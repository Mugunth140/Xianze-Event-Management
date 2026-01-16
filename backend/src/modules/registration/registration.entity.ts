import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;
}
