# =============================================================================
# XIANZE Backend - Production Dockerfile (Bun Runtime)
# =============================================================================
# Multi-stage build for optimal image size and security
# Uses Bun.js for faster builds and runtime performance

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application using NestJS CLI
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM oven/bun:1-alpine AS runner

# Install curl for healthcheck (not available in bun alpine by default)
RUN apk add --no-cache curl

# Add labels for container identification
LABEL maintainer="XIANZE Team"
LABEL description="XIANZE Event Management Backend API"
LABEL runtime="bun"

# Create non-root user for security
RUN addgroup --system --gid 1001 bunjs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules (Bun is compatible with node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy package.json for runtime
COPY --from=builder /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /data && chown nestjs:bunjs /data

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5000

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start the application with Bun
CMD ["bun", "run", "dist/main.js"]
