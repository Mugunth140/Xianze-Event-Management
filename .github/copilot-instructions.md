# XIANZE Event Management - Copilot Instructions

## Project Overview
XIANZE EMS is a full-stack event management system for a technical symposium. It has a **NestJS backend** (TypeScript, TypeORM, SQLite) and a **Next.js 14 frontend** (App Router, Tailwind CSS). Admin-only authentication controls access to event/registration management.

## Critical: Use Bun, Not npm
This project uses **Bun** as its runtime. Always use `bun` commands:
```bash
bun install          # Install dependencies (NOT npm/yarn/pnpm)
bun run dev          # Start dev server
bun run build        # Production build
bun add <package>    # Add dependency
```

## Development Workflow

### Start Development
```bash
# Option 1: Docker for backend
docker compose up -d              # Start backend + database
cd frontend && bun run dev        # Start frontend locally

# Option 2: Fully local
cd backend && bun run start:dev   # Backend at :5000
cd frontend && bun run dev        # Frontend at :3000
```

### Production Deployment
```bash
./deploy.sh prod                  # Full production deployment
./deploy.sh prod --init-ssl       # With SSL certificate setup
```

## Architecture Patterns

### Backend (NestJS)
- **Modular structure**: Each feature in `backend/src/modules/{feature}/`
- **Standard module pattern**: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/`, `dto/`
- **Authentication**: JWT via `JwtAuthGuard` + role-based access via `RolesGuard` + `@Roles()` decorator
- **Roles**: `admin`, `coordinator`, `member` - see [user.entity.ts](backend/src/modules/users/user.entity.ts)
- **Task-based permissions**: `TasksGuard` + `@Tasks()` for granular permissions (e.g., `VERIFY_PAYMENT`)
- **Database**: SQLite with TypeORM repository pattern, file at `./data/xianze.db`
- **Rate limiting**: Global throttling via `ThrottlerModule` (100 req/min default)

### Frontend (Next.js 14)
- **App Router**: File-based routing in `frontend/app/`
- **Client Components**: Use `'use client'` directive for interactive components (forms, modals, hooks)
- **API Client**: Use `apiRequest<T>()` from `frontend/lib/api.ts` for all backend calls (handles auth, retries, errors)
- **Admin routes**: Protected in `frontend/app/admin/` - auth check in layout.tsx
- **Event data**: Static event definitions in `frontend/data/events.ts`
- **Styling**: Tailwind CSS with custom components in `frontend/components/ui/`

### Redis Caching (Quiz Events)
- Key pattern: `xianze:{module}:{entity}:{identifier}` (e.g., `xianze:quiz:bug-smash:session:abc123`)
- All cached data MUST have TTL - see [CACHE_STRATEGY.md](CACHE_STRATEGY.md)
- Used for quiz sessions, leaderboards, rate limiting

## Adding New Features

### New Backend Module
1. Create folder: `backend/src/modules/{feature}/`
2. Follow structure: `{feature}.module.ts`, `{feature}.controller.ts`, `{feature}.service.ts`, `entities/`, `dto/`
3. Use `class-validator` decorators in DTOs
4. Register in `backend/src/app.module.ts`
5. Protected endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`

### New Event Module
Events live in `backend/src/modules/events/{event-slug}/`. Follow existing patterns in `bug-smash/` or `ctrl-quiz/`.

### New Admin Page
1. Create route: `frontend/app/admin/{feature}/page.tsx`
2. Use `'use client'` for interactive pages
3. Use shared components from `frontend/app/admin/components/ui/`
4. API calls: `await apiRequest<T>('/endpoint')`

## Key Files
- [backend/src/app.module.ts](backend/src/app.module.ts) - Module registration, global config
- [frontend/lib/api.ts](frontend/lib/api.ts) - API client with retry logic
- [frontend/data/events.ts](frontend/data/events.ts) - Event definitions
- [backend/src/modules/auth/guards/](backend/src/modules/auth/guards/) - Auth guards
- [docker-compose.yml](docker-compose.yml) - Development setup
- [docker-compose.prod.yml](docker-compose.prod.yml) - Production setup

## Testing & Quality
```bash
cd backend && bun run lint        # Backend linting
cd frontend && bun run lint       # Frontend linting  
cd backend && bun run test        # Jest tests
```
