import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuzzerGateway } from './buzzer.gateway';
import { BuzzerService } from './buzzer.service';
import { BuzzerScore } from './entities/buzzer-score.entity';

/**
 * Buzzer Module - Reusable across events
 *
 * Provides real-time buzzer functionality using WebSockets.
 * - Coordinator can start/stop buzzer sessions for any event
 * - Participants join with team names and press buzzer
 * - Server timestamps determine winner (first press)
 * - Scores persist in database across sessions
 */
@Module({
  imports: [TypeOrmModule.forFeature([BuzzerScore])],
  providers: [BuzzerGateway, BuzzerService],
  exports: [BuzzerGateway, BuzzerService],
})
export class BuzzerModule {}
