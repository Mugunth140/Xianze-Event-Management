import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum RoundStatus {
    WAITING = 'waiting',
    ACTIVE = 'active',
    COMPLETED = 'completed',
}

/**
 * MCQ Question for Ctrl + Quiz
 */
@Entity('ctrl_quiz_questions')
export class CtrlQuizQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    questionText: string;

    @Column({ type: 'simple-array' })
    options: string[];

    @Column({ type: 'int' })
    correctIndex: number;

    @Column({ type: 'int', default: 30 })
    timeLimit: number;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => CtrlQuizSubmission, (s) => s.question)
    submissions: CtrlQuizSubmission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

/**
 * Participant in Ctrl + Quiz
 */
@Entity('ctrl_quiz_participants')
@Index(['email'], { unique: true })
export class CtrlQuizParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string | null;

    @Column({ type: 'int', default: 0 })
    score: number;

    @Column({ type: 'datetime', nullable: true })
    lastSubmitTime: Date | null;

    @OneToMany(() => CtrlQuizSubmission, (s) => s.participant)
    submissions: CtrlQuizSubmission[];

    @CreateDateColumn()
    joinedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

/**
 * Answer submission
 */
@Entity('ctrl_quiz_submissions')
@Index(['participant', 'question'], { unique: true })
export class CtrlQuizSubmission {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CtrlQuizParticipant, (p) => p.submissions, { onDelete: 'CASCADE' })
    participant: CtrlQuizParticipant;

    @Column({ type: 'int' })
    participantId: number;

    @ManyToOne(() => CtrlQuizQuestion, (q) => q.submissions, { onDelete: 'CASCADE' })
    question: CtrlQuizQuestion;

    @Column({ type: 'int' })
    questionId: number;

    @Column({ type: 'int' })
    selectedIndex: number;

    @Column({ type: 'boolean' })
    isCorrect: boolean;

    @CreateDateColumn()
    submittedAt: Date;
}

/**
 * Round state (singleton)
 */
@Entity('ctrl_quiz_round_state')
export class CtrlQuizRoundState {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 20, default: RoundStatus.WAITING })
    status: RoundStatus;

    @Column({ type: 'int', default: 30 })
    roundDuration: number; // minutes

    @Column({ type: 'datetime', nullable: true })
    startedAt: Date | null;

    @UpdateDateColumn()
    updatedAt: Date;
}
