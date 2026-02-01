import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventParticipation } from '../registration/entities/event-participation.entity';
import { RoundParticipation } from '../registration/entities/round-participation.entity';
import { Registration } from '../registration/registration.entity';
import { User } from '../users/user.entity';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, EventParticipation, RoundParticipation, User])],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
