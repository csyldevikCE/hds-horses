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
import { Edit } from 'lucide-react';

interface EditHorseFormProps {
  horse: Horse;
  children: React.ReactNode;
}

export const EditHorseForm = ({ horse, children }: EditHorseFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: horse.name,
    breed: horse.breed,
    age: horse.age.toString(),
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
    
    // Training
    trainingLevel: horse.training.level,
    disciplines: horse.training.disciplines.join(', '),
    
    // Health Records
    vaccinations: horse.health.vaccinations,
    coggins: horse.health.coggins,
    lastVetCheck: horse.health.lastVetCheck,
  });

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the data to your backend
    console.log('Updated horse data:', formData);
    
    toast({
      title: "Horse Updated",
      description: `${formData.name} has been successfully updated.`,
    });
    
    setOpen(false);
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
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
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
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="e.g., 16.2 hands"
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUpload onMediaAdd={(files) => console.log('Updated media files:', files)} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Horse
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};