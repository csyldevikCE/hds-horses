/**
 * Data Export Edge Function
 *
 * Implements GDPR Article 20 (Right to Data Portability).
 * Exports all user data in JSON format.
 *
 * FRONTEND INTEGRATION:
 * See BACKEND.md at project root for integration instructions.
 *
 * @see GDPR-003 in TODO.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportData {
  exportDate: string
  exportVersion: string
  user: {
    id: string
    email: string
    created_at: string
  }
  organizations: Array<{
    id: string
    name: string
    role: string
    joined_at: string
  }>
  horses: Array<{
    id: string
    name: string
    breed: string
    birth_year: number
    color: string
    gender: string
    height: string
    description?: string
    registration_number?: string
    pedigree?: Record<string, unknown>
    created_at: string
    updated_at: string
    images: Array<{
      id: string
      url: string
      caption?: string
      is_primary: boolean
    }>
    videos: Array<{
      id: string
      url: string
      caption?: string
    }>
    vaccinations: Array<{
      id: string
      vaccine_name: string
      date_administered: string
      next_due_date?: string
      veterinarian?: string
      notes?: string
    }>
    vet_visits: Array<{
      id: string
      visit_date: string
      reason: string
      veterinarian?: string
      diagnosis?: string
      treatment?: string
      notes?: string
      follow_up_date?: string
    }>
    competitions: Array<{
      id: string
      event: string
      date: string
      discipline: string
      placement?: string
      notes?: string
    }>
    xrays: Array<{
      id: string
      url: string
      date_taken?: string
      body_part?: string
      veterinarian_name?: string
      notes?: string
    }>
  }>
  shareLinks: Array<{
    id: string
    horse_name: string
    recipient_name: string
    link_type: string
    created_at: string
    expires_at: string
    view_count: number
  }>
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

    // Create client with user's auth token
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

    // Use service role for data access (to ensure complete export)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize export data
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
      },
      organizations: [],
      horses: [],
      shareLinks: [],
    }

    // Get user's organization memberships
    const { data: orgMemberships } = await supabaseAdmin
      .from('organization_users')
      .select(`
        organization_id,
        role,
        created_at,
        organizations (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    for (const membership of orgMemberships || []) {
      const org = membership.organizations as { id: string; name: string }
      exportData.organizations.push({
        id: org.id,
        name: org.name,
        role: membership.role,
        joined_at: membership.created_at,
      })

      // Get horses for this organization that the user owns
      const { data: horses } = await supabaseAdmin
        .from('horses')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .eq('user_id', user.id)

      for (const horse of horses || []) {
        // Get horse images
        const { data: images } = await supabaseAdmin
          .from('horse_images')
          .select('*')
          .eq('horse_id', horse.id)

        // Generate signed URLs for images
        const imagesWithUrls = await Promise.all(
          (images || []).map(async (img) => {
            let url = img.url
            if (img.file_path) {
              const { data } = await supabaseAdmin.storage
                .from('horse-media')
                .createSignedUrl(img.file_path, 86400) // 24 hours
              if (data) url = data.signedUrl
            }
            return {
              id: img.id,
              url,
              caption: img.caption,
              is_primary: img.is_primary,
            }
          })
        )

        // Get horse videos
        const { data: videos } = await supabaseAdmin
          .from('horse_videos')
          .select('*')
          .eq('horse_id', horse.id)

        const videosWithUrls = await Promise.all(
          (videos || []).map(async (vid) => {
            let url = vid.url
            if (vid.file_path) {
              const { data } = await supabaseAdmin.storage
                .from('horse-media')
                .createSignedUrl(vid.file_path, 86400)
              if (data) url = data.signedUrl
            }
            return {
              id: vid.id,
              url,
              caption: vid.caption,
            }
          })
        )

        // Get vaccinations
        const { data: vaccinations } = await supabaseAdmin
          .from('vaccinations')
          .select('*')
          .eq('horse_id', horse.id)
          .order('date_administered', { ascending: false })

        // Get vet visits
        const { data: vetVisits } = await supabaseAdmin
          .from('vet_visits')
          .select('*')
          .eq('horse_id', horse.id)
          .order('visit_date', { ascending: false })

        // Get competitions
        const { data: competitions } = await supabaseAdmin
          .from('competitions')
          .select('*')
          .eq('horse_id', horse.id)
          .order('date', { ascending: false })

        // Get X-rays
        const { data: xrays } = await supabaseAdmin
          .from('horse_xrays')
          .select('*')
          .eq('horse_id', horse.id)
          .order('date_taken', { ascending: false })

        const xraysWithUrls = await Promise.all(
          (xrays || []).map(async (xray) => {
            let url = xray.file_url
            if (xray.file_type === 'upload' && xray.file_url) {
              const { data } = await supabaseAdmin.storage
                .from('horse-xrays')
                .createSignedUrl(xray.file_url, 86400)
              if (data) url = data.signedUrl
            }
            return {
              id: xray.id,
              url,
              date_taken: xray.date_taken,
              body_part: xray.body_part,
              veterinarian_name: xray.veterinarian_name,
              notes: xray.notes,
            }
          })
        )

        exportData.horses.push({
          id: horse.id,
          name: horse.name,
          breed: horse.breed,
          birth_year: horse.birth_year,
          color: horse.color,
          gender: horse.gender,
          height: horse.height,
          description: horse.description,
          registration_number: horse.registration_number,
          pedigree: horse.pedigree,
          created_at: horse.created_at,
          updated_at: horse.updated_at,
          images: imagesWithUrls,
          videos: videosWithUrls,
          vaccinations: (vaccinations || []).map(v => ({
            id: v.id,
            vaccine_name: v.vaccine_name,
            date_administered: v.date_administered,
            next_due_date: v.next_due_date,
            veterinarian: v.veterinarian,
            notes: v.notes,
          })),
          vet_visits: (vetVisits || []).map(v => ({
            id: v.id,
            visit_date: v.visit_date,
            reason: v.reason,
            veterinarian: v.veterinarian,
            diagnosis: v.diagnosis,
            treatment: v.treatment,
            notes: v.notes,
            follow_up_date: v.follow_up_date,
          })),
          competitions: (competitions || []).map(c => ({
            id: c.id,
            event: c.event,
            date: c.date,
            discipline: c.discipline,
            placement: c.placement,
            notes: c.notes,
          })),
          xrays: xraysWithUrls,
        })
      }
    }

    // Get share links created by user
    const { data: shareLinks } = await supabaseAdmin
      .from('share_links')
      .select(`
        id,
        recipient_name,
        link_type,
        created_at,
        expires_at,
        view_count,
        horses (
          name
        )
      `)
      .eq('created_by', user.id)

    for (const link of shareLinks || []) {
      const horse = link.horses as { name: string }
      exportData.shareLinks.push({
        id: link.id,
        horse_name: horse?.name || 'Unknown',
        recipient_name: link.recipient_name,
        link_type: link.link_type,
        created_at: link.created_at,
        expires_at: link.expires_at,
        view_count: link.view_count,
      })
    }

    // Log the export for audit
    await supabaseAdmin.rpc('log_audit_event', {
      p_user_id: user.id,
      p_organization_id: null,
      p_action: 'DATA_EXPORT',
      p_entity_type: 'user',
      p_entity_id: user.id,
      p_metadata: {
        horses_count: exportData.horses.length,
        organizations_count: exportData.organizations.length,
      },
      p_contains_pii: false,
    })

    return new Response(
      JSON.stringify(exportData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="hds-horses-export-${new Date().toISOString().split('T')[0]}.json"`,
        }
      }
    )

  } catch (error) {
    console.error('Error exporting data:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to export data. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
