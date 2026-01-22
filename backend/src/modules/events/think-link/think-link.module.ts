import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThinkLinkController } from './think-link.controller';
import { ThinkLinkPuzzle } from './think-link.entity';
import { ThinkLinkService } from './think-link.service';

@Module({
    imports: [TypeOrmModule.forFeature([ThinkLinkPuzzle])],
    controllers: [ThinkLinkController],
    providers: [ThinkLinkService],
    exports: [ThinkLinkService],
})
export class ThinkLinkModule { }
