# Frontend Architecture

This document explains the architectural decisions and patterns used in the XIANZE frontend.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           XIANZE Frontend                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         App Router                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │   Layout    │  │   Page      │  │  Loading    │              │   │
│  │  │  (Shared)   │  │ (Route)     │  │   State     │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Components                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │   UI        │  │   Feature   │  │   Layout    │              │   │
│  │  │ Components  │  │ Components  │  │ Components  │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API Client (lib/api.ts)                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│                     ┌─────────────────┐                                │
│                     │  Backend API    │                                │
│                     │  (NestJS)       │                                │
│                     └─────────────────┘                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Concepts

### 1. Next.js App Router

The App Router (introduced in Next.js 13) is a new routing paradigm:

```
app/
├── layout.tsx        # Root layout (wraps all pages)
├── page.tsx          # Home page (/)
├── admin/
│   ├── layout.tsx    # Admin layout (wraps admin pages)
│   └── page.tsx      # Admin dashboard (/admin)
├── events/
│   ├── page.tsx      # Events list (/events)
│   └── [id]/
│       └── page.tsx  # Single event (/events/123)
```

**Key concepts:**

- **Files become routes** - `page.tsx` files are routes
- **Layouts are shared** - `layout.tsx` wraps child pages
- **Server Components default** - Components are server-rendered by default
- **Client Components opt-in** - Use `'use client'` directive when needed

### 2. Server vs Client Components

```typescript
// Server Component (default)
// Can fetch data directly, can't use hooks
export default async function EventsPage() {
  const events = await fetchEvents(); // Direct server fetch
  return <EventList events={events} />;
}

// Client Component
// Can use hooks, interactive
'use client';

export function EventForm() {
  const [name, setName] = useState('');
  // Interactive form logic
}
```

**When to use each:**

| Server Components | Client Components        |
| ----------------- | ------------------------ |
| Data fetching     | Event handlers (onClick) |
| Database access   | useState, useEffect      |
| Backend services  | Browser APIs             |
| Sensitive data    | Interactivity            |

### 3. Component Organization

```
components/
├── ui/                    # Generic UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
├── features/              # Feature-specific components
│   ├── events/
│   │   ├── EventCard.tsx
│   │   └── EventForm.tsx
│   └── admin/
│       └── Sidebar.tsx
└── layouts/               # Layout components
    ├── Header.tsx
    └── Footer.tsx
```

---

## 🎨 Styling Strategy

### Tailwind CSS

We use Tailwind CSS for styling:

```tsx
// Utility classes
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>

// Custom component classes (defined in globals.css)
<button className="btn-primary">
  Click me
</button>
```

### CSS Organization

```css
/* globals.css */

/* 1. Tailwind imports */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 2. CSS variables for theming */
:root {
  --color-primary: #0ea5e9;
}

/* 3. Base styles */
body {
  @apply bg-gray-50;
}

/* 4. Component classes */
@layer components {
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded;
  }
}
```

---

## 🔌 API Communication

### API Client Pattern

```typescript
// lib/api.ts provides a configured client
import { api } from '@/lib/api';

// Type-safe requests
const events = await api.get<Event[]>('/events');
const newEvent = await api.post<Event>('/events', data);
```

### Data Fetching Patterns

**Server Components (Recommended):**

```typescript
// Direct fetch in server components
export default async function EventsPage() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`);
  const events = await response.json();

  return <EventList events={events} />;
}
```

**Client Components (When needed):**

```typescript
'use client';

export function EventsClient() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get<Event[]>('/events').then(setEvents);
  }, []);

  return <EventList events={events} />;
}
```

---

## 📁 File Naming Conventions

| Type        | Convention           | Example                 |
| ----------- | -------------------- | ----------------------- |
| Components  | PascalCase           | `EventCard.tsx`         |
| Pages       | lowercase            | `page.tsx`              |
| Utilities   | camelCase            | `formatDate.ts`         |
| Hooks       | camelCase with 'use' | `useEvents.ts`          |
| Types       | PascalCase           | `Event.ts`              |
| CSS modules | kebab-case           | `event-card.module.css` |

---

## 🧪 Testing Strategy

```
__tests__/
├── components/        # Component tests
├── pages/             # Page tests
└── utils/             # Utility tests
```

**Recommended tools:**

- Jest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests

---

## 📊 State Management

For simple state, use React's built-in hooks:

```typescript
// Local component state
const [isOpen, setIsOpen] = useState(false);

// Shared state via context
const AuthContext = createContext<AuthState | null>(null);
```

For complex state, consider:

- Zustand (simple & lightweight)
- TanStack Query (for server state)

---

## 🔐 Authentication (Placeholder)

Authentication will follow this pattern:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Login     │────────▶│   Auth      │────────▶│  Protected  │
│   Page      │         │   Context   │         │   Routes    │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Backend   │
                       │   JWT       │
                       └─────────────┘
```

> **Note**: Authentication is not implemented in this boilerplate.

---

## 📚 Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
