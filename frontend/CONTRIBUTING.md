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
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local if needed
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🏗️ Adding a New Page

This is the most common contribution. Follow these steps:

### Step 1: Create the Page Directory

```bash
# Create a new route at /events
mkdir app/events
```

### Step 2: Create the Page Component

Create `app/events/page.tsx`:

```typescript
import { api } from '@/lib/api';

// Define the data type
interface Event {
  id: string;
  name: string;
  date: string;
}

// Server Component - fetches data on the server
export default async function EventsPage() {
  // Fetch data from the API
  const events = await api.get<Event[]>('/events');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div key={event.id} className="card">
            <h2 className="font-medium">{event.name}</h2>
            <p className="text-gray-500">{event.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Add Loading State (Optional)

Create `app/events/loading.tsx`:

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

Create `app/events/error.tsx`:

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

## 🧩 Adding a New Component

### Step 1: Create the Component File

Create `components/EventCard.tsx`:

```typescript
interface EventCardProps {
  id: string;
  name: string;
  date: string;
  onSelect?: (id: string) => void;
}

export function EventCard({ id, name, date, onSelect }: EventCardProps) {
  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(id)}
    >
      <h3 className="font-medium text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500">{date}</p>
    </div>
  );
}
```

### Step 2: Export from Index (Optional)

Create `components/index.ts`:

```typescript
export * from './EventCard';
// Add more exports as components are added
```

### Step 3: Use in Pages

```typescript
import { EventCard } from '@/components/EventCard';
// or
import { EventCard } from '@/components';
```

---

## 🔄 Client Components

When you need interactivity, use client components:

```typescript
'use client'; // <-- Add this at the top

import { useState } from 'react';

export function EventForm() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Submit logic
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded px-3 py-2"
        placeholder="Event name"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary ml-2"
      >
        {isSubmitting ? 'Creating...' : 'Create Event'}
      </button>
    </form>
  );
}
```

---

## ✅ Code Quality Checklist

Before submitting your code, ensure:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] Components are properly typed with TypeScript
- [ ] Styling uses Tailwind CSS classes
- [ ] No hardcoded API URLs (use environment variables)
- [ ] Loading and error states are handled

---

## 📝 Commit Messages

Use conventional commit format:

```
type(scope): description

feat(events): add events listing page
fix(admin): resolve sidebar navigation issue
style(home): improve mobile responsiveness
refactor(api): extract common fetch logic
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `style` - Styling changes
- `refactor` - Code change (no behavior change)
- `docs` - Documentation only
- `test` - Adding or updating tests

---

## 🔀 Pull Request Process

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feature/events-page
   ```

2. **Make your changes** following the patterns above

3. **Test your changes**:

   ```bash
   npm run lint
   npm run build
   ```

4. **Commit and push**:

   ```bash
   git add .
   git commit -m "feat(events): add events listing page"
   git push origin feature/events-page
   ```

5. **Open a Pull Request** with:
   - Clear title describing the change
   - Screenshots for UI changes
   - Link to related issue (if any)

---

## ⚠️ Common Mistakes to Avoid

| ❌ Don't              | ✅ Do                                     |
| --------------------- | ----------------------------------------- |
| Use `any` type        | Define proper TypeScript interfaces       |
| Hardcode API URLs     | Use `process.env.NEXT_PUBLIC_API_URL`     |
| Forget `'use client'` | Add directive for interactive components  |
| Inline all styles     | Use Tailwind classes or component styles  |
| Skip loading states   | Add `loading.tsx` for data-fetching pages |
| Commit `.env.local`   | Use `.env.local.example` for templates    |

---

## ❓ Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
- Open an issue for questions

Welcome to the team! 🎉
