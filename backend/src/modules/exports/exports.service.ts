import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Contact } from '../contact/contact.entity';
import { EventParticipation } from '../registration/entities/event-participation.entity';
import { RoundParticipation } from '../registration/entities/round-participation.entity';
import { PaymentStatus, Registration } from '../registration/registration.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ExportsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(EventParticipation)
    private readonly eventParticipationRepo: Repository<EventParticipation>,
    @InjectRepository(RoundParticipation)
    private readonly roundParticipationRepo: Repository<RoundParticipation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async getRegistrations(event?: string) {
    if (event) {
      return this.registrationRepo.find({
        where: { event },
        order: { createdAt: 'DESC' },
      });
    }
    return this.registrationRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getAttendance(event?: string) {
    const where = event ? { isCheckedIn: true, event } : { isCheckedIn: true };
    return this.registrationRepo.find({
      where,
      order: { checkedInAt: 'DESC' },
    });
  }

  async getEventParticipation(eventSlug: string) {
    const participations = await this.eventParticipationRepo.find({
      where: { eventSlug },
      order: { scannedAt: 'DESC' },
    });

    const registrationIds = participations.map((p) => p.registrationId);
    const registrations = registrationIds.length
      ? await this.registrationRepo.find({ where: { id: In(registrationIds) } })
      : [];

    const registrationMap = new Map(registrations.map((r) => [r.id, r]));

    return participations.map((p) => {
      const reg = registrationMap.get(p.registrationId);
      return {
        registrationId: p.registrationId,
        name: reg?.name || '',
        email: reg?.email || '',
        college: reg?.college || '',
        registeredEvent: reg?.event || '',
        eventSlug: p.eventSlug,
        scannedAt: p.scannedAt,
      };
    });
  }

  async getRoundParticipation(eventSlug: string) {
    const rounds = await this.roundParticipationRepo.find({
      where: { eventSlug },
      order: { scannedAt: 'DESC' },
    });

    const registrationIds = rounds.map((p) => p.registrationId);
    const registrations = registrationIds.length
      ? await this.registrationRepo.find({ where: { id: In(registrationIds) } })
      : [];

    const registrationMap = new Map(registrations.map((r) => [r.id, r]));

    return rounds.map((r) => {
      const reg = registrationMap.get(r.registrationId);
      return {
        registrationId: r.registrationId,
        name: reg?.name || '',
        email: reg?.email || '',
        college: reg?.college || '',
        registeredEvent: reg?.event || '',
        eventSlug: r.eventSlug,
        roundNumber: r.roundNumber,
        scannedAt: r.scannedAt,
      };
    });
  }

  async getUsers() {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
    });

    return users.map(({ password: _password, ...user }) => user);
  }

  async getPayments(status?: string) {
    const where: Record<string, unknown> = {};
    if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      where.paymentStatus = status;
    }

    const registrations = await this.registrationRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return registrations.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      contact: r.contact,
      college: r.college,
      event: r.event,
      paymentMode: r.paymentMode,
      transactionId: r.transactionId || '',
      paymentStatus: r.paymentStatus,
      verifiedAt: r.verifiedAt,
      verificationNote: r.verificationNote || '',
      createdAt: r.createdAt,
    }));
  }

  async getAllEventParticipation() {
    const participations = await this.eventParticipationRepo.find({
      order: { scannedAt: 'DESC' },
    });

    const registrationIds = participations.map((p) => p.registrationId);
    const registrations = registrationIds.length
      ? await this.registrationRepo.find({ where: { id: In(registrationIds) } })
      : [];

    const registrationMap = new Map(registrations.map((r) => [r.id, r]));

    return participations.map((p) => {
      const reg = registrationMap.get(p.registrationId);
      return {
        registrationId: p.registrationId,
        name: reg?.name || '',
        email: reg?.email || '',
        college: reg?.college || '',
        registeredEvent: reg?.event || '',
        eventSlug: p.eventSlug,
        scannedAt: p.scannedAt,
      };
    });
  }

  async getCheckedInNoParticipation() {
    const checkedIn = await this.registrationRepo.find({
      where: { isCheckedIn: true },
      order: { checkedInAt: 'DESC' },
    });

    const checkedInIds = checkedIn.map((r) => r.id);
    const participated = checkedInIds.length
      ? await this.eventParticipationRepo.find({
          where: { registrationId: In(checkedInIds) },
        })
      : [];

    const participatedIds = new Set(participated.map((p) => p.registrationId));

    return checkedIn
      .filter((r) => !participatedIds.has(r.id))
      .map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        contact: r.contact,
        college: r.college,
        event: r.event,
        checkedInAt: r.checkedInAt,
      }));
  }

  async getContactInquiries() {
    return this.contactRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getEventSummary() {
    const allRegistrations = await this.registrationRepo.find();
    const allCheckedIn = await this.registrationRepo.find({ where: { isCheckedIn: true } });
    const allParticipations = await this.eventParticipationRepo.find();

    // Unique events from registrations
    const eventNames = [...new Set(allRegistrations.map((r) => r.event))];

    // Unique event slugs from participations
    const eventSlugs = [...new Set(allParticipations.map((p) => p.eventSlug))];
    const allSlugsAndNames = [...new Set([...eventNames, ...eventSlugs])];

    return allSlugsAndNames.sort().map((eventKey) => {
      const registered = allRegistrations.filter((r) => r.event === eventKey).length;
      const checkedIn = allCheckedIn.filter((r) => r.event === eventKey).length;
      const participated = allParticipations.filter((p) => p.eventSlug === eventKey).length;

      return {
        event: eventKey,
        totalRegistrations: registered,
        totalCheckedIn: checkedIn,
        totalParticipated: participated,
      };
    });
  }
}
