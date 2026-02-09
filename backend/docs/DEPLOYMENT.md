# Deployment Guide

This guide covers deploying the XIANZE backend to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] `NODE_ENV` is set to `production`
- [ ] `DATABASE_SYNCHRONIZE` is `false`
- [ ] All secrets are in environment variables (not code)
- [ ] CORS is configured correctly
- [ ] Health checks are working
- [ ] Logs are configured for production
- [ ] SSL/TLS is enabled (via reverse proxy)

---

## 🐳 Docker Deployment

### Building the Production Image

```bash
cd backend

# Build the image
docker build -t xianze-backend:latest .

# Verify the build
docker run --rm xianze-backend:latest node --version
```

### Running in Production

```bash
# Create a data volume for SQLite persistence
docker volume create xianze-data

# Run the container
docker run -d \
  --name xianze-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_PATH=/data/xianze.db \
  -e DATABASE_SYNCHRONIZE=false \
  -v xianze-data:/data \
  xianze-backend:latest
```

### Using Docker Compose (Recommended)

From the root directory:

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

---

## ☁️ Cloud Deployment Options

### AWS ECS / Fargate

1. Push image to ECR:

   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker tag xianze-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/xianze-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/xianze-backend:latest
   ```

2. Configure ECS service with:
   - Task definition pointing to ECR image
   - EFS volume for SQLite persistence
   - Application Load Balancer for HTTPS

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project>/xianze-backend

# Deploy to Cloud Run
gcloud run deploy xianze-backend \
  --image gcr.io/<project>/xianze-backend \
  --port 5000 \
  --set-env-vars NODE_ENV=production
```

> ⚠️ **Note**: Cloud Run is stateless. Use Cloud SQL or Cloud Storage for persistent data instead of SQLite.

### DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure as Docker app
3. Set environment variables in dashboard
4. Configure a managed database volume

---

## 🔒 Environment Variables in Production

**Never commit secrets to version control!**

### Required Variables

| Variable        | Description          | Example                  |
| --------------- | -------------------- | ------------------------ |
| `NODE_ENV`      | Must be `production` | `production`             |
| `PORT`          | Server port          | `5000`                   |
| `DATABASE_PATH` | SQLite file path     | `/data/xianze.db`        |
| `CORS_ORIGIN`   | Allowed origins      | `https://yourdomain.com` |

### Setting Variables

**Docker:**

```bash
docker run -e NODE_ENV=production -e PORT=5000 ...
```

**Docker Compose:**

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - PORT=5000
```

**Kubernetes:**

```yaml
envFrom:
  - secretRef:
      name: xianze-secrets
```

---

## 📊 Health Checks

The `/health` endpoint returns:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Docker Health Check

Already configured in Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1
```

### Load Balancer Configuration

Point your load balancer health check to:

- **Path**: `/health`
- **Expected status**: `200`
- **Interval**: `30s`
- **Timeout**: `10s`

---

## 💾 Database Backup

### Manual Backup

SQLite files can be copied while the application is running (with WAL mode):

```bash
# Copy the database file
cp /data/xianze.db /backups/xianze-$(date +%Y%m%d).db
```

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Copy database
cp /data/xianze.db "$BACKUP_DIR/xianze-$DATE.db"

# Keep last 7 days
find $BACKUP_DIR -name "xianze-*.db" -mtime +7 -delete

echo "Backup completed: xianze-$DATE.db"
```

### Restore from Backup

```bash
# Stop the application
docker compose down

# Replace the database file
cp /backups/xianze-20260101.db /data/xianze.db

# Start the application
docker compose up -d
```

---

## 🔄 Zero-Downtime Deployment

For production systems requiring zero downtime:

### Rolling Update with Docker Compose

```bash
# Pull new images
docker compose pull

# Update with zero downtime using recreate
docker compose up -d --no-deps --build backend
```

### Blue-Green Deployment

1. Run new version on different port
2. Test the new version
3. Switch load balancer to new version
4. Stop old version

---

## 📈 Monitoring

### Logging

Configure structured logging for production:

```typescript
// In main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'],
});
```

### Metrics

Consider adding:

- Prometheus endpoint for metrics
- APM integration (DataDog, New Relic)
- Error tracking (Sentry)

---

## 🆘 Rollback Procedure

If deployment fails:

1. **Identify the issue** - Check logs:

   ```bash
   docker compose logs backend
   ```

2. **Rollback to previous version**:

   ```bash
   docker compose down
   docker tag xianze-backend:latest xianze-backend:failed
   docker tag xianze-backend:previous xianze-backend:latest
   docker compose up -d
   ```

3. **Restore database if needed**:

   ```bash
   cp /backups/xianze-previous.db /data/xianze.db
   ```

4. **Document the incident** and fix the root cause

---

## ❓ Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common deployment issues.
