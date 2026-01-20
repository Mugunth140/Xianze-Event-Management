import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('registration')
@Unique(['email'])
export class Registration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  course: string;

  @Column({ type: 'varchar', length: 100 })
  branch: string;

  @Column({ type: 'varchar', length: 255 })
  college: string;

  @Column({ type: 'varchar', length: 15 })
  contact: string;

  @Column({ type: 'varchar', length: 100 })
  event: string;

  // Payment verification fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string | null;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'int', nullable: true })
  verifiedBy: number | null; // User ID who verified

  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  verificationNote: string | null; // Optional note for rejection reason

  // Check-in / Attendance fields
  @Column({ type: 'boolean', default: false })
  isCheckedIn: boolean;

  @Column({ type: 'int', nullable: true })
  checkedInBy: number | null; // User ID who checked in

  @Column({ type: 'datetime', nullable: true })
  checkedInAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
