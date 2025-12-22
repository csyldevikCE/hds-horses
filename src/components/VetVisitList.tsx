import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vetVisitService } from '@/services/vetVisitService'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stethoscope, Calendar, User, Phone, FileText, DollarSign, Trash2, AlertCircle, ExternalLink, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { isAdmin } from '@/types/organization'
import { useAuth } from '@/contexts/AuthContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface VetVisitListProps {
  horseId: string
}

export const VetVisitList = ({ horseId }: VetVisitListProps) => {
  const { toast } = useToast()
  const { userRole } = useAuth()
  const queryClient = useQueryClient()

  // Fetch all vet visits for this horse
  // Removed refetchOnMount - global staleTime handles freshness (PERF-005)
  const { data: vetVisits = [], isLoading } = useQuery({
    queryKey: ['vet-visits', horseId],
    queryFn: () => vetVisitService.getVetVisits(horseId),
  })

  // Delete vet visit mutation
  const deleteVetVisitMutation = useMutation({
    mutationFn: (id: string) => vetVisitService.deleteVetVisit(id),
    onSuccess: () => {
      // Removed await - let queries refetch in background (PERF-006)
      queryClient.invalidateQueries({ queryKey: ['vet-visits', horseId] })
      queryClient.invalidateQueries({ queryKey: ['horse', horseId] })

      toast({
        title: 'Visit deleted',
        description: 'The veterinary visit has been removed.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error deleting visit',
        description: error instanceof Error ? error.message : 'Failed to delete visit. Please try again.',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading veterinary visits...</p>
      </div>
    )
  }

  if (vetVisits.length === 0) {
    return (
      <div className="text-center py-12">
        <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">No veterinary visits recorded yet.</p>
        <p className="text-sm text-muted-foreground">
          {isAdmin(userRole)
            ? 'Click "Add Visit" above to record the first visit.'
            : 'Veterinary visits will appear here once added by an administrator.'}
        </p>
      </div>
    )
  }

  // Get the most recent visit for summary
  const latestVisit = vetVisits[0]

  return (
    <div className="space-y-6">
      {/* Latest Visit Summary */}
      {latestVisit && (
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Latest Veterinary Visit</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(latestVisit.visit_date).toLocaleDateString()}
                  {latestVisit.visit_type && (
                    <>
                      <span>•</span>
                      <span>{latestVisit.visit_type}</span>
                    </>
                  )}
                </div>
                {latestVisit.veterinarian_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <User className="h-4 w-4" />
                    {latestVisit.veterinarian_name}
                    {latestVisit.veterinarian_clinic && (
                      <span className="text-xs">({latestVisit.veterinarian_clinic})</span>
                    )}
                  </div>
                )}
              </div>
              {latestVisit.follow_up_required && latestVisit.follow_up_date && (
                <Badge
                  variant={
                    vetVisitService.isFollowUpOverdue(latestVisit.follow_up_date)
                      ? 'destructive'
                      : 'default'
                  }
                  className="gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  Follow-up {vetVisitService.isFollowUpOverdue(latestVisit.follow_up_date) ? 'Overdue' : 'Required'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Visits */}
      <div className="space-y-4">
        {vetVisits.map((visit) => (
          <Card key={visit.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4 mb-4">
                {/* Visit date and type */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm sm:text-base">
                      {new Date(visit.visit_date).toLocaleDateString()}
                    </span>
                  </div>
                  {visit.visit_type && <Badge variant="secondary" className="w-fit">{visit.visit_type}</Badge>}
                  {visit.cost && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {vetVisitService.formatCost(visit.cost)}
                    </div>
                  )}
                </div>

                {/* Veterinarian info */}
                {visit.veterinarian_name && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{visit.veterinarian_name}</span>
                    </div>
                    {visit.veterinarian_clinic && (
                      <div className="text-xs text-muted-foreground ml-6">
                        {visit.veterinarian_clinic}
                      </div>
                    )}
                    {visit.veterinarian_phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                        <Phone className="h-3 w-3" />
                        <span>{visit.veterinarian_phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Diagnosis */}
                {visit.diagnosis && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Diagnosis</p>
                    <p className="text-sm text-foreground break-words">{visit.diagnosis}</p>
                  </div>
                )}

                {/* Treatment */}
                {visit.treatment && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Treatment</p>
                    <p className="text-sm text-foreground break-words">{visit.treatment}</p>
                  </div>
                )}

                {/* Medications */}
                {visit.medications && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Medications</p>
                    <p className="text-sm text-foreground break-words">{visit.medications}</p>
                  </div>
                )}

                {/* Notes */}
                {visit.notes && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-foreground break-words">{visit.notes}</p>
                    </div>
                  </div>
                )}

                {/* Follow-up */}
                {visit.follow_up_required && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">
                        Follow-up {visit.follow_up_date ? (
                          <>
                            scheduled for{' '}
                            <span className="font-medium">
                              {new Date(visit.follow_up_date).toLocaleDateString()}
                            </span>
                          </>
                        ) : 'required'}
                      </span>
                    </div>
                    {visit.follow_up_date && vetVisitService.isFollowUpOverdue(visit.follow_up_date) && (
                      <Badge variant="destructive" className="w-fit">Overdue</Badge>
                    )}
                  </div>
                )}

                {/* Documents */}
                {visit.documents && visit.documents.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium mb-2 text-muted-foreground">
                      Documents ({visit.documents.length})
                    </p>
                    <div className="space-y-2">
                      {visit.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium truncate">{doc.file_name}</span>
                            </div>
                            {doc.document_type && (
                              <p className="text-xs text-muted-foreground ml-6">
                                {doc.document_type}
                              </p>
                            )}
                            {doc.description && (
                              <p className="text-xs text-muted-foreground ml-6 truncate">
                                {doc.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            asChild
                          >
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {isAdmin(userRole) && (
                  <div className="pt-4 border-t flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteVetVisitMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">Delete Visit</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Veterinary Visit?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this visit record and all associated documents?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteVetVisitMutation.mutate(visit.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
