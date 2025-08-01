import { supabase } from '@/lib/supabase'

export interface UploadedFile {
  id: string
  url: string
  name: string
  type: 'image' | 'video'
  size: number
}

export const fileUploadService = {
  // Upload a single file to Supabase Storage
  async uploadFile(
    file: File, 
    bucket: string = 'horse-media',
    folder: string = 'uploads'
  ): Promise<UploadedFile> {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      id: data.path,
      url: urlData.publicUrl,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      size: file.size
    }
  },

  // Upload multiple files
  async uploadFiles(
    files: File[], 
    bucket: string = 'horse-media',
    folder: string = 'uploads'
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, bucket, folder))
    return Promise.all(uploadPromises)
  },

  // Delete a file from Supabase Storage
  async deleteFile(filePath: string, bucket: string = 'horse-media'): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  },

  // Get file size in a human-readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Validate file type and size
  validateFile(file: File, maxSize: number = 100 * 1024 * 1024): { valid: boolean; error?: string } {
    // Check file size (default 100MB)
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size must be less than ${this.formatFileSize(maxSize)}` 
      }
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime'
    ]

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'File type not supported. Please upload images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, OGG, MOV)' 
      }
    }

    return { valid: true }
  }
} 