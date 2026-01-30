import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { AttendanceController } from './attendance.controller';
import { PaymentController } from './payment.controller';
import { RegistrationController } from './registration.controller';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { SpotRegistrationState } from './spot-registration-state.entity';
import { SpotRegistrationController } from './spot-registration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, SpotRegistrationState]), MailModule],
  controllers: [RegistrationController, PaymentController, AttendanceController, SpotRegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
