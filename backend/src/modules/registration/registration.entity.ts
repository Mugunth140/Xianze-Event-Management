import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('registration')
@Unique(['email'])
@Index(['transactionId'], { unique: true })
@Index(['paymentStatus'])
@Index(['event'])
@Index(['createdAt'])
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

  @Column({ type: 'boolean', default: false })
  isSpotRegistration: boolean;

  // Payment verification fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  screenshotPath: string | null;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'int', nullable: true })
  verifiedBy: number | null; // User ID who verified

  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  verificationNote: string | null; // Optional note for rejection reason

  // Event Pass fields
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  passId: string | null; // Unique pass identifier (e.g., XZ26-ABC123)

  @Column({ type: 'varchar', length: 64, nullable: true })
  qrCodeHash: string | null; // Hashed email for QR code

  @Column({ type: 'boolean', default: false })
  passEmailSent: boolean; // Track if pass email was sent

  @Column({ type: 'datetime', nullable: true })
  passEmailSentAt: Date | null;

  // Check-in / Attendance fields
  @Column({ type: 'boolean', default: false })
  isCheckedIn: boolean;

  @Column({ type: 'int', nullable: true })
  checkedInBy: number | null; // User ID who checked in

  @Column({ type: 'datetime', nullable: true })
  checkedInAt: Date | null;

  // Confirmation email tracking
  @Column({ type: 'boolean', default: false })
  confirmationEmailSent: boolean;

  @Column({ type: 'datetime', nullable: true })
  confirmationEmailSentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
