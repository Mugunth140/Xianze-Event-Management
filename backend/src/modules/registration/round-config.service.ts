import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventParticipation } from './entities/event-participation.entity';
import { EventRoundConfig } from './entities/event-round-config.entity';
import { RoundParticipation } from './entities/round-participation.entity';
import { Registration } from './registration.entity';

// Default events configuration
const DEFAULT_EVENTS = [
  { eventSlug: 'buildathon', eventName: 'Buildathon', totalRounds: 0 },
  { eventSlug: 'bug-smash', eventName: 'Bug Smash', totalRounds: 2 },
  { eventSlug: 'paper-presentation', eventName: 'Paper Presentation', totalRounds: 0 },
  { eventSlug: 'ctrl-quiz', eventName: 'Ctrl+ Quiz', totalRounds: 3 },
  { eventSlug: 'code-hunt', eventName: 'Code Hunt', totalRounds: 2 },
  { eventSlug: 'think-link', eventName: 'Think & Link', totalRounds: 2 },
  { eventSlug: 'gaming', eventName: 'Gaming', totalRounds: 3 }, // Mobile gaming competition with 2-3 rounds
  { eventSlug: 'fun-games', eventName: 'Fun Games', totalRounds: 0 }, // Mini games, no rounds
];

export interface RoundAnalytics {
  eventSlug: string;
  eventName: string;
  totalRounds: number;
  currentRound: number;
  isStarted: boolean;
  isCompleted: boolean;
  participantsByRound: Array<{
    roundNumber: number;
    participantCount: number;
    completedAt?: string;
  }>;
  totalEventParticipants: number;
}

@Injectable()
export class RoundConfigService {
  private readonly logger = new Logger(RoundConfigService.name);

  constructor(
    @InjectRepository(EventRoundConfig)
    private readonly roundConfigRepo: Repository<EventRoundConfig>,
    @InjectRepository(EventParticipation)
    private readonly eventParticipationRepo: Repository<EventParticipation>,
    @InjectRepository(RoundParticipation)
    private readonly roundParticipationRepo: Repository<RoundParticipation>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
  ) {}

  /**
   * Initialize default round configurations if not exists
   * Also fixes existing records with incorrect event names
   */
  async initializeDefaults(): Promise<void> {
    for (const event of DEFAULT_EVENTS) {
      const existing = await this.roundConfigRepo.findOne({
        where: { eventSlug: event.eventSlug },
      });

      if (!existing) {
        const config = this.roundConfigRepo.create(event);
        await this.roundConfigRepo.save(config);
        this.logger.log(`Initialized round config for ${event.eventName}`);
      } else if (existing.eventName !== event.eventName) {
        // Fix incorrect event names (e.g., 'gaming' slug had 'Fun Games' name before)
        existing.eventName = event.eventName;
        await this.roundConfigRepo.save(existing);
        this.logger.log(
          `Fixed event name for ${event.eventSlug}: ${existing.eventName} -> ${event.eventName}`,
        );
      }
    }
  }

  /**
   * Get all round configurations
   */
  async findAll(): Promise<EventRoundConfig[]> {
    // Always ensure all default events exist (handles new events added later)
    await this.initializeDefaults();

    return this.roundConfigRepo.find({
      order: { eventName: 'ASC' },
    });
  }

  /**
   * Get round configuration for a specific event
   */
  async findByEvent(eventSlug: string): Promise<EventRoundConfig | null> {
    return this.roundConfigRepo.findOne({
      where: { eventSlug },
    });
  }

  /**
   * Update round configuration for an event (admin only)
   */
  async updateConfig(eventSlug: string, totalRounds: number): Promise<EventRoundConfig> {
    // eslint-disable-next-line prefer-const
    let config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    config.totalRounds = totalRounds;

    // Reset round progress if rounds changed
    if (totalRounds === 0) {
      config.currentRound = 0;
      config.isCompleted = false;
    } else if (config.currentRound > totalRounds) {
      config.currentRound = totalRounds;
    }

    return this.roundConfigRepo.save(config);
  }

  /**
   * Start an event (sets currentRound to 1)
   */
  async startEvent(eventSlug: string): Promise<EventRoundConfig> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    config.isStarted = true;
    config.currentRound = config.totalRounds > 0 ? 1 : 0;
    config.isCompleted = false;

    return this.roundConfigRepo.save(config);
  }

  /**
   * Advance to next round or complete the event
   */
  async advanceRound(eventSlug: string): Promise<EventRoundConfig> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    if (config.totalRounds === 0) {
      // No rounds event - just mark as completed
      config.isCompleted = true;
      return this.roundConfigRepo.save(config);
    }

    // Record when this round was completed
    const roundCompletedAt = config.roundCompletedAt || {};
    roundCompletedAt[config.currentRound] = new Date().toISOString();
    config.roundCompletedAt = roundCompletedAt;

    if (config.currentRound >= config.totalRounds) {
      // All rounds completed
      config.isCompleted = true;
      config.isStarted = false;
    } else {
      // Pause after completing the round; next round must be started manually
      config.isCompleted = false;
      config.isStarted = false;
    }

    return this.roundConfigRepo.save(config);
  }

  /**
   * Manually set the current round for an event
   */
  async setCurrentRound(eventSlug: string, roundNumber: number): Promise<EventRoundConfig> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    if (config.totalRounds <= 0) {
      throw new BadRequestException('This event does not have rounds to set');
    }

    if (roundNumber < 1 || roundNumber > config.totalRounds) {
      throw new BadRequestException(`Round number must be between 1 and ${config.totalRounds}`);
    }

    config.isStarted = true;
    config.isCompleted = false;
    config.currentRound = roundNumber;

    return this.roundConfigRepo.save(config);
  }

  /**
   * Reset event to initial state
   * Also clears all participation records
   */
  async resetEvent(eventSlug: string): Promise<EventRoundConfig> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    // Clear all participation records for this event
    await this.eventParticipationRepo.delete({ eventSlug });
    await this.roundParticipationRepo.delete({ eventSlug });

    config.isStarted = false;
    config.currentRound = 0;
    config.isCompleted = false;
    config.roundCompletedAt = null;

    return this.roundConfigRepo.save(config);
  }

  /**
   * Reset a specific round for an event
   * Clears round participation and marks the round as not completed
   */
  async resetRound(eventSlug: string, roundNumber: number): Promise<EventRoundConfig> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    if (config.totalRounds <= 0) {
      throw new BadRequestException('This event does not have rounds to reset');
    }

    if (roundNumber < 1 || roundNumber > config.totalRounds) {
      throw new BadRequestException(`Round number must be between 1 and ${config.totalRounds}`);
    }

    await this.roundParticipationRepo.delete({ eventSlug, roundNumber });

    if (config.roundCompletedAt?.[roundNumber]) {
      const updated = { ...config.roundCompletedAt };
      delete updated[roundNumber];
      config.roundCompletedAt = Object.keys(updated).length ? updated : null;
    }

    config.isCompleted = false;
    config.isStarted = true;

    if (config.currentRound === 0 || config.currentRound > roundNumber) {
      config.currentRound = roundNumber;
    }

    return this.roundConfigRepo.save(config);
  }

  /**
   * Get analytics for a specific event
   */
  async getEventAnalytics(eventSlug: string): Promise<RoundAnalytics> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    // Get total event participants
    const totalEventParticipants = await this.eventParticipationRepo.count({
      where: { eventSlug },
    });

    // Get participants by round
    const participantsByRound: RoundAnalytics['participantsByRound'] = [];

    if (config.totalRounds > 0) {
      for (let round = 1; round <= config.totalRounds; round++) {
        const count = await this.roundParticipationRepo.count({
          where: { eventSlug, roundNumber: round },
        });

        participantsByRound.push({
          roundNumber: round,
          participantCount: count,
          completedAt: config.roundCompletedAt?.[round],
        });
      }
    }

    return {
      eventSlug: config.eventSlug,
      eventName: config.eventName,
      totalRounds: config.totalRounds,
      currentRound: config.currentRound,
      isStarted: config.isStarted,
      isCompleted: config.isCompleted,
      participantsByRound,
      totalEventParticipants,
    };
  }

  /**
   * Get analytics for all events
   */
  async getAllAnalytics(): Promise<RoundAnalytics[]> {
    const configs = await this.findAll();
    const analytics: RoundAnalytics[] = [];

    for (const config of configs) {
      const eventAnalytics = await this.getEventAnalytics(config.eventSlug);
      analytics.push(eventAnalytics);
    }

    return analytics;
  }

  /**
   * Get current round for an event (for scanner to know which round to scan)
   */
  async getCurrentRound(eventSlug: string): Promise<{
    eventSlug: string;
    currentRound: number;
    totalRounds: number;
    isStarted: boolean;
    isCompleted: boolean;
    hasRounds: boolean;
    currentRoundParticipantCount: number;
    currentRoundParticipants: Array<{
      registrationId: number;
      name: string;
      email: string;
      scannedAt: Date;
    }>;
  }> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      // Return default if not configured
      return {
        eventSlug,
        currentRound: 1,
        totalRounds: 0,
        isStarted: false,
        isCompleted: false,
        hasRounds: false,
        currentRoundParticipantCount: 0,
        currentRoundParticipants: [],
      };
    }

    const hasRounds = config.totalRounds > 0;
    const currentRound = config.currentRound || 1;
    const shouldFetchParticipants = hasRounds && config.isStarted && currentRound > 0;

    let currentRoundParticipants: Array<{
      registrationId: number;
      name: string;
      email: string;
      scannedAt: Date;
    }> = [];

    if (shouldFetchParticipants) {
      const participations = await this.roundParticipationRepo.find({
        where: { eventSlug, roundNumber: currentRound },
        order: { scannedAt: 'DESC' },
      });

      const registrationIds = participations.map((p) => p.registrationId);

      if (registrationIds.length > 0) {
        const registrations = await this.registrationRepo.find({
          where: { id: In(registrationIds) },
        });

        const registrationMap = new Map(
          registrations.map((r) => [r.id, { name: r.name, email: r.email }]),
        );

        currentRoundParticipants = participations
          .map((p) => {
            const registration = registrationMap.get(p.registrationId);
            if (!registration) return null;
            return {
              registrationId: p.registrationId,
              name: registration.name,
              email: registration.email,
              scannedAt: p.scannedAt,
            };
          })
          .filter(Boolean) as Array<{
          registrationId: number;
          name: string;
          email: string;
          scannedAt: Date;
        }>;
      }
    }

    return {
      eventSlug: config.eventSlug,
      currentRound,
      totalRounds: config.totalRounds,
      isStarted: config.isStarted,
      isCompleted: config.isCompleted,
      hasRounds,
      currentRoundParticipantCount: currentRoundParticipants.length,
      currentRoundParticipants,
    };
  }
}
