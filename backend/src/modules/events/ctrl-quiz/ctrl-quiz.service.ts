import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buzzerWSServer } from '../think-link/buzzer/buzzer-ws.server';
import {
  CtrlQuizParticipant,
  CtrlQuizQuestion,
  CtrlQuizRoundState,
  CtrlQuizSubmission,
  RoundStatus,
} from './ctrl-quiz.entity';

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
  constructor(
    @InjectRepository(CtrlQuizQuestion)
    private readonly questionRepo: Repository<CtrlQuizQuestion>,
    @InjectRepository(CtrlQuizParticipant)
    private readonly participantRepo: Repository<CtrlQuizParticipant>,
    @InjectRepository(CtrlQuizSubmission)
    private readonly submissionRepo: Repository<CtrlQuizSubmission>,
    @InjectRepository(CtrlQuizRoundState)
    private readonly roundStateRepo: Repository<CtrlQuizRoundState>,
  ) {}

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
    return this.questionRepo.save(question);
  }

  async getAllQuestions(): Promise<CtrlQuizQuestion[]> {
    return this.questionRepo.find({
      where: { isActive: true },
      order: { round: 'ASC', order: 'ASC' },
    });
  }

  async getQuestionById(id: number): Promise<CtrlQuizQuestion> {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) throw new NotFoundException(`Question ${id} not found`);
    return question;
  }

  async deleteQuestion(id: number): Promise<void> {
    const question = await this.getQuestionById(id);
    await this.questionRepo.remove(question);
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

    let participant = await this.participantRepo.findOne({ where: { name: trimmedName } });

    if (participant) {
      if (dto.name) participant.name = trimmedName;
      if (dto.phone) participant.phone = dto.phone;
      const updated = await this.participantRepo.save(participant);
      return updated;
    }

    const participantCount = await this.participantRepo.count();
    if (participantCount >= 2) {
      throw new BadRequestException('Only two participants are allowed');
    }

    const generatedEmail = dto.email || `ctrl-quiz-${Date.now()}@xianze.local`;

    participant = this.participantRepo.create({
      email: generatedEmail,
      name: trimmedName,
      phone: dto.phone || null,
    });
    const saved = await this.participantRepo.save(participant);

    // Broadcast leaderboard update to coordinators when new participant joins
    buzzerWSServer.notifyLeaderboardUpdate('ctrl-quiz').catch(() => {
      // Ignore broadcast errors
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

    // Broadcast leaderboard update to coordinators
    buzzerWSServer.notifyLeaderboardUpdate('ctrl-quiz').catch(() => {
      // Ignore broadcast errors - WS might not be connected
    });

    return { message: 'Answer saved' };
  }

  // ========================
  // LEADERBOARD
  // ========================

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const participants = await this.participantRepo.find();

    return participants
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const aTime = a.lastSubmitTime?.getTime() || Infinity;
        const bTime = b.lastSubmitTime?.getTime() || Infinity;
        return aTime - bTime;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        score: p.score,
        lastSubmitTime: p.lastSubmitTime,
      }));
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

  async resetQuiz(): Promise<void> {
    await this.submissionRepo.clear();
    await this.participantRepo
      .createQueryBuilder()
      .update()
      .set({ score: 0, lastSubmitTime: null })
      .execute();
    const state = await this.getRoundState();
    state.status = RoundStatus.WAITING;
    state.activeRound = 1;
    state.startedAt = null;
    await this.roundStateRepo.save(state);
  }
}
