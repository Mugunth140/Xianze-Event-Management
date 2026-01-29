import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtrlQuizController } from './ctrl-quiz.controller';
import {
  CtrlQuizParticipant,
  CtrlQuizQuestion,
  CtrlQuizRoundState,
  CtrlQuizSubmission,
} from './ctrl-quiz.entity';
import { CtrlQuizService } from './ctrl-quiz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CtrlQuizQuestion,
      CtrlQuizParticipant,
      CtrlQuizSubmission,
      CtrlQuizRoundState,
    ]),
  ],
  controllers: [CtrlQuizController],
  providers: [CtrlQuizService],
  exports: [CtrlQuizService],
})
export class CtrlQuizModule {}
