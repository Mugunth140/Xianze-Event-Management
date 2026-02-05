import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { DataSource, Repository } from 'typeorm';
import { buzzerWSServer } from '../think-link/buzzer/buzzer-ws.server';
import {
  CtrlQuizParticipant,
  CtrlQuizQuestion,
  CtrlQuizRoundState,
  CtrlQuizSubmission,
  RoundStatus,
} from './ctrl-quiz.entity';

/** Maximum number of participant teams allowed per quiz session */
const MAX_PARTICIPANTS = 30;

/** Cache TTL in seconds */
const CACHE_TTL = 300;

/** Cache key constants to avoid magic strings */
const CACHE_KEYS = {
  QUESTIONS_ALL: 'ctrl-quiz:questions:all',
  LEADERBOARD: 'ctrl-quiz:leaderboard',
  question: (id: number) => `ctrl-quiz:question:${id}`,
} as const;

export interface CreateQuestionDto {
  questionText: string;
  options: string[];
  correctIndex: number;
  timeLimit?: number;
  round?: number;
}

export interface JoinParticipantDto {
  name: string;
  email?: string;
  phone?: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  email: string | null;
  score: number;
  lastSubmitTime: Date | null;
}

@Injectable()
export class CtrlQuizService {
  private readonly logger = new Logger(CtrlQuizService.name);

  constructor(
    @InjectRepository(CtrlQuizQuestion)
    private readonly questionRepo: Repository<CtrlQuizQuestion>,
    @InjectRepository(CtrlQuizParticipant)
    private readonly participantRepo: Repository<CtrlQuizParticipant>,
    @InjectRepository(CtrlQuizSubmission)
    private readonly submissionRepo: Repository<CtrlQuizSubmission>,
    @InjectRepository(CtrlQuizRoundState)
    private readonly roundStateRepo: Repository<CtrlQuizRoundState>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Invalidate all ctrl-quiz related caches.
   * Called after mutations that affect questions, participants, or leaderboard.
   */
  private async invalidateAllCaches(): Promise<void> {
    await Promise.allSettled([
      this.cacheManager.del(CACHE_KEYS.QUESTIONS_ALL),
      this.cacheManager.del(CACHE_KEYS.LEADERBOARD),
    ]);
  }

  // ========================
  // ROUND STATE
  // ========================

  async getRoundState(): Promise<CtrlQuizRoundState> {
    let state = await this.roundStateRepo.findOne({ where: { id: 1 } });
    if (!state) {
      state = this.roundStateRepo.create({ id: 1 });
      await this.roundStateRepo.save(state);
    } else if (!state.activeRound) {
      state.activeRound = 1;
      await this.roundStateRepo.save(state);
    }
    return state;
  }

  async startQuiz(durationMinutes: number): Promise<CtrlQuizRoundState> {
    const state = await this.getRoundState();
    state.status = RoundStatus.ACTIVE;
    state.roundDuration = durationMinutes;
    state.startedAt = new Date();
    return this.roundStateRepo.save(state);
  }

  async startRound(round: number, durationMinutes: number): Promise<CtrlQuizRoundState> {
    const state = await this.getRoundState();
    state.status = RoundStatus.ACTIVE;
    state.roundDuration = durationMinutes;
    state.activeRound = round;
    state.startedAt = new Date();
    return this.roundStateRepo.save(state);
  }

  async pauseQuiz(): Promise<CtrlQuizRoundState> {
    const state = await this.getRoundState();
    state.status = RoundStatus.WAITING;
    return this.roundStateRepo.save(state);
  }

  async endQuiz(): Promise<CtrlQuizRoundState> {
    const state = await this.getRoundState();
    state.status = RoundStatus.COMPLETED;
    return this.roundStateRepo.save(state);
  }

  // ========================
  // QUESTIONS
  // ========================

  async createQuestion(dto: CreateQuestionDto): Promise<CtrlQuizQuestion> {
    const questionRound = dto.round && dto.round > 0 ? dto.round : 1;
    const maxOrder = await this.questionRepo
      .createQueryBuilder('q')
      .select('MAX(q.order)', 'max')
      .where('q.round = :round', { round: questionRound })
      .getRawOne();

    const question = this.questionRepo.create({
      ...dto,
      timeLimit: dto.timeLimit || 30,
      order: (maxOrder?.max || 0) + 1,
      round: questionRound,
    });
    const saved = await this.questionRepo.save(question);
    await this.cacheManager.del(CACHE_KEYS.QUESTIONS_ALL);
    return saved;
  }

  async getAllQuestions(): Promise<CtrlQuizQuestion[]> {
    const cached = await this.cacheManager.get<CtrlQuizQuestion[]>(CACHE_KEYS.QUESTIONS_ALL);
    if (cached) return cached;

    const questions = await this.questionRepo.find({
      where: { isActive: true },
      order: { round: 'ASC', order: 'ASC' },
    });
    await this.cacheManager.set(CACHE_KEYS.QUESTIONS_ALL, questions, CACHE_TTL);
    return questions;
  }

  async getQuestionById(id: number): Promise<CtrlQuizQuestion> {
    const cacheKey = CACHE_KEYS.question(id);
    const cached = await this.cacheManager.get<CtrlQuizQuestion>(cacheKey);
    if (cached) return cached;

    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) throw new NotFoundException(`Question ${id} not found`);
    await this.cacheManager.set(cacheKey, question, CACHE_TTL);
    return question;
  }

  async deleteQuestion(id: number): Promise<void> {
    const question = await this.getQuestionById(id);
    await this.questionRepo.remove(question);
    await Promise.all([
      this.cacheManager.del(CACHE_KEYS.QUESTIONS_ALL),
      this.cacheManager.del(CACHE_KEYS.question(id)),
    ]);
  }

  async getNextQuestion(participantId: number): Promise<CtrlQuizQuestion | null> {
    const participant = await this.participantRepo.findOne({
      where: { id: participantId },
      relations: ['submissions'],
    });
    if (!participant) throw new NotFoundException('Participant not found');

    const state = await this.getRoundState();
    const activeRound = state.activeRound || 1;

    const answeredIds = participant.submissions.map((s) => s.questionId);

    const qb = this.questionRepo
      .createQueryBuilder('q')
      .where('q.isActive = :isActive', { isActive: true })
      .andWhere('q.round = :round', { round: activeRound })
      .orderBy('RANDOM()');

    if (answeredIds.length > 0) {
      qb.andWhere('q.id NOT IN (:...ids)', { ids: answeredIds });
    }

    return qb.getOne();
  }

  // ========================
  // PARTICIPANTS
  // ========================

  async joinParticipant(dto: JoinParticipantDto): Promise<CtrlQuizParticipant> {
    const trimmedName = dto.name?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Name is required');
    }

    // Allow returning participants to rejoin (session recovery)
    const existing = await this.participantRepo.findOne({ where: { name: trimmedName } });
    if (existing) {
      if (dto.phone) existing.phone = dto.phone;
      return this.participantRepo.save(existing);
    }

    // Enforce participant cap
    const participantCount = await this.participantRepo.count();
    if (participantCount >= MAX_PARTICIPANTS) {
      throw new ConflictException(
        `Maximum of ${MAX_PARTICIPANTS} participants reached. Please wait for the coordinator to reset.`,
      );
    }

    const participant = this.participantRepo.create({
      email: dto.email || `ctrl-quiz-${Date.now()}@xianze.local`,
      name: trimmedName,
      phone: dto.phone || null,
    });
    const saved = await this.participantRepo.save(participant);

    // Invalidate leaderboard cache and broadcast update
    await this.cacheManager.del(CACHE_KEYS.LEADERBOARD);
    buzzerWSServer.notifyLeaderboardUpdate('ctrl-quiz').catch(() => {
      // Ignore broadcast errors — WS may not be connected
    });

    return saved;
  }

  async getAllParticipants(): Promise<CtrlQuizParticipant[]> {
    return this.participantRepo.find({ order: { joinedAt: 'ASC' } });
  }

  // ========================
  // SUBMISSIONS
  // ========================

  async submitAnswer(
    participantId: number,
    questionId: number,
    selectedIndex: number,
  ): Promise<{ message: string }> {
    const participant = await this.participantRepo.findOne({ where: { id: participantId } });
    if (!participant) throw new NotFoundException('Participant not found');

    const question = await this.getQuestionById(questionId);

    const existing = await this.submissionRepo.findOne({
      where: { participantId, questionId },
    });
    if (existing) {
      throw new BadRequestException('Already submitted answer for this question');
    }

    const isCorrect = selectedIndex === question.correctIndex;

    const submission = this.submissionRepo.create({
      participantId,
      questionId,
      selectedIndex,
      isCorrect,
    });
    await this.submissionRepo.save(submission);

    if (isCorrect) {
      participant.score += 1;
    }
    participant.lastSubmitTime = new Date();
    await this.participantRepo.save(participant);

    // Invalidate leaderboard cache and broadcast update
    await this.cacheManager.del(CACHE_KEYS.LEADERBOARD);
    buzzerWSServer.notifyLeaderboardUpdate('ctrl-quiz').catch(() => {
      // Ignore broadcast errors — WS may not be connected
    });

    return { message: 'Answer saved' };
  }

  // ========================
  // LEADERBOARD
  // ========================

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const cached = await this.cacheManager.get<LeaderboardEntry[]>(CACHE_KEYS.LEADERBOARD);
    if (cached) return cached;

    // Sort in DB for efficiency: highest score first, earliest submit time as tiebreaker
    const participants = await this.participantRepo
      .createQueryBuilder('p')
      .orderBy('p.score', 'DESC')
      .addOrderBy('COALESCE(p.lastSubmitTime, "9999-12-31")', 'ASC')
      .getMany();

    const leaderboard: LeaderboardEntry[] = participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      score: p.score,
      lastSubmitTime: p.lastSubmitTime,
    }));

    // Short TTL — leaderboard is frequently invalidated on submit/join/reset
    await this.cacheManager.set(CACHE_KEYS.LEADERBOARD, leaderboard, 10);
    return leaderboard;
  }

  // ========================
  // STATS
  // ========================

  async getStats(): Promise<{
    totalQuestions: number;
    totalParticipants: number;
  }> {
    const questions = await this.questionRepo.count({ where: { isActive: true } });
    const participants = await this.participantRepo.count();

    return {
      totalQuestions: questions,
      totalParticipants: participants,
    };
  }

  // ========================
  // RESET
  // ========================

  /**
   * Full quiz reset — removes ALL participants & submissions, resets round state.
   * Uses a transaction so the reset is atomic (all-or-nothing).
   */
  async resetQuiz(): Promise<void> {
    this.logger.log('Resetting quiz: removing all participants, submissions, and round state');

    await this.dataSource.transaction(async (manager) => {
      // Order matters: submissions reference participants, so clear submissions first
      await manager.getRepository(CtrlQuizSubmission).clear();
      await manager.getRepository(CtrlQuizParticipant).clear();

      // Reset round state to initial values
      const roundStateRepo = manager.getRepository(CtrlQuizRoundState);
      let state = await roundStateRepo.findOne({ where: { id: 1 } });
      if (!state) {
        state = roundStateRepo.create({ id: 1 });
      }
      state.status = RoundStatus.WAITING;
      state.activeRound = 1;
      state.startedAt = null;
      await roundStateRepo.save(state);
    });

    // Invalidate every cache key this module uses
    await this.invalidateAllCaches();

    // Push an empty leaderboard to all connected coordinators
    buzzerWSServer.notifyLeaderboardUpdate('ctrl-quiz').catch(() => {
      // Ignore broadcast errors
    });

    this.logger.log('Quiz reset complete');
  }
}
