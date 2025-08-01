import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your Horse interface
export interface Database {
  public: {
    Tables: {
      horses: {
        Row: {
          id: string
          name: string
          breed: string
          age: number
          color: string
          gender: 'Stallion' | 'Mare' | 'Gelding'
          height: string
          weight: number | null
          price: number | null
          status: 'Available' | 'Sold' | 'Reserved' | 'Not for Sale'
          description: string
          pedigree_sire: string | null
          pedigree_dam: string | null
          pedigree_sire_sire: string | null
          pedigree_sire_dam: string | null
          pedigree_dam_sire: string | null
          pedigree_dam_dam: string | null
          pedigree_sire_sire_sire: string | null
          pedigree_sire_sire_dam: string | null
          pedigree_sire_dam_sire: string | null
          pedigree_sire_dam_dam: string | null
          pedigree_dam_sire_sire: string | null
          pedigree_dam_sire_dam: string | null
          pedigree_dam_dam_sire: string | null
          pedigree_dam_dam_dam: string | null
          health_vaccinations: boolean
          health_coggins: boolean
          health_last_vet_check: string
          training_level: string
          training_disciplines: string[]
          location: string
          date_added: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          breed: string
          age: number
          color: string
          gender: 'Stallion' | 'Mare' | 'Gelding'
          height: string
          weight?: number | null
          price?: number | null
          status: 'Available' | 'Sold' | 'Reserved' | 'Not for Sale'
          description: string
          pedigree_sire?: string | null
          pedigree_dam?: string | null
          pedigree_sire_sire?: string | null
          pedigree_sire_dam?: string | null
          pedigree_dam_sire?: string | null
          pedigree_dam_dam?: string | null
          pedigree_sire_sire_sire?: string | null
          pedigree_sire_sire_dam?: string | null
          pedigree_sire_dam_sire?: string | null
          pedigree_sire_dam_dam?: string | null
          pedigree_dam_sire_sire?: string | null
          pedigree_dam_sire_dam?: string | null
          pedigree_dam_dam_sire?: string | null
          pedigree_dam_dam_dam?: string | null
          health_vaccinations: boolean
          health_coggins: boolean
          health_last_vet_check: string
          training_level: string
          training_disciplines: string[]
          location: string
          date_added?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          breed?: string
          age?: number
          color?: string
          gender?: 'Stallion' | 'Mare' | 'Gelding'
          height?: string
          weight?: number | null
          price?: number | null
          status?: 'Available' | 'Sold' | 'Reserved' | 'Not for Sale'
          description?: string
          pedigree_sire?: string | null
          pedigree_dam?: string | null
          pedigree_sire_sire?: string | null
          pedigree_sire_dam?: string | null
          pedigree_dam_sire?: string | null
          pedigree_dam_dam?: string | null
          pedigree_sire_sire_sire?: string | null
          pedigree_sire_sire_dam?: string | null
          pedigree_sire_dam_sire?: string | null
          pedigree_sire_dam_dam?: string | null
          pedigree_dam_sire_sire?: string | null
          pedigree_dam_sire_dam?: string | null
          pedigree_dam_dam_sire?: string | null
          pedigree_dam_dam_dam?: string | null
          health_vaccinations?: boolean
          health_coggins?: boolean
          health_last_vet_check?: string
          training_level?: string
          training_disciplines?: string[]
          location?: string
          date_added?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      horse_images: {
        Row: {
          id: string
          horse_id: string
          url: string
          caption: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          horse_id: string
          url: string
          caption?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          horse_id?: string
          url?: string
          caption?: string | null
          is_primary?: boolean
          created_at?: string
        }
      }
      horse_videos: {
        Row: {
          id: string
          horse_id: string
          url: string
          caption: string | null
          thumbnail: string | null
          created_at: string
        }
        Insert: {
          id?: string
          horse_id: string
          url: string
          caption?: string | null
          thumbnail?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          horse_id?: string
          url?: string
          caption?: string | null
          thumbnail?: string | null
          created_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          horse_id: string
          event: string
          date: string
          discipline: string
          placement: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          horse_id: string
          event: string
          date: string
          discipline: string
          placement: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          horse_id?: string
          event?: string
          date?: string
          discipline?: string
          placement?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
} 