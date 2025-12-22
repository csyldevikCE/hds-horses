import { supabase } from '@/lib/supabase'

export type RateLimitAction = 'login' | 'signup' | 'password_reset' | 'share_link_password'

export interface RateLimitResponse {
  allowed: boolean
  remaining: number
  resetAt: string
  retryAfter?: number // seconds until retry allowed
}

/**
 * Check rate limit for a given action and identifier.
 * Uses the rate-limit Edge Function deployed per BACKEND.md.
 *
 * @param action - The action being rate limited
 * @param identifier - IP address or other unique identifier
 * @param increment - Whether to increment the counter (default: true)
 * @returns Rate limit status
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
  increment: boolean = true
): Promise<RateLimitResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limit', {
      body: { action, identifier, increment }
    })

    if (error) {
      // Fail open - allow the request if rate limiting fails
      console.error('Rate limit check failed:', error)
      return { allowed: true, remaining: 5, resetAt: new Date().toISOString() }
    }

    return data
  } catch (err) {
    // Fail open on network errors
    console.error('Rate limit service error:', err)
    return { allowed: true, remaining: 5, resetAt: new Date().toISOString() }
  }
}

/**
 * Get the client's IP address for rate limiting.
 * Uses a public API as fallback when IP is not available from headers.
 *
 * Note: This is a best-effort approach. For server-side rate limiting,
 * the Edge Function extracts IP from request headers.
 */
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    const data = await response.json()
    return data.ip
  } catch {
    // Return a fallback identifier if IP lookup fails
    return 'unknown-client'
  }
}

/**
 * Format the retry time for user-friendly display.
 *
 * @param retryAfter - Seconds until retry is allowed
 * @returns Human-readable string like "5 minutes" or "1 hour"
 */
export function formatRetryTime(retryAfter: number): string {
  if (retryAfter < 60) {
    return `${retryAfter} seconds`
  }

  const minutes = Math.ceil(retryAfter / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours !== 1 ? 's' : ''}`
}
