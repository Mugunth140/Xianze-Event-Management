import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Round status
export enum RoundStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

// Round 2 status for participants
export enum Round2Status {
  PENDING = 'pending',
  QUALIFIED = 'qualified',
  ELIMINATED = 'eliminated',
}

/**
 * MCQ Question for Round 1
 */
@Entity('bug_smash_questions')
export class BugSmashQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'simple-array' })
  options: string[];

  @Column({ type: 'int' })
  correctIndex: number; // 0-based index

  @Column({ type: 'int', default: 30 })
  timeLimit: number; // seconds

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => BugSmashSubmission, (s) => s.question)
  submissions: BugSmashSubmission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Participant in Bug Smash
 */
@Entity('bug_smash_participants')
@Index(['email'], { unique: true })
export class BugSmashParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'int', default: 0 })
  round1Score: number;

  @Column({ type: 'datetime', nullable: true })
  lastSubmitTime: Date | null;

  @Column({ type: 'varchar', length: 20, default: Round2Status.PENDING })
  round2Status: Round2Status;

  @Column({ type: 'int', nullable: true })
  round3Rank: number | null;

  @Column({ type: 'int', nullable: true })
  round3Score: number | null;

  @OneToMany(() => BugSmashSubmission, (s) => s.participant)
  submissions: BugSmashSubmission[];

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Answer submission for Round 1
 */
@Entity('bug_smash_submissions')
@Index(['participant', 'question'], { unique: true })
export class BugSmashSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BugSmashParticipant, (p) => p.submissions, { onDelete: 'CASCADE' })
  participant: BugSmashParticipant;

  @Column({ type: 'int' })
  participantId: number;

  @ManyToOne(() => BugSmashQuestion, (q) => q.submissions, { onDelete: 'CASCADE' })
  question: BugSmashQuestion;

  @Column({ type: 'int' })
  questionId: number;

  @Column({ type: 'int' })
  selectedIndex: number;

  @Column({ type: 'boolean' })
  isCorrect: boolean;

  @CreateDateColumn()
  submittedAt: Date;
}

/**
 * Round state (singleton-ish, just tracks current round)
 */
@Entity('bug_smash_round_state')
export class BugSmashRoundState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 1 })
  currentRound: number; // 1, 2, or 3

  @Column({ type: 'varchar', length: 20, default: RoundStatus.WAITING })
  round1Status: RoundStatus;

  @Column({ type: 'int', default: 30 })
  roundDuration: number; // minutes

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  currentQuestionId: number | null;

  @Column({ type: 'datetime', nullable: true })
  questionStartedAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
