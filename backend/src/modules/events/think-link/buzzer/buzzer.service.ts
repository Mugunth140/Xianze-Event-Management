import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuzzerScore } from './entities/buzzer-score.entity';

/**
 * Service for managing buzzer scores with database persistence
 */
@Injectable()
export class BuzzerService {
  private readonly logger = new Logger(BuzzerService.name);

  constructor(
    @InjectRepository(BuzzerScore)
    private readonly scoreRepository: Repository<BuzzerScore>,
  ) {}

  /**
   * Add or increment score for a team in an event
   */
  async addScore(
    eventSlug: string,
    name1: string,
    name2: string,
    points: number = 1,
  ): Promise<BuzzerScore> {
    const teamKey = `${name1.toLowerCase()}|${name2.toLowerCase()}`;

    let score = await this.scoreRepository.findOne({
      where: { eventSlug, teamKey },
    });

    if (score) {
      score.score += points;
      score.correctAnswers += 1;
      this.logger.log(`Updated score for ${name1} & ${name2} in ${eventSlug}: ${score.score}`);
    } else {
      score = this.scoreRepository.create({
        eventSlug,
        teamKey,
        name1,
        name2,
        score: points,
        correctAnswers: 1,
      });
      this.logger.log(`Created new score for ${name1} & ${name2} in ${eventSlug}: ${points}`);
    }

    return this.scoreRepository.save(score);
  }

  /**
   * Get leaderboard for an event, sorted by score descending
   */
  async getLeaderboard(eventSlug: string): Promise<BuzzerScore[]> {
    return this.scoreRepository.find({
      where: { eventSlug },
      order: { score: 'DESC', correctAnswers: 'DESC' },
    });
  }

  /**
   * Reset all scores for an event
   */
  async resetLeaderboard(eventSlug: string): Promise<void> {
    await this.scoreRepository.delete({ eventSlug });
    this.logger.log(`Reset leaderboard for ${eventSlug}`);
  }

  /**
   * Get all available events that have scores
   */
  async getEvents(): Promise<string[]> {
    const results = await this.scoreRepository
      .createQueryBuilder('score')
      .select('DISTINCT score.eventSlug', 'eventSlug')
      .getRawMany();
    return results.map((r) => r.eventSlug);
  }

  /**
   * Delete a specific team's score
   */
  async deleteTeamScore(eventSlug: string, teamKey: string): Promise<void> {
    await this.scoreRepository.delete({ eventSlug, teamKey });
    this.logger.log(`Deleted score for ${teamKey} in ${eventSlug}`);
  }
}
