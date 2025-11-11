import { supabase } from '@/lib/supabase'

export interface VeterinaryDocument {
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

export type DocumentType =
  | 'Health Certificate'
  | 'Insurance'
  | 'Veterinary Report'
  | 'Coggins Test'
  | 'Registration Papers'
  | 'Custom'

export interface CreateDocumentParams {
  horse_id: string
  organization_id: string
  file_url: string
  file_name: string
  file_type?: string
  file_size?: number
  document_type?: DocumentType | string
  description?: string
}

export interface UpdateDocumentParams {
  id: string
  document_type?: DocumentType | string
  description?: string
}

class VetDocService {
  /**
   * Get all veterinary documents for a horse
   */
  async getDocuments(horseId: string): Promise<VeterinaryDocument[]> {
    try {
      const { data, error } = await supabase
        .from('veterinary_documents')
        .select('*')
        .eq('horse_id', horseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching veterinary documents:', error)
      throw error
    }
  }

  /**
   * Get a single veterinary document by ID
   */
  async getDocument(id: string): Promise<VeterinaryDocument | null> {
    try {
      const { data, error } = await supabase
        .from('veterinary_documents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching veterinary document:', error)
      throw error
    }
  }

  /**
   * Create a new veterinary document record
   */
  async createDocument(params: CreateDocumentParams): Promise<VeterinaryDocument> {
    try {
      const { data, error } = await supabase
        .from('veterinary_documents')
        .insert({
          horse_id: params.horse_id,
          organization_id: params.organization_id,
          file_url: params.file_url,
          file_name: params.file_name,
          file_type: params.file_type || null,
          file_size: params.file_size || null,
          document_type: params.document_type || null,
          description: params.description || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating veterinary document:', error)
      throw error
    }
  }

  /**
   * Update veterinary document metadata
   */
  async updateDocument(params: UpdateDocumentParams): Promise<VeterinaryDocument> {
    try {
      const { data, error } = await supabase
        .from('veterinary_documents')
        .update({
          document_type: params.document_type,
          description: params.description,
        })
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating veterinary document:', error)
      throw error
    }
  }

  /**
   * Delete a veterinary document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      // First get the document to check if it's a file upload
      const doc = await this.getDocument(id)

      // If it's a file upload (not external URL), delete from storage
      if (doc && doc.file_url && !doc.file_url.startsWith('http')) {
        await this.deleteFileFromStorage(doc.file_url)
      }

      // Delete the database record
      const { error } = await supabase
        .from('veterinary_documents')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting veterinary document:', error)
      throw error
    }
  }

  /**
   * Upload document file to Supabase Storage
   */
  async uploadFile(
    file: File,
    horseId: string,
    organizationId: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/${horseId}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage (private bucket)
      const { data, error } = await supabase.storage
        .from('veterinary-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Return the storage path (for private buckets, we'll generate signed URLs on demand)
      return data.path
    } catch (error) {
      console.error('Error uploading veterinary document file:', error)
      throw error
    }
  }

  /**
   * Get a signed URL for viewing a document (valid for 1 hour)
   */
  async getSignedUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('veterinary-documents')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Error getting signed URL:', error)
      throw error
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  private async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split('/veterinary-documents/')
      if (urlParts.length !== 2) return

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('veterinary-documents')
        .remove([filePath])

      if (error) throw error
    } catch (error) {
      console.error('Error deleting file from storage:', error)
      // Don't throw - deletion of database record should still succeed
    }
  }

  /**
   * Validate PDF file format
   */
  isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  }

  /**
   * Validate image file format (JPEG, PNG)
   */
  isImageFile(file: File): boolean {
    return file.type === 'image/jpeg' || file.type === 'image/png'
  }

  /**
   * Validate document file format (PDF, DOC, DOCX, Images)
   */
  isValidFileType(file: File): boolean {
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    return validTypes.includes(file.type)
  }

  /**
   * Validate file size (max 50MB)
   */
  isValidFileSize(file: File): boolean {
    const maxSize = 50 * 1024 * 1024 // 50MB
    return file.size <= maxSize
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

export const vetDocService = new VetDocService()
