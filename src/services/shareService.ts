import { supabase } from '@/lib/supabase'
import { horseService } from './horseService'
import { getOrganizationWithContacts } from './organizationService'
import { Horse } from '@/types/horse'
import { Organization, OrganizationContact } from '@/types/organization'
import bcrypt from 'bcryptjs'

export type ShareLinkType = 'standard' | 'one_time' | 'password_protected'

export type ShareableField =
  | 'basic_info'
  | 'description'
  | 'pedigree'
  | 'health'
  | 'training'
  | 'competitions'
  | 'images'
  | 'videos'
  | 'price'
  | 'xrays'

export interface ShareLink {
  id: string
  horse_id: string
  organization_id: string
  token: string
  recipient_name: string
  expires_at: string
  created_at: string
  created_by: string
  link_type: ShareLinkType
  password_hash: string | null
  view_count: number
  max_views: number | null
  shared_fields: ShareableField[]
}

export interface SharedHorseData {
  id: string
  name: string
  breed: string
  age: number
  color: string
  gender: 'Stallion' | 'Mare' | 'Gelding'
  height: string
  description?: string
  price?: number | null
  pedigree?: {
    sire: string
    dam: string
    sireSire?: string
    sireDam?: string
    damSire?: string
    damDam?: string
    sireSireSire?: string
    sireSireDam?: string
    sireDamSire?: string
    sireDamDam?: string
    damSireSire?: string
    damSireDam?: string
    damDamSire?: string
    damDamDam?: string
  }
  health?: {
    vaccinations: boolean
    coggins: boolean
    lastVetCheck: string
  }
  training?: {
    level: string
    disciplines: string[]
  }
  competitions?: {
    id: string
    event: string
    date: string
    discipline: string
    placement: string
    notes?: string
    equipeLink?: string
  }[]
  images?: {
    id: string
    url: string
    caption?: string
    isPrimary: boolean
  }[]
  videos?: {
    id: string
    url: string
    caption?: string
    thumbnail?: string
  }[]
  xrays?: {
    id: string
    file_url: string
    file_type: 'upload' | 'url'
    format: 'dicom' | 'jpeg' | 'png'
    date_taken: string | null
    body_part: string | null
    veterinarian_name: string | null
    notes: string | null
    created_at: string
  }[]
  organization?: {
    name: string
    email?: string
    phone?: string
    website?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    description?: string
    logo_url?: string
  }
  contacts?: {
    id: string
    name: string
    title?: string
    email?: string
    phone?: string
    is_primary: boolean
  }[]
}

export interface CreateShareLinkParams {
  horseId: string
  organizationId: string
  userId: string
  recipientName: string
  linkType: ShareLinkType
  expiresAt: string  // ISO date string
  password?: string  // plain text password, will be hashed
  maxViews?: number  // for one_time links
  sharedFields: ShareableField[]
}

export interface UpdateShareLinkParams {
  shareLinkId: string
  recipientName?: string
  expiresAt?: string  // ISO date string
  sharedFields?: ShareableField[]
}

export const shareService = {
  // Generate a cryptographically secure token for sharing
  generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  },

  // Hash password for password-protected links
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  },

  // Verify password for password-protected links
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  },

  // Create a share link for a horse
  async createShareLink(params: CreateShareLinkParams): Promise<ShareLink> {
    const {
      horseId,
      organizationId,
      userId,
      recipientName,
      linkType,
      expiresAt,
      password,
      maxViews,
      sharedFields
    } = params

    const token = this.generateToken()

    // Hash password if provided
    let passwordHash: string | null = null
    if (linkType === 'password_protected' && password) {
      passwordHash = await this.hashPassword(password)
    }

    // Set max_views for one_time links
    const finalMaxViews = linkType === 'one_time' ? (maxViews || 1) : null

    const { data, error } = await supabase
      .from('share_links')
      .insert({
        horse_id: horseId,
        organization_id: organizationId,
        token: token,
        recipient_name: recipientName,
        expires_at: expiresAt,
        created_by: userId,
        link_type: linkType,
        password_hash: passwordHash,
        view_count: 0,
        max_views: finalMaxViews,
        shared_fields: sharedFields,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update an existing share link
  async updateShareLink(params: UpdateShareLinkParams): Promise<ShareLink> {
    const { shareLinkId, recipientName, expiresAt, sharedFields } = params

    // Build update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {}
    if (recipientName !== undefined) updates.recipient_name = recipientName
    if (expiresAt !== undefined) updates.expires_at = expiresAt
    if (sharedFields !== undefined) updates.shared_fields = sharedFields

    const { data, error } = await supabase
      .from('share_links')
      .update(updates)
      .eq('id', shareLinkId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get a shared horse by token (without password verification)
  async getSharedHorseMetadata(token: string): Promise<ShareLink | null> {
    const { data: shareLink, error: shareError } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (shareError) {
      throw new Error('Share link not found')
    }

    if (!shareLink) {
      throw new Error('Share link not found')
    }

    return shareLink
  },

  // Increment view count for a share link
  async incrementViewCount(shareLinkId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_share_link_view_count', {
      share_link_id_param: shareLinkId
    })

    if (error) {
      console.error('Error incrementing view count:', error)
      throw error
    }
  },

  // Get a shared horse by token (with optional password)
  async getSharedHorse(token: string, password?: string): Promise<SharedHorseData | null> {
    // First, check if the share link is valid
    const shareLink = await this.getSharedHorseMetadata(token)

    if (!shareLink) {
      throw new Error('Share link not found')
    }

    // Check if expired
    if (new Date(shareLink.expires_at) < new Date()) {
      throw new Error('Share link has expired')
    }

    // Check if one-time link has been used up
    if (shareLink.link_type === 'one_time' && shareLink.max_views) {
      if (shareLink.view_count >= shareLink.max_views) {
        throw new Error('Share link has been used and is no longer available')
      }
    }

    // Check password for password-protected links
    if (shareLink.link_type === 'password_protected') {
      if (!password) {
        throw new Error('Password required')
      }
      if (!shareLink.password_hash) {
        throw new Error('Invalid share link configuration')
      }
      const isValid = await this.verifyPassword(password, shareLink.password_hash)
      if (!isValid) {
        throw new Error('Incorrect password')
      }
    }

    // Increment view count (for tracking and one-time links)
    await this.incrementViewCount(shareLink.id)

    // Get the horse data
    const horse = await horseService.getHorse(shareLink.horse_id)
    if (!horse) {
      throw new Error('Horse not found')
    }

    // Filter data based on shared_fields
    const sharedFields = shareLink.shared_fields || []
    const sharedData: SharedHorseData = {
      id: horse.id,
      name: horse.name,
      breed: horse.breed,
      age: horse.age,
      color: horse.color,
      gender: horse.gender,
      height: horse.height,
    }

    // Add optional fields based on shared_fields
    if (sharedFields.includes('description')) {
      sharedData.description = horse.description
    }

    if (sharedFields.includes('price')) {
      sharedData.price = horse.price
    }

    if (sharedFields.includes('pedigree')) {
      sharedData.pedigree = horse.pedigree
    }

    if (sharedFields.includes('health')) {
      sharedData.health = {
        vaccinations: horse.health.vaccinations,
        coggins: horse.health.coggins,
        lastVetCheck: horse.health.lastVetCheck
      }
    }

    if (sharedFields.includes('training')) {
      sharedData.training = horse.training
    }

    if (sharedFields.includes('competitions')) {
      sharedData.competitions = horse.competitions
    }

    if (sharedFields.includes('images')) {
      sharedData.images = horse.images
    }

    if (sharedFields.includes('videos')) {
      sharedData.videos = horse.videos
    }

    if (sharedFields.includes('xrays')) {
      // Fetch X-rays for the horse
      const { data: xrays, error: xraysError } = await supabase
        .from('horse_xrays')
        .select('*')
        .eq('horse_id', horse.id)
        .order('date_taken', { ascending: false })

      if (!xraysError && xrays) {
        // Generate signed URLs for uploaded X-rays (private bucket)
        const xraysWithSignedUrls = await Promise.all(
          xrays.map(async (xray) => {
            if (xray.file_type === 'upload') {
              try {
                // Generate a signed URL valid for 24 hours
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                  .from('horse-xrays')
                  .createSignedUrl(xray.file_url, 86400) // 24 hours

                if (!signedUrlError && signedUrlData) {
                  return {
                    ...xray,
                    file_url: signedUrlData.signedUrl
                  }
                }
              } catch (error) {
                console.error('Error generating signed URL for X-ray:', error)
              }
            }
            // Return original for URL-based X-rays or if signed URL generation failed
            return xray
          })
        )

        sharedData.xrays = xraysWithSignedUrls
      }
    }

    // Always include organization contact information on shared links
    const orgData = await getOrganizationWithContacts(shareLink.organization_id)
    if (orgData) {
      sharedData.organization = {
        name: orgData.organization.name,
        email: orgData.organization.email || undefined,
        phone: orgData.organization.phone || undefined,
        website: orgData.organization.website || undefined,
        address_line1: orgData.organization.address_line1 || undefined,
        address_line2: orgData.organization.address_line2 || undefined,
        city: orgData.organization.city || undefined,
        state: orgData.organization.state || undefined,
        postal_code: orgData.organization.postal_code || undefined,
        country: orgData.organization.country || undefined,
        description: orgData.organization.description || undefined,
        logo_url: orgData.organization.logo_url || undefined,
      }
      sharedData.contacts = orgData.contacts.map(c => ({
        id: c.id,
        name: c.name,
        title: c.title || undefined,
        email: c.email || undefined,
        phone: c.phone || undefined,
        is_primary: c.is_primary
      }))
    }

    return sharedData
  },

  // Get all share links for an organization
  async getOrganizationShareLinks(organizationId: string): Promise<ShareLink[]> {
    const { data, error } = await supabase
      .from('share_links')
      .select(`
        *,
        horses (
          id,
          name,
          breed
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Delete a share link (only admins can delete)
  async deleteShareLink(shareLinkId: string): Promise<void> {
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', shareLinkId)

    if (error) throw error
  },

  // Get share link status (active/expired/used)
  getShareLinkStatus(shareLink: ShareLink): 'active' | 'expired' | 'used' {
    if (new Date(shareLink.expires_at) < new Date()) {
      return 'expired'
    }
    if (shareLink.link_type === 'one_time' && shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
      return 'used'
    }
    return 'active'
  },

  // Format time remaining
  getTimeRemaining(expiresAt: string): string {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
      return `${days}d ${hours}h remaining`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  },

  // Get human-readable link type
  getLinkTypeLabel(linkType: ShareLinkType): string {
    switch (linkType) {
      case 'standard':
        return 'Standard (Time-based)'
      case 'one_time':
        return 'One-Time View'
      case 'password_protected':
        return 'Password Protected'
      default:
        return linkType
    }
  },

  // Log a view with tracking data
  async logView(shareLinkId: string, ipAddress?: string, userAgent?: string, referer?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('share_link_views')
        .insert({
          share_link_id: shareLinkId,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          referer: referer || null,
          // Country, city, region can be populated by a separate IP lookup service if needed
        })

      if (error) {
        console.error('Error logging view:', error)
        // Don't throw - tracking failures shouldn't block the user
      }
    } catch (error) {
      console.error('Error logging view:', error)
    }
  },

  // Log a view with geolocation data
  async logViewWithGeo(
    shareLinkId: string,
    ipAddress?: string,
    userAgent?: string,
    referer?: string,
    country?: string,
    city?: string,
    region?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('share_link_views')
        .insert({
          share_link_id: shareLinkId,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          referer: referer || null,
          country: country || null,
          city: city || null,
          region: region || null,
        })

      if (error) {
        console.error('Error logging view with geo:', error)
        // Don't throw - tracking failures shouldn't block the user
      }
    } catch (error) {
      console.error('Error logging view with geo:', error)
    }
  },

  // Get analytics for a share link
  async getShareLinkAnalytics(shareLinkId: string) {
    const { data: views, error } = await supabase
      .from('share_link_views')
      .select('*')
      .eq('share_link_id', shareLinkId)
      .order('viewed_at', { ascending: false })

    if (error) throw error

    // Calculate statistics
    const totalViews = views?.length || 0
    const uniqueIPs = new Set(views?.filter(v => v.ip_address).map(v => v.ip_address)).size
    const lastViewed = views?.[0]?.viewed_at || null

    // Group by date for timeline
    const viewsByDate: Record<string, number> = {}
    views?.forEach(view => {
      const date = new Date(view.viewed_at).toLocaleDateString()
      viewsByDate[date] = (viewsByDate[date] || 0) + 1
    })

    // Group by country
    const viewsByCountry: Record<string, number> = {}
    views?.forEach(view => {
      if (view.country) {
        viewsByCountry[view.country] = (viewsByCountry[view.country] || 0) + 1
      }
    })

    // Recent views (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentViews = views?.filter(v => new Date(v.viewed_at) > oneDayAgo).length || 0

    // Detect new IP addresses
    const ipFirstSeen: Record<string, string> = {}
    views?.slice().reverse().forEach(view => {
      if (view.ip_address && !ipFirstSeen[view.ip_address]) {
        ipFirstSeen[view.ip_address] = view.viewed_at
      }
    })

    return {
      totalViews,
      uniqueVisitors: uniqueIPs,
      lastViewed,
      recentViews, // last 24h
      viewsByDate,
      viewsByCountry,
      views: views || [],
      ipFirstSeen,
    }
  }
}
