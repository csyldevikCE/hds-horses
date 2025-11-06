import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type HorseXRay = Database['public']['Tables']['horse_xrays']['Row']
type HorseXRayInsert = Database['public']['Tables']['horse_xrays']['Insert']
type HorseXRayUpdate = Database['public']['Tables']['horse_xrays']['Update']

export type XRayFileType = 'upload' | 'url'
export type XRayFormat = 'dicom' | 'jpeg' | 'png'

export interface CreateXRayData {
  horseId: string
  organizationId: string
  fileUrl: string
  fileType: XRayFileType
  format?: XRayFormat
  dateTaken?: string
  bodyPart?: string
  veterinarianName?: string
  notes?: string
}

export interface UpdateXRayData {
  xrayId: string
  dateTaken?: string
  bodyPart?: string
  veterinarianName?: string
  notes?: string
}

class XRayService {
  /**
   * Get all X-rays for a specific horse
   */
  async getHorseXRays(horseId: string): Promise<HorseXRay[]> {
    try {
      const { data, error } = await supabase
        .from('horse_xrays')
        .select('*')
        .eq('horse_id', horseId)
        .order('date_taken', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching horse X-rays:', error)
      throw error
    }
  }

  /**
   * Get a single X-ray by ID
   */
  async getXRay(xrayId: string): Promise<HorseXRay | null> {
    try {
      const { data, error } = await supabase
        .from('horse_xrays')
        .select('*')
        .eq('id', xrayId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching X-ray:', error)
      throw error
    }
  }

  /**
   * Create a new X-ray record
   */
  async createXRay(xrayData: CreateXRayData): Promise<HorseXRay> {
    try {
      const insertData: HorseXRayInsert = {
        horse_id: xrayData.horseId,
        organization_id: xrayData.organizationId,
        file_url: xrayData.fileUrl,
        file_type: xrayData.fileType,
        format: xrayData.format || 'dicom',
        date_taken: xrayData.dateTaken || null,
        body_part: xrayData.bodyPart || null,
        veterinarian_name: xrayData.veterinarianName || null,
        notes: xrayData.notes || null,
      }

      const { data, error } = await supabase
        .from('horse_xrays')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating X-ray:', error)
      throw error
    }
  }

  /**
   * Update X-ray metadata (not the file itself)
   */
  async updateXRay(updateData: UpdateXRayData): Promise<HorseXRay> {
    try {
      const updatePayload: HorseXRayUpdate = {
        ...(updateData.dateTaken && { date_taken: updateData.dateTaken }),
        ...(updateData.bodyPart && { body_part: updateData.bodyPart }),
        ...(updateData.veterinarianName && { veterinarian_name: updateData.veterinarianName }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
      }

      const { data, error } = await supabase
        .from('horse_xrays')
        .update(updatePayload)
        .eq('id', updateData.xrayId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating X-ray:', error)
      throw error
    }
  }

  /**
   * Delete an X-ray record
   */
  async deleteXRay(xrayId: string): Promise<void> {
    try {
      // First get the X-ray to check if it's a file upload
      const xray = await this.getXRay(xrayId)

      // If it's a file upload, delete from storage
      if (xray && xray.file_type === 'upload') {
        await this.deleteFileFromStorage(xray.file_url)
      }

      // Delete the database record
      const { error } = await supabase
        .from('horse_xrays')
        .delete()
        .eq('id', xrayId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting X-ray:', error)
      throw error
    }
  }

  /**
   * Upload X-ray file to Supabase Storage (Private Bucket)
   */
  async uploadXRayFile(
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
        .from('horse-xrays')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // For private buckets, we store the path and generate signed URLs on demand
      // Return the storage path (not a URL) which will be used to generate signed URLs later
      return data.path
    } catch (error) {
      console.error('Error uploading X-ray file:', error)
      throw error
    }
  }

  /**
   * Get a signed URL for viewing an X-ray (valid for 1 hour)
   * Use this for private bucket access
   */
  async getSignedUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('horse-xrays')
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
      const urlParts = fileUrl.split('/horse-xrays/')
      if (urlParts.length !== 2) return

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('horse-xrays')
        .remove([filePath])

      if (error) throw error
    } catch (error) {
      console.error('Error deleting file from storage:', error)
      // Don't throw - deletion of database record should still succeed
    }
  }

  /**
   * Validate DICOM file format
   */
  isDicomFile(file: File): boolean {
    return (
      file.type === 'application/dicom' ||
      file.name.toLowerCase().endsWith('.dcm')
    )
  }

  /**
   * Validate image file format (JPEG, PNG)
   */
  isImageFile(file: File): boolean {
    return file.type === 'image/jpeg' || file.type === 'image/png'
  }

  /**
   * Get file format from File object
   */
  getFileFormat(file: File): XRayFormat {
    if (this.isDicomFile(file)) return 'dicom'
    if (file.type === 'image/jpeg') return 'jpeg'
    if (file.type === 'image/png') return 'png'
    return 'dicom' // default
  }

  /**
   * Validate file size (max 500MB for large DICOM files)
   */
  isValidFileSize(file: File): boolean {
    const maxSize = 500 * 1024 * 1024 // 500MB
    return file.size <= maxSize
  }
}

export const xrayService = new XRayService()
