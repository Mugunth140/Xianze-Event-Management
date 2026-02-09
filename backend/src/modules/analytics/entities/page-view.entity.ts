import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('page_views')
@Index(['visitorId'])
@Index(['path'])
@Index(['createdAt'])
export class PageView {
  @PrimaryGeneratedColumn()
  id: number;

  // Unique visitor identifier (fingerprint hash)
  @Column({ type: 'varchar', length: 64 })
  visitorId: string;

  // Session ID for grouping page views
  @Column({ type: 'varchar', length: 64, nullable: true })
  sessionId: string;

  // Page path visited
  @Column({ type: 'varchar', length: 500 })
  path: string;

  // Referrer URL
  @Column({ type: 'varchar', length: 500, nullable: true })
  referrer: string;

  // User agent string
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  // Parsed browser info
  @Column({ type: 'varchar', length: 100, nullable: true })
  browser: string;

  // Parsed OS info
  @Column({ type: 'varchar', length: 100, nullable: true })
  os: string;

  // Device type (desktop, mobile, tablet)
  @Column({ type: 'varchar', length: 20, nullable: true })
  deviceType: string;

  // Country from IP (if available)
  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  // City from IP (if available)
  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  // Screen resolution
  @Column({ type: 'varchar', length: 20, nullable: true })
  screenResolution: string;

  // Language preference
  @Column({ type: 'varchar', length: 10, nullable: true })
  language: string;

  // Time spent on page in seconds (updated on next page view or exit)
  @Column({ type: 'int', nullable: true })
  duration: number;

  @CreateDateColumn()
  createdAt: Date;
}
