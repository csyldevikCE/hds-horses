/**
 * Create Share Link Edge Function
 *
 * Handles server-side password hashing for password-protected share links.
 * This is more secure than client-side hashing because:
 * 1. The password is never visible in browser devtools
 * 2. Server-side hashing is faster and uses more secure random number generation
 * 3. Hash is never transmitted to the client
 *
 * FRONTEND INTEGRATION:
 * See BACKEND.md at project root for integration instructions.
 * Replace client-side bcrypt hashing in shareService.ts with this function.
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

interface CreateShareLinkRequest {
  horseId: string
  organizationId: string
  recipientName: string
  linkType: 'standard' | 'one_time' | 'password_protected'
  expiresAt: string  // ISO date string
  password?: string  // Plain text password (only for password_protected type)
  maxViews?: number  // For one_time links
  sharedFields: string[]
}

interface ShareLink {
  id: string
  horse_id: string
  organization_id: string
  token: string
  recipient_name: string
  expires_at: string
  created_at: string
  created_by: string
  link_type: string
  view_count: number
  max_views: number | null
  shared_fields: string[]
}

// Generate a cryptographically secure token
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create client with user's auth token for RLS
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateShareLinkRequest = await req.json()
    const {
      horseId,
      organizationId,
      recipientName,
      linkType,
      expiresAt,
      password,
      maxViews,
      sharedFields
    } = body

    // Validate required fields
    if (!horseId || !organizationId || !recipientName || !linkType || !expiresAt || !sharedFields) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password for password-protected links
    if (linkType === 'password_protected' && !password) {
      return new Response(
        JSON.stringify({ error: 'Password required for password-protected links' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to the organization
    const { data: orgUser, error: orgError } = await supabaseUser
      .from('organization_users')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgUser) {
      return new Response(
        JSON.stringify({ error: 'User is not a member of this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify horse belongs to the organization
    const { data: horse, error: horseError } = await supabaseUser
      .from('horses')
      .select('id')
      .eq('id', horseId)
      .eq('organization_id', organizationId)
      .single()

    if (horseError || !horse) {
      return new Response(
        JSON.stringify({ error: 'Horse not found or does not belong to this organization' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate token
    const token = generateToken()

    // Hash password if provided (server-side for security)
    let passwordHash: string | null = null
    if (linkType === 'password_protected' && password) {
      const salt = await bcrypt.genSalt(10)
      passwordHash = await bcrypt.hash(password, salt)
    }

    // Set max_views for one_time links
    const finalMaxViews = linkType === 'one_time' ? (maxViews || 1) : null

    // Use service role to insert (bypasses RLS for this operation)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: shareLink, error: insertError } = await supabaseAdmin
      .from('share_links')
      .insert({
        horse_id: horseId,
        organization_id: organizationId,
        token: token,
        recipient_name: recipientName,
        expires_at: expiresAt,
        created_by: user.id,
        link_type: linkType,
        password_hash: passwordHash,
        view_count: 0,
        max_views: finalMaxViews,
        shared_fields: sharedFields,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating share link:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return the share link WITHOUT the password_hash
    const response: ShareLink = {
      id: shareLink.id,
      horse_id: shareLink.horse_id,
      organization_id: shareLink.organization_id,
      token: shareLink.token,
      recipient_name: shareLink.recipient_name,
      expires_at: shareLink.expires_at,
      created_at: shareLink.created_at,
      created_by: shareLink.created_by,
      link_type: shareLink.link_type,
      view_count: shareLink.view_count,
      max_views: shareLink.max_views,
      shared_fields: shareLink.shared_fields,
    }

    return new Response(
      JSON.stringify(response),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
