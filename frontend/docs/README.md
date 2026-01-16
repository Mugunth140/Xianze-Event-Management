# XIANZE 2026 Frontend

<div align="center">

**Next.js-powered web application for the XIANZE Inter-College Technical Fest**

[![Next.js](https://img.shields.io/badge/Next.js-14.x-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Events](https://img.shields.io/badge/Events-7-orange?style=flat-square)](../EVENTS.md)

</div>

---

## 📖 Overview

This is the frontend application for **XIANZE 2026**, the inter-college technical fest organized by Mind Bender's Association. It provides the public-facing event pages for participants to view event details and register, as well as an admin dashboard for event coordinators.

### Supported Events (7 Total)

| #   | Event              | Route                        |
| --- | ------------------ | ---------------------------- |
| 1   | Buildathon         | `/events/buildathon`         |
| 2   | Bug Smash          | `/events/bug-smash`          |
| 3   | Paper Presentation | `/events/paper-presentation` |
| 4   | Gaming             | `/events/gaming`             |
| 5   | Ctrl + Quiz        | `/events/ctrl-quiz`          |
| 6   | Code Hunt          | `/events/code-hunt`          |
| 7   | Think & Link       | `/events/think-link`         |

### Why These Technologies?

| Technology       | Why We Use It                                                                |
| ---------------- | ---------------------------------------------------------------------------- |
| **Next.js 14**   | React framework with App Router for modern server-side rendering and routing |
| **App Router**   | File-based routing with layouts, loading states, and server components       |
| **Tailwind CSS** | Utility-first CSS for rapid UI development                                   |
| **TypeScript**   | Type safety and better developer experience                                  |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Backend API running (see [Backend README](../backend/README.md))

### Running Locally

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.local.example .env.local

# 4. Start development server
npm run dev

# Server will be available at http://localhost:3000
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
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   ├── globals.css           # Global styles
│   ├── admin/                # Admin section
│   │   └── page.tsx          # Admin dashboard
│   └── events/               # All 7 event pages
│       ├── page.tsx          # Events listing
│       ├── buildathon/
│       ├── bug-smash/
│       ├── paper-presentation/
│       ├── gaming/
│       ├── ctrl-quiz/
│       ├── code-hunt/
│       └── think-link/
├── lib/                      # Utilities
│   └── api.ts                # API client
├── components/               # React components
├── public/                   # Static assets
├── docs/                     # Additional documentation
├── Dockerfile                # Production container
├── docker-compose.yml        # Standalone Docker setup
└── package.json              # Dependencies & scripts
```

### Understanding the Structure

- **`app/`** - Next.js App Router directory. Each folder with a `page.tsx` becomes a route.
- **`app/events/`** - Contains all 7 event pages for XIANZE 2026.
- **`lib/`** - Shared utilities like the API client.
- **`components/`** - Reusable React components.
- **`public/`** - Static files served at root URL.

---

## ⚙️ Environment Variables

| Variable              | Description          | Default                 |
| --------------------- | -------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000` |

> **Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## 🛠️ Available Scripts

| Script           | Description                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Start development server with hot reload |
| `npm run build`  | Build production bundle                  |
| `npm run start`  | Run production build                     |
| `npm run lint`   | Run ESLint                               |
| `npm run format` | Format code with Prettier                |

---

## 🔌 API Communication

The frontend communicates with the backend using the API client in `lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// Fetch events
const events = await api.get<Event[]>('/events');

// Create event
const newEvent = await api.post<Event>('/events', {
  name: 'My Event',
  date: '2024-01-01',
});
```

### Error Handling

```typescript
import { api, ApiError } from '@/lib/api';

try {
  const data = await api.get('/events');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  }
}
```

---

## 🏗️ Extending the Frontend

### Adding a New Page

1. Create a folder in `app/` with the route name:

   ```bash
   mkdir app/events
   ```

2. Create a `page.tsx` file:

   ```typescript
   // app/events/page.tsx
   export default function EventsPage() {
     return (
       <div>
         <h1>Events</h1>
       </div>
     );
   }
   ```

3. The page is now available at `/events`.

### Adding a New Component

1. Create a file in `components/`:

   ```typescript
   // components/EventCard.tsx
   interface EventCardProps {
     title: string;
     date: string;
   }

   export function EventCard({ title, date }: EventCardProps) {
     return (
       <div className="card">
         <h3>{title}</h3>
         <p>{date}</p>
       </div>
     );
   }
   ```

2. Import and use in pages:
   ```typescript
   import { EventCard } from '@/components/EventCard';
   ```

For detailed instructions, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Component design and patterns
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute code
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

---

## 🔗 Related

- [Root README](../README.md)
- [Backend Documentation](../backend/README.md)
