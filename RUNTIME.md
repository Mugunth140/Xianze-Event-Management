# XIANZE Runtime: Bun.js

This document explains the Bun.js runtime used in the XIANZE Event Management System.

---

## Why Bun?

XIANZE uses [Bun](https://bun.sh) as its JavaScript/TypeScript runtime instead of Node.js. Here's why:

### Performance Benefits

| Aspect          | Bun            | Node.js                  |
| --------------- | -------------- | ------------------------ |
| Startup Time    | ~4x faster     | Baseline                 |
| Package Install | ~25x faster    | Baseline                 |
| TypeScript      | Native support | Requires transpilation   |
| Hot Reload      | Built-in, fast | Requires nodemon/ts-node |

### Developer Experience

- **Native TypeScript** - No need for ts-node or build steps during development
- **Fast installs** - `bun install` is significantly faster than npm/yarn
- **Built-in bundler** - Less tooling complexity
- **Node.js compatible** - Runs most npm packages without modification

### Production Benefits

- **Smaller Docker images** - Bun's alpine image is lightweight
- **Faster cold starts** - Important for containerized environments
- **Lower memory usage** - More efficient runtime

---

## Installation

### macOS / Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows (WSL)

```bash
# Inside WSL
curl -fsSL https://bun.sh/install | bash
```

### Verify Installation

```bash
bun --version
# Should output: 1.x.x
```

---

## Command Reference

| Purpose              | Bun Command            | npm Equivalent             |
| -------------------- | ---------------------- | -------------------------- |
| Install dependencies | `bun install`          | `npm install`              |
| Add package          | `bun add <package>`    | `npm install <package>`    |
| Add dev dependency   | `bun add -d <package>` | `npm install -D <package>` |
| Run script           | `bun run <script>`     | `npm run <script>`         |
| Run file directly    | `bun <file.ts>`        | `npx ts-node <file.ts>`    |
| Execute package      | `bunx <package>`       | `npx <package>`            |

---

## Project Scripts

### Backend

```bash
cd backend

# Development
bun run start:dev      # Start with hot reload

# Production
bun run build          # Build the project
bun run start:prod     # Start production server

# Quality
bun run lint           # Run ESLint
bun run format         # Format with Prettier
bun run test           # Run tests
```

### Frontend

```bash
cd frontend

# Development
bun run dev            # Start Next.js dev server

# Production
bun run build          # Build for production
bun run start          # Start production server

# Quality
bun run lint           # Run ESLint
bun run format         # Format with Prettier
```

### Root (Monorepo)

```bash
# From project root
bun run format         # Format all files
bun run format:check   # Check formatting
```

---

## Docker Configuration

Both Dockerfiles use the official Bun alpine image:

```dockerfile
FROM oven/bun:1-alpine
```

### Backend Dockerfile Highlights

```dockerfile
# Dependencies stage
FROM oven/bun:1-alpine AS deps
RUN bun install --frozen-lockfile

# Build stage
FROM oven/bun:1-alpine AS builder
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS runner
CMD ["bun", "run", "dist/main.js"]
```

### Frontend Dockerfile Highlights

```dockerfile
# Dependencies stage
FROM oven/bun:1-alpine AS deps
RUN bun install --frozen-lockfile

# Build stage
FROM oven/bun:1-alpine AS builder
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS runner
CMD ["bun", "run", "server.js"]
```

---

## Lock Files

Bun uses `bun.lockb` (binary format) instead of `package-lock.json`.

> [!IMPORTANT]
> **Do NOT mix package managers!**
>
> - ❌ Don't use `npm install` or `yarn`
> - ✅ Always use `bun install`

If you see both `package-lock.json` and `bun.lockb`, delete `package-lock.json`:

```bash
rm package-lock.json
bun install
```

---

## Compatibility Notes

### NestJS

NestJS works with Bun out of the box. The `@nestjs/cli` commands still work:

```bash
bun run nest build
bun run nest start --watch
```

### Next.js

Next.js is fully compatible with Bun:

```bash
bun run next dev
bun run next build
```

### Known Limitations

Some npm packages have native Node.js dependencies that may not work:

- **Workaround**: Use Bun's Node.js compatibility mode
- **Check**: [Bun's compatibility table](https://bun.sh/docs/runtime/nodejs-apis)

For XIANZE, all critical dependencies are tested and compatible.

---

## Troubleshooting

### "Command not found: bun"

Ensure Bun is in your PATH:

```bash
export PATH="$HOME/.bun/bin:$PATH"
```

Add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.).

### "No lockfile found"

Generate the lock file:

```bash
bun install
```

### "Module not found" errors

Clear and reinstall:

```bash
rm -rf node_modules bun.lockb
bun install
```

### Native module issues

Some packages with C++ bindings may need special handling:

```bash
bun install --backend=node-gyp
```

---

## IDE Support

### VS Code

1. Install the [Bun extension](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)
2. Configure TypeScript to use Bun types

### JetBrains IDEs

Bun is automatically detected in recent versions of WebStorm/IntelliJ.

---

## Related Documentation

- [Bun Official Docs](https://bun.sh/docs)
- [Bun Compatibility](https://bun.sh/docs/runtime/nodejs-apis)
- [Docker Compose](/docker-compose.yml) - Container configuration
- [CONTRIBUTING.md](/backend/CONTRIBUTING.md) - Development workflow
