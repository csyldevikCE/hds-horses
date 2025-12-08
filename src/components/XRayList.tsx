import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { xrayService } from '@/services/xrayService'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin } from '@/types/organization'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { FileImage, Download, Edit, Trash2, Loader2, Calendar, User, FileText, Link as LinkIcon, Eye } from 'lucide-react'
import { DicomViewer } from '@/components/DicomViewer'

interface XRayListProps {
  horseId: string
}

export const XRayList = ({ horseId }: XRayListProps) => {
  const { userRole } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editingXRay, setEditingXRay] = useState<string | null>(null)
  const [viewingXRay, setViewingXRay] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loadingSignedUrls, setLoadingSignedUrls] = useState(false)

  // Form state for editing
  const [editDateTaken, setEditDateTaken] = useState('')
  const [editBodyPart, setEditBodyPart] = useState('')
  const [editVeterinarianName, setEditVeterinarianName] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const { data: xrays = [], isLoading } = useQuery({
    queryKey: ['horse-xrays', horseId],
    queryFn: () => xrayService.getHorseXRays(horseId),
  })

  // Generate signed URLs for uploaded files (private bucket)
  useEffect(() => {
    const generateSignedUrls = async () => {
      setLoadingSignedUrls(true)
      const urls: Record<string, string> = {}

      for (const xray of xrays) {
        // Only generate signed URLs for uploaded files, not external URLs
        if (xray.file_type === 'upload') {
          try {
            const signedUrl = await xrayService.getSignedUrl(xray.file_url)
            urls[xray.id] = signedUrl
            console.log(`Generated signed URL for X-ray ${xray.id}`)
          } catch (error) {
            console.error(`Failed to get signed URL for X-ray ${xray.id}:`, error)
          }
        }
      }

      setSignedUrls(urls)
      setLoadingSignedUrls(false)
    }

    if (xrays.length > 0) {
      generateSignedUrls()
    }
  }, [xrays])

  // Helper to get the display URL (signed URL for uploads, direct URL for external links)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDisplayUrl = (xray: any): string => {
    if (xray.file_type === 'upload') {
      return signedUrls[xray.id] || ''
    }
    return xray.file_url
  }

  const updateMutation = useMutation({
    mutationFn: (xrayId: string) => {
      return xrayService.updateXRay({
        xrayId,
        dateTaken: editDateTaken || undefined,
        bodyPart: editBodyPart || undefined,
        veterinarianName: editVeterinarianName || undefined,
        notes: editNotes || undefined,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['horse-xrays', horseId] })
      toast({
        title: 'X-ray updated',
        description: 'X-ray information has been updated successfully.',
      })
      setEditingXRay(null)
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (xrayId: string) => xrayService.deleteXRay(xrayId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['horse-xrays', horseId] })
      toast({
        title: 'X-ray deleted',
        description: 'X-ray has been removed successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (xray: any) => {
    setEditingXRay(xray.id)
    setEditDateTaken(xray.date_taken || '')
    setEditBodyPart(xray.body_part || '')
    setEditVeterinarianName(xray.veterinarian_name || '')
    setEditNotes(xray.notes || '')
  }

  const handleSaveEdit = (xrayId: string) => {
    updateMutation.mutate(xrayId)
  }

  const handleDelete = (xrayId: string) => {
    if (confirm('Are you sure you want to delete this X-ray? This action cannot be undone.')) {
      deleteMutation.mutate(xrayId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (xrays.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No X-rays uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {xrays.map((xray) => (
        <Card key={xray.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon/Thumbnail */}
              <div className="flex-shrink-0">
                {xray.format === 'dicom' ? (
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                    <FileImage className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : (
                  <img
                    src={getDisplayUrl(xray)}
                    alt="X-ray"
                    className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80"
                    onClick={() => setViewingXRay(xray.id)}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={xray.file_type === 'upload' ? 'default' : 'secondary'}>
                        {xray.file_type === 'upload' ? 'Uploaded' : 'URL'}
                      </Badge>
                      <Badge variant="outline">{xray.format.toUpperCase()}</Badge>
                    </div>
                    {xray.body_part && (
                      <p className="font-medium text-sm">{xray.body_part}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {isAdmin(userRole) && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(xray)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(xray.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-sm text-muted-foreground">
                  {xray.date_taken && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(xray.date_taken).toLocaleDateString()}</span>
                    </div>
                  )}
                  {xray.veterinarian_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{xray.veterinarian_name}</span>
                    </div>
                  )}
                  {xray.notes && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-3 w-3 mt-0.5" />
                      <span className="line-clamp-2">{xray.notes}</span>
                    </div>
                  )}
                </div>

                {/* View/Download buttons */}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingXRay(xray.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const displayUrl = getDisplayUrl(xray)
                      window.open(displayUrl, '_blank')
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  {xray.file_type === 'url' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getDisplayUrl(xray), '_blank')}
                    >
                      <LinkIcon className="h-3 w-3 mr-1" />
                      External Link
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={!!editingXRay} onOpenChange={(open) => !open && setEditingXRay(null)}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit X-Ray Information</DialogTitle>
            <DialogDescription>
              Update the date, body part, veterinarian, and clinical notes for this X-ray
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (editingXRay) handleSaveEdit(editingXRay)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date-taken">Date Taken</Label>
                <Input
                  id="edit-date-taken"
                  type="date"
                  value={editDateTaken}
                  onChange={(e) => setEditDateTaken(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-body-part">Body Part</Label>
                <Input
                  id="edit-body-part"
                  type="text"
                  placeholder="e.g., Left Front Leg"
                  value={editBodyPart}
                  onChange={(e) => setEditBodyPart(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-vet-name">Veterinarian Name</Label>
              <Input
                id="edit-vet-name"
                type="text"
                placeholder="e.g., Dr. Smith"
                value={editVeterinarianName}
                onChange={(e) => setEditVeterinarianName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Clinical Notes / Findings</Label>
              <Textarea
                id="edit-notes"
                placeholder="Enter any clinical findings..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingXRay(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog (for all image types including DICOM) */}
      <Dialog open={!!viewingXRay} onOpenChange={(open) => !open && setViewingXRay(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                const xray = xrays.find(x => x.id === viewingXRay)
                return xray?.body_part ? `X-Ray: ${xray.body_part}` : 'X-Ray Image'
              })()}
            </DialogTitle>
            <DialogDescription>
              View and examine the X-ray image in detail
            </DialogDescription>
          </DialogHeader>
          {viewingXRay && (() => {
            const xray = xrays.find(x => x.id === viewingXRay)
            if (!xray) return null

            const displayUrl = getDisplayUrl(xray)

            // Show loading state if URL is not ready yet (for uploaded files)
            if (xray.file_type === 'upload' && !displayUrl) {
              return (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Preparing X-ray...</p>
                  </div>
                </div>
              )
            }

            // Show DICOM viewer for DICOM files
            if (xray.format === 'dicom') {
              return (
                <DicomViewer
                  fileUrl={displayUrl}
                  format={xray.format}
                  className="w-full"
                />
              )
            }

            // Show regular image for JPEG/PNG
            return (
              <div className="flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg p-4">
                <img
                  src={displayUrl}
                  alt="X-ray"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
