import { createHash, randomBytes } from 'crypto';

/**
 * Hash email for QR code to prevent exposing user data
 * Uses SHA-256 with a salt for security
 */
export function hashEmailForQR(email: string, registrationId: number): string {
  const salt = process.env.QR_HASH_SALT || 'xianze2026-default-salt';
  const data = `${email}:${registrationId}:${salt}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Generate a unique pass ID
 */
export function generatePassId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex');
  return `XZ26-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
}

/**
 * Sanitize input to prevent XSS and injection
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}
