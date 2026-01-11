# Troubleshooting Guide

Common issues and solutions for the XIANZE backend.

---

## 🚀 Startup Issues

### Error: "Cannot find module 'xxx'"

**Cause**: Dependencies not installed or corrupted.

**Solution**:

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Error: "ENOENT: no such file or directory 'xxx.db'"

**Cause**: Database directory doesn't exist.

**Solution**:

```bash
# Create the data directory
mkdir -p data

# Or set DATABASE_PATH to an existing directory
export DATABASE_PATH=./data/xianze.db
```

---

### Error: "Port 5000 is already in use"

**Cause**: Another process is using port 5000.

**Solution**:

```bash
# Find and kill the process using port 5000
lsof -i :5000
kill -9 <PID>

# Or use a different port
export PORT=5001
npm run start:dev
```

---

### Error: "Cannot read properties of undefined (reading 'xxx')"

**Cause**: Environment variables not loaded.

**Solution**:

```bash
# Make sure .env file exists
cp .env.example .env

# Verify variables are loaded
node -e "require('dotenv').config(); console.log(process.env.PORT)"
```

---

## 🗄️ Database Issues

### Error: "SQLITE_BUSY: database is locked"

**Cause**: Multiple processes trying to write simultaneously.

**Solution**:

1. Ensure only one instance is running:

   ```bash
   docker compose down
   docker compose up backend
   ```

2. Enable WAL mode (already configured):
   ```typescript
   // In database.config.ts
   enableWAL: true;
   ```

---

### Error: "SQLITE_CORRUPT: database disk image is malformed"

**Cause**: Database file is corrupted.

**Solution**:

1. Stop the application
2. Restore from backup:
   ```bash
   cp /backups/xianze-latest.db /data/xianze.db
   ```
3. If no backup, recreate the database (⚠️ data loss):
   ```bash
   rm /data/xianze.db
   npm run start:dev  # Will recreate with synchronize=true
   ```

---

### Tables not created / Schema out of sync

**Cause**: `DATABASE_SYNCHRONIZE` is false (correct for production).

**Solution**:
For development, temporarily enable sync:

```bash
export DATABASE_SYNCHRONIZE=true
npm run start:dev
```

For production, use migrations (when implemented).

---

## 🐳 Docker Issues

### Container exits immediately

**Cause**: Application crash on startup.

**Solution**:

```bash
# Check the logs
docker compose logs backend

# Run interactively to see errors
docker compose run --rm backend sh
node dist/main.js
```

---

### Changes not reflected in container

**Cause**: Docker cache using old build.

**Solution**:

```bash
# Rebuild without cache
docker compose build --no-cache backend
docker compose up -d
```

---

### Volume data not persisting

**Cause**: Using wrong volume or bind mount.

**Solution**:

```bash
# Check volume exists
docker volume ls | grep xianze

# Inspect volume
docker volume inspect xianze-sqlite-data

# Recreate volume
docker compose down -v
docker compose up -d
```

---

### Health check failing

**Cause**: Application not responding on health endpoint.

**Solution**:

```bash
# Check if application is running
docker compose exec backend wget -qO- http://localhost:5000/health

# Check container logs
docker compose logs --tail 100 backend
```

---

## 🔧 Build Issues

### TypeScript compilation errors

**Cause**: Type mismatches or missing types.

**Solution**:

```bash
# Clear TypeScript cache
rm -rf dist

# Rebuild
npm run build
```

---

### ESLint/Prettier conflicts

**Cause**: Inconsistent formatting.

**Solution**:

```bash
# Fix all lint issues
npm run lint

# Format all files
npm run format
```

---

## 🌐 Network Issues

### CORS errors in browser

**Cause**: Frontend origin not allowed.

**Solution**:
Set the correct CORS origin:

```bash
# In .env
CORS_ORIGIN=http://localhost:3000
```

Or configure in `main.ts`:

```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
});
```

---

### Connection refused to backend

**Cause**: Backend not running or wrong port.

**Solution**:

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check Docker network
docker network inspect xianze-network

# Frontend should use container name in Docker
# NEXT_PUBLIC_API_URL=http://backend:5000
```

---

## 🧪 Test Issues

### Tests timing out

**Cause**: Database connections not closing.

**Solution**:
Add proper cleanup in tests:

```typescript
afterEach(async () => {
  await app.close();
});
```

---

### E2E tests failing with database errors

**Cause**: Tests using production database.

**Solution**:
Use an in-memory database for tests:

```typescript
// In test config
TypeOrmModule.forRoot({
  type: 'better-sqlite3',
  database: ':memory:',
  synchronize: true,
});
```

---

## 📊 Performance Issues

### Slow queries

**Cause**: Missing indexes or inefficient queries.

**Solution**:

1. Enable SQL logging:

   ```bash
   export DATABASE_LOGGING=true
   ```

2. Add indexes to frequently queried columns:
   ```typescript
   @Entity()
   export class Event {
     @Index()
     @Column()
     name: string;
   }
   ```

---

### Memory leaks

**Cause**: Event listeners or connections not cleaned up.

**Solution**:

1. Use `onModuleDestroy` lifecycle hook
2. Properly close database connections
3. Monitor with:
   ```bash
   docker stats xianze-backend
   ```

---

## 🆘 Still Stuck?

1. **Check the logs** - Most issues are in the logs:

   ```bash
   docker compose logs -f backend
   ```

2. **Search the issue tracker** - Someone may have had the same problem

3. **Ask for help** - Open a new issue with:
   - Error message (full stack trace)
   - Steps to reproduce
   - Environment (OS, Node version, Docker version)
   - What you've already tried

---

## 📚 Related Documentation

- [README.md](./README.md) - Setup instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
