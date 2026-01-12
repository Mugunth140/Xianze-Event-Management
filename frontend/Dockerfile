# XIANZE Frontend - Static Build
# Builds Next.js static export, output is in /app/out

FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Output: Static files in /app/out
# These will be copied to nginx in docker-compose
