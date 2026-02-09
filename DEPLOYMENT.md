# XIANZE Production Deployment Guide

This guide covers deploying XIANZE Event Management to a production server.

## Prerequisites

- Linux server (Ubuntu 22.04+ recommended)
- Docker Engine 24.0+
- Docker Compose v2.20+
- Domain name pointed to your server
- 2GB+ RAM, 2 CPU cores minimum

## Quick Deployment

### 1. Clone and Configure

```bash
# Clone repository
git clone <repository-url> /opt/xianze
cd /opt/xianze

# Create production environment file
cp .env.production.example .env

# Edit with your values
nano .env
```

### 2. Configure Environment

Edit `.env` with production values:

```env
DOMAIN=your-domain.com
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=/api
NODE_ENV=production
```

### 3. Update Nginx Configuration

Edit `nginx/nginx.conf` and replace `your-domain.com` with your actual domain.

### 4. Deploy (Without SSL)

For initial deployment without SSL:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Visit `http://your-domain.com` to verify it works.

### 5. Add SSL Certificate (Let's Encrypt)

```bash
# Start certbot to get certificates
docker compose -f docker-compose.prod.yml --profile ssl run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  --email your-email@example.com \
  -d your-domain.com \
  --agree-tos --no-eff-email

# Update nginx.conf to enable HTTPS (uncomment SSL server block)
# Then reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Architecture

```
                    ┌─────────────────┐
     Port 80/443    │                 │
    ──────────────▶ │   Nginx Proxy   │
                    │                 │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌───────────┐  ┌───────────┐
        │ Frontend │  │  Backend  │  │   Redis   │
        │ Next.js  │  │  NestJS   │  │   Cache   │
        │  :3000   │  │   :5000   │  │   :6379   │
        └──────────┘  └─────┬─────┘  └───────────┘
                            │
                      ┌─────▼─────┐
                      │  SQLite   │
                      │  Volume   │
                      └───────────┘
```

---

## Security Features

### Implemented

- ✅ **Nginx Reverse Proxy** - No direct access to app containers
- ✅ **Security Headers** - XSS, CSRF, Content-Type protection
- ✅ **Rate Limiting** - 100 req/min per IP (configurable)
- ✅ **Helmet Middleware** - Additional security headers
- ✅ **Non-root Containers** - Services run as unprivileged users
- ✅ **Resource Limits** - CPU/memory caps prevent runaway processes
- ✅ **Graceful Shutdown** - Clean connection handling on restart

### Recommended Additional Steps

1. **Enable UFW Firewall**

   ```bash
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp
   ufw enable
   ```

2. **Enable Automatic Updates**

   ```bash
   apt install unattended-upgrades
   dpkg-reconfigure unattended-upgrades
   ```

3. **Set Up Monitoring** (optional)
   - Use Uptime Kuma, Grafana, or similar for health monitoring
   - Monitor `/health` endpoint

---

## Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Update Deployment

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Backup Database

```bash
# Copy SQLite database from volume
docker cp xianze-backend:/data/xianze.db ./backup-$(date +%Y%m%d).db
```

### Restore Database

```bash
docker cp ./backup.db xianze-backend:/data/xianze.db
docker compose -f docker-compose.prod.yml restart backend
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check health
curl http://localhost:5000/health
```

### 502 Bad Gateway

- Backend hasn't started yet (wait for health check)
- Check backend logs for errors

### SSL Certificate Issues

```bash
# Test certificate renewal
docker compose -f docker-compose.prod.yml --profile ssl run --rm certbot renew --dry-run
```

---

## Resource Requirements

| Service   | CPU      | Memory    |
| --------- | -------- | --------- |
| Nginx     | 0.5      | 128MB     |
| Backend   | 1.0      | 512MB     |
| Frontend  | 1.0      | 512MB     |
| Redis     | 0.25     | 256MB     |
| **Total** | **2.75** | **1.4GB** |

Recommended: 4GB RAM, 4 CPU cores for comfortable operation.
