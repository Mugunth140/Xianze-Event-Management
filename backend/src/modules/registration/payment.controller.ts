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

@Controller('payments')
@UseGuards(JwtAuthGuard, TasksGuard)
export class PaymentController {
  constructor(private readonly registrationService: RegistrationService) {}

  /**
   * Get pending payments
   * Admins see all, others see only their assigned event(s)
   */
  @Get('pending')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async getPendingPayments(@Request() req: AuthRequest, @Query('event') event?: string) {
    const user = req.user;

    // Admin can see all or filter by event
    if (user.role === UserRole.ADMIN) {
      return this.registrationService.getPendingPayments(event);
    }

    // Coordinator sees only their event
    if (user.role === UserRole.COORDINATOR && user.assignedEvent) {
      return this.registrationService.getPendingPayments(user.assignedEvent);
    }

    // Member with permission sees their events
    if (user.role === UserRole.MEMBER && user.assignedEvents?.length) {
      // If event query provided and user has access, filter by it
      if (event && user.assignedEvents.includes(event)) {
        return this.registrationService.getPendingPayments(event);
      }
      // Otherwise return first assigned event's pending payments
      return this.registrationService.getPendingPayments(user.assignedEvents[0]);
    }

    return [];
  }

  /**
   * Verify a payment
   */
  @Post(':id/verify')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async verifyPayment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
    @Body('note') note?: string,
  ) {
    // TODO: Add event scope validation
    return this.registrationService.verifyPayment(id, req.user.id, note);
  }

  /**
   * Reject a payment
   */
  @Post(':id/reject')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async rejectPayment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
    @Body('reason') reason: string,
  ) {
    // TODO: Add event scope validation
    return this.registrationService.rejectPayment(id, req.user.id, reason || 'Rejected');
  }

  /**
   * Get verification history (all verified/rejected payments)
   */
  @Get('history')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async getVerificationHistory(@Request() req: AuthRequest, @Query('event') event?: string) {
    const user = req.user;
    const payments = await this.registrationService.findAll();

    // Filter to non-pending
    let filtered = payments.filter((p) => p.paymentStatus !== 'pending');

    // Apply event scope
    if (user.role === UserRole.COORDINATOR && user.assignedEvent) {
      filtered = filtered.filter((p) => p.event === user.assignedEvent);
    } else if (user.role === UserRole.MEMBER && user.assignedEvents?.length) {
      filtered = filtered.filter((p) => user.assignedEvents?.includes(p.event));
    } else if (event) {
      filtered = filtered.filter((p) => p.event === event);
    }

    return filtered;
  }
}
