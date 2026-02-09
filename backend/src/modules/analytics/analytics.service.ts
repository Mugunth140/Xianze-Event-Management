import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../contact/contact.entity';
import { Registration } from '../registration/registration.entity';

// Canonical event names - normalize variations to these
const CANONICAL_EVENTS: Record<string, string> = {
  // Buildathon variations
  buildathon: 'Buildathon',
  buildathlon: 'Buildathon',
  'build a thon': 'Buildathon',
  // Ctrl+ Quiz variations
  'ctrl + quiz': 'Ctrl+ Quiz',
  'ctrl+ quiz': 'Ctrl+ Quiz',
  'ctrl+quiz': 'Ctrl+ Quiz',
  'ctrl quiz': 'Ctrl+ Quiz',
  // Bug Smash
  'bug smash': 'Bug Smash',
  bugsmash: 'Bug Smash',
  // Paper Presentation
  'paper presentation': 'Paper Presentation',
  paperpresentation: 'Paper Presentation',
  // Think & Link
  'think & link': 'Think & Link',
  'think and link': 'Think & Link',
  thinklink: 'Think & Link',
  'think&link': 'Think & Link',
  // Code Hunt
  'code hunt': 'Code Hunt: Word Edition',
  'code hunt: word edition': 'Code Hunt: Word Edition',
  codehunt: 'Code Hunt: Word Edition',
  // Gaming
  gaming: 'Gaming',
  // Fun Games
  'fun games': 'Fun Games',
  fungames: 'Fun Games',
};

function normalizeEventName(eventName: string): string {
  if (!eventName) return eventName;
  const key = eventName.toLowerCase().trim();
  return CANONICAL_EVENTS[key] || eventName;
}

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

    const rawRegistrationsByEvent = await this.registrationRepository
      .createQueryBuilder('r')
      .select('r.event', 'event')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.event')
      .getRawMany();

    // Normalize and consolidate event names
    const eventCountMap = new Map<string, number>();
    for (const item of rawRegistrationsByEvent) {
      const normalizedName = normalizeEventName(item.event);
      const currentCount = eventCountMap.get(normalizedName) || 0;
      eventCountMap.set(normalizedName, currentCount + parseInt(item.count));
    }

    const registrationsByEvent = Array.from(eventCountMap.entries())
      .map(([event, count]) => ({ event, count: count.toString() }))
      .sort((a, b) => parseInt(b.count) - parseInt(a.count));

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

  async getPaymentStats() {
    const stats = await this.registrationRepository
      .createQueryBuilder('r')
      .select('r.paymentStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.paymentStatus')
      .getRawMany();

    // Ensure all statuses are represented even if count is 0
    const formattedStats = [
      { status: 'verified', count: 0 },
      { status: 'pending', count: 0 },
      { status: 'rejected', count: 0 },
    ];

    stats.forEach((item) => {
      const index = formattedStats.findIndex((s) => s.status === item.status);
      if (index !== -1) {
        formattedStats[index].count = parseInt(item.count);
      }
    });

    return formattedStats;
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

  async getEventBreakdown(eventName?: string, paymentMode?: string) {
    const query = this.registrationRepository.createQueryBuilder('r');

    if (eventName) {
      query.where('r.event = :eventName', { eventName });
    }

    if (paymentMode) {
      if (eventName) {
        query.andWhere('r.paymentMode = :paymentMode', { paymentMode });
      } else {
        query.where('r.paymentMode = :paymentMode', { paymentMode });
      }
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
        'r.paymentMode',
        'r.transactionId',
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
