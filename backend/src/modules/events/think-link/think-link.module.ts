import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ThinkLinkController } from './think-link.controller';
import { ThinkLinkPresentation } from './think-link.entity';
import { ThinkLinkService } from './think-link.service';

@Module({
  imports: [TypeOrmModule.forFeature([ThinkLinkPresentation])],
  controllers: [ThinkLinkController],
  providers: [ThinkLinkService],
  exports: [ThinkLinkService],
})
export class ThinkLinkModule {}
