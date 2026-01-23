import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}

export interface JoinParticipantDto {
    email: string;
    name: string;
    phone?: string;
}

export interface LeaderboardEntry {
    id: number;
    name: string;
    email: string;
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
    ) { }

    // ========================
    // ROUND STATE
    // ========================

    async getRoundState(): Promise<CtrlQuizRoundState> {
        let state = await this.roundStateRepo.findOne({ where: { id: 1 } });
        if (!state) {
            state = this.roundStateRepo.create({ id: 1 });
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
        const maxOrder = await this.questionRepo
            .createQueryBuilder('q')
            .select('MAX(q.order)', 'max')
            .getRawOne();

        const question = this.questionRepo.create({
            ...dto,
            timeLimit: dto.timeLimit || 30,
            order: (maxOrder?.max || 0) + 1,
        });
        return this.questionRepo.save(question);
    }

    async getAllQuestions(): Promise<CtrlQuizQuestion[]> {
        return this.questionRepo.find({
            where: { isActive: true },
            order: { order: 'ASC' },
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

        const answeredIds = participant.submissions.map((s) => s.questionId);

        const qb = this.questionRepo
            .createQueryBuilder('q')
            .where('q.isActive = :isActive', { isActive: true })
            .orderBy('q.order', 'ASC');

        if (answeredIds.length > 0) {
            qb.andWhere('q.id NOT IN (:...ids)', { ids: answeredIds });
        }

        return qb.getOne();
    }

    // ========================
    // PARTICIPANTS
    // ========================

    async joinParticipant(dto: JoinParticipantDto): Promise<CtrlQuizParticipant> {
        let participant = await this.participantRepo.findOne({ where: { email: dto.email } });

        if (participant) {
            if (dto.name) participant.name = dto.name;
            if (dto.phone) participant.phone = dto.phone;
            return this.participantRepo.save(participant);
        }

        participant = this.participantRepo.create({
            email: dto.email,
            name: dto.name,
            phone: dto.phone || null,
        });
        return this.participantRepo.save(participant);
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
        await this.participantRepo.update({}, { score: 0, lastSubmitTime: null });
        const state = await this.getRoundState();
        state.status = RoundStatus.WAITING;
        state.startedAt = null;
        await this.roundStateRepo.save(state);
    }
}
