import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { User } from '../users/user.entity';
import { AttendanceController } from './attendance.controller';
import { EventParticipation } from './entities/event-participation.entity';
import { RoundParticipation } from './entities/round-participation.entity';
import { EventParticipationService } from './event-participation.service';
import { PaymentController } from './payment.controller';
import { RegistrationController } from './registration.controller';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, User, EventParticipation, RoundParticipation]),
    MailModule,
  ],
  controllers: [RegistrationController, PaymentController, AttendanceController],
  providers: [RegistrationService, EventParticipationService],
  exports: [RegistrationService, EventParticipationService],
})
export class RegistrationModule {}
