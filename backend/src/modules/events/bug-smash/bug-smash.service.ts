import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    BugSmashParticipant,
    BugSmashQuestion,
    BugSmashRoundState,
    BugSmashSubmission,
    Round2Status,
    RoundStatus,
} from './bug-smash.entity';

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
    round1Score: number;
    lastSubmitTime: Date | null;
    round2Status: Round2Status;
    round3Rank: number | null;
    round3Score: number | null;
}

@Injectable()
export class BugSmashService {
    constructor(
        @InjectRepository(BugSmashQuestion)
        private readonly questionRepo: Repository<BugSmashQuestion>,
        @InjectRepository(BugSmashParticipant)
        private readonly participantRepo: Repository<BugSmashParticipant>,
        @InjectRepository(BugSmashSubmission)
        private readonly submissionRepo: Repository<BugSmashSubmission>,
        @InjectRepository(BugSmashRoundState)
        private readonly roundStateRepo: Repository<BugSmashRoundState>,
    ) { }

    // ========================
    // ROUND STATE MANAGEMENT
    // ========================

    async getRoundState(): Promise<BugSmashRoundState> {
        let state = await this.roundStateRepo.findOne({ where: { id: 1 } });
        if (!state) {
            state = this.roundStateRepo.create({ id: 1 });
            await this.roundStateRepo.save(state);
        }
        return state;
    }

    async startRound1(): Promise<BugSmashRoundState> {
        const state = await this.getRoundState();
        state.round1Status = RoundStatus.ACTIVE;
        state.currentRound = 1;
        return this.roundStateRepo.save(state);
    }

    async endRound1(): Promise<BugSmashRoundState> {
        const state = await this.getRoundState();
        state.round1Status = RoundStatus.COMPLETED;
        state.currentQuestionId = null;
        return this.roundStateRepo.save(state);
    }

    async setCurrentQuestion(questionId: number): Promise<BugSmashRoundState> {
        const state = await this.getRoundState();
        state.currentQuestionId = questionId;
        state.questionStartedAt = new Date();
        return this.roundStateRepo.save(state);
    }

    // ========================
    // QUESTION MANAGEMENT
    // ========================

    async createQuestion(dto: CreateQuestionDto): Promise<BugSmashQuestion> {
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

    async getAllQuestions(): Promise<BugSmashQuestion[]> {
        return this.questionRepo.find({
            where: { isActive: true },
            order: { order: 'ASC' },
        });
    }

    async getQuestionById(id: number): Promise<BugSmashQuestion> {
        const question = await this.questionRepo.findOne({ where: { id } });
        if (!question) throw new NotFoundException(`Question ${id} not found`);
        return question;
    }

    async deleteQuestion(id: number): Promise<void> {
        const question = await this.getQuestionById(id);
        await this.questionRepo.remove(question);
    }

    // ========================
    // PARTICIPANT MANAGEMENT
    // ========================

    async joinParticipant(dto: JoinParticipantDto): Promise<BugSmashParticipant> {
        let participant = await this.participantRepo.findOne({ where: { email: dto.email } });

        if (participant) {
            // Already joined, update name/phone if provided
            if (dto.name) participant.name = dto.name;
            if (dto.phone) participant.phone = dto.phone;
            return this.participantRepo.save(participant);
        }

        // New participant
        participant = this.participantRepo.create({
            email: dto.email,
            name: dto.name,
            phone: dto.phone || null,
        });
        return this.participantRepo.save(participant);
    }

    async getParticipantByEmail(email: string): Promise<BugSmashParticipant | null> {
        return this.participantRepo.findOne({ where: { email } });
    }

    async getAllParticipants(): Promise<BugSmashParticipant[]> {
        return this.participantRepo.find({ order: { joinedAt: 'ASC' } });
    }

    // ========================
    // ANSWER SUBMISSION
    // ========================

    async submitAnswer(
        participantId: number,
        questionId: number,
        selectedIndex: number,
    ): Promise<{ isCorrect: boolean; score: number }> {
        const participant = await this.participantRepo.findOne({ where: { id: participantId } });
        if (!participant) throw new NotFoundException('Participant not found');

        const question = await this.getQuestionById(questionId);

        // Check if already submitted
        const existing = await this.submissionRepo.findOne({
            where: { participantId, questionId },
        });
        if (existing) {
            throw new BadRequestException('Already submitted answer for this question');
        }

        const isCorrect = selectedIndex === question.correctIndex;

        // Create submission
        const submission = this.submissionRepo.create({
            participantId,
            questionId,
            selectedIndex,
            isCorrect,
        });
        await this.submissionRepo.save(submission);

        // Update participant score
        if (isCorrect) {
            participant.round1Score += 1;
        }
        participant.lastSubmitTime = new Date();
        await this.participantRepo.save(participant);

        return { isCorrect, score: participant.round1Score };
    }

    // ========================
    // LEADERBOARD
    // ========================

    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        const participants = await this.participantRepo.find();

        // Sort by score DESC, then by lastSubmitTime ASC (earlier = better)
        return participants
            .sort((a, b) => {
                if (b.round1Score !== a.round1Score) {
                    return b.round1Score - a.round1Score;
                }
                // Tie-breaker: earlier submission wins
                const aTime = a.lastSubmitTime?.getTime() || Infinity;
                const bTime = b.lastSubmitTime?.getTime() || Infinity;
                return aTime - bTime;
            })
            .map((p) => ({
                id: p.id,
                name: p.name,
                email: p.email,
                round1Score: p.round1Score,
                lastSubmitTime: p.lastSubmitTime,
                round2Status: p.round2Status,
                round3Rank: p.round3Rank,
                round3Score: p.round3Score,
            }));
    }

    // ========================
    // ROUND 2 - SHORTLISTING
    // ========================

    async updateRound2Status(participantId: number, status: Round2Status): Promise<BugSmashParticipant> {
        const participant = await this.participantRepo.findOne({ where: { id: participantId } });
        if (!participant) throw new NotFoundException('Participant not found');

        participant.round2Status = status;
        return this.participantRepo.save(participant);
    }

    // ========================
    // ROUND 3 - FINAL RESULTS
    // ========================

    async updateRound3Result(participantId: number, rank?: number, score?: number): Promise<BugSmashParticipant> {
        const participant = await this.participantRepo.findOne({ where: { id: participantId } });
        if (!participant) throw new NotFoundException('Participant not found');

        if (rank !== undefined) participant.round3Rank = rank;
        if (score !== undefined) participant.round3Score = score;
        return this.participantRepo.save(participant);
    }

    // ========================
    // STATS
    // ========================

    async getStats(): Promise<{
        totalQuestions: number;
        totalParticipants: number;
        qualified: number;
        eliminated: number;
    }> {
        const questions = await this.questionRepo.count({ where: { isActive: true } });
        const participants = await this.participantRepo.find();

        return {
            totalQuestions: questions,
            totalParticipants: participants.length,
            qualified: participants.filter(p => p.round2Status === Round2Status.QUALIFIED).length,
            eliminated: participants.filter(p => p.round2Status === Round2Status.ELIMINATED).length,
        };
    }

    // ========================
    // RESET
    // ========================

    async resetRound1(): Promise<void> {
        await this.submissionRepo.clear();
        await this.participantRepo.update({}, { round1Score: 0, lastSubmitTime: null });
        const state = await this.getRoundState();
        state.round1Status = RoundStatus.WAITING;
        state.currentQuestionId = null;
        state.questionStartedAt = null;
        await this.roundStateRepo.save(state);
    }
}
