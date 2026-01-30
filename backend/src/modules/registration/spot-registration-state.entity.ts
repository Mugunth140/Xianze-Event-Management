import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('spot_registration_state')
export class SpotRegistrationState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  enabled: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
