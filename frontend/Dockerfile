# XIANZE Frontend - Static Build
# Builds Next.js static export, output is in /app/out

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files - lockfile is optional
COPY package.json bun.lock* ./

# Install dependencies - allow lockfile updates for compatibility
# Uses existing lockfile if valid, regenerates if needed
RUN bun install --no-save || bun install

COPY . .

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Output: Static files in /app/out
# These will be copied to nginx in docker-compose
