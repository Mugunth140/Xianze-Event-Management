import { SetMetadata } from '@nestjs/common';
import { UserTask } from '../../users/user.entity';

export const TASKS_KEY = 'requiredTasks';

/**
 * Decorator to specify required tasks for an endpoint.
 * User must have at least ONE of the specified tasks.
 * Admin users bypass this check entirely.
 *
 * @param tasks - Array of tasks, user needs at least one
 */
export const RequireTasks = (...tasks: UserTask[]) => SetMetadata(TASKS_KEY, tasks);
