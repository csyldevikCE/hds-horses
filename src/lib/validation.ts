import { z } from 'zod'

/**
 * Password validation schema per SEC-004.
 * Requires: 12+ chars, uppercase, lowercase, number, special character.
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character')

/**
 * Password requirements for UI display.
 */
export const passwordRequirements = [
  { regex: /.{12,}/, label: 'At least 12 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[a-z]/, label: 'One lowercase letter' },
  { regex: /[0-9]/, label: 'One number' },
  { regex: /[^A-Za-z0-9]/, label: 'One special character (!@#$%^&*...)' },
]

/**
 * Check which password requirements are met.
 * Returns an array of { label, met } objects.
 */
export function checkPasswordRequirements(password: string) {
  return passwordRequirements.map((req) => ({
    label: req.label,
    met: req.regex.test(password),
  }))
}

/**
 * Calculate password strength as a percentage (0-100).
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0

  const requirements = checkPasswordRequirements(password)
  const metCount = requirements.filter((r) => r.met).length
  return Math.round((metCount / requirements.length) * 100)
}

/**
 * Validate password and return error messages.
 * Returns null if valid, or an array of error messages.
 */
export function validatePassword(password: string): string[] | null {
  const result = passwordSchema.safeParse(password)

  if (result.success) {
    return null
  }

  return result.error.errors.map((e) => e.message)
}

/**
 * Email validation schema.
 */
export const emailSchema = z.string().email('Please enter a valid email address')

/**
 * Name validation schema (for first/last name).
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .trim()

/**
 * Organization name validation schema.
 */
export const organizationNameSchema = z
  .string()
  .min(1, 'Organization name is required')
  .max(200, 'Organization name is too long')
  .trim()
