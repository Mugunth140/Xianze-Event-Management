import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaperPresentationController } from './paper-presentation.controller';
import { PaperPresentationService } from './paper-presentation.service';
import { PaperSubmission } from './paper-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaperSubmission])],
  controllers: [PaperPresentationController],
  providers: [PaperPresentationService],
  exports: [PaperPresentationService],
})
export class PaperPresentationModule {}
