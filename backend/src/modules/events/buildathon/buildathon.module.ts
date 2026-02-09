import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildathonController } from './buildathon.controller';
import {
  BuildathonApiState,
  BuildathonDocument,
  BuildathonRequestLog,
  BuildathonTeam,
} from './buildathon.entity';
import { BuildathonService } from './buildathon.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BuildathonTeam,
      BuildathonDocument,
      BuildathonApiState,
      BuildathonRequestLog,
    ]),
  ],
  controllers: [BuildathonController],
  providers: [BuildathonService],
  exports: [BuildathonService],
})
export class BuildathonModule {}
