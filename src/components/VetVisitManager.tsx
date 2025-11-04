import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  vetVisitService,
  CreateVetVisitParams,
  VISIT_TYPES,
  DOCUMENT_TYPES,
} from '@/services/vetVisitService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, Stethoscope, Upload, X } from 'lucide-react'

interface VetVisitManagerProps {
  horseId: string
}

export const VetVisitManager = ({ horseId }: VetVisitManagerProps) => {
  const [open, setOpen] = useState(false)
  const { organization } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form state
  const [visitDate, setVisitDate] = useState('')
  const [visitType, setVisitType] = useState('')
  const [customVisitType, setCustomVisitType] = useState('')
  const [veterinarianName, setVeterinarianName] = useState('')
  const [veterinarianClinic, setVeterinarianClinic] = useState('')
  const [veterinarianPhone, setVeterinarianPhone] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [medications, setMedications] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [cost, setCost] = useState('')

  // Document upload state
  const [documentUrls, setDocumentUrls] = useState<
    Array<{
      url: string
      fileName: string
      documentType: string
      description: string
    }>
  >([])
  const [currentDocUrl, setCurrentDocUrl] = useState('')
  const [currentDocFileName, setCurrentDocFileName] = useState('')
  const [currentDocType, setCurrentDocType] = useState('')
  const [currentDocDescription, setCurrentDocDescription] = useState('')

  // Reset form
  const resetForm = () => {
    setVisitDate('')
    setVisitType('')
    setCustomVisitType('')
    setVeterinarianName('')
    setVeterinarianClinic('')
    setVeterinarianPhone('')
    setDiagnosis('')
    setTreatment('')
    setMedications('')
    setNotes('')
    setFollowUpRequired(false)
    setFollowUpDate('')
    setCost('')
    setDocumentUrls([])
    setCurrentDocUrl('')
    setCurrentDocFileName('')
    setCurrentDocType('')
    setCurrentDocDescription('')
  }

  // Add document to list
  const addDocument = () => {
    if (!currentDocUrl || !currentDocFileName) {
      toast({
        title: 'Missing document info',
        description: 'Please provide a URL and file name for the document.',
        variant: 'destructive',
      })
      return
    }

    setDocumentUrls([
      ...documentUrls,
      {
        url: currentDocUrl,
        fileName: currentDocFileName,
        documentType: currentDocType,
        description: currentDocDescription,
      },
    ])

    // Reset current document fields
    setCurrentDocUrl('')
    setCurrentDocFileName('')
    setCurrentDocType('')
    setCurrentDocDescription('')
  }

  // Remove document from list
  const removeDocument = (index: number) => {
    setDocumentUrls(documentUrls.filter((_, i) => i !== index))
  }

  // Create vet visit mutation
  const createVetVisitMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization found')

      const finalVisitType =
        visitType === 'Custom' ? customVisitType : visitType

      const params: CreateVetVisitParams = {
        horse_id: horseId,
        organization_id: organization.id,
        visit_date: visitDate,
        visit_type: finalVisitType || undefined,
        veterinarian_name: veterinarianName || undefined,
        veterinarian_clinic: veterinarianClinic || undefined,
        veterinarian_phone: veterinarianPhone || undefined,
        diagnosis: diagnosis || undefined,
        treatment: treatment || undefined,
        medications: medications || undefined,
        notes: notes || undefined,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate || undefined,
        cost: cost ? parseFloat(cost) : undefined,
      }

      const visit = await vetVisitService.createVetVisit(params)

      // Add documents if any
      for (const doc of documentUrls) {
        await vetVisitService.addDocument({
          vet_visit_id: visit.id,
          file_url: doc.url,
          file_name: doc.fileName,
          document_type: doc.documentType || undefined,
          description: doc.description || undefined,
        })
      }

      return visit
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vet-visits', horseId] })
      await queryClient.invalidateQueries({ queryKey: ['horse', horseId] })

      resetForm()
      setOpen(false)

      toast({
        title: 'Vet visit recorded!',
        description: 'The veterinary visit has been added to the health records.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error recording visit',
        description: error.message || 'Failed to record visit. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const isFormValid = () => {
    if (!visitDate) return false
    if (visitType === 'Custom' && !customVisitType) return false
    return true
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Visit
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Record Veterinary Visit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visit Date and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit-date">
                Visit Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-type">Visit Type</Label>
              <Select value={visitType} onValueChange={setVisitType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {visitType === 'Custom' && (
                <Input
                  placeholder="Enter custom visit type"
                  value={customVisitType}
                  onChange={(e) => setCustomVisitType(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* Veterinarian Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Veterinarian Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vet-name">Name</Label>
                <Input
                  id="vet-name"
                  placeholder="Dr. Name"
                  value={veterinarianName}
                  onChange={(e) => setVeterinarianName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vet-clinic">Clinic</Label>
                <Input
                  id="vet-clinic"
                  placeholder="Clinic name"
                  value={veterinarianClinic}
                  onChange={(e) => setVeterinarianClinic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vet-phone">Phone</Label>
                <Input
                  id="vet-phone"
                  type="tel"
                  placeholder="Phone number"
                  value={veterinarianPhone}
                  onChange={(e) => setVeterinarianPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Visit Details</h4>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                placeholder="Diagnosis or findings..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment</Label>
              <Textarea
                id="treatment"
                placeholder="Treatment provided..."
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Medications</Label>
              <Textarea
                id="medications"
                placeholder="Medications prescribed..."
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Follow-up */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <Checkbox
                id="follow-up"
                checked={followUpRequired}
                onCheckedChange={(checked) => setFollowUpRequired(checked === true)}
              />
              <Label htmlFor="follow-up" className="cursor-pointer">
                Follow-up required
              </Label>
            </div>
            {followUpRequired && (
              <div className="space-y-2">
                <Label htmlFor="follow-up-date">Follow-up Date</Label>
                <Input
                  id="follow-up-date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Cost (USD)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          {/* Documents Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Documents
            </h4>

            {/* Add Document Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="doc-url" className="text-xs">Document URL</Label>
                  <Input
                    id="doc-url"
                    placeholder="https://..."
                    value={currentDocUrl}
                    onChange={(e) => setCurrentDocUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-filename" className="text-xs">File Name</Label>
                  <Input
                    id="doc-filename"
                    placeholder="report.pdf"
                    value={currentDocFileName}
                    onChange={(e) => setCurrentDocFileName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="doc-type" className="text-xs">Document Type</Label>
                  <Select value={currentDocType} onValueChange={setCurrentDocType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
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
                <div className="space-y-2">
                  <Label htmlFor="doc-description" className="text-xs">Description</Label>
                  <Input
                    id="doc-description"
                    placeholder="Brief description..."
                    value={currentDocDescription}
                    onChange={(e) => setCurrentDocDescription(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDocument}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            {/* Document List */}
            {documentUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {documentUrls.length} document{documentUrls.length !== 1 ? 's' : ''} added
                </p>
                {documentUrls.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.fileName}</p>
                      {doc.documentType && (
                        <p className="text-xs text-muted-foreground">{doc.documentType}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
              disabled={createVetVisitMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createVetVisitMutation.mutate()}
              disabled={createVetVisitMutation.isPending || !isFormValid()}
              className="flex-1"
            >
              {createVetVisitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Record Visit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
