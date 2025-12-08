import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vetDocService, DocumentType } from '@/services/vetDocService'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Upload, Link as LinkIcon, Loader2, FileText, X } from 'lucide-react'

interface VetDocUploadProps {
  horseId: string
}

const DOCUMENT_TYPES: DocumentType[] = [
  'Health Certificate',
  'Insurance',
  'Veterinary Report',
  'Coggins Test',
  'Registration Papers',
  'Custom',
]

export const VetDocUpload = ({ horseId }: VetDocUploadProps) => {
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
  const [documentType, setDocumentType] = useState<string>('')
  const [description, setDescription] = useState('')

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error('No organization found')

      let fileUrl = ''
      let fileName = ''
      let fileType: string | undefined
      let fileSize: number | undefined

      if (uploadMethod === 'file') {
        if (!selectedFile) throw new Error('No file selected')

        // Validate file
        if (!vetDocService.isValidFileSize(selectedFile)) {
          throw new Error('File size must be less than 50MB')
        }

        if (!vetDocService.isValidFileType(selectedFile)) {
          throw new Error('File must be PDF, DOC, DOCX, JPEG, or PNG format')
        }

        // Upload file to storage
        fileUrl = await vetDocService.uploadFile(selectedFile, horseId, organization.id)
        fileName = selectedFile.name
        fileType = selectedFile.type
        fileSize = selectedFile.size
      } else {
        // URL method
        if (!urlInput) throw new Error('Please enter a URL')
        fileUrl = urlInput
        // Extract filename from URL or use placeholder
        fileName = urlInput.split('/').pop() || 'Document'
      }

      // Create document record
      return await vetDocService.createDocument({
        horse_id: horseId,
        organization_id: organization.id,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        document_type: documentType || undefined,
        description: description || undefined,
      })
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['horse', horseId] })
      await queryClient.invalidateQueries({ queryKey: ['vet-documents', horseId] })

      toast({
        title: 'Document added successfully',
        description: 'The veterinary document has been uploaded and saved.',
      })

      // Reset form
      setSelectedFile(null)
      setUrlInput('')
      setDocumentType('')
      setDescription('')
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
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add Veterinary Document</DialogTitle>
          <DialogDescription>
            Upload health certificates, insurance documents, or veterinary reports for this horse
          </DialogDescription>
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
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {vetDocService.formatFileSize(selectedFile.size)}
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
                      Drag and drop your document here, or
                    </p>
                    <Button type="button" variant="outline" onClick={() => document.getElementById('doc-upload')?.click()}>
                      Browse Files
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Supported: PDF, DOC, DOCX, JPEG, PNG • Max size: 50MB
                    </p>
                  </div>
                )}
                <input
                  id="doc-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="url-input">Document URL</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the URL of the document hosted elsewhere
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Metadata fields */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Document Information</h4>

            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                placeholder="Enter any notes or description about this document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              {uploadMutation.isPending ? 'Uploading...' : 'Add Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
