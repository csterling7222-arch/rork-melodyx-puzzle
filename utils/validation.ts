/**
 * Input validation and sanitization utilities
 * Provides type-safe validation for user inputs throughout the app
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates and sanitizes a username
 * Rules: 3-20 characters, alphanumeric with underscores
 */
export function validateUsername(input: string): ValidationResult {
  const sanitized = input.trim();
  
  if (!sanitized) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (sanitized.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }
  
  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates an email address
 */
export function validateEmail(input: string): ValidationResult {
  const sanitized = input.trim().toLowerCase();
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates a password
 * Rules: Minimum 8 characters, at least one letter and one number
 */
export function validatePassword(input: string): ValidationResult {
  if (!input) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (input.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (input.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }
  
  if (!/[a-zA-Z]/.test(input)) {
    return { isValid: false, error: 'Password must contain at least one letter' };
  }
  
  if (!/[0-9]/.test(input)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
}

/**
 * Sanitizes text input to prevent XSS and other attacks
 */
export function sanitizeText(input: string, options?: { maxLength?: number; allowNewlines?: boolean }): string {
  const { maxLength = 1000, allowNewlines = false } = options ?? {};
  
  let sanitized = input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
  
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validates a melody name for user-created content
 */
export function validateMelodyName(input: string): ValidationResult {
  const sanitized = sanitizeText(input, { maxLength: 50 });
  
  if (!sanitized) {
    return { isValid: false, error: 'Melody name is required' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Melody name must be at least 2 characters' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Melody name must be 50 characters or less' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates a search query
 */
export function validateSearchQuery(input: string): ValidationResult {
  const sanitized = sanitizeText(input, { maxLength: 100 });
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Search query is too long' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates a numeric input within a range
 */
export function validateNumber(
  input: number | string,
  options: { min?: number; max?: number; integer?: boolean }
): ValidationResult {
  const { min = -Infinity, max = Infinity, integer = false } = options;
  
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }
  
  if (integer && !Number.isInteger(num)) {
    return { isValid: false, error: 'Please enter a whole number' };
  }
  
  if (num < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }
  
  if (num > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }
  
  return { isValid: true, sanitized: String(num) };
}

/**
 * Validates a URL
 */
export function validateUrl(input: string): ValidationResult {
  const sanitized = input.trim();
  
  if (!sanitized) {
    return { isValid: false, error: 'URL is required' };
  }
  
  try {
    const url = new URL(sanitized);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { isValid: false, error: 'URL must start with http:// or https://' };
    }
    return { isValid: true, sanitized: url.toString() };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

/**
 * Validates note input for melody creation
 */
export function validateNote(note: string): ValidationResult {
  const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const notePattern = /^([A-G])([#b])?([0-8])?$/i;
  
  const match = note.toUpperCase().match(notePattern);
  if (!match) {
    return { isValid: false, error: 'Invalid note format' };
  }
  
  const [, noteLetter, accidental] = match;
  let normalizedNote = noteLetter;
  
  if (accidental === 'B' || accidental === 'b') {
    const noteIndex = validNotes.indexOf(noteLetter);
    if (noteIndex === 0) {
      normalizedNote = 'B';
    } else {
      normalizedNote = validNotes[noteIndex - 1];
      if (!normalizedNote.includes('#')) {
        normalizedNote = validNotes[noteIndex - 1];
      }
    }
  } else if (accidental === '#') {
    normalizedNote = `${noteLetter}#`;
  }
  
  if (!validNotes.includes(normalizedNote) && !validNotes.includes(normalizedNote.replace('#', ''))) {
    return { isValid: false, error: 'Invalid note' };
  }
  
  return { isValid: true, sanitized: normalizedNote };
}

/**
 * Batch validate multiple fields
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  validators: { [K in keyof T]?: (value: T[K]) => ValidationResult }
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;
  
  for (const [key, validator] of Object.entries(validators)) {
    if (validator) {
      const result = validator(data[key as keyof T]);
      if (!result.isValid && result.error) {
        errors[key as keyof T] = result.error;
        isValid = false;
      }
    }
  }
  
  return { isValid, errors };
}

/**
 * Rate limiting helper for form submissions
 */
const rateLimitMap = new Map<string, number>();

export function checkRateLimit(key: string, cooldownMs: number = 1000): boolean {
  const now = Date.now();
  const lastAttempt = rateLimitMap.get(key) ?? 0;
  
  if (now - lastAttempt < cooldownMs) {
    return false;
  }
  
  rateLimitMap.set(key, now);
  return true;
}

/**
 * Clears rate limit for a specific key
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
