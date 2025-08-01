import { supabase } from '@/lib/supabase'
import { horseService } from './horseService'
import { Horse } from '@/types/horse'

export interface ShareLink {
  id: string
  horse_id: string
  token: string
  recipient_name: string
  expires_at: string
  created_at: string
  created_by: string
}

export interface SharedHorseData {
  id: string
  name: string
  breed: string
  age: number
  color: string
  gender: 'Stallion' | 'Mare' | 'Gelding'
  height: string
  description: string
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
  training: {
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
  images: {
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
}

export const shareService = {
  // Generate a unique token for sharing
  generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },

  // Create a share link for a horse (12 hours from now)
  async createShareLink(horseId: string, userId: string, recipientName: string): Promise<ShareLink> {
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now

    const { data, error } = await supabase
      .from('share_links')
      .insert({
        horse_id: horseId,
        token: token,
        recipient_name: recipientName,
        expires_at: expiresAt,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get a shared horse by token
  async getSharedHorse(token: string): Promise<SharedHorseData | null> {
    // First, check if the share link is valid and not expired
    const { data: shareLink, error: shareError } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (shareError || !shareLink) {
      throw new Error('Share link not found')
    }

    // Check if expired
    if (new Date(shareLink.expires_at) < new Date()) {
      throw new Error('Share link has expired')
    }

    // Get the horse data
    const horse = await horseService.getHorse(shareLink.horse_id)
    if (!horse) {
      throw new Error('Horse not found')
    }

    // Return only the allowed fields for shared view
    return {
      id: horse.id,
      name: horse.name,
      breed: horse.breed,
      age: horse.age,
      color: horse.color,
      gender: horse.gender,
      height: horse.height,
      description: horse.description,
      pedigree: horse.pedigree,
      training: horse.training,
      competitions: horse.competitions,
      images: horse.images,
      videos: horse.videos
    }
  },

  // Get all share links for a user
  async getUserShareLinks(userId: string): Promise<ShareLink[]> {
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
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Delete a share link
  async deleteShareLink(shareLinkId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', shareLinkId)
      .eq('created_by', userId)

    if (error) throw error
  },

  // Get share link status (active/expired)
  getShareLinkStatus(expiresAt: string): 'active' | 'expired' {
    return new Date(expiresAt) > new Date() ? 'active' : 'expired'
  },

  // Format time remaining
  getTimeRemaining(expiresAt: string): string {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }
} 