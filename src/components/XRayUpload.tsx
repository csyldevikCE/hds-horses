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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

      let fileUrl = ''
      let fileType: 'upload' | 'url' = 'upload'
      let format: 'dicom' | 'jpeg' | 'png' = 'dicom'

      if (uploadMethod === 'file') {
        if (!selectedFile) throw new Error('No file selected')

        // Validate file
        if (!xrayService.isValidFileSize(selectedFile)) {
          throw new Error('File size must be less than 500MB')
        }

        if (!xrayService.isDicomFile(selectedFile) && !xrayService.isImageFile(selectedFile)) {
          throw new Error('File must be DICOM (.dcm), JPEG, or PNG format')
        }

        // Upload file to storage
        fileUrl = await xrayService.uploadXRayFile(selectedFile, horseId, organization.id)
        format = xrayService.getFileFormat(selectedFile)
      } else {
        // URL method
        if (!urlInput) throw new Error('Please enter a URL')
        fileUrl = urlInput
        fileType = 'url'
        // Default to dicom for URLs
        format = 'dicom'
      }

      // Create X-ray record
      return await xrayService.createXRay({
        horseId,
        organizationId: organization.id,
        fileUrl,
        fileType,
        format,
        dateTaken: dateTaken || undefined,
        bodyPart: bodyPart || undefined,
        veterinarianName: veterinarianName || undefined,
        notes: notes || undefined,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['horse', horseId] })
      await queryClient.invalidateQueries({ queryKey: ['horse-xrays', horseId] })

      toast({
        title: 'X-ray added successfully',
        description: 'The X-ray has been uploaded and saved.',
      })

      // Reset form
      setSelectedFile(null)
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
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
          <DialogTitle>Add X-Ray</DialogTitle>
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
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <FileImage className="h-8 w-8 text-primary" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      Drag and drop your X-ray file here, or
                    </p>
                    <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                      Browse Files
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Supported: DICOM (.dcm), JPEG, PNG • Max size: 500MB
                    </p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".dcm,image/jpeg,image/png,application/dicom"
                  onChange={handleFileChange}
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
            <h4 className="font-medium">X-Ray Information</h4>

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

            <div>
              <Label htmlFor="notes">Clinical Notes / Findings</Label>
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
              {uploadMutation.isPending ? 'Uploading...' : 'Add X-Ray'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
