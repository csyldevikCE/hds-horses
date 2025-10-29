import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { horseService } from '@/services/horseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Zap as HorseIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateHorseFormProps {
  children: React.ReactNode;
}

export const CreateHorseForm = ({ children }: CreateHorseFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birthYear: '',
    color: '',
    gender: '',
    height: '',
    weight: '',
    price: '',
    status: 'Available',
    description: '',
    sire: '',
    dam: '',
    location: '',
    trainingLevel: '',
    disciplines: '',
    vaccinations: false,
    coggins: false,
    lastVetCheck: ''
  });

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createHorseMutation = useMutation({
    mutationFn: (horseData: any) => horseService.createHorse(horseData, user?.id || ''),
    onSuccess: () => {
      // Invalidate horses list with CORRECT organization ID
      queryClient.invalidateQueries({ queryKey: ['horses', organization?.id] });
      toast({
        title: "Horse created successfully!",
        description: `${formData.name} has been added to your inventory.`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error creating horse",
        description: "There was an error creating the horse. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      birthYear: '',
      color: '',
      gender: '',
      height: '',
      weight: '',
      price: '',
      status: 'Available',
      description: '',
      sire: '',
      dam: '',
      location: '',
      trainingLevel: '',
      disciplines: '',
      vaccinations: false,
      coggins: false,
      lastVetCheck: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a horse.",
        variant: "destructive",
      });
      return;
    }

    const horseData = {
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
        dam: formData.dam
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
      images: [],
      videos: [],
      competitions: []
    };

    createHorseMutation.mutate(horseData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HorseIcon className="h-5 w-5" />
            Create New Horse
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Horse Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="breed">Breed *</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => handleInputChange('breed', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="birthYear">Year of Birth *</Label>
                  <Input
                    id="birthYear"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder={`e.g., ${new Date().getFullYear() - 5}`}
                    value={formData.birthYear}
                    onChange={(e) => handleInputChange('birthYear', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stallion">Stallion</SelectItem>
                      <SelectItem value="Mare">Mare</SelectItem>
                      <SelectItem value="Gelding">Gelding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="height">Height (hands)</Label>
                  <Input
                    id="height"
                    placeholder="e.g., 16.2"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Sales Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </div>
                <div>
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
              </div>
              <div className="mt-4">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the horse's characteristics, temperament, and any special notes..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pedigree */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Pedigree (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sire">Sire</Label>
                  <Input
                    id="sire"
                    value={formData.sire}
                    onChange={(e) => handleInputChange('sire', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dam">Dam</Label>
                  <Input
                    id="dam"
                    value={formData.dam}
                    onChange={(e) => handleInputChange('dam', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Training</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trainingLevel">Training Level</Label>
                  <Input
                    id="trainingLevel"
                    placeholder="e.g., Beginner, Intermediate, Advanced"
                    value={formData.trainingLevel}
                    onChange={(e) => handleInputChange('trainingLevel', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="disciplines">Disciplines</Label>
                  <Input
                    id="disciplines"
                    placeholder="e.g., Dressage, Jumping, Trail (comma separated)"
                    value={formData.disciplines}
                    onChange={(e) => handleInputChange('disciplines', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Health Records</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vaccinations"
                    checked={formData.vaccinations}
                    onCheckedChange={(checked) => handleInputChange('vaccinations', checked)}
                  />
                  <Label htmlFor="vaccinations">Vaccinations up to date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coggins"
                    checked={formData.coggins}
                    onCheckedChange={(checked) => handleInputChange('coggins', checked)}
                  />
                  <Label htmlFor="coggins">Coggins test current</Label>
                </div>
                <div>
                  <Label htmlFor="lastVetCheck">Last Veterinary Check</Label>
                  <Input
                    id="lastVetCheck"
                    type="date"
                    value={formData.lastVetCheck}
                    onChange={(e) => handleInputChange('lastVetCheck', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={createHorseMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-warm"
              disabled={createHorseMutation.isPending}
            >
              {createHorseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Horse'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};