import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { xrayService } from '@/services/xrayService'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Upload, Link as LinkIcon, Loader2, FileImage, X } from 'lucide-react'

interface XRayUploadProps {
  horseId: string
}

export const XRayUpload = ({ horseId }: XRayUploadProps) => {
  const [open, setOpen] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const { organization } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  // URL state
  const [urlInput, setUrlInput] = useState('')

  // Metadata state
  const [dateTaken, setDateTaken] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [veterinarianName, setVeterinarianName] = useState('')
  const [notes, setNotes] = useState('')

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error('No organization found')

      if (uploadMethod === 'file') {
        if (selectedFiles.length === 0) throw new Error('No files selected')

        // Upload multiple files
        const uploadPromises = selectedFiles.map(async (file) => {
          // Validate file
          if (!xrayService.isValidFileSize(file)) {
            throw new Error(`File ${file.name} exceeds 500MB limit`)
          }

          if (!xrayService.isDicomFile(file) && !xrayService.isImageFile(file)) {
            throw new Error(`File ${file.name} must be DICOM (.dcm), JPEG, or PNG format`)
          }

          // Upload file to storage
          const fileUrl = await xrayService.uploadXRayFile(file, horseId, organization.id)
          const format = xrayService.getFileFormat(file)

          // Create X-ray record
          // For multiple files, skip metadata fields (date, body part, vet name)
          // Only include notes if provided
          return await xrayService.createXRay({
            horseId,
            organizationId: organization.id,
            fileUrl,
            fileType: 'upload',
            format,
            dateTaken: selectedFiles.length === 1 ? dateTaken || undefined : undefined,
            bodyPart: selectedFiles.length === 1 ? bodyPart || undefined : undefined,
            veterinarianName: selectedFiles.length === 1 ? veterinarianName || undefined : undefined,
            notes: notes || undefined,
          })
        })

        return await Promise.all(uploadPromises)
      } else {
        // URL method (single upload)
        if (!urlInput) throw new Error('Please enter a URL')

        return await xrayService.createXRay({
          horseId,
          organizationId: organization.id,
          fileUrl: urlInput,
          fileType: 'url',
          format: 'dicom',
          dateTaken: dateTaken || undefined,
          bodyPart: bodyPart || undefined,
          veterinarianName: veterinarianName || undefined,
          notes: notes || undefined,
        })
      }
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['horse', horseId] })
      await queryClient.invalidateQueries({ queryKey: ['horse-xrays', horseId] })

      const count = Array.isArray(data) ? data.length : 1
      toast({
        title: count > 1 ? `${count} X-rays added successfully` : 'X-ray added successfully',
        description: count > 1
          ? `${count} X-ray files have been uploaded and saved.`
          : 'The X-ray has been uploaded and saved.',
      })

      // Reset form
      setSelectedFiles([])
      setUrlInput('')
      setDateTaken('')
      setBodyPart('')
      setVeterinarianName('')
      setNotes('')
      setOpen(false)
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    uploadMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Add X-Ray
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add X-Ray
            <span className="text-xs font-normal text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
              Multiple files supported
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'url')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="h-4 w-4 mr-2" />
                Add URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <FileImage className="h-6 w-6 text-primary flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add More Files
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      Drag and drop X-ray files here, or
                    </p>
                    <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                      Browse Files
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Supported: DICOM (.dcm), JPEG, PNG • Max size: 500MB per file
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md py-2 px-3">
                      <FileImage className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        You can select multiple files to upload them all at once
                      </p>
                    </div>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".dcm,image/jpeg,image/png,application/dicom"
                  onChange={handleFileChange}
                  multiple
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="url-input">X-Ray URL</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/xray.dcm"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the URL of the X-ray file hosted elsewhere
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Metadata fields */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">X-Ray Information</h4>
              {uploadMethod === 'file' && selectedFiles.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  ({selectedFiles.length} files selected)
                </p>
              )}
            </div>

            {/* Only show detailed metadata for single file uploads */}
            {(uploadMethod === 'url' || selectedFiles.length === 1) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date-taken">Date Taken</Label>
                    <Input
                      id="date-taken"
                      type="date"
                      value={dateTaken}
                      onChange={(e) => setDateTaken(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="body-part">Body Part</Label>
                    <Input
                      id="body-part"
                      type="text"
                      placeholder="e.g., Left Front Leg, Hoof"
                      value={bodyPart}
                      onChange={(e) => setBodyPart(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="vet-name">Veterinarian Name</Label>
                  <Input
                    id="vet-name"
                    type="text"
                    placeholder="e.g., Dr. Smith"
                    value={veterinarianName}
                    onChange={(e) => setVeterinarianName(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Notes field always visible */}
            <div>
              <Label htmlFor="notes">
                Clinical Notes / Findings
                {uploadMethod === 'file' && selectedFiles.length > 1 && (
                  <span className="text-muted-foreground ml-1">(applies to all {selectedFiles.length} files)</span>
                )}
              </Label>
              <Textarea
                id="notes"
                placeholder="Enter any clinical findings, diagnosis, or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploadMutation.isPending
                ? `Uploading${uploadMethod === 'file' && selectedFiles.length > 1 ? ` ${selectedFiles.length} files` : ''}...`
                : uploadMethod === 'file' && selectedFiles.length > 1
                  ? `Add ${selectedFiles.length} X-Rays`
                  : 'Add X-Ray'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
