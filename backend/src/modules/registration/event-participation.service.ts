import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventParticipation } from './entities/event-participation.entity';
import { RoundParticipation } from './entities/round-participation.entity';
import { PaymentStatus, Registration } from './registration.entity';

export interface ScanResult {
  success: boolean;
  message: string;
  warning?: boolean;
  registration?: {
    id: number;
    name: string;
    email: string;
    college: string;
    event: string; // Registered event
    passId: string;
  };
  participation?: EventParticipation | RoundParticipation;
}

export interface ParticipationHistory {
  registrationId: number;
  participantName: string;
  participantEmail: string;
  registeredEvent: string;
  isCheckedIn: boolean;
  checkedInAt?: Date;
  eventParticipations: Array<{
    eventSlug: string;
    scannedAt: Date;
    rounds: Array<{
      roundNumber: number;
      scannedAt: Date;
    }>;
  }>;
}

@Injectable()
export class EventParticipationService {
  private readonly logger = new Logger(EventParticipationService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(EventParticipation)
    private readonly eventParticipationRepo: Repository<EventParticipation>,
    @InjectRepository(RoundParticipation)
    private readonly roundParticipationRepo: Repository<RoundParticipation>,
  ) {}

  /**
   * Validate participant can participate in events
   * Must be checked in at venue first
   */
  private async validateParticipant(qrHash: string): Promise<{
    valid: boolean;
    registration?: Registration;
    reason?: string;
  }> {
    const registration = await this.registrationRepo.findOne({
      where: { qrCodeHash: qrHash },
    });

    if (!registration) {
      return { valid: false, reason: 'Invalid QR code - participant not found' };
    }

    if (registration.paymentStatus !== PaymentStatus.VERIFIED) {
      return {
        valid: false,
        registration,
        reason: `Payment not verified (status: ${registration.paymentStatus})`,
      };
    }

    if (!registration.isCheckedIn) {
      return {
        valid: false,
        registration,
        reason: 'Participant must check in at venue desk first',
      };
    }

    return { valid: true, registration };
  }

  /**
   * Scan a participant at an event hall
   * Creates event participation record if not already exists
   */
  async scanEventParticipation(
    qrHash: string,
    eventSlug: string,
    scannedBy: number,
  ): Promise<ScanResult> {
    // Validate participant
    const validation = await this.validateParticipant(qrHash);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.reason!,
        registration: validation.registration
          ? {
              id: validation.registration.id,
              name: validation.registration.name,
              email: validation.registration.email,
              college: validation.registration.college,
              event: validation.registration.event,
              passId: validation.registration.passId || '',
            }
          : undefined,
      };
    }

    const registration = validation.registration!;

    // Check if already participated in this event
    const existing = await this.eventParticipationRepo.findOne({
      where: {
        registrationId: registration.id,
        eventSlug,
      },
    });

    if (existing) {
      this.logger.warn(`Duplicate scan: ${registration.name} already scanned for ${eventSlug}`);
      return {
        success: true,
        warning: true,
        message: `Already registered for this event at ${existing.scannedAt.toLocaleTimeString()}`,
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          college: registration.college,
          event: registration.event,
          passId: registration.passId || '',
        },
        participation: existing,
      };
    }

    // Create new participation record
    const participation = this.eventParticipationRepo.create({
      registrationId: registration.id,
      eventSlug,
      scannedBy,
    });

    const saved = await this.eventParticipationRepo.save(participation);

    this.logger.log(`Event participation recorded: ${registration.name} -> ${eventSlug}`);

    return {
      success: true,
      message: `${registration.name} registered for ${eventSlug}`,
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        event: registration.event,
        passId: registration.passId || '',
      },
      participation: saved,
    };
  }

  /**
   * Scan a participant for a specific round within an event
   * Must have event participation first
   */
  async scanRoundParticipation(
    qrHash: string,
    eventSlug: string,
    roundNumber: number,
    scannedBy: number,
  ): Promise<ScanResult> {
    // Validate participant
    const validation = await this.validateParticipant(qrHash);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.reason!,
        registration: validation.registration
          ? {
              id: validation.registration.id,
              name: validation.registration.name,
              email: validation.registration.email,
              college: validation.registration.college,
              event: validation.registration.event,
              passId: validation.registration.passId || '',
            }
          : undefined,
      };
    }

    const registration = validation.registration!;

    // Check if participant has event participation
    const eventParticipation = await this.eventParticipationRepo.findOne({
      where: {
        registrationId: registration.id,
        eventSlug,
      },
    });

    if (!eventParticipation) {
      return {
        success: false,
        message: `Participant not registered for ${eventSlug}. Scan for event first.`,
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          college: registration.college,
          event: registration.event,
          passId: registration.passId || '',
        },
      };
    }

    // Check if already participated in this round
    const existing = await this.roundParticipationRepo.findOne({
      where: {
        registrationId: registration.id,
        eventSlug,
        roundNumber,
      },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate round scan: ${registration.name} already in round ${roundNumber} of ${eventSlug}`,
      );
      return {
        success: true,
        warning: true,
        message: `Already registered for Round ${roundNumber} at ${existing.scannedAt.toLocaleTimeString()}`,
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          college: registration.college,
          event: registration.event,
          passId: registration.passId || '',
        },
        participation: existing,
      };
    }

    // Create new round participation
    const participation = this.roundParticipationRepo.create({
      registrationId: registration.id,
      eventSlug,
      roundNumber,
      scannedBy,
    });

    const saved = await this.roundParticipationRepo.save(participation);

    this.logger.log(
      `Round participation recorded: ${registration.name} -> ${eventSlug} Round ${roundNumber}`,
    );

    return {
      success: true,
      message: `${registration.name} registered for ${eventSlug} Round ${roundNumber}`,
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        event: registration.event,
        passId: registration.passId || '',
      },
      participation: saved,
    };
  }

  /**
   * Get participation history for a participant
   */
  async getParticipantHistory(registrationId: number): Promise<ParticipationHistory | null> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId },
    });

    if (!registration) {
      return null;
    }

    const eventParticipations = await this.eventParticipationRepo.find({
      where: { registrationId },
      order: { scannedAt: 'ASC' },
    });

    const roundParticipations = await this.roundParticipationRepo.find({
      where: { registrationId },
      order: { scannedAt: 'ASC' },
    });

    // Group rounds by event
    const roundsByEvent = roundParticipations.reduce(
      (acc, round) => {
        if (!acc[round.eventSlug]) {
          acc[round.eventSlug] = [];
        }
        acc[round.eventSlug].push({
          roundNumber: round.roundNumber,
          scannedAt: round.scannedAt,
        });
        return acc;
      },
      {} as Record<string, Array<{ roundNumber: number; scannedAt: Date }>>,
    );

    return {
      registrationId: registration.id,
      participantName: registration.name,
      participantEmail: registration.email,
      registeredEvent: registration.event,
      isCheckedIn: registration.isCheckedIn,
      checkedInAt: registration.checkedInAt || undefined,
      eventParticipations: eventParticipations.map((ep) => ({
        eventSlug: ep.eventSlug,
        scannedAt: ep.scannedAt,
        rounds: roundsByEvent[ep.eventSlug] || [],
      })),
    };
  }

  /**
   * Get all participants for a specific event
   */
  async getEventParticipants(eventSlug: string): Promise<
    Array<{
      registrationId: number;
      name: string;
      email: string;
      college: string;
      scannedAt: Date;
      roundsCompleted: number;
      maxRound: number;
    }>
  > {
    const participations = await this.eventParticipationRepo.find({
      where: { eventSlug },
      order: { scannedAt: 'DESC' },
    });

    const results = [];

    for (const participation of participations) {
      const registration = await this.registrationRepo.findOne({
        where: { id: participation.registrationId },
      });

      if (!registration) continue;

      const rounds = await this.roundParticipationRepo.find({
        where: {
          registrationId: participation.registrationId,
          eventSlug,
        },
      });

      const maxRound = rounds.reduce((max, r) => Math.max(max, r.roundNumber), 0);

      results.push({
        registrationId: registration.id,
        name: registration.name,
        email: registration.email,
        college: registration.college,
        scannedAt: participation.scannedAt,
        roundsCompleted: rounds.length,
        maxRound,
      });
    }

    return results;
  }

  /**
   * Get participation statistics for an event
   */
  async getEventStats(eventSlug: string): Promise<{
    totalParticipants: number;
    roundStats: Array<{ round: number; count: number }>;
  }> {
    const totalParticipants = await this.eventParticipationRepo.count({
      where: { eventSlug },
    });

    // Get round counts
    const rounds = await this.roundParticipationRepo.find({
      where: { eventSlug },
    });

    const roundCounts = rounds.reduce(
      (acc, r) => {
        acc[r.roundNumber] = (acc[r.roundNumber] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    const roundStats = Object.entries(roundCounts)
      .map(([round, count]) => ({
        round: parseInt(round),
        count: count as number,
      }))
      .sort((a, b) => a.round - b.round);

    return {
      totalParticipants,
      roundStats,
    };
  }

  /**
   * Get all venue check-ins with their event participation summary
   */
  async getVenueCheckInSummary(): Promise<
    Array<{
      registrationId: number;
      name: string;
      email: string;
      college: string;
      registeredEvent: string;
      checkedInAt: Date;
      eventsAttended: number;
      events: string[];
    }>
  > {
    const checkedInRegistrations = await this.registrationRepo.find({
      where: { isCheckedIn: true },
      order: { checkedInAt: 'DESC' },
    });

    const results = [];

    for (const reg of checkedInRegistrations) {
      const participations = await this.eventParticipationRepo.find({
        where: { registrationId: reg.id },
      });

      results.push({
        registrationId: reg.id,
        name: reg.name,
        email: reg.email,
        college: reg.college,
        registeredEvent: reg.event,
        checkedInAt: reg.checkedInAt!,
        eventsAttended: participations.length,
        events: participations.map((p) => p.eventSlug),
      });
    }

    return results;
  }
}
