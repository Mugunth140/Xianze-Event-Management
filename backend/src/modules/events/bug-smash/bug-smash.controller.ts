import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import { Round2Status } from './bug-smash.entity';
import { BugSmashService, CreateQuestionDto, JoinParticipantDto } from './bug-smash.service';

@Controller('bug-smash')
export class BugSmashController {
    constructor(private readonly service: BugSmashService) { }

    // ========================
    // ROUND STATE (Admin/Coordinator)
    // ========================

    @Get('state')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    async getRoundState() {
        const state = await this.service.getRoundState();
        return { success: true, data: state };
    }

    @Post('round1/start')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    @HttpCode(HttpStatus.OK)
    async startRound1() {
        const state = await this.service.startRound1();
        return { success: true, data: state };
    }

    @Post('round1/end')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    @HttpCode(HttpStatus.OK)
    async endRound1() {
        const state = await this.service.endRound1();
        return { success: true, data: state };
    }

    @Post('round1/question/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    @HttpCode(HttpStatus.OK)
    async setCurrentQuestion(@Param('id', ParseIntPipe) id: number) {
        const state = await this.service.setCurrentQuestion(id);
        return { success: true, data: state };
    }

    @Post('round1/reset')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    @HttpCode(HttpStatus.OK)
    async resetRound1() {
        await this.service.resetRound1();
        return { success: true, message: 'Round 1 reset' };
    }

    // ========================
    // QUESTIONS (Admin/Coordinator)
    // ========================

    @Post('questions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    async createQuestion(@Body() dto: CreateQuestionDto) {
        if (!dto.questionText || !dto.options || dto.options.length < 2) {
            throw new BadRequestException('Question must have text and at least 2 options');
        }
        if (dto.correctIndex < 0 || dto.correctIndex >= dto.options.length) {
            throw new BadRequestException('correctIndex out of range');
        }
        const question = await this.service.createQuestion(dto);
        return { success: true, data: question };
    }

    @Get('questions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
    async getAllQuestions() {
        const questions = await this.service.getAllQuestions();
        return { success: true, data: questions };
    }

    @Delete('questions/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
        await this.service.deleteQuestion(id);
        return { success: true, message: 'Question deleted' };
    }

    // ========================
    // PARTICIPANTS (Public)
    // ========================

    @Post('join')
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    async joinParticipant(@Body() dto: JoinParticipantDto) {
        if (!dto.email || !dto.name) {
            throw new BadRequestException('Email and name are required');
        }
        const participant = await this.service.joinParticipant(dto);
        return { success: true, data: participant };
    }

    @Get('participant/:email')
    async getParticipant(@Param('email') email: string) {
        const participant = await this.service.getParticipantByEmail(email);
        if (!participant) {
            return { success: false, data: null };
        }
        return { success: true, data: participant };
    }

    // ========================
    // ANSWER SUBMISSION (Public)
    // ========================

    @Post('submit/:questionId')
    @Throttle({ default: { limit: 30, ttl: 60000 } })
    async submitAnswer(
        @Param('questionId', ParseIntPipe) questionId: number,
        @Body('participantId') participantId: number,
        @Body('selectedIndex') selectedIndex: number,
    ) {
        if (participantId === undefined || selectedIndex === undefined) {
            throw new BadRequestException('participantId and selectedIndex are required');
        }
        const result = await this.service.submitAnswer(participantId, questionId, selectedIndex);
        return { success: true, data: result };
    }

    // ========================
    // CURRENT QUESTION (Public) - for participants to see
    // ========================

    @Get('current-question')
    async getCurrentQuestion() {
        const state = await this.service.getRoundState();
        if (!state.currentQuestionId) {
            return { success: true, data: null };
        }
        const question = await this.service.getQuestionById(state.currentQuestionId);
        // Don't send correctIndex to participants
        return {
            success: true,
            data: {
                id: question.id,
                questionText: question.questionText,
                options: question.options,
                timeLimit: question.timeLimit,
                startedAt: state.questionStartedAt,
            },
        };
    }

    // ========================
    // LEADERBOARD (Public)
    // ========================

    @Get('leaderboard')
    async getLeaderboard() {
        const leaderboard = await this.service.getLeaderboard();
        return { success: true, data: leaderboard };
    }

    // ========================
    // ROUND 2 - SHORTLISTING (Coordinator)
    // ========================

    @Patch('round2/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    async updateRound2Status(
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: Round2Status,
    ) {
        if (!Object.values(Round2Status).includes(status)) {
            throw new BadRequestException('Invalid status. Must be: pending, qualified, or eliminated');
        }
        const participant = await this.service.updateRound2Status(id, status);
        return { success: true, data: participant };
    }

    // ========================
    // ROUND 3 - FINAL (Coordinator)
    // ========================

    @Patch('round3/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    async updateRound3Result(
        @Param('id', ParseIntPipe) id: number,
        @Body('rank') rank?: number,
        @Body('score') score?: number,
    ) {
        const participant = await this.service.updateRound3Result(id, rank, score);
        return { success: true, data: participant };
    }

    // ========================
    // STATS (Coordinator)
    // ========================

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
    async getStats() {
        const stats = await this.service.getStats();
        return { success: true, data: stats };
    }

    // ========================
    // ALL PARTICIPANTS (Coordinator)
    // ========================

    @Get('participants')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
    async getAllParticipants() {
        const participants = await this.service.getAllParticipants();
        return { success: true, data: participants };
    }
}
