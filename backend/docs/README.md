# XIANZE Backend

<div align="center">

**NestJS-powered REST API for the XIANZE Event Management System**

[![NestJS](https://img.shields.io/badge/NestJS-10.x-ea2845?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)

</div>

---

## 📖 Overview

This is the backend API for XIANZE, built with NestJS and TypeORM. It provides a RESTful interface for managing events, venues, and attendees (features to be implemented).

### Why These Technologies?

| Technology  | Why We Use It                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| **NestJS**  | Enterprise-grade Node.js framework with built-in TypeScript support, dependency injection, and modular architecture     |
| **SQLite**  | Zero-configuration database, perfect for admin-only workloads. File-based for easy backup and Docker volume persistence |
| **TypeORM** | TypeScript-first ORM with excellent NestJS integration and migration support                                            |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Running Locally

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start development server
npm run start:dev

# Server will be available at http://localhost:5000
# Health check: http://localhost:5000/health
```

### Running with Docker

```bash
# Build and run standalone
docker compose up --build

# Or from root directory (recommended)
cd ..
docker compose up --build
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   └── database.config.ts   # TypeORM/SQLite config
│   ├── modules/             # Feature modules (empty placeholder)
│   ├── app.module.ts        # Root application module
│   ├── app.controller.ts    # Health check controller
│   ├── app.service.ts       # Core application service
│   └── main.ts              # Application entry point
├── test/
│   └── app.e2e-spec.ts      # End-to-end tests
├── docs/                    # Additional documentation
├── Dockerfile               # Production container
├── docker-compose.yml       # Standalone Docker setup
└── package.json             # Dependencies & scripts
```

### Understanding the Structure

- **`src/config/`** - All configuration is centralized here. Each config file exports a typed configuration object.
- **`src/modules/`** - Future feature modules go here. Each module is self-contained with its controller, service, and entities.
- **`src/app.module.ts`** - The root module that imports all other modules.
- **`src/main.ts`** - Bootstraps the application with global settings.

---

## ⚙️ Environment Variables

| Variable               | Description                                 | Default            |
| ---------------------- | ------------------------------------------- | ------------------ |
| `NODE_ENV`             | Environment mode                            | `development`      |
| `PORT`                 | HTTP server port                            | `5000`             |
| `DATABASE_PATH`        | SQLite database file path                   | `./data/xianze.db` |
| `DATABASE_LOGGING`     | Enable SQL query logging                    | `false`            |
| `DATABASE_SYNCHRONIZE` | Auto-sync schema (⚠️ disable in production) | `false`            |
| `CORS_ORIGIN`          | Allowed CORS origins                        | `*`                |

---

## 🛠️ Available Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run start:dev`  | Start development server with hot reload |
| `npm run build`      | Build production bundle                  |
| `npm run start:prod` | Run production build                     |
| `npm run lint`       | Run ESLint and fix issues                |
| `npm run test`       | Run unit tests                           |
| `npm run test:e2e`   | Run end-to-end tests                     |

---

## 🏗️ Extending the Backend

### Adding a New Module

1. Create a new folder in `src/modules/`:

   ```
   src/modules/events/
   ├── events.module.ts
   ├── events.controller.ts
   ├── events.service.ts
   ├── entities/
   │   └── event.entity.ts
   └── dto/
       ├── create-event.dto.ts
       └── update-event.dto.ts
   ```

2. Import the module in `app.module.ts`:

   ```typescript
   import { EventsModule } from './modules/events/events.module';

   @Module({
     imports: [
       // ... existing imports
       EventsModule,
     ],
   })
   export class AppModule {}
   ```

3. The module will automatically be available at `/api/events` (with the global prefix).

For detailed instructions, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute code
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [SECURITY.md](./SECURITY.md) - Security considerations
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

---

## 🔗 Related

- [Root README](../README.md)
- [Frontend Documentation](../frontend/README.md)
