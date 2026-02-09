import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Tracks which rounds within an event a participant completed.
 * Created when a coordinator rescans a participant's QR for a new round.
 * Duplicate scans for the same round are ignored.
 */
@Entity('round_participation')
@Unique(['registrationId', 'eventSlug', 'roundNumber']) // One record per participant per event per round
@Index(['registrationId'])
@Index(['eventSlug'])
@Index(['roundNumber'])
export class RoundParticipation {
  @PrimaryGeneratedColumn()
  id: number;

  // Reference to the registration
  @Column({ type: 'int' })
  registrationId: number;

  // Event slug (e.g., 'bug-smash', 'ctrl-quiz')
  @Column({ type: 'varchar', length: 100 })
  eventSlug: string;

  // Round number (1, 2, 3, etc.)
  @Column({ type: 'int' })
  roundNumber: number;

  // User who scanned
  @Column({ type: 'int' })
  scannedBy: number;

  // When they were scanned for this round
  @CreateDateColumn()
  scannedAt: Date;
}
