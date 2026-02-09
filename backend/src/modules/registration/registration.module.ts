import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { User } from '../users/user.entity';
import { AttendanceController } from './attendance.controller';
import { EventParticipation } from './entities/event-participation.entity';
import { EventRoundConfig } from './entities/event-round-config.entity';
import { RoundParticipation } from './entities/round-participation.entity';
import { EventParticipationService } from './event-participation.service';
import { PaymentController } from './payment.controller';
import { RegistrationController } from './registration.controller';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { RoundConfigService } from './round-config.service';
import { RoundsController } from './rounds.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registration,
      User,
      EventParticipation,
      RoundParticipation,
      EventRoundConfig,
    ]),
    MailModule,
  ],
  controllers: [RegistrationController, PaymentController, AttendanceController, RoundsController],
  providers: [RegistrationService, EventParticipationService, RoundConfigService],
  exports: [RegistrationService, EventParticipationService, RoundConfigService],
})
export class RegistrationModule {}
