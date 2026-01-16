# Troubleshooting Guide

Common issues and solutions for the XIANZE frontend.

---

## 🚀 Startup Issues

### Error: "Module not found: Can't resolve 'xxx'"

**Cause**: Dependencies not installed or import path wrong.

**Solution**:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check if import path is correct
# Use @/ for absolute imports from root
import { api } from '@/lib/api';  # ✓ Correct
import { api } from 'lib/api';    # ✗ Wrong
```

---

### Error: "Port 3000 is already in use"

**Cause**: Another process is using port 3000.

**Solution**:

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

---

### Page shows "404 - This page could not be found"

**Cause**: Missing `page.tsx` file or wrong folder structure.

**Solution**:

```bash
# Ensure the folder has page.tsx
ls app/your-route/
# Should show: page.tsx

# Route structure must be:
app/
├── your-route/
│   └── page.tsx  # Required for /your-route
```

---

### Tailwind styles not applying

**Cause**: Content paths not configured or cache issue.

**Solution**:

1. Check `tailwind.config.ts` has correct content paths:

   ```typescript
   content: [
     './pages/**/*.{js,ts,jsx,tsx,mdx}',
     './components/**/*.{js,ts,jsx,tsx,mdx}',
     './app/**/*.{js,ts,jsx,tsx,mdx}',
   ],
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## 🔌 API Connection Issues

### Error: "Failed to fetch" or "Network error"

**Cause**: Backend not running or wrong API URL.

**Solution**:

1. Verify backend is running:

   ```bash
   curl http://localhost:5000/health
   ```

2. Check environment variable:

   ```bash
   # In .env.local
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. Restart the development server after changing env vars.

---

### CORS errors in browser console

**Cause**: Backend not allowing frontend origin.

**Solution**:

1. In backend, configure CORS:

   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: 'http://localhost:3000',
   });
   ```

2. Or for development, allow all origins:
   ```typescript
   app.enableCors();
   ```

---

### Data not updating after API call

**Cause**: Server Component caching or missing revalidation.

**Solution**:

```typescript
// Option 1: Disable caching for the fetch
const response = await fetch(url, { cache: 'no-store' });

// Option 2: Revalidate periodically
const response = await fetch(url, { next: { revalidate: 60 } });

// Option 3: Use router.refresh() after mutations
import { useRouter } from 'next/navigation';

const router = useRouter();
await api.post('/events', data);
router.refresh(); // Revalidate server components
```

---

## 🐳 Docker Issues

### Container fails to build

**Cause**: Build-time errors or missing files.

**Solution**:

```bash
# Check build logs
docker compose build --no-cache frontend

# Verify .dockerignore isn't excluding needed files
cat .dockerignore
```

---

### Environment variables not working in Docker

**Cause**: Variables need to be set at build time for NEXT*PUBLIC*\*.

**Solution**:

```bash
# Pass variables as build args
docker compose build \
  --build-arg NEXT_PUBLIC_API_URL=http://backend:5000 \
  frontend
```

Or in docker-compose.yml:

```yaml
frontend:
  build:
    args:
      - NEXT_PUBLIC_API_URL=http://backend:5000
```

---

### Frontend can't connect to backend in Docker

**Cause**: Wrong hostname. In Docker, use container names.

**Solution**:

```bash
# In Docker, backend is accessible via container name
NEXT_PUBLIC_API_URL=http://backend:5000  # In Docker
NEXT_PUBLIC_API_URL=http://localhost:5000  # Local development
```

---

## 🎨 Styling Issues

### Custom font not loading

**Cause**: Font not imported correctly.

**Solution**:

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

---

### Dark mode not working

**Cause**: Tailwind dark mode not configured.

**Solution**:

```typescript
// tailwind.config.ts
const config = {
  darkMode: 'class', // or 'media' for system preference
  // ...
};
```

Then use dark: prefix:

```tsx
<div className="bg-white dark:bg-gray-900">Content</div>
```

---

## 🔧 Build Issues

### Build fails with TypeScript errors

**Cause**: Type errors in code.

**Solution**:

```bash
# Check types without building
npx tsc --noEmit

# Fix errors shown, common issues:
# - Missing types
# - Incorrect imports
# - Unused variables
```

---

### Build fails with "Module parse failed"

**Cause**: Invalid syntax or unsupported feature.

**Solution**:

1. Check for syntax errors in the file mentioned
2. Ensure you're using supported JavaScript/TypeScript features
3. Check if `'use client'` is needed for client-side code

---

### Images not loading in production

**Cause**: Images not in public folder or wrong path.

**Solution**:

```tsx
// Images in public/ are accessible from root
<img src="/logo.png" alt="Logo" />;

// For optimization, use next/image
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={50} />;
```

---

## 🧪 Testing Issues

### Tests failing with "window is not defined"

**Cause**: Server-side code running in test environment.

**Solution**:

```typescript
// Mock window in tests
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost' },
});

// Or add 'use client' to components that use window
```

---

## 🆘 Still Stuck?

1. **Check the console** - Browser DevTools shows client errors
2. **Check terminal** - Development server shows server errors
3. **Clear caches**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```
4. **Search for the error** - Most Next.js errors are documented
5. **Open an issue** - Include error message and steps to reproduce

---

## 📚 Related Documentation

- [README.md](./README.md) - Setup instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Design patterns
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
