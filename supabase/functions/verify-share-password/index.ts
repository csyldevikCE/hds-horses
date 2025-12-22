/**
 * Verify Share Link Password Edge Function
 *
 * Server-side password verification for password-protected share links.
 * Includes rate limiting integration.
 *
 * FRONTEND INTEGRATION:
 * See BACKEND.md at project root for integration instructions.
 *
 * @see SEC-008 in TODO.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyPasswordRequest {
  token: string
  password: string
}

interface VerifyPasswordResponse {
  valid: boolean
  error?: string
  rateLimited?: boolean
  retryAfter?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, password }: VerifyPasswordRequest = await req.json()

    // Validate inputs
    if (!token || !password) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check rate limit first
    const rateLimitResult = await checkRateLimit(supabase, token)
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Too many password attempts. Please try again later.',
          rateLimited: true,
          retryAfter: rateLimitResult.retryAfter,
        } as VerifyPasswordResponse),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': (rateLimitResult.retryAfter || 3600).toString(),
          }
        }
      )
    }

    // Get the share link
    const { data: shareLink, error: fetchError } = await supabase
      .from('share_links')
      .select('id, password_hash, link_type, expires_at, view_count, max_views')
      .eq('token', token)
      .single()

    if (fetchError || !shareLink) {
      // Increment rate limit even for invalid tokens to prevent enumeration
      await incrementRateLimit(supabase, token)
      return new Response(
        JSON.stringify({ valid: false, error: 'Share link not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if link is expired
    if (new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Share link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if one-time link is exhausted
    if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Share link has been used' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if this is a password-protected link
    if (shareLink.link_type !== 'password_protected' || !shareLink.password_hash) {
      return new Response(
        JSON.stringify({ valid: false, error: 'This link does not require a password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the password
    const isValid = await bcrypt.compare(password, shareLink.password_hash)

    if (!isValid) {
      // Increment rate limit on failed attempt
      await incrementRateLimit(supabase, token)
      return new Response(
        JSON.stringify({ valid: false, error: 'Incorrect password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Password is correct - clear rate limit for this token
    await clearRateLimit(supabase, token)

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error verifying password:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Rate limiting helpers
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMinutes: 60,
  blockDurationMinutes: 60,
}

interface RateLimitCheck {
  allowed: boolean
  retryAfter?: number
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, identifier: string): Promise<RateLimitCheck> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000)

  const { data: entries } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('action', 'share_link_password')
    .eq('identifier', identifier)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)

  const entry = entries?.[0]

  if (entry?.blocked_until) {
    const blockedUntil = new Date(entry.blocked_until)
    if (blockedUntil > new Date()) {
      const retryAfter = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000)
      return { allowed: false, retryAfter }
    }
  }

  const attempts = entry?.attempts || 0
  return { allowed: attempts < RATE_LIMIT_CONFIG.maxAttempts }
}

async function incrementRateLimit(supabase: ReturnType<typeof createClient>, identifier: string): Promise<void> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000)
  const now = new Date()

  const { data: entries } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('action', 'share_link_password')
    .eq('identifier', identifier)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)

  const entry = entries?.[0]
  const attempts = (entry?.attempts || 0) + 1
  const shouldBlock = attempts >= RATE_LIMIT_CONFIG.maxAttempts
  const blockedUntil = shouldBlock
    ? new Date(Date.now() + RATE_LIMIT_CONFIG.blockDurationMinutes * 60 * 1000)
    : null

  await supabase
    .from('rate_limits')
    .upsert({
      id: entry?.id || crypto.randomUUID(),
      action: 'share_link_password',
      identifier,
      attempts,
      window_start: entry?.window_start || now.toISOString(),
      blocked_until: blockedUntil?.toISOString() || null,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'id',
    })
}

async function clearRateLimit(supabase: ReturnType<typeof createClient>, identifier: string): Promise<void> {
  await supabase
    .from('rate_limits')
    .delete()
    .eq('action', 'share_link_password')
    .eq('identifier', identifier)
}
