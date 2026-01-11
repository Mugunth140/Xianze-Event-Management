# Backend Architecture

This document explains the architectural decisions and patterns used in the XIANZE backend.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           XIANZE Backend                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   HTTP      │    │   Global    │    │   Global    │                 │
│  │   Request   │───▶│   Pipes     │───▶│   Guards    │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                              │                          │
│                                              ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        MODULES                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │    Auth      │  │   Events     │  │   Venues     │           │  │
│  │  │   Module     │  │   Module     │  │   Module     │           │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              │                          │
│                                              ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         TypeORM                                   │  │
│  │                    (Repository Pattern)                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                              │                          │
│                                              ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     SQLite Database                               │  │
│  │                   (./data/xianze.db)                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Concepts

### 1. Modular Architecture

NestJS uses a modular architecture where each feature is encapsulated in its own module.

```
src/modules/
├── auth/           # Authentication module (placeholder)
├── events/         # Events feature module
├── venues/         # Venues feature module
└── attendees/      # Attendees feature module
```

**Why modules?**

- **Separation of concerns** - Each module handles one feature
- **Testability** - Modules can be tested in isolation
- **Scalability** - Easy to add new features without affecting existing code
- **Reusability** - Modules can be shared across projects

### 2. Dependency Injection

NestJS uses a built-in dependency injection (DI) container.

```typescript
// The service is "injected" into the controller
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}
}
```

**Why DI?**

- **Loose coupling** - Components don't create their dependencies
- **Easy testing** - Dependencies can be mocked
- **Flexibility** - Easy to swap implementations

### 3. Repository Pattern

TypeORM implements the repository pattern for database access.

```typescript
// Repositories are injected into services
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}
}
```

**Why repositories?**

- **Abstraction** - Business logic doesn't care about database details
- **Testability** - Repositories can be mocked
- **Consistency** - Standard API for all entities

---

## 📊 Request Lifecycle

```
1. HTTP Request arrives
       │
       ▼
2. Global Middleware (logging, etc.)
       │
       ▼
3. Guards (authentication, authorization)
       │
       ▼
4. Interceptors (transform request)
       │
       ▼
5. Pipes (validation, transformation)
       │
       ▼
6. Controller (route handler)
       │
       ▼
7. Service (business logic)
       │
       ▼
8. Repository (database operations)
       │
       ▼
9. Response (interceptors transform, then send)
```

---

## 🗄️ Database Design

### Why SQLite?

| Consideration    | SQLite            | PostgreSQL         |
| ---------------- | ----------------- | ------------------ |
| Setup complexity | None (file-based) | Requires server    |
| Concurrent users | ~10-20 writers    | Thousands          |
| Data volume      | Up to 1TB         | Unlimited          |
| Backup           | Copy file         | pg_dump            |
| Docker friendly  | Single volume     | Separate container |

**XIANZE is admin-only**, meaning:

- Low concurrent users (typically < 10)
- Moderate data volume
- Simple deployment requirements

SQLite is the right choice. For multi-tenant or high-concurrency scenarios, migrate to PostgreSQL.

### File Location

The database file is stored at the path specified by `DATABASE_PATH`:

- **Local development**: `./data/xianze.db`
- **Docker**: `/data/xianze.db` (mounted volume)

---

## 🔐 Authentication Strategy (Placeholder)

The authentication system follows this pattern:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │  Login  │              │  Token  │              │
│    Admin     │────────▶│   AuthModule │────────▶│   Protected  │
│              │         │              │         │   Routes     │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Admin-only approach:**

- No self-registration (admins are created manually or seeded)
- JWT-based session management
- Role-based access control (RBAC)

> ⚠️ **Note**: Authentication is not implemented in this boilerplate. This is the intended architecture when you add it.

---

## 📁 File Organization

### Standard Module Structure

```
src/modules/feature/
├── feature.module.ts       # Module definition
├── feature.controller.ts   # HTTP route handlers
├── feature.service.ts      # Business logic
├── feature.guard.ts        # Authorization guards
├── entities/
│   └── feature.entity.ts   # TypeORM entity
├── dto/
│   ├── create-feature.dto.ts
│   └── update-feature.dto.ts
├── interfaces/
│   └── feature.interface.ts
└── __tests__/
    ├── feature.controller.spec.ts
    └── feature.service.spec.ts
```

### Naming Conventions

| Type       | Convention                 | Example                         |
| ---------- | -------------------------- | ------------------------------- |
| Files      | kebab-case                 | `event-registration.service.ts` |
| Classes    | PascalCase                 | `EventRegistrationService`      |
| Interfaces | PascalCase with I prefix   | `IEventData`                    |
| DTOs       | PascalCase with Dto suffix | `CreateEventDto`                |
| Entities   | PascalCase                 | `Event`                         |

---

## 🧪 Testing Strategy

```
tests/
├── unit/           # Unit tests (*.spec.ts alongside source)
├── integration/    # Integration tests
└── e2e/            # End-to-end tests (test/ folder)
```

**Coverage targets:**

- Services: 80%+
- Controllers: 60%+
- E2E critical paths: 100%

---

## 🔄 Error Handling

NestJS has built-in exception filters. Use them consistently:

```typescript
// Bad - generic error
throw new Error('Event not found');

// Good - HTTP exception
throw new NotFoundException('Event with ID 123 not found');
```

Custom exceptions should extend `HttpException`:

```typescript
export class EventNotPublishedException extends HttpException {
  constructor(eventId: string) {
    super(`Event ${eventId} is not published`, HttpStatus.FORBIDDEN);
  }
}
```

---

## 📚 Further Reading

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
