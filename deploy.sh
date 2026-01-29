#!/bin/bash
# XIANZE Deployment Script
# Usage: ./deploy.sh [dev|prod] [--init-ssl] [--full]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV="${1:-prod}"
NO_CACHE="--no-cache"
INIT_SSL=false
FULL_REDEPLOY=false
COMPOSE_FILE="docker-compose.yml"
DOMAIN="${DOMAIN:-xianze.tech}"
EMAIL="${EMAIL:-admin@xianze.tech}"
SERVICES_TO_DEPLOY="backend frontend-builder nginx"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --init-ssl)
            INIT_SSL=true
            ;;
        --full)
            FULL_REDEPLOY=true
            ;;
        prod|dev)
            ENV="$arg"
            ;;
    esac
done

if [[ "$ENV" == "prod" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   XIANZE Event Management - Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Environment:${NC} $ENV"
echo -e "${YELLOW}Compose file:${NC} $COMPOSE_FILE"
if [[ "$INIT_SSL" == true ]]; then
    echo -e "${YELLOW}SSL Init:${NC} Enabled (Domain: $DOMAIN)"
fi
echo ""

# Check if compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo -e "${RED}Error: $COMPOSE_FILE not found${NC}"
    exit 1
fi

# Function to initialize SSL certificates
init_ssl_certificates() {
    echo -e "${BLUE}[SSL]${NC} Initializing SSL certificates for $DOMAIN..."
    
    # Check if certificates already exist
    if docker volume inspect xianze-certbot-conf > /dev/null 2>&1; then
        CERT_EXISTS=$(docker run --rm -v xianze-certbot-conf:/etc/letsencrypt alpine sh -c \
            "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem && echo 'yes' || echo 'no'")
        if [[ "$CERT_EXISTS" == "yes" ]]; then
            echo -e "${GREEN}✓ SSL certificates already exist for $DOMAIN${NC}"
            return 0
        fi
    fi
    
    echo -e "${YELLOW}Obtaining new SSL certificate...${NC}"
    
    # Create volumes if they don't exist
    docker volume create xianze-certbot-conf > /dev/null 2>&1 || true
    docker volume create xianze-certbot-www > /dev/null 2>&1 || true
    
    # Start nginx temporarily with HTTP-only config for ACME challenge
    echo -e "${BLUE}[SSL]${NC} Starting temporary HTTP server for ACME challenge..."
    
    # Build and start only nginx with HTTP config temporarily
    docker compose -f "$COMPOSE_FILE" build nginx backend frontend-builder
    
    # Start backend first (nginx depends on it)
    docker compose -f "$COMPOSE_FILE" up -d redis
    sleep 3
    docker compose -f "$COMPOSE_FILE" up -d backend
    sleep 5
    
    # Start nginx with HTTP config temporarily (override the SSL config)
    docker run -d --name xianze-nginx-temp \
        --network xianze-prod-network \
        -p 80:80 \
        -v xianze-certbot-www:/var/www/certbot \
        -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
        -v xianze-frontend-static:/usr/share/nginx/html:ro \
        nginx:alpine
    
    sleep 3
    
    # Request certificate from Let's Encrypt
    echo -e "${BLUE}[SSL]${NC} Requesting certificate from Let's Encrypt..."
    docker run --rm \
        -v xianze-certbot-conf:/etc/letsencrypt \
        -v xianze-certbot-www:/var/www/certbot \
        --network xianze-prod-network \
        certbot/certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal
    
    SSL_RESULT=$?
    
    # Stop temporary nginx
    docker stop xianze-nginx-temp > /dev/null 2>&1 || true
    docker rm xianze-nginx-temp > /dev/null 2>&1 || true
    
    if [[ $SSL_RESULT -eq 0 ]]; then
        echo -e "${GREEN}✓ SSL certificate obtained successfully!${NC}"
    else
        echo -e "${RED}✗ Failed to obtain SSL certificate${NC}"
        echo -e "${YELLOW}Make sure your domain points to this server and port 80 is accessible${NC}"
        exit 1
    fi
}

# Step 1: Pull latest code (if git repo)
if [[ -d ".git" ]]; then
    echo -e "${BLUE}[1/5]${NC} Pulling latest changes..."
    git pull --ff-only || echo -e "${YELLOW}Warning: Could not pull (maybe local changes?)${NC}"
else
    echo -e "${BLUE}[1/5]${NC} Skipping git pull (not a git repo)"
fi

# Step 2: Stop containers
if [[ "$FULL_REDEPLOY" == true ]]; then
    echo -e "${BLUE}[2/5]${NC} Stopping all containers (full redeploy)..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans
else
    echo -e "${BLUE}[2/5]${NC} Stopping app containers only..."
    docker compose -f "$COMPOSE_FILE" stop $SERVICES_TO_DEPLOY
fi

# Step 2.5: Initialize SSL if requested (production only)
if [[ "$INIT_SSL" == true ]] && [[ "$ENV" == "prod" ]]; then
    init_ssl_certificates
fi

# Step 3: Remove old volumes and build fresh
echo -e "${BLUE}[3/5]${NC} Removing old frontend volume for fresh build..."
docker volume rm xianze-frontend-static 2>/dev/null || true

echo -e "${BLUE}[3/5]${NC} Building new images (no-cache, fresh)..."
if [[ "$FULL_REDEPLOY" == true ]]; then
    docker compose -f "$COMPOSE_FILE" build $NO_CACHE
else
    docker compose -f "$COMPOSE_FILE" build $NO_CACHE $SERVICES_TO_DEPLOY
fi

# Step 4: Start containers
if [[ "$FULL_REDEPLOY" == true ]]; then
    echo -e "${BLUE}[4/5]${NC} Starting all containers..."
    docker compose -f "$COMPOSE_FILE" up -d
else
    echo -e "${BLUE}[4/5]${NC} Starting app containers..."
    docker compose -f "$COMPOSE_FILE" up -d $SERVICES_TO_DEPLOY
fi

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

# Check HTTPS (production only)
if [[ "$ENV" == "prod" ]]; then
    if curl -sf https://$DOMAIN/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ HTTPS is working on $DOMAIN${NC}"
    else
        echo -e "${YELLOW}⚠ HTTPS not responding (run with --init-ssl if certificates are missing)${NC}"
    fi
fi

echo ""
echo -e "View logs: ${BLUE}docker compose -f $COMPOSE_FILE logs -f${NC}"
if [[ "$ENV" == "prod" ]]; then
    echo -e "Init SSL:  ${BLUE}./deploy.sh prod --init-ssl${NC}"
fi
