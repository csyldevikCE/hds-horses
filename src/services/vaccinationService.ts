import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type VaccinationRow = Database['public']['Tables']['vaccinations']['Row']
type VaccinationInsert = Database['public']['Tables']['vaccinations']['Insert']
type VaccinationUpdate = Database['public']['Tables']['vaccinations']['Update']

export interface Vaccination {
  id: string
  horse_id: string
  organization_id: string
  vaccine_type: string
  vaccine_name?: string
  dose_number?: string
  administered_date: string
  next_due_date?: string
  veterinarian_name?: string
  veterinarian_license?: string
  batch_number?: string
  notes?: string
  recorded_in_passport: boolean
  recorded_in_fei_app: boolean
  created_at: string
  updated_at: string
}

export interface CreateVaccinationParams {
  horse_id: string
  organization_id: string
  vaccine_type: string
  vaccine_name?: string
  dose_number?: string
  administered_date: string
  next_due_date?: string
  veterinarian_name?: string
  veterinarian_license?: string
  batch_number?: string
  notes?: string
  recorded_in_passport?: boolean
  recorded_in_fei_app?: boolean
}

// Common vaccine types
export const VACCINE_TYPES = [
  'Equine Influenza',
  'Tetanus',
  'EHV (Equine Herpesvirus)',
  'Rabies',
  'West Nile Virus',
  'Eastern/Western Equine Encephalomyelitis',
  'Strangles',
  'Potomac Horse Fever',
  'Botulism',
  'Custom'
] as const

// FEI Influenza dose numbers
export const FEI_DOSE_NUMBERS = [
  'V1 (Primary - Day 0)',
  'V2 (Primary - 21-60 days)',
  'V3 (First Booster - within 6 months + 21 days)',
  'Booster (Annual - within 12 months)',
  'Custom'
] as const

// Calculate next due date based on FEI rules for Equine Influenza
export const calculateFEINextDueDate = (
  administered_date: string,
  dose_number: string
): string | null => {
  const adminDate = new Date(administered_date)

  if (dose_number.startsWith('V1')) {
    // V2 must be given 21-60 days after V1
    // Set due date to 30 days (middle of range)
    const dueDate = new Date(adminDate)
    dueDate.setDate(dueDate.getDate() + 30)
    return dueDate.toISOString().split('T')[0]
  } else if (dose_number.startsWith('V2')) {
    // V3 must be within 6 months + 21 days after V2
    const dueDate = new Date(adminDate)
    dueDate.setMonth(dueDate.getMonth() + 6)
    dueDate.setDate(dueDate.getDate() + 21)
    return dueDate.toISOString().split('T')[0]
  } else if (dose_number.startsWith('V3') || dose_number.startsWith('Booster')) {
    // Subsequent boosters must be within 12 months
    // But for competition eligibility: within 6 months + 21 days
    const dueDate = new Date(adminDate)
    dueDate.setMonth(dueDate.getMonth() + 6)
    dueDate.setDate(dueDate.getDate() + 21)
    return dueDate.toISOString().split('T')[0]
  }

  return null
}

// Check if a vaccination is due, overdue, or compliant
export const getVaccinationStatus = (
  next_due_date: string | null | undefined
): 'compliant' | 'due_soon' | 'overdue' | 'unknown' => {
  if (!next_due_date) return 'unknown'

  const dueDate = new Date(next_due_date)
  const today = new Date()
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilDue < 0) {
    return 'overdue'
  } else if (daysUntilDue <= 30) {
    return 'due_soon'
  } else {
    return 'compliant'
  }
}

export const vaccinationService = {
  // Get all vaccinations for a horse
  async getVaccinations(horseId: string): Promise<Vaccination[]> {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('horse_id', horseId)
      .order('administered_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get vaccinations by type
  async getVaccinationsByType(
    horseId: string,
    vaccineType: string
  ): Promise<Vaccination[]> {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('horse_id', horseId)
      .eq('vaccine_type', vaccineType)
      .order('administered_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a single vaccination
  async getVaccination(id: string): Promise<Vaccination | null> {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  // Create a new vaccination record
  async createVaccination(params: CreateVaccinationParams): Promise<Vaccination> {
    const vaccinationData: VaccinationInsert = {
      horse_id: params.horse_id,
      organization_id: params.organization_id,
      vaccine_type: params.vaccine_type,
      vaccine_name: params.vaccine_name || null,
      dose_number: params.dose_number || null,
      administered_date: params.administered_date,
      next_due_date: params.next_due_date || null,
      veterinarian_name: params.veterinarian_name || null,
      veterinarian_license: params.veterinarian_license || null,
      batch_number: params.batch_number || null,
      notes: params.notes || null,
      recorded_in_passport: params.recorded_in_passport ?? false,
      recorded_in_fei_app: params.recorded_in_fei_app ?? false,
    }

    const { data, error } = await supabase
      .from('vaccinations')
      .insert(vaccinationData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a vaccination record
  async updateVaccination(
    id: string,
    updates: Partial<CreateVaccinationParams>
  ): Promise<Vaccination> {
    const updateData: VaccinationUpdate = {
      vaccine_type: updates.vaccine_type,
      vaccine_name: updates.vaccine_name || null,
      dose_number: updates.dose_number || null,
      administered_date: updates.administered_date,
      next_due_date: updates.next_due_date || null,
      veterinarian_name: updates.veterinarian_name || null,
      veterinarian_license: updates.veterinarian_license || null,
      batch_number: updates.batch_number || null,
      notes: updates.notes || null,
      recorded_in_passport: updates.recorded_in_passport,
      recorded_in_fei_app: updates.recorded_in_fei_app,
    }

    const { data, error } = await supabase
      .from('vaccinations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a vaccination record
  async deleteVaccination(id: string): Promise<void> {
    const { error } = await supabase
      .from('vaccinations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get FEI compliance status for Equine Influenza
  async getFEIInfluenzaComplianceStatus(
    horseId: string
  ): Promise<{
    status: 'compliant' | 'due_soon' | 'overdue' | 'incomplete_primary' | 'not_applicable'
    message: string
    lastVaccination?: Vaccination
    nextDueDate?: string
  }> {
    const influenzaVaccinations = await this.getVaccinationsByType(
      horseId,
      'Equine Influenza'
    )

    if (influenzaVaccinations.length === 0) {
      return {
        status: 'not_applicable',
        message: 'No Equine Influenza vaccinations recorded',
      }
    }

    // Check if primary course is complete (need at least V1, V2, V3)
    const hasV1 = influenzaVaccinations.some(v => v.dose_number?.includes('V1'))
    const hasV2 = influenzaVaccinations.some(v => v.dose_number?.includes('V2'))
    const hasV3 = influenzaVaccinations.some(v => v.dose_number?.includes('V3'))

    if (!hasV1 || !hasV2 || !hasV3) {
      return {
        status: 'incomplete_primary',
        message: 'Primary vaccination course incomplete. Need V1, V2, and V3.',
        lastVaccination: influenzaVaccinations[0],
      }
    }

    // Get most recent vaccination
    const lastVaccination = influenzaVaccinations[0]

    if (!lastVaccination.next_due_date) {
      return {
        status: 'not_applicable',
        message: 'Next due date not set for last vaccination',
        lastVaccination,
      }
    }

    const dueDate = new Date(lastVaccination.next_due_date)
    const today = new Date()
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDue < 0) {
      return {
        status: 'overdue',
        message: `Booster overdue by ${Math.abs(daysUntilDue)} days`,
        lastVaccination,
        nextDueDate: lastVaccination.next_due_date,
      }
    } else if (daysUntilDue <= 30) {
      return {
        status: 'due_soon',
        message: `Booster due in ${daysUntilDue} days`,
        lastVaccination,
        nextDueDate: lastVaccination.next_due_date,
      }
    } else {
      return {
        status: 'compliant',
        message: `FEI compliant. Next booster due in ${daysUntilDue} days`,
        lastVaccination,
        nextDueDate: lastVaccination.next_due_date,
      }
    }
  },
}
