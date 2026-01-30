import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RequireTasks } from '../auth/decorators/tasks.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksGuard } from '../auth/guards/tasks.guard';
import { MailService } from '../mail/mail.service';
import { User, UserRole, UserTask } from '../users/user.entity';
import { Registration } from './registration.entity';
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
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
   * Verify a payment and send event pass email
   */
  @Post(':id/verify')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async verifyPayment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
    @Body('note') note?: string,
  ): Promise<{ success: boolean; registration: Registration; emailSent: boolean }> {
    const registration = await this.registrationService.verifyPayment(id, req.user.id, note);

    // Send event pass email (async)
    const emailSent = await this.sendEventPassEmail(registration);

    return {
      success: true,
      registration,
      emailSent,
    };
  }

  /**
   * Send event pass email with QR code
   */
  private async sendEventPassEmail(registration: Registration): Promise<boolean> {
    if (!registration.passId || !registration.qrCodeHash) {
      this.logger.error(`Missing pass data for registration ${registration.id}`);
      return false;
    }

    try {
      const emailSent = await this.mailService.sendEventPass({
        name: registration.name,
        email: registration.email,
        event: registration.event,
        passId: registration.passId,
        qrCodeHash: registration.qrCodeHash,
        college: registration.college,
      });

      if (emailSent) {
        await this.registrationService.markPassEmailSent(registration.id);
        this.logger.log(`Event pass email sent for registration ${registration.id}`);
      }

      return emailSent;
    } catch (error) {
      this.logger.error(`Failed to send event pass email: ${error}`);
      return false;
    }
  }

  /**
   * Reject a payment and send rejection email
   */
  @Post(':id/reject')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async rejectPayment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
    @Body('reason') reason: string,
  ): Promise<{ success: boolean; registration: Registration; emailSent: boolean }> {
    const rejectionReason = reason || 'Payment could not be verified';
    const registration = await this.registrationService.rejectPayment(
      id,
      req.user.id,
      rejectionReason,
    );

    // Send rejection email (async)
    const emailSent = await this.mailService.sendPaymentRejection(
      registration.email,
      registration.name,
      registration.event,
      rejectionReason,
    );

    return {
      success: true,
      registration,
      emailSent,
    };
  }

  /**
   * Resend event pass email (for already verified registrations)
   */
  @Post(':id/resend-pass')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async resendEventPass(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; emailSent: boolean }> {
    const registration = await this.registrationService.findOne(id);

    if (registration.paymentStatus !== 'verified') {
      return { success: false, emailSent: false };
    }

    const emailSent = await this.sendEventPassEmail(registration);
    return { success: true, emailSent };
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

  /**
   * Group verified payments by the user who verified them
   */
  @Get('verified-by')
  @RequireTasks(UserTask.VERIFY_PAYMENT)
  async getVerifiedBy(@Request() req: AuthRequest, @Query('event') event?: string) {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can access verified-by summary');
    }
    const payments = await this.registrationService.findAll();

    let filtered = payments.filter((p) => p.paymentStatus === 'verified' && p.verifiedBy);

    if (event) {
      filtered = filtered.filter((p) => p.event === event);
    }

    const verifierIds = Array.from(new Set(filtered.map((p) => p.verifiedBy).filter(Boolean))) as number[];
    const users = verifierIds.length
      ? await this.userRepository.find({ where: { id: In(verifierIds) } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const grouped = new Map<number, Registration[]>();
    filtered.forEach((payment) => {
      const id = payment.verifiedBy as number;
      if (!grouped.has(id)) grouped.set(id, []);
      grouped.get(id)!.push(payment);
    });

    const result = Array.from(grouped.entries()).map(([verifierId, registrations]) => {
      const verifier = userMap.get(verifierId);
      return {
        verifier: verifier
          ? {
              id: verifier.id,
              name: verifier.name,
              username: verifier.username,
              role: verifier.role,
            }
          : {
              id: verifierId,
              name: 'Unknown User',
              username: 'unknown',
              role: 'member',
            },
        totalVerified: registrations.length,
        registrations,
      };
    });

    return result.sort((a, b) => b.totalVerified - a.totalVerified);
  }
}
