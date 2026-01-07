# Component Guidelines

This document provides guidelines for creating React components in the XIANZE frontend.

---

## 📁 Component Organization

```
components/
├── ui/                    # Generic, reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── features/              # Feature-specific components
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventList.tsx
│   │   └── EventForm.tsx
│   └── admin/
│       ├── Sidebar.tsx
│       └── Header.tsx
└── layouts/               # Layout components
    ├── MainLayout.tsx
    └── AdminLayout.tsx
```

---

## 🧱 Component Template

### Basic Component

```typescript
// components/ui/Button.tsx

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-colors';

  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Client Component (Interactive)

```typescript
// components/features/events/EventForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface EventFormProps {
  onSubmit: (data: { name: string; date: string }) => Promise<void>;
}

export function EventForm({ onSubmit }: EventFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({ name, date });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Event name"
        className="w-full border rounded-lg px-4 py-2"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border rounded-lg px-4 py-2"
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Event'}
      </Button>
    </form>
  );
}
```

---

## ✅ Best Practices

### DO ✓

- Define TypeScript interfaces for props
- Use meaningful, descriptive names
- Keep components focused and small
- Use Tailwind for styling
- Handle loading and error states
- Export named exports (not default)

### DON'T ✗

- Use `any` type
- Create components with too many props
- Mix server and client logic
- Hardcode colors or sizes
- Forget accessibility attributes

---

## 🎨 Styling Guidelines

1. **Use Tailwind classes** for all styling
2. **Create reusable classes** in `globals.css` for repeated patterns
3. **Use CSS variables** for theme colors
4. **Prefer composition** over prop variations

```tsx
// ✓ Good - Compose components
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>

// ✗ Avoid - Too many props
<Card
  title="Title"
  body="Content"
  hasHeader={true}
  headerVariant="primary"
/>
```

---

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Next.js Components](https://nextjs.org/docs/app/building-your-application/rendering)
