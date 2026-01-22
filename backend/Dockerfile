# XIANZE Backend - Multi-stage Dockerfile (Bun + NestJS)

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps

# Install build dependencies for native modules (node-gyp)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy package files - lockfile is optional
COPY package.json bun.lock* ./

# Install dependencies - allow lockfile updates for compatibility
# Uses existing lockfile if valid, regenerates if needed
RUN bun install --no-save || bun install

# Stage 2: Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Production
FROM oven/bun:1-alpine AS runner
# Install curl for health checks and LibreOffice for PPT to PDF conversion
RUN apk add --no-cache curl libreoffice
LABEL maintainer="XIANZE Team" description="XIANZE Backend API" runtime="bun"

RUN addgroup --system --gid 1001 bunjs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

RUN mkdir -p /data/transactions /data/presentations /data/think-link && chown -R nestjs:bunjs /data

USER nestjs
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["bun", "run", "dist/main.js"]
