# Security Guide

This document outlines security considerations and best practices for the XIANZE backend.

---

## 🔐 Authentication (Placeholder)

> ⚠️ **Note**: Authentication is not implemented in this boilerplate. These are the security patterns to follow when implementing.

### Intended Authentication Flow

```
┌──────────────┐    Credentials     ┌──────────────┐
│              │───────────────────▶│              │
│    Admin     │                    │  AuthModule  │
│              │◀───────────────────│              │
└──────────────┘    JWT Token       └──────────────┘
       │
       │ Token in Header
       ▼
┌──────────────────────────────────────────────────┐
│              Protected Routes                     │
└──────────────────────────────────────────────────┘
```

### JWT Best Practices

When implementing JWT authentication:

1. **Use strong secrets** - At least 256 bits of entropy
2. **Short expiration** - Access tokens: 15-30 minutes
3. **Refresh tokens** - For obtaining new access tokens
4. **Secure storage** - HttpOnly cookies or secure storage
5. **Token rotation** - Rotate refresh tokens on use

### Password Storage

```typescript
// Use bcrypt with adequate salt rounds
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## 🛡️ Input Validation

All user input must be validated using DTOs:

```typescript
import { IsString, IsEmail, Length, Matches } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 128)
  password: string;
}
```

### Global Validation Pipe

Already configured in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Throw on unknown properties
    transform: true, // Auto-transform types
  }),
);
```

---

## 🌐 CORS Configuration

Configure CORS strictly in production:

```typescript
// In main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Never use `origin: '*'` in production!**

---

## 🔒 Security Headers

Add security headers using Helmet:

```bash
npm install helmet
```

```typescript
// In main.ts
import helmet from 'helmet';

app.use(helmet());
```

Helmet provides:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- Content Security Policy

---

## 🗄️ Database Security

### SQLite File Permissions

Ensure the database file is only readable by the application:

```bash
chmod 600 /data/xianze.db
chown nodejs:nodejs /data/xianze.db
```

### SQL Injection Prevention

TypeORM protects against SQL injection when used correctly:

```typescript
// ✅ SAFE - Parameterized query
const user = await this.userRepository.findOne({
  where: { email: userInput },
});

// ✅ SAFE - Query builder with parameters
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: userInput })
  .getMany();

// ❌ UNSAFE - String interpolation
const users = await this.userRepository.query(
  `SELECT * FROM users WHERE email = '${userInput}'`, // NEVER DO THIS
);
```

---

## 🔑 Secrets Management

### Environment Variables

**Never commit secrets to version control!**

Required secrets:

- JWT secret key
- Database credentials (if not SQLite)
- API keys for external services

```bash
# .env (NOT committed)
JWT_SECRET=your-256-bit-secret-key-here
API_KEY=external-service-api-key
```

### Docker Secrets

For Docker Swarm or Kubernetes:

```yaml
# docker-compose.yml
services:
  backend:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  jwt_secret:
    external: true
```

---

## 📊 Rate Limiting

Protect against brute force attacks:

```bash
npm install @nestjs/throttler
```

```typescript
// In app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds
        limit: 10, // Max requests per window
      },
    ]),
  ],
})
export class AppModule {}
```

Apply to specific routes:

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @Post('login')
  login() {
    /* ... */
  }
}
```

---

## 📝 Audit Logging

Log security-relevant events:

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async login(username: string, ip: string) {
    // ... authentication logic

    if (success) {
      this.logger.log(`Login successful: ${username} from ${ip}`);
    } else {
      this.logger.warn(`Login failed: ${username} from ${ip}`);
    }
  }
}
```

Events to log:

- Login attempts (success and failure)
- Password changes
- Role changes
- Data exports
- Admin actions

---

## 🧪 Security Testing

### Regular Checks

1. **Dependency vulnerabilities**:

   ```bash
   npm audit
   ```

2. **Static analysis**:

   ```bash
   npx eslint . --ext .ts
   ```

3. **API testing** - Test for:
   - Authentication bypass
   - Authorization issues
   - Input validation
   - Rate limiting

### Checklist

- [ ] No secrets in code
- [ ] All inputs validated
- [ ] CORS configured correctly
- [ ] Security headers enabled
- [ ] Rate limiting enabled
- [ ] Audit logging configured
- [ ] Dependencies up to date
- [ ] Database file permissions correct

---

## 🚨 Incident Response

If a security incident occurs:

1. **Contain** - Isolate affected systems
2. **Assess** - Determine scope and impact
3. **Notify** - Inform relevant stakeholders
4. **Remediate** - Fix the vulnerability
5. **Document** - Record lessons learned

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Node.js Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
