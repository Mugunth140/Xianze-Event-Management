import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RequireTasks } from '../auth/decorators/tasks.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksGuard } from '../auth/guards/tasks.guard';
import { MailService } from '../mail/mail.service';
import { UserTask } from '../users/user.entity';
import { CreateSpotRegistrationDto } from './dto/create-spot-registration.dto';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';

interface AuthRequest {
  user: { id: number; username: string; role: string };
}

@Controller('spot-registration')
export class SpotRegistrationController {
  private readonly logger = new Logger(SpotRegistrationController.name);

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly mailService: MailService,
  ) {}

  @Get('state')
  async getState(): Promise<{ success: boolean; enabled: boolean }> {
    const state = await this.registrationService.getSpotRegistrationState();
    return { success: true, enabled: state.enabled };
  }

  @Patch('state')
  @UseGuards(JwtAuthGuard, TasksGuard)
  @RequireTasks(UserTask.SPOT_REGISTRATION)
  async updateState(@Body('enabled') enabled: boolean) {
    const updated = await this.registrationService.updateSpotRegistrationState(Boolean(enabled));
    return { success: true, enabled: updated.enabled };
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateSpotRegistrationDto,
  ): Promise<{ success: boolean; message: string; status: string }> {
    const state = await this.registrationService.getSpotRegistrationState();
    if (!state.enabled) {
      throw new ForbiddenException('Spot registration is currently closed');
    }

    const exists = await this.registrationService.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException('This email is already registered for an event');
    }

    await this.registrationService.createSpotRegistration(dto);

    return {
      success: true,
      message: 'Spot registration submitted successfully. Await verification.',
      status: 'pending_verification',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, TasksGuard)
  @RequireTasks(UserTask.SPOT_REGISTRATION)
  async list(@Query('event') event?: string): Promise<{ success: boolean; data: Registration[] }> {
    const registrations = await this.registrationService.findSpotRegistrations(event);
    return { success: true, data: registrations };
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, TasksGuard)
  @RequireTasks(UserTask.SPOT_REGISTRATION)
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ): Promise<{ success: boolean; registration: Registration; emailSent: boolean }> {
    const registration = await this.registrationService.verifySpotRegistration(id, req.user.id);

    const emailSent = await this.sendEventPassEmail(registration);

    return {
      success: true,
      registration,
      emailSent,
    };
  }

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
}
