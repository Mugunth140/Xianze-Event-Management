# Contributing to XIANZE Frontend

Thank you for contributing to the XIANZE frontend! This guide will help you get started safely.

---

## 📋 Before You Start

1. **Read the architecture** - Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand our patterns
2. **Set up locally** - Follow the [README.md](./README.md) setup instructions
3. **Ensure backend is running** - The frontend needs the API (see [Backend README](../backend/README.md))

---

## 🔧 Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd xianze/frontend
bun install    # NOT npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local if needed
```

### 3. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

---

## 🚀 Runtime: Bun.js

This project uses **Bun** as its runtime. See [RUNTIME.md](/RUNTIME.md) for details.

### Quick Commands

```bash
# Install dependencies (NOT npm install)
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run linting
bun run lint
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

3. **Test your changes**:

   ```bash
   bun run lint
   bun run build
   ```

4. **Commit frequently** with clear messages:

   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push your branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request (PR) / Merge Request (MR)**:
   - Use a clear title describing the change
   - Include screenshots for UI changes
   - Link to related issue (if any)
   - Request review from maintainers

7. **Address review feedback** and update your PR

8. **Merge after approval** - Maintainers will merge after review

### Branch Naming Conventions

| Type          | Pattern                     | Example                   |
| ------------- | --------------------------- | ------------------------- |
| Feature       | `feature/short-description` | `feature/buildathon-page` |
| Bug Fix       | `fix/issue-description`     | `fix/event-card-styling`  |
| Documentation | `docs/what-changed`         | `docs/update-readme`      |
| Style         | `style/what-changed`        | `style/dark-mode-support` |

---

## 🏗️ Adding a New Page

This is the most common contribution. Follow these steps:

### Step 1: Create the Page Directory

```bash
# Create a new route at /your-page
mkdir app/your-page
```

### Step 2: Create the Page Component

Create `app/your-page/page.tsx`:

```typescript
import { api } from '@/lib/api';

// Define the data type
interface YourData {
  id: string;
  name: string;
}

// Server Component - fetches data on the server
export default async function YourPage() {
  // Fetch data from the API
  const data = await api.get<YourData[]>('/your-endpoint');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Page</h1>
      {/* Your content here */}
    </div>
  );
}
```

### Step 3: Add Loading State (Optional)

Create `app/your-page/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  );
}
```

### Step 4: Add Error Handling (Optional)

Create `app/your-page/error.tsx`:

```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
```

---

## 🎯 Event Route Implementation

When implementing event routes, follow these guidelines:

### 1. Check the Event Requirements

Review [EVENTS.md](/EVENTS.md) for:

- Frontend requirements (Required / Minimal)
- Backend dependencies
- Special cases (like Fun Games - no registration)

### 2. Use the Existing Placeholder

Each event has a placeholder page:

```text
app/events/{event-name}/page.tsx
```

### 3. Follow the Events Layout

The events layout is at `app/events/layout.tsx`. Use it for consistent navigation.

### 4. Event Route Examples

| Event      | Route                | Complexity                |
| ---------- | -------------------- | ------------------------- |
| Buildathon | `/events/buildathon` | High (forms, submissions) |
| Bug Smash  | `/events/bug-smash`  | High (quiz interface)     |
| Fun Games  | `/events/fun-games`  | Low (display only)        |

---

## 🧩 Adding a New Component

### Step 1: Create the Component File

Create `components/YourComponent.tsx`:

```typescript
interface YourComponentProps {
  id: string;
  name: string;
  onClick?: (id: string) => void;
}

export function YourComponent({ id, name, onClick }: YourComponentProps) {
  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <h3 className="font-medium text-gray-900">{name}</h3>
    </div>
  );
}
```

### Step 2: Export from Index (Optional)

Create `components/index.ts`:

```typescript
export * from './YourComponent';
```

---

## 🔄 Client Components

When you need interactivity, use client components:

```typescript
'use client'; // <-- Add this at the top

import { useState } from 'react';

export function InteractiveComponent() {
  const [value, setValue] = useState('');

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="border rounded px-3 py-2"
    />
  );
}
```

---

## ✅ Code Quality Checklist

Before submitting your code, ensure:

- [ ] `bun run lint` passes with no errors
- [ ] `bun run build` completes successfully
- [ ] Components are properly typed with TypeScript
- [ ] Styling uses Tailwind CSS classes
- [ ] No hardcoded API URLs (use environment variables)
- [ ] Loading and error states are handled

---

## 📝 Commit Messages

Use conventional commit format:

```text
type(scope): description

feat(events): add buildathon registration form
fix(quiz): resolve timer display issue
style(home): improve mobile responsiveness
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `style` - Styling changes
- `refactor` - Code change (no behavior change)
- `docs` - Documentation only
- `test` - Adding or updating tests

---

## ⚠️ Common Mistakes to Avoid

| ❌ Don't                | ✅ Do                                     |
| ----------------------- | ----------------------------------------- |
| Commit directly to main | Use feature branches + PRs                |
| Use npm/yarn/pnpm       | Use `bun` commands only                   |
| Use `any` type          | Define proper TypeScript interfaces       |
| Hardcode API URLs       | Use `process.env.NEXT_PUBLIC_API_URL`     |
| Forget `'use client'`   | Add directive for interactive components  |
| Inline all styles       | Use Tailwind classes or component styles  |
| Skip loading states     | Add `loading.tsx` for data-fetching pages |
| Commit `.env.local`     | Use `.env.local.example` for templates    |

---

## ❓ Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
- Read [EVENTS.md](/EVENTS.md) for event-specific guidance
- Read [RUNTIME.md](/RUNTIME.md) for Bun.js help
- Open an issue for questions

Welcome to the team! 🎉
