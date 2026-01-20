import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/user.entity';

export const EVENT_SCOPE_KEY = 'eventScope';

/**
 * Guard to ensure user can only access resources for their assigned event(s).
 * Expects the event identifier in request body, params, or query as 'event' or 'eventName'.
 * Admin users bypass this check.
 */
@Injectable()
export class EventScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin bypasses event scope checks
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Extract event from request (body, params, or query)
    const event =
      request.body?.event ||
      request.body?.eventName ||
      request.params?.event ||
      request.params?.eventName ||
      request.query?.event ||
      request.query?.eventName;

    // If no event in request, allow (endpoint might not be event-scoped)
    if (!event) {
      return true;
    }

    // Check user's event access
    if (user.role === UserRole.COORDINATOR) {
      if (user.assignedEvent !== event) {
        throw new ForbiddenException(`Access denied. You are not assigned to event: ${event}`);
      }
    }

    if (user.role === UserRole.MEMBER) {
      const assignedEvents = user.assignedEvents || [];
      if (!assignedEvents.includes(event)) {
        throw new ForbiddenException(`Access denied. You are not assigned to event: ${event}`);
      }
    }

    return true;
  }
}
