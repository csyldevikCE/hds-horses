import { useState } from 'react';
import { Horse } from '@/types/horse';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaUpload } from '@/components/MediaUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { horseService } from '@/services/horseService';
import { Edit, Plus, Trash2, Loader2 } from 'lucide-react';

interface EditHorseFormProps {
  horse: Horse;
  children: React.ReactNode;
}

export const EditHorseForm = ({ horse, children }: EditHorseFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: horse.name,
    breed: horse.breed,
    birthYear: horse.birthYear.toString(),
    color: horse.color,
    gender: horse.gender,
    height: horse.height,
    weight: horse.weight?.toString() || '',
    description: horse.description,
    location: horse.location,
    
    // Sales Information
    status: horse.status,
    price: horse.price?.toString() || '',
    
    // Pedigree
    sire: horse.pedigree?.sire || '',
    dam: horse.pedigree?.dam || '',
    sireSire: horse.pedigree?.sireSire || '',
    sireDam: horse.pedigree?.sireDam || '',
    damSire: horse.pedigree?.damSire || '',
    damDam: horse.pedigree?.damDam || '',
    sireSireSire: horse.pedigree?.sireSireSire || '',
    sireSireDam: horse.pedigree?.sireSireDam || '',
    sireDamSire: horse.pedigree?.sireDamSire || '',
    sireDamDam: horse.pedigree?.sireDamDam || '',
    damSireSire: horse.pedigree?.damSireSire || '',
    damSireDam: horse.pedigree?.damSireDam || '',
    damDamSire: horse.pedigree?.damDamSire || '',
    damDamDam: horse.pedigree?.damDamDam || '',
    
    // Training
    trainingLevel: horse.training.level,
    disciplines: horse.training.disciplines.join(', '),
    
    // Health Records
    vaccinations: horse.health.vaccinations,
    coggins: horse.health.coggins,
    lastVetCheck: horse.health.lastVetCheck,
  });

  const [competitions, setCompetitions] = useState(horse.competitions || []);

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addCompetition = () => {
    const newCompetition = {
      id: Date.now().toString(),
      event: '',
      date: '',
      discipline: '',
      placement: '',
      notes: '',
      equipeLink: ''
    };
    setCompetitions([...competitions, newCompetition]);
  };

  const removeCompetition = (id: string) => {
    setCompetitions(competitions.filter(comp => comp.id !== id));
  };

  const updateCompetition = (id: string, field: string, value: string) => {
    setCompetitions(competitions.map(comp => 
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  // Update horse mutation
  const updateHorseMutation = useMutation({
    mutationFn: async () => {
      const updatedHorse: Partial<Horse> = {
        name: formData.name,
        breed: formData.breed,
        birthYear: parseInt(formData.birthYear),
        color: formData.color,
        gender: formData.gender as 'Stallion' | 'Mare' | 'Gelding',
        height: formData.height,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        status: formData.status as 'Available' | 'Sold' | 'Reserved' | 'Not for Sale',
        description: formData.description,
        pedigree: formData.sire || formData.dam ? {
          sire: formData.sire,
          dam: formData.dam,
          sireSire: formData.sireSire || undefined,
          sireDam: formData.sireDam || undefined,
          damSire: formData.damSire || undefined,
          damDam: formData.damDam || undefined,
          sireSireSire: formData.sireSireSire || undefined,
          sireSireDam: formData.sireSireDam || undefined,
          sireDamSire: formData.sireDamSire || undefined,
          sireDamDam: formData.sireDamDam || undefined,
          damSireSire: formData.damSireSire || undefined,
          damSireDam: formData.damSireDam || undefined,
          damDamSire: formData.damDamSire || undefined,
          damDamDam: formData.damDamDam || undefined
        } : undefined,
        health: {
          vaccinations: formData.vaccinations,
          coggins: formData.coggins,
          lastVetCheck: formData.lastVetCheck
        },
        training: {
          level: formData.trainingLevel,
          disciplines: formData.disciplines.split(',').map(d => d.trim()).filter(d => d)
        },
        location: formData.location,
        competitions: competitions
      };

      return horseService.updateHorse(horse.id, updatedHorse);
    },
    onSuccess: () => {
      // Invalidate specific horse detail
      queryClient.invalidateQueries({ queryKey: ['horse', horse.id] });
      // Invalidate horses list with CORRECT organization ID
      queryClient.invalidateQueries({ queryKey: ['horses', organization?.id] });
      toast({
        title: "Horse Updated",
        description: `${formData.name} has been successfully updated.`,
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update horse. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHorseMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit {horse.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => handleInputChange('breed', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthYear">Year of Birth</Label>
                <Input
                  id="birthYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.birthYear}
                  onChange={(e) => handleInputChange('birthYear', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stallion">Stallion</SelectItem>
                    <SelectItem value="Mare">Mare</SelectItem>
                    <SelectItem value="Gelding">Gelding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="e.g., 165 cm"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Sales Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                    <SelectItem value="Not for Sale">Not for Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pedigree */}
          <Card>
            <CardHeader>
              <CardTitle>Pedigree</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generation 2 - Parents */}
              <div>
                <h4 className="font-medium mb-3">Parents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sire">Sire</Label>
                    <Input
                      id="sire"
                      value={formData.sire}
                      onChange={(e) => handleInputChange('sire', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dam">Dam</Label>
                    <Input
                      id="dam"
                      value={formData.dam}
                      onChange={(e) => handleInputChange('dam', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Generation 3 - Grandparents */}
              <div>
                <h4 className="font-medium mb-3">Grandparents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sireSire">Sire's Sire</Label>
                    <Input
                      id="sireSire"
                      value={formData.sireSire}
                      onChange={(e) => handleInputChange('sireSire', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sireDam">Sire's Dam</Label>
                    <Input
                      id="sireDam"
                      value={formData.sireDam}
                      onChange={(e) => handleInputChange('sireDam', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="damSire">Dam's Sire</Label>
                    <Input
                      id="damSire"
                      value={formData.damSire}
                      onChange={(e) => handleInputChange('damSire', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="damDam">Dam's Dam</Label>
                    <Input
                      id="damDam"
                      value={formData.damDam}
                      onChange={(e) => handleInputChange('damDam', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Generation 4 - Great Grandparents */}
              <div>
                <h4 className="font-medium mb-3">Great Grandparents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sireSireSire">Sire's Sire's Sire</Label>
                    <Input
                      id="sireSireSire"
                      value={formData.sireSireSire}
                      onChange={(e) => handleInputChange('sireSireSire', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sireSireDam">Sire's Sire's Dam</Label>
                    <Input
                      id="sireSireDam"
                      value={formData.sireSireDam}
                      onChange={(e) => handleInputChange('sireSireDam', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sireDamSire">Sire's Dam's Sire</Label>
                    <Input
                      id="sireDamSire"
                      value={formData.sireDamSire}
                      onChange={(e) => handleInputChange('sireDamSire', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sireDamDam">Sire's Dam's Dam</Label>
                    <Input
                      id="sireDamDam"
                      value={formData.sireDamDam}
                      onChange={(e) => handleInputChange('sireDamDam', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="damSireSire">Dam's Sire's Sire</Label>
                    <Input
                      id="damSireSire"
                      value={formData.damSireSire}
                      onChange={(e) => handleInputChange('damSireSire', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="damSireDam">Dam's Sire's Dam</Label>
                    <Input
                      id="damSireDam"
                      value={formData.damSireDam}
                      onChange={(e) => handleInputChange('damSireDam', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="damDamSire">Dam's Dam's Sire</Label>
                    <Input
                      id="damDamSire"
                      value={formData.damDamSire}
                      onChange={(e) => handleInputChange('damDamSire', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="damDamDam">Dam's Dam's Dam</Label>
                    <Input
                      id="damDamDam"
                      value={formData.damDamDam}
                      onChange={(e) => handleInputChange('damDamDam', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training */}
          <Card>
            <CardHeader>
              <CardTitle>Training</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trainingLevel">Training Level</Label>
                <Input
                  id="trainingLevel"
                  value={formData.trainingLevel}
                  onChange={(e) => handleInputChange('trainingLevel', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="disciplines">Disciplines (comma-separated)</Label>
                <Input
                  id="disciplines"
                  value={formData.disciplines}
                  onChange={(e) => handleInputChange('disciplines', e.target.value)}
                  placeholder="e.g., Dressage, Jumping, Trail"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Health Records */}
          <Card>
            <CardHeader>
              <CardTitle>Health Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vaccinations"
                  checked={formData.vaccinations}
                  onCheckedChange={(checked) => handleInputChange('vaccinations', checked as boolean)}
                />
                <Label htmlFor="vaccinations">Current Vaccinations</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coggins"
                  checked={formData.coggins}
                  onCheckedChange={(checked) => handleInputChange('coggins', checked as boolean)}
                />
                <Label htmlFor="coggins">Current Coggins Test</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastVetCheck">Last Vet Check</Label>
                <Input
                  id="lastVetCheck"
                  type="date"
                  value={formData.lastVetCheck}
                  onChange={(e) => handleInputChange('lastVetCheck', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Competition Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Competition Results
                <Button type="button" variant="outline" size="sm" onClick={addCompetition}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competition
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {competitions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No competition results added yet.</p>
              ) : (
                competitions.map((competition) => (
                  <Card key={competition.id} className="relative">
                    <CardContent className="pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeCompetition(competition.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                        <div className="space-y-2">
                          <Label htmlFor={`event-${competition.id}`}>Event</Label>
                          <Input
                            id={`event-${competition.id}`}
                            value={competition.event}
                            onChange={(e) => updateCompetition(competition.id, 'event', e.target.value)}
                            placeholder="e.g., Kentucky Derby"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`date-${competition.id}`}>Date</Label>
                          <Input
                            id={`date-${competition.id}`}
                            type="date"
                            value={competition.date}
                            onChange={(e) => updateCompetition(competition.id, 'date', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`discipline-${competition.id}`}>Discipline</Label>
                          <Input
                            id={`discipline-${competition.id}`}
                            value={competition.discipline}
                            onChange={(e) => updateCompetition(competition.id, 'discipline', e.target.value)}
                            placeholder="e.g., Dressage, Jumping"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`placement-${competition.id}`}>Placement</Label>
                          <Input
                            id={`placement-${competition.id}`}
                            value={competition.placement}
                            onChange={(e) => updateCompetition(competition.id, 'placement', e.target.value)}
                            placeholder="e.g., 1st Place, 2nd Place"
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`notes-${competition.id}`}>Notes (optional)</Label>
                          <Textarea
                            id={`notes-${competition.id}`}
                            value={competition.notes || ''}
                            onChange={(e) => updateCompetition(competition.id, 'notes', e.target.value)}
                            placeholder="Additional notes about this competition"
                            rows={2}
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`equipeLink-${competition.id}`}>Equipe Link (optional)</Label>
                          <Input
                            id={`equipeLink-${competition.id}`}
                            type="url"
                            value={competition.equipeLink || ''}
                            onChange={(e) => updateCompetition(competition.id, 'equipeLink', e.target.value)}
                            placeholder="https://equipe.com/result/..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUpload 
                horseId={horse.id}
                onMediaAdd={(files) => console.log('Updated media files:', files)} 
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateHorseMutation.isPending}>
              {updateHorseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Horse'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};