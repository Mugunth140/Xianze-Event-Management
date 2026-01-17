import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../contact/contact.entity';
import { Registration } from '../registration/registration.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async getOverview() {
    const totalRegistrations = await this.registrationRepository.count();
    const totalContacts = await this.contactRepository.count();

    const registrationsByEvent = await this.registrationRepository
      .createQueryBuilder('r')
      .select('r.event', 'event')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.event')
      .getRawMany();

    const registrationsByCollege = await this.registrationRepository
      .createQueryBuilder('r')
      .select('r.college', 'college')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.college')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalRegistrations,
      totalContacts,
      registrationsByEvent,
      registrationsByCollege,
    };
  }

  async getRegistrationTrends() {
    const trends = await this.registrationRepository
      .createQueryBuilder('r')
      .select("strftime('%Y-%m-%d', r.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy("strftime('%Y-%m-%d', r.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return trends;
  }

  async getEventBreakdown(eventName?: string) {
    const query = this.registrationRepository.createQueryBuilder('r');

    if (eventName) {
      query.where('r.event = :eventName', { eventName });
    }

    const registrations = await query
      .select([
        'r.id',
        'r.name',
        'r.email',
        'r.college',
        'r.course',
        'r.branch',
        'r.contact',
        'r.event',
        'r.createdAt',
      ])
      .orderBy('r.createdAt', 'DESC')
      .getMany();

    return registrations;
  }

  async getRecentRegistrations(limit = 10) {
    return this.registrationRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
