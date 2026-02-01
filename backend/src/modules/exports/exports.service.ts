import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventParticipation } from '../registration/entities/event-participation.entity';
import { RoundParticipation } from '../registration/entities/round-participation.entity';
import { Registration } from '../registration/registration.entity';
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
}
