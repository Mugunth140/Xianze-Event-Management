import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * Tracks which events a participant attended.
 * Created when a coordinator scans a participant's QR at an event hall.
 * Duplicate scans for the same event are ignored (participant already marked).
 */
@Entity('event_participation')
@Unique(['registrationId', 'eventSlug']) // One record per participant per event
@Index(['registrationId'])
@Index(['eventSlug'])
@Index(['scannedAt'])
export class EventParticipation {
  @PrimaryGeneratedColumn()
  id: number;

  // Reference to the registration
  @Column({ type: 'int' })
  registrationId: number;

  // Event slug (e.g., 'bug-smash', 'ctrl-quiz')
  @Column({ type: 'varchar', length: 100 })
  eventSlug: string;

  // User who scanned (coordinator/member)
  @Column({ type: 'int' })
  scannedBy: number;

  // When they were scanned into this event
  @CreateDateColumn()
  scannedAt: Date;
}
