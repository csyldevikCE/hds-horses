// Supabase Edge Function for GDPR-compliant share link view logging
// Runs in EU (Frankfurt) - no data sent to US third parties

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { shareLinkId, userAgent, referer } = await req.json()

    if (!shareLinkId) {
      return new Response(
        JSON.stringify({ error: 'shareLinkId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get geolocation from Cloudflare headers (available in Supabase Edge Functions)
    // This data is derived server-side - no external API call needed
    const country = req.headers.get('cf-ipcountry') || undefined
    const city = req.headers.get('cf-ipcity') || undefined
    const region = req.headers.get('cf-region') || undefined

    // Get IP from connecting client (for analytics, anonymized)
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined

    // Anonymize IP for GDPR compliance (remove last octet for IPv4)
    const anonymizedIp = ip ? anonymizeIp(ip) : undefined

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log the view with server-derived geolocation
    const { error } = await supabase
      .from('share_link_views')
      .insert({
        share_link_id: shareLinkId,
        ip_address: anonymizedIp, // Anonymized for GDPR
        user_agent: userAgent,
        referer: referer,
        country: country,
        city: city,
        region: region,
        viewed_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error logging view:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to log view' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Anonymize IP address for GDPR compliance
// IPv4: Remove last octet (192.168.1.100 -> 192.168.1.0)
// IPv6: Remove last 80 bits
function anonymizeIp(ip: string): string {
  if (ip.includes('.')) {
    // IPv4
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
  } else if (ip.includes(':')) {
    // IPv6 - keep first 3 segments
    const parts = ip.split(':')
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}::0`
    }
  }
  return 'anonymous'
}
