import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuzzerModule } from './buzzer/buzzer.module';
import { ThinkLinkController } from './think-link.controller';
import { ThinkLinkPuzzle } from './think-link.entity';
import { ThinkLinkService } from './think-link.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThinkLinkPuzzle]), BuzzerModule],
  controllers: [ThinkLinkController],
  providers: [ThinkLinkService],
  exports: [ThinkLinkService],
})
export class ThinkLinkModule {}
