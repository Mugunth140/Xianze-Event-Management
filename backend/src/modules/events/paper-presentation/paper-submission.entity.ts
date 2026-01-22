import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum PaperSubmissionStatus {
    SUBMITTED = 'submitted',
    PRESENTED = 'presented',
    SKIPPED = 'skipped',
    DISQUALIFIED = 'disqualified',
}

@Entity('paper_submissions')
export class PaperSubmission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    teamName: string;

    @Column({ type: 'simple-array' })
    teamMembers: string[];

    @Column({ type: 'varchar', length: 255 })
    college: string;

    @Column({ type: 'varchar', length: 500 })
    topic: string;

    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'varchar', length: 500 })
    slidePath: string;

    @Column({ type: 'varchar', length: 50, default: PaperSubmissionStatus.SUBMITTED })
    status: PaperSubmissionStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
