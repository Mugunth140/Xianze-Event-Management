import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('certificate_email_logs')
export class CertificateEmailLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  batchId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  emailPrefix: string;

  @Column({ type: 'text' })
  filenames: string; // JSON stringified array of attached filenames

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'success' | 'failed' | 'pending' | 'no-files';

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  sentAt: Date;
}
