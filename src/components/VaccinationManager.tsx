import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  vaccinationService,
  CreateVaccinationParams,
  VACCINE_TYPES,
  FEI_DOSE_NUMBERS,
  calculateFEINextDueDate,
} from '@/services/vaccinationService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, Syringe, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VaccinationManagerProps {
  horseId: string
}

export const VaccinationManager = ({ horseId }: VaccinationManagerProps) => {
  const [open, setOpen] = useState(false)
  const { organization } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form state
  const [vaccineType, setVaccineType] = useState('')
  const [vaccineName, setVaccineName] = useState('')
  const [doseNumber, setDoseNumber] = useState('')
  const [customDoseNumber, setCustomDoseNumber] = useState('')
  const [administeredDate, setAdministeredDate] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [autoCalculateNextDue, setAutoCalculateNextDue] = useState(true)
  const [veterinarianName, setVeterinarianName] = useState('')
  const [veterinarianLicense, setVeterinarianLicense] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [recordedInPassport, setRecordedInPassport] = useState(false)
  const [recordedInFeiApp, setRecordedInFeiApp] = useState(false)

  // Auto-calculate next due date for FEI Influenza
  useEffect(() => {
    if (
      autoCalculateNextDue &&
      vaccineType === 'Equine Influenza' &&
      administeredDate &&
      doseNumber &&
      !doseNumber.includes('Custom')
    ) {
      const calculatedDate = calculateFEINextDueDate(administeredDate, doseNumber)
      if (calculatedDate) {
        setNextDueDate(calculatedDate)
      }
    }
  }, [autoCalculateNextDue, vaccineType, administeredDate, doseNumber])

  // Reset form
  const resetForm = () => {
    setVaccineType('')
    setVaccineName('')
    setDoseNumber('')
    setCustomDoseNumber('')
    setAdministeredDate('')
    setNextDueDate('')
    setAutoCalculateNextDue(true)
    setVeterinarianName('')
    setVeterinarianLicense('')
    setBatchNumber('')
    setNotes('')
    setRecordedInPassport(false)
    setRecordedInFeiApp(false)
  }

  // Create vaccination mutation
  const createVaccinationMutation = useMutation({
    mutationFn: () => {
      if (!organization?.id) throw new Error('No organization found')

      const finalDoseNumber = doseNumber === 'Custom' ? customDoseNumber : doseNumber

      const params: CreateVaccinationParams = {
        horse_id: horseId,
        organization_id: organization.id,
        vaccine_type: vaccineType,
        vaccine_name: vaccineName || undefined,
        dose_number: finalDoseNumber || undefined,
        administered_date: administeredDate,
        next_due_date: nextDueDate || undefined,
        veterinarian_name: veterinarianName || undefined,
        veterinarian_license: veterinarianLicense || undefined,
        batch_number: batchNumber || undefined,
        notes: notes || undefined,
        recorded_in_passport: recordedInPassport,
        recorded_in_fei_app: recordedInFeiApp,
      }

      return vaccinationService.createVaccination(params)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vaccinations', horseId] })
      await queryClient.invalidateQueries({ queryKey: ['horse', horseId] })

      resetForm()
      setOpen(false)

      toast({
        title: 'Vaccination recorded!',
        description: 'The vaccination has been added to the horse\'s health records.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error recording vaccination',
        description: error.message || 'Failed to record vaccination. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const isFormValid = () => {
    if (!vaccineType || !administeredDate) return false
    if (doseNumber === 'Custom' && !customDoseNumber) return false
    return true
  }

  const showFEIInfo = vaccineType === 'Equine Influenza'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vaccination
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Record Vaccination
          </DialogTitle>
          <DialogDescription>
            Track vaccinations including FEI compliance for equine influenza
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* FEI Information Banner */}
          {showFEIInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>FEI Requirements:</strong> Primary course requires V1, V2 (21-60 days later),
                and V3 (within 6 months + 21 days). Boosters must be given within 12 months.
                For competition eligibility, last booster must be within 6 months + 21 days,
                and not within 7 days of event arrival.
              </AlertDescription>
            </Alert>
          )}

          {/* Vaccine Type - Required */}
          <div className="space-y-2">
            <Label htmlFor="vaccine-type">
              Vaccine Type <span className="text-destructive">*</span>
            </Label>
            <Select value={vaccineType} onValueChange={setVaccineType}>
              <SelectTrigger>
                <SelectValue placeholder="Select vaccine type" />
              </SelectTrigger>
              <SelectContent>
                {VACCINE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vaccine Name (Brand) */}
          <div className="space-y-2">
            <Label htmlFor="vaccine-name">Vaccine Brand/Product Name</Label>
            <Input
              id="vaccine-name"
              placeholder="e.g., Fluvac Innovator, Prestige, etc."
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
            />
          </div>

          {/* Dose Number - Show FEI options for Equine Influenza */}
          <div className="space-y-2">
            <Label htmlFor="dose-number">
              Dose Number {showFEIInfo && <span className="text-xs text-muted-foreground">(FEI Protocol)</span>}
            </Label>
            <Select value={doseNumber} onValueChange={setDoseNumber}>
              <SelectTrigger>
                <SelectValue placeholder="Select dose number" />
              </SelectTrigger>
              <SelectContent>
                {showFEIInfo ? (
                  FEI_DOSE_NUMBERS.map((dose) => (
                    <SelectItem key={dose} value={dose}>
                      {dose}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Dose 1">Dose 1</SelectItem>
                    <SelectItem value="Dose 2">Dose 2</SelectItem>
                    <SelectItem value="Booster">Booster</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {doseNumber === 'Custom' && (
              <Input
                placeholder="Enter custom dose number"
                value={customDoseNumber}
                onChange={(e) => setCustomDoseNumber(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Administered Date - Required */}
          <div className="space-y-2">
            <Label htmlFor="administered-date">
              Date Administered <span className="text-destructive">*</span>
            </Label>
            <Input
              id="administered-date"
              type="date"
              value={administeredDate}
              onChange={(e) => setAdministeredDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Next Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="next-due-date">Next Due Date</Label>
              {showFEIInfo && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auto-calculate"
                    checked={autoCalculateNextDue}
                    onCheckedChange={(checked) => setAutoCalculateNextDue(checked === true)}
                  />
                  <Label htmlFor="auto-calculate" className="text-sm font-normal cursor-pointer">
                    Auto-calculate (FEI rules)
                  </Label>
                </div>
              )}
            </div>
            <Input
              id="next-due-date"
              type="date"
              value={nextDueDate}
              onChange={(e) => {
                setNextDueDate(e.target.value)
                setAutoCalculateNextDue(false)
              }}
              disabled={autoCalculateNextDue && showFEIInfo}
            />
            {autoCalculateNextDue && showFEIInfo && nextDueDate && (
              <p className="text-xs text-muted-foreground">
                Calculated based on FEI requirements for {doseNumber}
              </p>
            )}
          </div>

          {/* Veterinarian Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vet-name">Veterinarian Name</Label>
              <Input
                id="vet-name"
                placeholder="Dr. Name"
                value={veterinarianName}
                onChange={(e) => setVeterinarianName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vet-license">License Number</Label>
              <Input
                id="vet-license"
                placeholder="License #"
                value={veterinarianLicense}
                onChange={(e) => setVeterinarianLicense(e.target.value)}
              />
            </div>
          </div>

          {/* Batch Number */}
          <div className="space-y-2">
            <Label htmlFor="batch-number">Batch/Lot Number</Label>
            <Input
              id="batch-number"
              placeholder="For traceability"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information or reactions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* FEI Compliance Checkboxes */}
          {showFEIInfo && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <p className="text-sm font-medium">FEI Compliance (Required from Feb 1, 2025)</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="passport"
                    checked={recordedInPassport}
                    onCheckedChange={(checked) => setRecordedInPassport(checked === true)}
                  />
                  <Label htmlFor="passport" className="font-normal cursor-pointer">
                    Recorded in horse passport
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="fei-app"
                    checked={recordedInFeiApp}
                    onCheckedChange={(checked) => setRecordedInFeiApp(checked === true)}
                  />
                  <Label htmlFor="fei-app" className="font-normal cursor-pointer">
                    Recorded in FEI HorseApp by veterinarian
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
              disabled={createVaccinationMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createVaccinationMutation.mutate()}
              disabled={createVaccinationMutation.isPending || !isFormValid()}
              className="flex-1"
            >
              {createVaccinationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Syringe className="mr-2 h-4 w-4" />
                  Record Vaccination
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
