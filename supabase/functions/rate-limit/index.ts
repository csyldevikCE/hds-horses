/**
 * Rate Limiting Edge Function
 *
 * Provides rate limiting for sensitive operations:
 * - Login attempts: 5 failures per IP per 15 minutes
 * - Signup: 3 accounts per IP per hour
 * - Password reset: 3 requests per email per hour
 * - Share link password verification: 5 attempts per link per hour
 *
 * Uses Supabase as the rate limit store (no external dependencies).
 *
 * FRONTEND INTEGRATION:
 * See BACKEND.md at project root for integration instructions.
 * Create rateLimitService.ts following the API documented there.
 *
 * @see SEC-005 in TODO.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limit configurations
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15,
    blockDurationMinutes: 15,
  },
  signup: {
    maxAttempts: 3,
    windowMinutes: 60,
    blockDurationMinutes: 60,
  },
  password_reset: {
    maxAttempts: 3,
    windowMinutes: 60,
    blockDurationMinutes: 60,
  },
  share_link_password: {
    maxAttempts: 5,
    windowMinutes: 60,
    blockDurationMinutes: 60,
  },
}

type RateLimitAction = keyof typeof RATE_LIMITS

interface RateLimitRequest {
  action: RateLimitAction
  identifier: string  // IP address, email, or share link ID
  increment?: boolean // Whether to increment the counter (default: true)
}

interface RateLimitResponse {
  allowed: boolean
  remaining: number
  resetAt: string      // ISO timestamp when the limit resets
  retryAfter?: number  // Seconds until retry is allowed (if blocked)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, identifier, increment = true }: RateLimitRequest = await req.json()

    // Validate inputs
    if (!action || !identifier) {
      return new Response(
        JSON.stringify({ error: 'action and identifier are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!RATE_LIMITS[action]) {
      return new Response(
        JSON.stringify({ error: `Invalid action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const config = RATE_LIMITS[action]
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate time window
    const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000)
    const now = new Date()

    // Get current rate limit entry
    const { data: entries, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('action', action)
      .eq('identifier', identifier)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching rate limit:', fetchError)
      // On error, allow the request (fail open for availability)
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: config.maxAttempts,
          resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000).toISOString(),
        } as RateLimitResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentEntry = entries?.[0]
    let attempts = currentEntry?.attempts || 0
    let windowStartTime = currentEntry?.window_start ? new Date(currentEntry.window_start) : now

    // Check if currently blocked
    if (currentEntry?.blocked_until) {
      const blockedUntil = new Date(currentEntry.blocked_until)
      if (blockedUntil > now) {
        const retryAfter = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000)
        return new Response(
          JSON.stringify({
            allowed: false,
            remaining: 0,
            resetAt: blockedUntil.toISOString(),
            retryAfter,
          } as RateLimitResponse),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': retryAfter.toString(),
            }
          }
        )
      }
      // Block has expired, reset the entry
      attempts = 0
      windowStartTime = now
    }

    // Increment counter if requested
    if (increment) {
      attempts += 1

      // Check if we should block
      const shouldBlock = attempts >= config.maxAttempts
      const blockedUntil = shouldBlock
        ? new Date(Date.now() + config.blockDurationMinutes * 60 * 1000)
        : null

      // Upsert the rate limit entry
      const { error: upsertError } = await supabase
        .from('rate_limits')
        .upsert({
          id: currentEntry?.id || crypto.randomUUID(),
          action,
          identifier,
          attempts,
          window_start: windowStartTime.toISOString(),
          blocked_until: blockedUntil?.toISOString() || null,
          updated_at: now.toISOString(),
        }, {
          onConflict: 'id',
        })

      if (upsertError) {
        console.error('Error upserting rate limit:', upsertError)
      }

      if (shouldBlock) {
        const retryAfter = config.blockDurationMinutes * 60
        return new Response(
          JSON.stringify({
            allowed: false,
            remaining: 0,
            resetAt: blockedUntil!.toISOString(),
            retryAfter,
          } as RateLimitResponse),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': retryAfter.toString(),
            }
          }
        )
      }
    }

    // Calculate reset time
    const resetAt = new Date(windowStartTime.getTime() + config.windowMinutes * 60 * 1000)

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: Math.max(0, config.maxAttempts - attempts),
        resetAt: resetAt.toISOString(),
      } as RateLimitResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open for availability
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: 5,
        resetAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      } as RateLimitResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
