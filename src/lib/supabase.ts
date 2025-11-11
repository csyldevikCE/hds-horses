import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
})

// Helper function to calculate age from birth year
export const calculateAge = (birthYear: number): number => {
  const currentYear = new Date().getFullYear()
  return currentYear - birthYear
}

// Database types for multi-tenant organization system
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_users: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'admin' | 'read_only'
          invited_by: string | null
          invited_at: string
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'admin' | 'read_only'
          invited_by?: string | null
          invited_at?: string
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'admin' | 'read_only'
          invited_by?: string | null
          invited_at?: string
          joined_at?: string
          created_at?: string
        }
      }
      horses: {
        Row: {
          id: string
          name: string
          breed: string
          birth_year: number
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
          organization_id: string
        }
        Insert: {
          id?: string
          name: string
          breed: string
          birth_year: number
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
          organization_id: string
        }
        Update: {
          id?: string
          name?: string
          breed?: string
          birth_year?: number
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
          organization_id?: string
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
          equipe_link: string | null
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
          equipe_link?: string | null
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
          equipe_link?: string | null
          created_at?: string
        }
      }
      share_links: {
        Row: {
          id: string
          horse_id: string
          organization_id: string
          token: string
          recipient_name: string
          expires_at: string
          created_at: string
          created_by: string
          link_type: 'standard' | 'one_time' | 'password_protected'
          password_hash: string | null
          view_count: number
          max_views: number | null
          shared_fields: string[]
        }
        Insert: {
          id?: string
          horse_id: string
          organization_id: string
          token: string
          recipient_name: string
          expires_at: string
          created_at?: string
          created_by: string
          link_type?: 'standard' | 'one_time' | 'password_protected'
          password_hash?: string | null
          view_count?: number
          max_views?: number | null
          shared_fields?: string[]
        }
        Update: {
          id?: string
          horse_id?: string
          organization_id?: string
          token?: string
          recipient_name?: string
          expires_at?: string
          created_at?: string
          created_by?: string
          link_type?: 'standard' | 'one_time' | 'password_protected'
          password_hash?: string | null
          view_count?: number
          max_views?: number | null
          shared_fields?: string[]
        }
      }
      share_link_views: {
        Row: {
          id: string
          share_link_id: string
          viewed_at: string
          ip_address: string | null
          user_agent: string | null
          country: string | null
          city: string | null
          region: string | null
          referer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          share_link_id: string
          viewed_at?: string
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          city?: string | null
          region?: string | null
          referer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          share_link_id?: string
          viewed_at?: string
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          city?: string | null
          region?: string | null
          referer?: string | null
          created_at?: string
        }
      }
      horse_xrays: {
        Row: {
          id: string
          horse_id: string
          organization_id: string
          file_url: string
          file_type: 'upload' | 'url'
          format: 'dicom' | 'jpeg' | 'png'
          date_taken: string | null
          body_part: string | null
          veterinarian_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          horse_id: string
          organization_id: string
          file_url: string
          file_type: 'upload' | 'url'
          format?: 'dicom' | 'jpeg' | 'png'
          date_taken?: string | null
          body_part?: string | null
          veterinarian_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          horse_id?: string
          organization_id?: string
          file_url?: string
          file_type?: 'upload' | 'url'
          format?: 'dicom' | 'jpeg' | 'png'
          date_taken?: string | null
          body_part?: string | null
          veterinarian_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          token: string
          email: string
          role: 'admin' | 'read_only'
          invited_by: string
          expires_at: string
          used_at: string | null
          used_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          token: string
          email: string
          role: 'admin' | 'read_only'
          invited_by: string
          expires_at: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          token?: string
          email?: string
          role?: 'admin' | 'read_only'
          invited_by?: string
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
      }
      vaccinations: {
        Row: {
          id: string
          horse_id: string
          organization_id: string
          vaccine_type: string
          vaccine_name: string | null
          dose_number: string | null
          administered_date: string
          next_due_date: string | null
          veterinarian_name: string | null
          veterinarian_license: string | null
          batch_number: string | null
          notes: string | null
          recorded_in_passport: boolean
          recorded_in_fei_app: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          horse_id: string
          organization_id: string
          vaccine_type: string
          vaccine_name?: string | null
          dose_number?: string | null
          administered_date: string
          next_due_date?: string | null
          veterinarian_name?: string | null
          veterinarian_license?: string | null
          batch_number?: string | null
          notes?: string | null
          recorded_in_passport?: boolean
          recorded_in_fei_app?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          horse_id?: string
          organization_id?: string
          vaccine_type?: string
          vaccine_name?: string | null
          dose_number?: string | null
          administered_date?: string
          next_due_date?: string | null
          veterinarian_name?: string | null
          veterinarian_license?: string | null
          batch_number?: string | null
          notes?: string | null
          recorded_in_passport?: boolean
          recorded_in_fei_app?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vet_visits: {
        Row: {
          id: string
          horse_id: string
          organization_id: string
          visit_date: string
          visit_type: string | null
          veterinarian_name: string | null
          veterinarian_clinic: string | null
          veterinarian_phone: string | null
          diagnosis: string | null
          treatment: string | null
          medications: string | null
          notes: string | null
          follow_up_required: boolean
          follow_up_date: string | null
          cost: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          horse_id: string
          organization_id: string
          visit_date: string
          visit_type?: string | null
          veterinarian_name?: string | null
          veterinarian_clinic?: string | null
          veterinarian_phone?: string | null
          diagnosis?: string | null
          treatment?: string | null
          medications?: string | null
          notes?: string | null
          follow_up_required?: boolean
          follow_up_date?: string | null
          cost?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          horse_id?: string
          organization_id?: string
          visit_date?: string
          visit_type?: string | null
          veterinarian_name?: string | null
          veterinarian_clinic?: string | null
          veterinarian_phone?: string | null
          diagnosis?: string | null
          treatment?: string | null
          medications?: string | null
          notes?: string | null
          follow_up_required?: boolean
          follow_up_date?: string | null
          cost?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      vet_visit_documents: {
        Row: {
          id: string
          vet_visit_id: string
          file_url: string
          file_name: string
          file_type: string | null
          file_size: number | null
          document_type: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vet_visit_id: string
          file_url: string
          file_name: string
          file_type?: string | null
          file_size?: number | null
          document_type?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vet_visit_id?: string
          file_url?: string
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          document_type?: string | null
          description?: string | null
          created_at?: string
        }
      }
      veterinary_documents: {
        Row: {
          id: string
          horse_id: string
          organization_id: string
          file_url: string
          file_name: string
          file_type: string | null
          file_size: number | null
          document_type: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          horse_id: string
          organization_id: string
          file_url: string
          file_name: string
          file_type?: string | null
          file_size?: number | null
          document_type?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          horse_id?: string
          organization_id?: string
          file_url?: string
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          document_type?: string | null
          description?: string | null
          created_at?: string
        }
      }
    }
  }
} 