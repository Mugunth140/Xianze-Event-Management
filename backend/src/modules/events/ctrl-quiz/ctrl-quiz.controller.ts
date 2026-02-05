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
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import { CreateQuestionDto, CtrlQuizService, JoinParticipantDto } from './ctrl-quiz.service';

@Controller('ctrl-quiz')
export class CtrlQuizController {
  constructor(private readonly service: CtrlQuizService) {}

  // ========================
  // ROUND STATE (Coordinator)
  // ========================

  @Get('state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getRoundState() {
    const state = await this.service.getRoundState();
    return { success: true, data: state };
  }

  @Post('start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  async startQuiz(@Body('duration') duration?: number, @Body('round') round?: number) {
    const roundValue = round && round > 0 ? round : 1;
    const state = await this.service.startRound(roundValue, duration || 30);
    return { success: true, data: state };
  }

  @Post('pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  async pauseQuiz() {
    const state = await this.service.pauseQuiz();
    return { success: true, data: state };
  }

  @Post('end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  async endQuiz() {
    const state = await this.service.endQuiz();
    return { success: true, data: state };
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  async resetQuiz() {
    await this.service.resetQuiz();
    return { success: true, message: 'Quiz reset' };
  }

  // ========================
  // QUESTIONS (Coordinator)
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
    if (dto.round !== undefined && dto.round !== 1 && dto.round !== 2) {
      throw new BadRequestException('round must be 1 or 2');
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
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
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
    if (!dto.name) {
      throw new BadRequestException('Name is required');
    }
    const participant = await this.service.joinParticipant(dto);
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
  // NEXT QUESTION (Public)
  // ========================

  @Post('next-question')
  async getNextQuestion(@Body('participantId') participantId: number) {
    if (!participantId) throw new BadRequestException('participantId required');

    const state = await this.service.getRoundState();
    if (state.status !== 'active') {
      return { success: false, message: 'Quiz is not active', data: null };
    }

    const question = await this.service.getNextQuestion(participantId);

    if (!question) {
      return {
        success: true,
        data: null,
        meta: {
          status: state.status,
          activeRound: state.activeRound,
          roundStartedAt: state.startedAt,
          roundDuration: state.roundDuration,
        },
      };
    }

    return {
      success: true,
      data: {
        id: question.id,
        questionText: question.questionText,
        options: question.options,
        roundStartedAt: state.startedAt,
        roundDuration: state.roundDuration,
        activeRound: state.activeRound,
        status: state.status,
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
  // STATS (Coordinator)
  // ========================

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getStats() {
    const stats = await this.service.getStats();
    return { success: true, data: stats };
  }
}
