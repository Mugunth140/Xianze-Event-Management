import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('visitors')
@Index(['visitorId'], { unique: true })
@Index(['firstVisit'])
@Index(['lastVisit'])
export class Visitor {
  @PrimaryGeneratedColumn()
  id: number;

  // Unique visitor identifier (fingerprint hash)
  @Column({ type: 'varchar', length: 64, unique: true })
  visitorId: string;

  // First visit timestamp
  @Column({ type: 'datetime' })
  firstVisit: Date;

  // Last visit timestamp
  @Column({ type: 'datetime' })
  lastVisit: Date;

  // Total number of visits/sessions
  @Column({ type: 'int', default: 1 })
  totalVisits: number;

  // Total page views across all sessions
  @Column({ type: 'int', default: 0 })
  totalPageViews: number;

  // Last known browser
  @Column({ type: 'varchar', length: 100, nullable: true })
  browser: string;

  // Last known OS
  @Column({ type: 'varchar', length: 100, nullable: true })
  os: string;

  // Last known device type
  @Column({ type: 'varchar', length: 20, nullable: true })
  deviceType: string;

  // Last known country
  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  // Whether visitor has converted (e.g., registered)
  @Column({ type: 'boolean', default: false })
  isConverted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
