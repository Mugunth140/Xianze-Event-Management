import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  COORDINATOR = 'coordinator',
  MEMBER = 'member',
}

// Optional tasks that can be assigned to users
export enum UserTask {
  // Payment related
  VERIFY_PAYMENT = 'verify_payment',

  // Attendance related
  MARK_ATTENDANCE = 'mark_attendance',
  CHECK_IN_PARTICIPANT = 'check_in_participant',

  // Event participation scanning (coordinators scan QR at event halls)
  SCAN_EVENT_PARTICIPATION = 'scan_event_participation',

  // Round management (start/advance rounds for events)
  MANAGE_ROUNDS = 'manage_rounds',

  // Participant management (admin default, optional for others)
  EDIT_PARTICIPANT = 'edit_participant',
  DELETE_PARTICIPANT = 'delete_participant',
}

// Default tasks per role (these are implicit, not stored)
export const DEFAULT_TASKS: Record<UserRole, UserTask[]> = {
  [UserRole.ADMIN]: Object.values(UserTask), // Admin has all tasks
  [UserRole.COORDINATOR]: [UserTask.SCAN_EVENT_PARTICIPATION, UserTask.MANAGE_ROUNDS], // Coordinators can scan and manage rounds
  [UserRole.MEMBER]: [UserTask.CHECK_IN_PARTICIPANT], // Members can check-in participants
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.MEMBER })
  role: UserRole;

  // For Coordinator: single event
  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedEvent: string | null;

  // For Member: multiple events allowed
  @Column({ type: 'simple-array', nullable: true })
  assignedEvents: string[] | null;

  // Optional tasks assigned beyond defaults
  @Column({ type: 'simple-array', nullable: true })
  tasks: UserTask[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ==========================================
// Permission Helper Functions (not on entity)
// ==========================================

/**
 * Check if user has a specific task
 */
export function userHasTask(
  user: User | { role: UserRole; tasks?: UserTask[] | null },
  task: UserTask,
): boolean {
  // Admin always has all tasks
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // Check default tasks for role
  if (DEFAULT_TASKS[user.role]?.includes(task)) {
    return true;
  }

  // Check explicitly assigned tasks
  return user.tasks?.includes(task) ?? false;
}

/**
 * Check if user can access an event
 */
export function userCanAccessEvent(
  user: User | { role: UserRole; assignedEvent?: string | null; assignedEvents?: string[] | null },
  event: string,
): boolean {
  // Admin can access all events
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // Coordinator: check assignedEvent
  if (user.role === UserRole.COORDINATOR) {
    return user.assignedEvent === event;
  }

  // Member: check assignedEvents array
  if (user.role === UserRole.MEMBER) {
    return user.assignedEvents?.includes(event) ?? false;
  }

  return false;
}

/**
 * Get all effective tasks for a user (defaults + assigned)
 */
export function getUserEffectiveTasks(
  user: User | { role: UserRole; tasks?: UserTask[] | null },
): UserTask[] {
  if (user.role === UserRole.ADMIN) {
    return Object.values(UserTask);
  }

  const defaultTasks = DEFAULT_TASKS[user.role] || [];
  const assignedTasks = user.tasks || [];
  return [...new Set([...defaultTasks, ...assignedTasks])];
}
