import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { PaymentController } from './payment.controller';
import { RegistrationController } from './registration.controller';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';

@Module({
  imports: [TypeOrmModule.forFeature([Registration])],
  controllers: [RegistrationController, PaymentController, AttendanceController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
