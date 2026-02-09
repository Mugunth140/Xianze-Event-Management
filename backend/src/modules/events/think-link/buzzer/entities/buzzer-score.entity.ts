import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entity for storing buzzer scores persistently
 * Allows reuse across different events
 */
@Entity('buzzer_scores')
@Index(['eventSlug', 'teamKey'], { unique: true })
export class BuzzerScore {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Event identifier (e.g., 'think-link', 'tech-quiz', 'general-quiz')
   */
  @Column()
  @Index()
  eventSlug: string;

  /**
   * Unique team identifier (lowercase "name1|name2")
   */
  @Column()
  teamKey: string;

  /**
   * First participant name
   */
  @Column()
  name1: string;

  /**
   * Second participant name
   */
  @Column()
  name2: string;

  /**
   * Total score
   */
  @Column({ default: 0 })
  score: number;

  /**
   * Number of correct answers
   */
  @Column({ default: 0 })
  correctAnswers: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
