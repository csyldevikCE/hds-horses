import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type VetVisitRow = Database['public']['Tables']['vet_visits']['Row']
type VetVisitInsert = Database['public']['Tables']['vet_visits']['Insert']
type VetVisitUpdate = Database['public']['Tables']['vet_visits']['Update']

type VetVisitDocumentRow = Database['public']['Tables']['vet_visit_documents']['Row']
type VetVisitDocumentInsert = Database['public']['Tables']['vet_visit_documents']['Insert']

export interface VetVisit {
  id: string
  horse_id: string
  organization_id: string
  visit_date: string
  visit_type?: string
  veterinarian_name?: string
  veterinarian_clinic?: string
  veterinarian_phone?: string
  diagnosis?: string
  treatment?: string
  medications?: string
  notes?: string
  follow_up_required: boolean
  follow_up_date?: string
  cost?: number
  created_at: string
  updated_at: string
  documents?: VetVisitDocument[]
}

export interface VetVisitDocument {
  id: string
  vet_visit_id: string
  file_url: string
  file_name: string
  file_type?: string
  file_size?: number
  document_type?: string
  description?: string
  created_at: string
}

export interface CreateVetVisitParams {
  horse_id: string
  organization_id: string
  visit_date: string
  visit_type?: string
  veterinarian_name?: string
  veterinarian_clinic?: string
  veterinarian_phone?: string
  diagnosis?: string
  treatment?: string
  medications?: string
  notes?: string
  follow_up_required?: boolean
  follow_up_date?: string
  cost?: number
}

export interface AddDocumentParams {
  vet_visit_id: string
  file_url: string
  file_name: string
  file_type?: string
  file_size?: number
  document_type?: string
  description?: string
}

// Common visit types
export const VISIT_TYPES = [
  'Routine Check',
  'Emergency',
  'Dental',
  'Surgery',
  'Follow-up',
  'Lameness Exam',
  'Pre-Purchase Exam',
  'Vaccination',
  'Farrier Visit',
  'Custom'
] as const

// Common document types
export const DOCUMENT_TYPES = [
  'Lab Results',
  'X-Ray Report',
  'Ultrasound Report',
  'Invoice',
  'Prescription',
  'Treatment Plan',
  'Health Certificate',
  'Surgery Report',
  'Custom'
] as const

export const vetVisitService = {
  // Get all vet visits for a horse - uses JOIN to avoid N+1 queries
  async getVetVisits(horseId: string): Promise<VetVisit[]> {
    const { data: visits, error } = await supabase
      .from('vet_visits')
      .select(`
        *,
        vet_visit_documents (*)
      `)
      .eq('horse_id', horseId)
      .order('visit_date', { ascending: false })

    if (error) throw error

    // Map the nested documents to the expected format
    return (visits || []).map((visit) => ({
      ...visit,
      documents: visit.vet_visit_documents || [],
    }))
  },

  // Get a single vet visit - uses JOIN to fetch documents in one query
  async getVetVisit(id: string): Promise<VetVisit | null> {
    const { data: visit, error } = await supabase
      .from('vet_visits')
      .select(`
        *,
        vet_visit_documents (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return {
      ...visit,
      documents: visit.vet_visit_documents || [],
    }
  },

  // Get the most recent vet visit for a horse - uses JOIN
  async getLatestVetVisit(horseId: string): Promise<VetVisit | null> {
    const { data: visit, error } = await supabase
      .from('vet_visits')
      .select(`
        *,
        vet_visit_documents (*)
      `)
      .eq('horse_id', horseId)
      .order('visit_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!visit) return null

    return {
      ...visit,
      documents: visit.vet_visit_documents || [],
    }
  },

  // Create a new vet visit
  async createVetVisit(params: CreateVetVisitParams): Promise<VetVisit> {
    const visitData: VetVisitInsert = {
      horse_id: params.horse_id,
      organization_id: params.organization_id,
      visit_date: params.visit_date,
      visit_type: params.visit_type || null,
      veterinarian_name: params.veterinarian_name || null,
      veterinarian_clinic: params.veterinarian_clinic || null,
      veterinarian_phone: params.veterinarian_phone || null,
      diagnosis: params.diagnosis || null,
      treatment: params.treatment || null,
      medications: params.medications || null,
      notes: params.notes || null,
      follow_up_required: params.follow_up_required ?? false,
      follow_up_date: params.follow_up_date || null,
      cost: params.cost || null,
    }

    const { data, error } = await supabase
      .from('vet_visits')
      .insert(visitData)
      .select()
      .single()

    if (error) throw error

    return { ...data, documents: [] }
  },

  // Update a vet visit
  async updateVetVisit(
    id: string,
    updates: Partial<CreateVetVisitParams>
  ): Promise<VetVisit> {
    const updateData: VetVisitUpdate = {
      visit_date: updates.visit_date,
      visit_type: updates.visit_type || null,
      veterinarian_name: updates.veterinarian_name || null,
      veterinarian_clinic: updates.veterinarian_clinic || null,
      veterinarian_phone: updates.veterinarian_phone || null,
      diagnosis: updates.diagnosis || null,
      treatment: updates.treatment || null,
      medications: updates.medications || null,
      notes: updates.notes || null,
      follow_up_required: updates.follow_up_required,
      follow_up_date: updates.follow_up_date || null,
      cost: updates.cost || null,
    }

    const { data, error } = await supabase
      .from('vet_visits')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        vet_visit_documents (*)
      `)
      .single()

    if (error) throw error

    return {
      ...data,
      documents: data.vet_visit_documents || [],
    }
  },

  // Delete a vet visit (and all associated documents via CASCADE)
  async deleteVetVisit(id: string): Promise<void> {
    const { error } = await supabase.from('vet_visits').delete().eq('id', id)

    if (error) throw error
  },

  // Add a document to a vet visit
  async addDocument(params: AddDocumentParams): Promise<VetVisitDocument> {
    const documentData: VetVisitDocumentInsert = {
      vet_visit_id: params.vet_visit_id,
      file_url: params.file_url,
      file_name: params.file_name,
      file_type: params.file_type || null,
      file_size: params.file_size || null,
      document_type: params.document_type || null,
      description: params.description || null,
    }

    const { data, error } = await supabase
      .from('vet_visit_documents')
      .insert(documentData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a document
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('vet_visit_documents')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get documents for a visit
  async getDocuments(vetVisitId: string): Promise<VetVisitDocument[]> {
    const { data, error } = await supabase
      .from('vet_visit_documents')
      .select('*')
      .eq('vet_visit_id', vetVisitId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Helper to format cost
  formatCost(cost: number | null | undefined): string {
    if (!cost) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cost)
  },

  // Helper to check if follow-up is overdue
  isFollowUpOverdue(followUpDate: string | null | undefined): boolean {
    if (!followUpDate) return false
    return new Date(followUpDate) < new Date()
  },
}
