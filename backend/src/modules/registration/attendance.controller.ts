import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RequireTasks } from '../auth/decorators/tasks.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksGuard } from '../auth/guards/tasks.guard';
import { UserRole, UserTask } from '../users/user.entity';
import { RegistrationService } from './registration.service';

interface AuthRequest {
  user: {
    id: number;
    role: UserRole;
    assignedEvent?: string;
    assignedEvents?: string[];
  };
}

@Controller('attendance')
@UseGuards(JwtAuthGuard, TasksGuard)
export class AttendanceController {
  constructor(private readonly registrationService: RegistrationService) {}

  /**
   * Validate a participant for check-in (QR scan)
   */
  @Get('validate/:id')
  @RequireTasks(UserTask.CHECK_IN_PARTICIPANT, UserTask.MARK_ATTENDANCE)
  async validateCheckIn(@Param('id', ParseIntPipe) id: number) {
    return this.registrationService.validateForCheckIn(id);
  }

  /**
   * Check in a participant
   */
  @Post('check-in')
  @RequireTasks(UserTask.CHECK_IN_PARTICIPANT)
  async checkIn(@Body('registrationId') registrationId: number, @Request() req: AuthRequest) {
    // Validate first
    const validation = await this.registrationService.validateForCheckIn(registrationId);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.reason,
        registration: validation.registration,
      };
    }

    // Perform check-in
    const updated = await this.registrationService.checkIn(registrationId, req.user.id);
    return {
      success: true,
      message: 'Check-in successful',
      registration: updated,
    };
  }

  /**
   * Check in a participant by QR code hash (for mobile QR scanner)
   */
  @Post('qr-check-in')
  @RequireTasks(UserTask.CHECK_IN_PARTICIPANT)
  async qrCheckIn(@Body('qrHash') qrHash: string, @Request() req: AuthRequest) {
    // Validate the QR hash first
    const validation = await this.registrationService.validateForCheckInByQR(qrHash);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.reason,
        registration: validation.registration,
      };
    }

    // Perform check-in using the QR hash
    const updated = await this.registrationService.checkInByQRHash(qrHash, req.user.id);
    return {
      success: true,
      message: 'Check-in successful',
      registration: updated,
    };
  }

  /**
   * Get attendance list for an event
   */
  @Get('list')
  @RequireTasks(UserTask.MARK_ATTENDANCE, UserTask.CHECK_IN_PARTICIPANT)
  async getAttendance(@Request() req: AuthRequest, @Query('event') event?: string) {
    const user = req.user;

    // Determine event to query
    let targetEvent = event;
    if (user.role === UserRole.COORDINATOR && user.assignedEvent) {
      targetEvent = user.assignedEvent;
    } else if (user.role === UserRole.MEMBER && user.assignedEvents?.length) {
      if (!event || !user.assignedEvents.includes(event)) {
        targetEvent = user.assignedEvents[0];
      }
    }

    if (!targetEvent && user.role !== UserRole.ADMIN) {
      return [];
    }

    if (targetEvent) {
      return this.registrationService.getAttendance(targetEvent);
    }

    // Admin without event filter gets all checked-in
    const all = await this.registrationService.findAll();
    return all.filter((r) => r.isCheckedIn);
  }

  /**
   * Get attendance statistics
   */
  @Get('stats')
  @RequireTasks(UserTask.MARK_ATTENDANCE, UserTask.CHECK_IN_PARTICIPANT)
  async getStats(@Request() req: AuthRequest, @Query('event') event?: string) {
    const user = req.user;

    // Determine event for stats
    let targetEvent = event;
    if (user.role === UserRole.COORDINATOR && user.assignedEvent) {
      targetEvent = user.assignedEvent;
    } else if (user.role === UserRole.MEMBER && user.assignedEvents?.length && !event) {
      targetEvent = user.assignedEvents[0];
    }

    return this.registrationService.getAttendanceStats(targetEvent);
  }

  /**
   * Get all registrations for an event (for attendance marking)
   */
  @Get('registrations')
  @RequireTasks(UserTask.MARK_ATTENDANCE)
  async getRegistrations(@Request() req: AuthRequest, @Query('event') event?: string) {
    const user = req.user;

    // Determine event
    let targetEvent = event;
    if (user.role === UserRole.COORDINATOR && user.assignedEvent) {
      targetEvent = user.assignedEvent;
    } else if (user.role === UserRole.MEMBER && user.assignedEvents?.length) {
      if (!event || !user.assignedEvents.includes(event)) {
        targetEvent = user.assignedEvents[0];
      }
    }

    if (targetEvent) {
      return this.registrationService.findByEvent(targetEvent);
    }

    // Admin without filter gets all
    if (user.role === UserRole.ADMIN) {
      return this.registrationService.findAll();
    }

    return [];
  }
}
