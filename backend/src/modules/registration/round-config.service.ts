import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventParticipation } from './entities/event-participation.entity';
import { EventRoundConfig } from './entities/event-round-config.entity';
import { RoundParticipation } from './entities/round-participation.entity';

// Default events configuration
const DEFAULT_EVENTS = [
  { eventSlug: 'buildathon', eventName: 'Buildathon', totalRounds: 0 },
  { eventSlug: 'bug-smash', eventName: 'Bug Smash', totalRounds: 2 },
  { eventSlug: 'paper-presentation', eventName: 'Paper Presentation', totalRounds: 0 },
  { eventSlug: 'ctrl-quiz', eventName: 'Ctrl+ Quiz', totalRounds: 3 },
  { eventSlug: 'code-hunt', eventName: 'Code Hunt', totalRounds: 2 },
  { eventSlug: 'think-link', eventName: 'Think & Link', totalRounds: 2 },
  { eventSlug: 'gaming', eventName: 'Gaming', totalRounds: 0 },
  { eventSlug: 'fun-games', eventName: 'Fun Games', totalRounds: 0 },
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
  ) {}

  /**
   * Initialize default round configurations if not exists
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
      }
    }
  }

  /**
   * Get all round configurations
   */
  async findAll(): Promise<EventRoundConfig[]> {
    // Initialize defaults if empty
    const count = await this.roundConfigRepo.count();
    if (count === 0) {
      await this.initializeDefaults();
    }

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
    } else {
      // Move to next round
      config.currentRound += 1;
    }

    return this.roundConfigRepo.save(config);
  }

  /**
   * Reset event to initial state
   */
  async resetEvent(eventSlug: string): Promise<EventRoundConfig> {
    const config = await this.roundConfigRepo.findOne({
      where: { eventSlug },
    });

    if (!config) {
      throw new NotFoundException(`Event configuration not found: ${eventSlug}`);
    }

    config.isStarted = false;
    config.currentRound = 0;
    config.isCompleted = false;
    config.roundCompletedAt = null;

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
      };
    }

    return {
      eventSlug: config.eventSlug,
      currentRound: config.currentRound || 1,
      totalRounds: config.totalRounds,
      isStarted: config.isStarted,
      isCompleted: config.isCompleted,
      hasRounds: config.totalRounds > 0,
    };
  }
}
