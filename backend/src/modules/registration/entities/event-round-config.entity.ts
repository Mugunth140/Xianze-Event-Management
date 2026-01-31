import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

/**
 * Stores configuration for event rounds.
 * Some events have multiple rounds (e.g., Bug Smash, Ctrl+Quiz),
 * while others have no rounds (e.g., Paper Presentation, Buildathon, Fun Games).
 */
@Entity('event_round_configs')
@Unique(['eventSlug'])
export class EventRoundConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  eventSlug: string;

  @Column({ type: 'varchar', length: 255 })
  eventName: string;

  /**
   * Total number of rounds for this event
   * 0 = No rounds (single session event like Buildathon, Paper Presentation)
   * 1+ = Multiple rounds with scanning per round
   */
  @Column({ type: 'int', default: 0 })
  totalRounds: number;

  /**
   * Current active round (1-indexed)
   * 0 = Not started or no rounds
   * 1+ = Currently on this round
   */
  @Column({ type: 'int', default: 0 })
  currentRound: number;

  /**
   * Whether the event has started
   */
  @Column({ type: 'boolean', default: false })
  isStarted: boolean;

  /**
   * Whether the event has completed all rounds
   */
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  /**
   * Timestamps for each round completion
   * Stored as JSON: { "1": "2026-01-31T10:00:00Z", "2": "2026-01-31T11:00:00Z" }
   */
  @Column({ type: 'simple-json', nullable: true })
  roundCompletedAt: Record<number, string> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
