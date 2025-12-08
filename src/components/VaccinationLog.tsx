import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vaccinationService, Vaccination, getVaccinationStatus } from '@/services/vaccinationService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Syringe, Calendar, User, FileText, Trash2, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react'
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

interface VaccinationLogProps {
  horseId: string
}

export const VaccinationLog = ({ horseId }: VaccinationLogProps) => {
  const { toast } = useToast()
  const { userRole } = useAuth()
  const queryClient = useQueryClient()

  // Fetch all vaccinations for this horse
  const { data: vaccinations = [], isLoading } = useQuery({
    queryKey: ['vaccinations', horseId],
    queryFn: () => vaccinationService.getVaccinations(horseId),
    refetchOnMount: true,
  })

  // Fetch FEI compliance status
  const { data: feiStatus } = useQuery({
    queryKey: ['fei-compliance', horseId],
    queryFn: () => vaccinationService.getFEIInfluenzaComplianceStatus(horseId),
    refetchOnMount: true,
  })

  // Delete vaccination mutation
  const deleteVaccinationMutation = useMutation({
    mutationFn: (id: string) => vaccinationService.deleteVaccination(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vaccinations', horseId] })
      await queryClient.invalidateQueries({ queryKey: ['fei-compliance', horseId] })
      queryClient.invalidateQueries({ queryKey: ['horse', horseId] })

      toast({
        title: 'Vaccination deleted',
        description: 'The vaccination record has been removed.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting vaccination',
        description: error.message || 'Failed to delete vaccination. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const getStatusBadge = (status: ReturnType<typeof getVaccinationStatus>) => {
    switch (status) {
      case 'compliant':
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Current
          </Badge>
        )
      case 'due_soon':
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Due Soon
          </Badge>
        )
      case 'overdue':
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return null
    }
  }

  const getFEIComplianceBadge = () => {
    if (!feiStatus) return null

    switch (feiStatus.status) {
      case 'compliant':
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <Shield className="h-3 w-3 mr-1" />
            FEI Compliant
          </Badge>
        )
      case 'due_soon':
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            FEI Due Soon
          </Badge>
        )
      case 'overdue':
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            FEI Overdue
          </Badge>
        )
      case 'incomplete_primary':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Primary Incomplete
          </Badge>
        )
      default:
        return null
    }
  }

  // Group vaccinations by type
  const vaccinationsByType = vaccinations.reduce((acc, vaccination) => {
    if (!acc[vaccination.vaccine_type]) {
      acc[vaccination.vaccine_type] = []
    }
    acc[vaccination.vaccine_type].push(vaccination)
    return acc
  }, {} as Record<string, Vaccination[]>)

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading vaccination records...</p>
      </div>
    )
  }

  if (vaccinations.length === 0) {
    return (
      <div className="text-center py-12">
        <Syringe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">No vaccination records yet.</p>
        <p className="text-sm text-muted-foreground">
          {isAdmin(userRole)
            ? 'Click "Add Vaccination" above to record the first vaccination.'
            : 'Vaccination records will appear here once added by an administrator.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* FEI Compliance Status */}
      {feiStatus && feiStatus.status !== 'not_applicable' && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" />
              FEI Equine Influenza Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {getFEIComplianceBadge()}
              <span className="text-sm text-muted-foreground">{feiStatus.message}</span>
            </div>
            {feiStatus.nextDueDate && (
              <p className="text-xs text-muted-foreground">
                Next booster due: {new Date(feiStatus.nextDueDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vaccinations grouped by type */}
      {Object.entries(vaccinationsByType).map(([type, typeVaccinations]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Syringe className="h-5 w-5 text-primary" />
              {type}
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                ({typeVaccinations.length} {typeVaccinations.length === 1 ? 'record' : 'records'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeVaccinations.map((vaccination) => {
                const status = getVaccinationStatus(vaccination.next_due_date)

                return (
                  <div
                    key={vaccination.id}
                    className="p-3 sm:p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      {/* Dose and date */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                        {vaccination.dose_number && (
                          <Badge variant="secondary" className="w-fit">{vaccination.dose_number}</Badge>
                        )}
                        {vaccination.vaccine_name && (
                          <Badge variant="outline" className="w-fit">{vaccination.vaccine_name}</Badge>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(vaccination.administered_date).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Next due date with status */}
                      {vaccination.next_due_date && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Next due: {new Date(vaccination.next_due_date).toLocaleDateString()}
                          </span>
                          {getStatusBadge(status)}
                        </div>
                      )}

                      {/* Veterinarian info */}
                      {vaccination.veterinarian_name && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="break-words">{vaccination.veterinarian_name}</span>
                          </div>
                          {vaccination.veterinarian_license && (
                            <div className="text-xs text-muted-foreground ml-6">
                              License: {vaccination.veterinarian_license}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Batch number */}
                      {vaccination.batch_number && (
                        <div className="text-xs text-muted-foreground">
                          Batch: {vaccination.batch_number}
                        </div>
                      )}

                      {/* Notes */}
                      {vaccination.notes && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-foreground break-words">{vaccination.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* FEI compliance indicators */}
                      {vaccination.vaccine_type === 'Equine Influenza' && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {vaccination.recorded_in_passport && (
                            <Badge variant="outline" className="gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              In Passport
                            </Badge>
                          )}
                          {vaccination.recorded_in_fei_app && (
                            <Badge variant="outline" className="gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              In FEI App
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Admin Actions */}
                      {isAdmin(userRole) && (
                        <div className="pt-3 border-t flex justify-end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deleteVaccinationMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="ml-2 hidden sm:inline">Delete Record</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Vaccination Record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this vaccination record? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteVaccinationMutation.mutate(vaccination.id)}
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
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
