# =============================================================================
# XIANZE Backend - Production Dockerfile
# =============================================================================
# Multi-stage build for optimal image size and security

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Install all dependencies for build
RUN cp -R node_modules prod_node_modules
RUN npm ci && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Add labels for container identification
LABEL maintainer="XIANZE Team"
LABEL description="XIANZE Event Management Backend API"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy production dependencies
COPY --from=deps /app/prod_node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /data && chown nestjs:nodejs /data

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/main"]
