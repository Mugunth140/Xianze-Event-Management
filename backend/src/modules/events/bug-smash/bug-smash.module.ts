import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BugSmashController } from './bug-smash.controller';
import {
    BugSmashParticipant,
    BugSmashQuestion,
    BugSmashRoundState,
    BugSmashSubmission,
} from './bug-smash.entity';
import { BugSmashService } from './bug-smash.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BugSmashQuestion,
            BugSmashParticipant,
            BugSmashSubmission,
            BugSmashRoundState,
        ]),
    ],
    controllers: [BugSmashController],
    providers: [BugSmashService],
    exports: [BugSmashService],
})
export class BugSmashModule { }
