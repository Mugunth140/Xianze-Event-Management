# Contributing to XIANZE Backend

Thank you for contributing to the XIANZE backend! This guide will help you get started safely.

---

## 📋 Before You Start

1. **Read the architecture** - Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the patterns we use
2. **Set up locally** - Follow the [README.md](./README.md) setup instructions
3. **Check existing issues** - Look for open issues or create a new one

---

## 🔧 Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd xianze/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings if needed
```

### 3. Start Development Server

```bash
npm run start:dev
```

The server will restart automatically when you make changes.

---

## 🏗️ Adding a New Feature Module

This is the most common contribution. Follow these steps exactly:

### Step 1: Create the Module Structure

```bash
# Create the folder structure
mkdir -p src/modules/your-feature/{entities,dto}
```

### Step 2: Create the Entity

Create `src/modules/your-feature/entities/your-feature.entity.ts`:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('your_feature')
export class YourFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Step 3: Create DTOs

Create `src/modules/your-feature/dto/create-your-feature.dto.ts`:

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateYourFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### Step 4: Create the Service

Create `src/modules/your-feature/your-feature.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YourFeature } from './entities/your-feature.entity';
import { CreateYourFeatureDto } from './dto/create-your-feature.dto';

@Injectable()
export class YourFeatureService {
  constructor(
    @InjectRepository(YourFeature)
    private readonly repository: Repository<YourFeature>,
  ) {}

  async create(dto: CreateYourFeatureDto): Promise<YourFeature> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }

  async findAll(): Promise<YourFeature[]> {
    return this.repository.find();
  }
}
```

### Step 5: Create the Controller

Create `src/modules/your-feature/your-feature.controller.ts`:

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { YourFeatureService } from './your-feature.service';
import { CreateYourFeatureDto } from './dto/create-your-feature.dto';

@Controller('your-feature')
export class YourFeatureController {
  constructor(private readonly service: YourFeatureService) {}

  @Post()
  create(@Body() dto: CreateYourFeatureDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
```

### Step 6: Create the Module

Create `src/modules/your-feature/your-feature.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YourFeature } from './entities/your-feature.entity';
import { YourFeatureController } from './your-feature.controller';
import { YourFeatureService } from './your-feature.service';

@Module({
  imports: [TypeOrmModule.forFeature([YourFeature])],
  controllers: [YourFeatureController],
  providers: [YourFeatureService],
  exports: [YourFeatureService],
})
export class YourFeatureModule {}
```

### Step 7: Register the Module

Edit `src/app.module.ts`:

```typescript
import { YourFeatureModule } from './modules/your-feature/your-feature.module';

@Module({
  imports: [
    // ... existing imports
    YourFeatureModule, // Add your module here
  ],
})
export class AppModule {}
```

### Step 8: Test Your Feature

```bash
# Run the development server
npm run start:dev

# Test create
curl -X POST http://localhost:5000/api/your-feature \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# Test list
curl http://localhost:5000/api/your-feature
```

---

## ✅ Code Quality Checklist

Before submitting your code, ensure:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] You've added tests for new functionality
- [ ] All existing tests pass (`npm run test`)
- [ ] You've updated documentation if needed

---

## 📝 Commit Messages

Use conventional commit format:

```
type(scope): description

feat(events): add event creation endpoint
fix(auth): resolve token expiration issue
docs(readme): update installation steps
refactor(events): extract validation logic
test(events): add unit tests for service
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code change that neither fixes nor adds
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

---

## 🚀 Runtime: Bun.js

This project uses **Bun** as its runtime. See [RUNTIME.md](/RUNTIME.md) for details.

### Quick Commands

```bash
# Install dependencies (NOT npm install)
bun install

# Run development server
bun run start:dev

# Build for production
bun run build

# Run production
bun run start:prod
```

> [!CAUTION]
> **Do NOT use npm, yarn, or pnpm.** Always use `bun` commands.

---

## 🔀 Branch Workflow (MANDATORY)

> [!IMPORTANT]
> **All features MUST be developed on a separate branch.**
> Direct commits to `main` are NOT allowed.

### Step-by-Step Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the patterns in this guide

3. **Commit frequently** with clear messages:

   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push your branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request (PR) / Merge Request (MR)**:
   - Use a clear title describing the change
   - Link to related issue (if any)
   - Describe what and why
   - Request review from maintainers

6. **Address review feedback** and update your PR

7. **Merge after approval** - Maintainers will merge after review

### Branch Naming Conventions

| Type          | Pattern                     | Example                           |
| ------------- | --------------------------- | --------------------------------- |
| Feature       | `feature/short-description` | `feature/buildathon-registration` |
| Bug Fix       | `fix/issue-description`     | `fix/quiz-timer-bug`              |
| Documentation | `docs/what-changed`         | `docs/update-events-readme`       |
| Refactor      | `refactor/what-changed`     | `refactor/cache-service`          |

---

## 🎯 Event Module Implementation

When implementing event modules, follow these guidelines:

### 1. Check the Event Requirements

Review [EVENTS.md](/EVENTS.md) for:

- Backend requirements (Required / Minimal / None)
- Redis usage requirements
- Registration requirements

### 2. Read the Event README

Each event has a README with implementation details:

```
src/modules/events/{event-name}/README.md
```

### 3. Follow the Module Pattern

Create the standard NestJS module structure:

```
src/modules/events/{event-name}/
├── entities/
├── dto/
├── {event-name}.controller.ts
├── {event-name}.service.ts
├── {event-name}.module.ts
└── README.md
```

### 4. Use Redis Appropriately

If the event requires Redis, see [CACHE_STRATEGY.md](/CACHE_STRATEGY.md) for:

- Key naming conventions
- TTL requirements
- Data structures

---

## ⚠️ Common Mistakes to Avoid

| ❌ Don't                          | ✅ Do                                |
| --------------------------------- | ------------------------------------ |
| Commit directly to main           | Use feature branches + PRs           |
| Use npm/yarn/pnpm                 | Use `bun` commands only              |
| Put business logic in controllers | Keep controllers thin, use services  |
| Use `any` type                    | Define proper TypeScript types       |
| Skip validation                   | Always use DTOs with class-validator |
| Hardcode configuration            | Use environment variables            |
| Commit `.env` files               | Use `.env.example` for templates     |
| Write tests after shipping        | Write tests alongside code           |

---

## ❓ Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
- Read [EVENTS.md](/EVENTS.md) for event-specific guidance
- Read [RUNTIME.md](/RUNTIME.md) for Bun.js help
- Open an issue for questions

Welcome to the team! 🎉
