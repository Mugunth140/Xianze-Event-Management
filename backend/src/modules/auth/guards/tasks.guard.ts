import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEFAULT_TASKS, UserRole, UserTask } from '../../users/user.entity';
import { TASKS_KEY } from '../decorators/tasks.decorator';

@Injectable()
export class TasksGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTasks = this.reflector.getAllAndOverride<UserTask[]>(TASKS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no tasks required, allow access
    if (!requiredTasks || requiredTasks.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin bypasses all task checks
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Get user's effective tasks (default + assigned)
    const defaultTasks = DEFAULT_TASKS[user.role as UserRole] || [];
    const assignedTasks = user.tasks || [];
    const effectiveTasks = [...new Set([...defaultTasks, ...assignedTasks])];

    // Check if user has at least one of the required tasks
    const hasRequiredTask = requiredTasks.some((task) => effectiveTasks.includes(task));

    if (!hasRequiredTask) {
      throw new ForbiddenException(`Access denied. Required task: ${requiredTasks.join(' or ')}`);
    }

    return true;
  }
}
