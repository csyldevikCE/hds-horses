import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, Calendar, Trophy, Tag, Link2, FileText } from 'lucide-react'

interface CompetitionManagerProps {
  horseId: string
}

interface CompetitionFormData {
  event: string
  date: string
  discipline: string
  placement: string
  notes?: string
  equipeLink?: string
}

export const CompetitionManager = ({ horseId }: CompetitionManagerProps) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CompetitionFormData>({
    event: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    discipline: '',
    placement: '',
    notes: '',
    equipeLink: '',
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const addCompetitionMutation = useMutation({
    mutationFn: async (data: CompetitionFormData) => {
      console.log('[CompetitionManager] Starting insert with data:', { horseId, ...data })

      const { error, status, statusText } = await supabase
        .from('competitions')
        .insert({
          horse_id: horseId,
          event: data.event,
          date: data.date,
          discipline: data.discipline,
          placement: data.placement,
          notes: data.notes || null,
          equipe_link: data.equipeLink || null,
        })

      console.log('[CompetitionManager] Insert response:', { error, status, statusText })

      if (error) {
        console.error('[CompetitionManager] Insert error:', error)
        throw error
      }

      console.log('[CompetitionManager] Insert successful')
    },
    onSuccess: () => {
      console.log('[CompetitionManager] onSuccess called')
      // Invalidate in background - don't await to prevent blocking if query hangs
      queryClient.invalidateQueries({ queryKey: ['horse', horseId] })

      setOpen(false)
      setFormData({
        event: '',
        date: new Date().toISOString().split('T')[0],
        discipline: '',
        placement: '',
        notes: '',
        equipeLink: '',
      })

      toast({
        title: 'Competition added!',
        description: 'The competition result has been added successfully.',
      })
    },
    onError: (error) => {
      console.error('[CompetitionManager] onError called:', error)
      toast({
        title: 'Error adding competition',
        description: error instanceof Error ? error.message : 'Failed to add competition. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.event.trim() || !formData.date || !formData.discipline.trim() || !formData.placement.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    addCompetitionMutation.mutate(formData)
  }

  const updateField = (field: keyof CompetitionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Result
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Add Competition Result
          </DialogTitle>
          <DialogDescription>
            Record show jumping, dressage, eventing, and other competition results
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Event Name *
            </Label>
            <Input
              id="event"
              placeholder="e.g., Kentucky Horse Park Spring Classic"
              value={formData.event}
              onChange={(e) => updateField('event', e.target.value)}
              required
            />
          </div>

          {/* Date and Discipline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discipline" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Discipline *
              </Label>
              <Input
                id="discipline"
                placeholder="e.g., Show Jumping, Dressage, Eventing"
                value={formData.discipline}
                onChange={(e) => updateField('discipline', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Placement */}
          <div className="space-y-2">
            <Label htmlFor="placement" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Placement *
            </Label>
            <Input
              id="placement"
              placeholder="e.g., 1st Place, 2nd Place, Clear Round"
              value={formData.placement}
              onChange={(e) => updateField('placement', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Examples: 1st Place, 2nd Place, 3rd Place, Clear Round, Qualified, etc.
            </p>
          </div>

          {/* Equipe Link */}
          <div className="space-y-2">
            <Label htmlFor="equipeLink" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Results Link (Optional)
            </Label>
            <Input
              id="equipeLink"
              type="url"
              placeholder="https://online.equipe.com/startlists/1171508"
              value={formData.equipeLink}
              onChange={(e) => updateField('equipeLink', e.target.value)}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Supported platforms:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Equipe: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://online.equipe.com/startlists/...</code></li>
                <li>USEF: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://www.usef.org/...</code></li>
                <li>FEI: <code className="text-xs bg-muted px-1 py-0.5 rounded">https://data.fei.org/...</code></li>
                <li>Or any other competition results URL</li>
              </ul>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the competition..."
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={addCompetitionMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addCompetitionMutation.isPending}
              className="flex-1"
            >
              {addCompetitionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Add Competition
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
