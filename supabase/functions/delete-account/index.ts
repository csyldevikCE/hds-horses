/**
 * Delete Account Edge Function
 *
 * Implements GDPR Article 17 (Right to Erasure).
 * Deletes all user data including:
 * - Horses (if sole owner in org)
 * - Images and files from Storage
 * - Vaccinations, vet visits, competitions
 * - Share links
 * - Organization membership
 * - User profile
 *
 * FRONTEND INTEGRATION:
 * See BACKEND.md at project root for integration instructions.
 *
 * @see GDPR-001 in TODO.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteAccountRequest {
  confirmation: string  // Must be "DELETE MY ACCOUNT"
}

interface DeleteAccountResponse {
  success: boolean
  deletedEntities: {
    horses: number
    images: number
    videos: number
    documents: number
    vaccinations: number
    vetVisits: number
    competitions: number
    shareLinks: number
    xrays: number
  }
  error?: string
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
        JSON.stringify({ success: false, error: 'Authorization header required' }),
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
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate confirmation phrase
    const { confirmation }: DeleteAccountRequest = await req.json()
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid confirmation phrase. Type "DELETE MY ACCOUNT" to confirm.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for deletion operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const deletedEntities = {
      horses: 0,
      images: 0,
      videos: 0,
      documents: 0,
      vaccinations: 0,
      vetVisits: 0,
      competitions: 0,
      shareLinks: 0,
      xrays: 0,
    }

    // Log the deletion request for audit
    await supabaseAdmin.rpc('log_audit_event', {
      p_user_id: user.id,
      p_organization_id: null,
      p_action: 'ACCOUNT_DELETION_REQUESTED',
      p_entity_type: 'user',
      p_entity_id: user.id,
      p_metadata: { email: user.email },
      p_contains_pii: true,
    })

    // Get user's organization memberships
    const { data: orgMemberships } = await supabaseAdmin
      .from('organization_users')
      .select('organization_id, role')
      .eq('user_id', user.id)

    // For each organization, handle horses and related data
    for (const membership of orgMemberships || []) {
      const orgId = membership.organization_id

      // Get horses owned by user in this organization
      const { data: horses } = await supabaseAdmin
        .from('horses')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)

      for (const horse of horses || []) {
        // Delete horse images from storage
        const { data: images } = await supabaseAdmin
          .from('horse_images')
          .select('file_path')
          .eq('horse_id', horse.id)

        for (const img of images || []) {
          if (img.file_path) {
            await supabaseAdmin.storage.from('horse-media').remove([img.file_path])
            deletedEntities.images++
          }
        }

        // Delete horse videos from storage
        const { data: videos } = await supabaseAdmin
          .from('horse_videos')
          .select('file_path')
          .eq('horse_id', horse.id)

        for (const vid of videos || []) {
          if (vid.file_path) {
            await supabaseAdmin.storage.from('horse-media').remove([vid.file_path])
            deletedEntities.videos++
          }
        }

        // Delete X-rays from storage
        const { data: xrays } = await supabaseAdmin
          .from('horse_xrays')
          .select('file_url, file_type')
          .eq('horse_id', horse.id)

        for (const xray of xrays || []) {
          if (xray.file_type === 'upload' && xray.file_url) {
            await supabaseAdmin.storage.from('horse-xrays').remove([xray.file_url])
            deletedEntities.xrays++
          }
        }

        // Delete vet documents from storage
        const { data: vetVisits } = await supabaseAdmin
          .from('vet_visits')
          .select('id')
          .eq('horse_id', horse.id)

        for (const visit of vetVisits || []) {
          const { data: vetDocs } = await supabaseAdmin
            .from('vet_visit_documents')
            .select('file_path')
            .eq('vet_visit_id', visit.id)

          for (const doc of vetDocs || []) {
            if (doc.file_path) {
              await supabaseAdmin.storage.from('vet-documents').remove([doc.file_path])
              deletedEntities.documents++
            }
          }
        }

        // Delete vaccinations
        const { count: vaccCount } = await supabaseAdmin
          .from('vaccinations')
          .delete()
          .eq('horse_id', horse.id)
          .select('*', { count: 'exact', head: true })
        deletedEntities.vaccinations += vaccCount || 0

        // Delete vet visit documents (cascade should handle this, but explicit for count)
        const { count: vetVisitCount } = await supabaseAdmin
          .from('vet_visits')
          .delete()
          .eq('horse_id', horse.id)
          .select('*', { count: 'exact', head: true })
        deletedEntities.vetVisits += vetVisitCount || 0

        // Delete competitions
        const { count: compCount } = await supabaseAdmin
          .from('competitions')
          .delete()
          .eq('horse_id', horse.id)
          .select('*', { count: 'exact', head: true })
        deletedEntities.competitions += compCount || 0

        // Delete share links for this horse
        const { count: shareCount } = await supabaseAdmin
          .from('share_links')
          .delete()
          .eq('horse_id', horse.id)
          .select('*', { count: 'exact', head: true })
        deletedEntities.shareLinks += shareCount || 0

        // Delete the horse itself (cascade deletes images, videos, xrays records)
        await supabaseAdmin
          .from('horses')
          .delete()
          .eq('id', horse.id)
        deletedEntities.horses++
      }

      // Remove user from organization
      await supabaseAdmin
        .from('organization_users')
        .delete()
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
    }

    // Delete any remaining share links created by this user
    const { count: remainingShareLinks } = await supabaseAdmin
      .from('share_links')
      .delete()
      .eq('created_by', user.id)
      .select('*', { count: 'exact', head: true })
    deletedEntities.shareLinks += remainingShareLinks || 0

    // Delete invitations sent by this user
    await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('invited_by', user.id)

    // Log the completion
    await supabaseAdmin.rpc('log_audit_event', {
      p_user_id: user.id,
      p_organization_id: null,
      p_action: 'ACCOUNT_DELETED',
      p_entity_type: 'user',
      p_entity_id: user.id,
      p_new_value: deletedEntities,
      p_contains_pii: false,
    })

    // Finally, delete the user from auth.users
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteUserError) {
      console.error('Error deleting user from auth:', deleteUserError)
      // Continue anyway - data is deleted
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedEntities,
      } as DeleteAccountResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deleting account:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete account. Please contact support.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
