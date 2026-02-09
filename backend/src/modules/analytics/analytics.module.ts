import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../contact/contact.entity';
import { Registration } from '../registration/registration.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PageView, Visitor } from './entities';
import { VisitorAnalyticsController } from './visitor-analytics.controller';
import { VisitorAnalyticsService } from './visitor-analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, Contact, PageView, Visitor])],
  controllers: [AnalyticsController, VisitorAnalyticsController],
  providers: [AnalyticsService, VisitorAnalyticsService],
})
export class AnalyticsModule {}
