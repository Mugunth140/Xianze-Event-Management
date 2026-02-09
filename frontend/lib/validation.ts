'use client';

/**
 * Validation Utility Library
 *
 * Provides reusable validation functions for form inputs with XSS prevention.
 */

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Sanitize input to prevent XSS attacks
 * Strips HTML tags and dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate Indian phone number (10 digits, optionally with +91)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Contact number is required' };
  }

  // Remove spaces, dashes, and country code
  const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^91/, '');

  if (!/^\d{10}$/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid Indian mobile number' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true, error: null };
}

/**
 * Validate name (letters, spaces, common characters)
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Name is required' };
  }

  const sanitized = name.trim();

  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: 'Name is too long' };
  }

  // Allow letters, spaces, dots, hyphens, and apostrophes
  if (!/^[a-zA-Z\s.\-']+$/.test(sanitized)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate message (for contact form)
 */
export function validateMessage(message: string, maxLength = 2000): ValidationResult {
  if (!message || message.trim() === '') {
    return { isValid: false, error: 'Message is required' };
  }

  if (message.trim().length < 10) {
    return { isValid: false, error: 'Message must be at least 10 characters' };
  }

  if (message.length > maxLength) {
    return { isValid: false, error: `Message must be less than ${maxLength} characters` };
  }

  return { isValid: true, error: null };
}

/**
 * Validate college name
 */
export function validateCollege(college: string): ValidationResult {
  if (!college || college.trim() === '') {
    return { isValid: false, error: 'College name is required' };
  }

  if (college.trim().length < 3) {
    return { isValid: false, error: 'College name must be at least 3 characters' };
  }

  if (college.length > 200) {
    return { isValid: false, error: 'College name is too long' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate dropdown selection
 */
export function validateSelection(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `Please select a ${fieldName}` };
  }
  return { isValid: true, error: null };
}
