import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vetDocService, VeterinaryDocument } from '@/services/vetDocService'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { FileText, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { isAdmin } from '@/types/organization'
import { format } from 'date-fns'

interface VetDocListProps {
  horseId: string
}

export const VetDocList = ({ horseId }: VetDocListProps) => {
  const { userRole } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['vet-documents', horseId],
    queryFn: () => vetDocService.getDocuments(horseId),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => vetDocService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-documents', horseId] })
      toast({
        title: 'Document deleted',
        description: 'The document has been successfully deleted.',
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

  const handleView = async (doc: VeterinaryDocument) => {
    try {
      let url = doc.file_url

      // If it's a storage path (not an external URL), get a signed URL
      if (!url.startsWith('http')) {
        url = await vetDocService.getSignedUrl(url)
      }

      // Open in new tab
      window.open(url, '_blank')
    } catch (error) {
      toast({
        title: 'Error opening document',
        description: 'Failed to open the document. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteMutation.mutate(documentId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No veterinary documents uploaded yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload health certificates, insurance docs, coggins tests, and more
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="p-4">
          <div className="flex items-start gap-4">
            {/* File Icon */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{doc.file_name}</h4>
                  {doc.document_type && (
                    <Badge variant="outline" className="mt-1">
                      {doc.document_type}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(doc)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {isAdmin(userRole) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              {doc.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {doc.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {doc.file_size && (
                  <span>{vetDocService.formatFileSize(doc.file_size)}</span>
                )}
                <span>Added {format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
