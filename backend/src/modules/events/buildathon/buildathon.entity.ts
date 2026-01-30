import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Buildathon Team entity
 * Stores team registrations (1-4 members per team)
 */
@Entity('buildathon_teams')
export class BuildathonTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  teamName: string;

  @Column()
  participant1: string;

  @Column({ nullable: true })
  participant2?: string;

  @Column({ nullable: true })
  participant3?: string;

  @Column({ nullable: true })
  participant4?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Buildathon Document entity
 * Stores uploaded documents (rulebooks, guides) with QR code for participants
 */
@Entity('buildathon_documents')
export class BuildathonDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  filePath: string;

  /** QR code that links to the document for participant scanning */
  @Column({ nullable: true })
  qrCodePath?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Buildathon API State entity
 * Controls which endpoints are enabled/disabled
 */
@Entity('buildathon_api_state')
export class BuildathonApiState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  customersEndpointEnabled: boolean;

  @Column({ default: false })
  ordersEndpointEnabled: boolean;

  @Column({ default: false })
  productsEndpointEnabled: boolean;

  /** Registration Form QR code path (single static QR for team registration) */
  @Column({ nullable: true })
  registrationQrPath?: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Buildathon API Request Log entity
 * Tracks all API requests for metrics
 */
@Entity('buildathon_request_logs')
@Index(['endpoint', 'createdAt'])
export class BuildathonRequestLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  endpoint: string;

  @Column({ nullable: true })
  teamId?: number;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;
}
