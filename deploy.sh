#!/bin/bash
# XIANZE Deployment Script
# Usage: ./deploy.sh [dev|prod] [--no-cache]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV="${1:-prod}"
NO_CACHE=""
COMPOSE_FILE="docker-compose.yml"

if [[ "$ENV" == "prod" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

if [[ "$2" == "--no-cache" ]] || [[ "$1" == "--no-cache" ]]; then
    NO_CACHE="--no-cache"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   XIANZE Event Management - Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Environment:${NC} $ENV"
echo -e "${YELLOW}Compose file:${NC} $COMPOSE_FILE"
echo ""

# Check if compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo -e "${RED}Error: $COMPOSE_FILE not found${NC}"
    exit 1
fi

# Step 1: Pull latest code (if git repo)
if [[ -d ".git" ]]; then
    echo -e "${BLUE}[1/5]${NC} Pulling latest changes..."
    git pull --ff-only || echo -e "${YELLOW}Warning: Could not pull (maybe local changes?)${NC}"
else
    echo -e "${BLUE}[1/5]${NC} Skipping git pull (not a git repo)"
fi

# Step 2: Stop running containers
echo -e "${BLUE}[2/5]${NC} Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans

# Step 3: Build new images
echo -e "${BLUE}[3/5]${NC} Building new images..."
docker compose -f "$COMPOSE_FILE" build $NO_CACHE

# Step 4: Start containers
echo -e "${BLUE}[4/5]${NC} Starting containers..."
docker compose -f "$COMPOSE_FILE" up -d

# Step 5: Cleanup old images
echo -e "${BLUE}[5/5]${NC} Cleaning up unused images..."
docker image prune -f

# Health check
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Show container status
echo -e "${YELLOW}Container Status:${NC}"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo -e "${YELLOW}Waiting for health checks...${NC}"
sleep 5

# Check backend health
if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Backend not responding yet (may still be starting)${NC}"
fi

echo ""
echo -e "View logs: ${BLUE}docker compose -f $COMPOSE_FILE logs -f${NC}"
