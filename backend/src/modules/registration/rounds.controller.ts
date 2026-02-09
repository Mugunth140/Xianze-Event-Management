import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequireTasks } from '../auth/decorators/tasks.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TasksGuard } from '../auth/guards/tasks.guard';
import { UserRole, UserTask, userCanAccessEvent } from '../users/user.entity';
import {
  AdvanceRoundDto,
  ResetRoundDto,
  SetCurrentRoundDto,
  UpdateEventRoundConfigDto,
} from './dto/round-config.dto';
import { RoundConfigService } from './round-config.service';

interface AuthRequest {
  user: {
    id: number;
    role: UserRole;
    assignedEvent?: string;
    assignedEvents?: string[];
  };
}

@Controller('rounds')
@UseGuards(JwtAuthGuard, TasksGuard)
export class RoundsController {
  constructor(private readonly roundConfigService: RoundConfigService) {}

  /**
   * Get all round configurations
   * Admin sees all, coordinators see their assigned event
   */
  @Get()
  @RequireTasks(UserTask.MANAGE_ROUNDS)
  async getAllConfigs(@Request() req: AuthRequest) {
    const user = req.user;

    if (user.role === UserRole.ADMIN) {
      return this.roundConfigService.findAll();
    }

    // Non-admins only see their assigned events
    const allConfigs = await this.roundConfigService.findAll();
    return allConfigs.filter((config) => userCanAccessEvent(user, config.eventSlug));
  }

  /**
   * Get round configuration for a specific event
   */
  @Get('config/:eventSlug')
  @RequireTasks(UserTask.MANAGE_ROUNDS)
  async getEventConfig(@Param('eventSlug') eventSlug: string, @Request() req: AuthRequest) {
    const user = req.user;

    // Check access
    if (user.role !== UserRole.ADMIN && !userCanAccessEvent(user, eventSlug)) {
      return null;
    }

    return this.roundConfigService.findByEvent(eventSlug);
  }

  /**
   * Get current round for an event (for scanner)
   * This is a lightweight endpoint for the scanner to know which round to scan
   */
  @Get('current/:eventSlug')
  async getCurrentRound(@Param('eventSlug') eventSlug: string, @Request() req: AuthRequest) {
    const user = req.user;

    if (user.role !== UserRole.ADMIN && !userCanAccessEvent(user, eventSlug)) {
      return {
        eventSlug,
        currentRound: 1,
        totalRounds: 0,
        isStarted: false,
        isCompleted: false,
        hasRounds: false,
        currentRoundParticipantCount: 0,
        currentRoundParticipants: [],
      };
    }

    return this.roundConfigService.getCurrentRound(eventSlug);
  }

  /**
   * Update round configuration (Admin only)
   */
  @Patch('config/:eventSlug')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateConfig(
    @Param('eventSlug') eventSlug: string,
    @Body() dto: UpdateEventRoundConfigDto,
  ) {
    if (dto.totalRounds !== undefined) {
      return this.roundConfigService.updateConfig(eventSlug, dto.totalRounds);
    }
    return this.roundConfigService.findByEvent(eventSlug);
  }

  /**
   * Start an event (requires MANAGE_ROUNDS task + event access)
   */
  @Post('start/:eventSlug')
  @RequireTasks(UserTask.MANAGE_ROUNDS)
  async startEvent(@Param('eventSlug') eventSlug: string, @Request() req: AuthRequest) {
    const user = req.user;

    // Check access
    if (user.role !== UserRole.ADMIN && !userCanAccessEvent(user, eventSlug)) {
      return { error: 'Not authorized to start this event' };
    }

    return this.roundConfigService.startEvent(eventSlug);
  }

  /**
   * Advance to next round (requires MANAGE_ROUNDS task + event access)
   */
  @Post('advance')
  @RequireTasks(UserTask.MANAGE_ROUNDS)
  async advanceRound(@Body() dto: AdvanceRoundDto, @Request() req: AuthRequest) {
    const user = req.user;

    // Check access
    if (user.role !== UserRole.ADMIN && !userCanAccessEvent(user, dto.eventSlug)) {
      return { error: 'Not authorized to advance rounds for this event' };
    }

    return this.roundConfigService.advanceRound(dto.eventSlug);
  }

  /**
   * Manually set current round (requires MANAGE_ROUNDS task + event access)
   */
  @Post('set-current')
  @RequireTasks(UserTask.MANAGE_ROUNDS)
  async setCurrentRound(@Body() dto: SetCurrentRoundDto, @Request() req: AuthRequest) {
    const user = req.user;

    if (user.role !== UserRole.ADMIN && !userCanAccessEvent(user, dto.eventSlug)) {
      return { error: 'Not authorized to set rounds for this event' };
    }

    return this.roundConfigService.setCurrentRound(dto.eventSlug, dto.roundNumber);
  }

  /**
   * Reset event to initial state (Admin only)
   */
  @Post('reset/:eventSlug')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetEvent(@Param('eventSlug') eventSlug: string) {
    return this.roundConfigService.resetEvent(eventSlug);
  }

  /**
   * Reset a specific round for an event (Admin only)
   */
  @Post('reset-round')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetRound(@Body() dto: ResetRoundDto) {
    return this.roundConfigService.resetRound(dto.eventSlug, dto.roundNumber);
  }

  /**
   * Get analytics for a specific event
   */
  @Get('analytics/:eventSlug')
  @RequireTasks(UserTask.MANAGE_ROUNDS)
  async getEventAnalytics(@Param('eventSlug') eventSlug: string, @Request() req: AuthRequest) {
    const user = req.user;

    // Check access
    if (user.role !== UserRole.ADMIN && !userCanAccessEvent(user, eventSlug)) {
      return null;
    }

    return this.roundConfigService.getEventAnalytics(eventSlug);
  }

  /**
   * Get analytics for all events (Admin only)
   */
  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllAnalytics() {
    return this.roundConfigService.getAllAnalytics();
  }
}
