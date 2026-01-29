import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PuzzleResult {
  PENDING = 'pending',
  CORRECT = 'correct',
  WRONG = 'wrong',
}

@Entity('think_link_puzzles')
export class ThinkLinkPuzzle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  imagePath: string;

  @Column({ type: 'int', default: 0 })
  roundNumber: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hint: string | null;

  @Column({ type: 'varchar', length: 20, default: PuzzleResult.PENDING })
  result: PuzzleResult;

  @Column({ type: 'datetime', nullable: true })
  markedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
