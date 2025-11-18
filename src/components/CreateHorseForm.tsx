import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { horseService } from '@/services/horseService';
import { blupService, BlupHorseData } from '@/services/blupService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Zap as HorseIcon, Loader2, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateHorseFormProps {
  children: React.ReactNode;
}

export const CreateHorseForm = ({ children }: CreateHorseFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  // BLUP Import State
  const [blupRegno, setBlupRegno] = useState('');
  const [isLoadingBlup, setIsLoadingBlup] = useState(false);
  const [blupError, setBlupError] = useState<string | null>(null);
  const [blupSuccess, setBlupSuccess] = useState(false);

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
    sireSire: '',
    sireDam: '',
    damSire: '',
    damDam: '',
    sireSireSire: '',
    sireSireDam: '',
    sireDamSire: '',
    sireDamDam: '',
    damSireSire: '',
    damSireDam: '',
    damDamSire: '',
    damDamDam: '',
    location: '',
    trainingLevel: '',
    disciplines: '',
    // BLUP fields
    regno: '',
    chipNumber: '',
    wffsStatus: 'NOT_TESTED',
    studBookNo: '',
    lifeNo: '',
    foreignNo: '',
    owner: '',
    breeder: '',
    blupUrl: ''
  });

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fetch horse data from BLUP
  const handleFetchFromBlup = async () => {
    // Validate registration number
    const validation = blupService.validateRegno(blupRegno);
    if (!validation.valid) {
      setBlupError(validation.message || 'Invalid registration number');
      setBlupSuccess(false);
      return;
    }

    setIsLoadingBlup(true);
    setBlupError(null);
    setBlupSuccess(false);

    try {
      const blupData: BlupHorseData = await blupService.fetchHorseFromBlup(blupRegno);

      // Populate form with BLUP data
      setFormData(prev => ({
        ...prev,
        name: blupData.name,
        breed: blupData.breed,
        birthYear: blupData.birthYear.toString(),
        color: blupData.color,
        gender: blupData.gender,
        sire: blupData.pedigree?.sire || '',
        dam: blupData.pedigree?.dam || '',
        sireSire: blupData.pedigree?.sireSire || '',
        sireDam: blupData.pedigree?.sireDam || '',
        damSire: blupData.pedigree?.damSire || '',
        damDam: blupData.pedigree?.damDam || '',
        sireSireSire: blupData.pedigree?.sireSireSire || '',
        sireSireDam: blupData.pedigree?.sireSireDam || '',
        sireDamSire: blupData.pedigree?.sireDamSire || '',
        sireDamDam: blupData.pedigree?.sireDamDam || '',
        damSireSire: blupData.pedigree?.damSireSire || '',
        damSireDam: blupData.pedigree?.damSireDam || '',
        damDamSire: blupData.pedigree?.damDamSire || '',
        damDamDam: blupData.pedigree?.damDamDam || '',
        // BLUP fields
        regno: blupData.regno,
        chipNumber: blupData.chipNumber || '',
        wffsStatus: blupData.wffsStatus !== undefined ? blupData.wffsStatus.toString() : 'NOT_TESTED',
        studBookNo: blupData.studBookNo || '',
        lifeNo: blupData.lifeNo || '',
        foreignNo: blupData.foreignNo || '',
        owner: blupData.owner || '',
        breeder: blupData.breeder || '',
        blupUrl: blupData.blupUrl || '',
      }));

      setBlupSuccess(true);
      toast({
        title: 'Horse data imported successfully!',
        description: `${blupData.name} has been loaded from BLUP. Review and fill in remaining fields.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch horse data';
      setBlupError(errorMessage);
      setBlupSuccess(false);
      toast({
        title: 'Failed to import horse data',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBlup(false);
    }
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
      sireSire: '',
      sireDam: '',
      damSire: '',
      damDam: '',
      sireSireSire: '',
      sireSireDam: '',
      sireDamSire: '',
      sireDamDam: '',
      damSireSire: '',
      damSireDam: '',
      damDamSire: '',
      damDamDam: '',
      location: '',
      trainingLevel: '',
      disciplines: '',
      // BLUP fields
      regno: '',
      chipNumber: '',
      wffsStatus: '',
      studBookNo: '',
      lifeNo: '',
      foreignNo: '',
      owner: '',
      breeder: '',
      blupUrl: ''
    });
    setBlupRegno('');
    setBlupError(null);
    setBlupSuccess(false);
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
      training: {
        level: formData.trainingLevel,
        disciplines: formData.disciplines.split(',').map(d => d.trim()).filter(d => d)
      },
      location: formData.location,
      // BLUP fields
      regno: formData.regno || undefined,
      chipNumber: formData.chipNumber || undefined,
      wffsStatus: formData.wffsStatus && formData.wffsStatus !== 'NOT_TESTED' ? parseInt(formData.wffsStatus) : undefined,
      studBookNo: formData.studBookNo || undefined,
      lifeNo: formData.lifeNo || undefined,
      foreignNo: formData.foreignNo || undefined,
      owner: formData.owner || undefined,
      breeder: formData.breeder || undefined,
      blupUrl: formData.blupUrl || undefined,
      lastBlupSync: formData.regno ? new Date().toISOString() : undefined,
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
          <DialogDescription>
            Add a new horse to your stable with complete information, pedigree, and registration details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BLUP Import Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Import from BLUP System</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Enter a registration number to automatically import horse data and pedigree from the BLUP system
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g., 04201515"
                    value={blupRegno}
                    onChange={(e) => {
                      setBlupRegno(e.target.value);
                      setBlupError(null);
                      setBlupSuccess(false);
                    }}
                    disabled={isLoadingBlup}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleFetchFromBlup}
                  disabled={isLoadingBlup || !blupRegno}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoadingBlup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {blupError && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{blupError}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {blupSuccess && (
                <Alert className="mt-3 bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-900 dark:text-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Horse data imported successfully! Review the fields below and add any missing information.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

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
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    placeholder="e.g., 165"
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

          {/* Registration Details (Optional) */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Registration Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="regno">Registration Number</Label>
                  <Input
                    id="regno"
                    placeholder="e.g., 04204021"
                    value={formData.regno}
                    onChange={(e) => handleInputChange('regno', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="chipNumber">Microchip Number</Label>
                  <Input
                    id="chipNumber"
                    placeholder="e.g., 981100004755899"
                    value={formData.chipNumber}
                    onChange={(e) => handleInputChange('chipNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lifeNo">Life Number</Label>
                  <Input
                    id="lifeNo"
                    placeholder="e.g., 528003202010695"
                    value={formData.lifeNo}
                    onChange={(e) => handleInputChange('lifeNo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="studBookNo">Studbook Number</Label>
                  <Input
                    id="studBookNo"
                    value={formData.studBookNo}
                    onChange={(e) => handleInputChange('studBookNo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="foreignNo">Foreign Registration</Label>
                  <Input
                    id="foreignNo"
                    placeholder="e.g., 528003202010695 Reg. A"
                    value={formData.foreignNo}
                    onChange={(e) => handleInputChange('foreignNo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="wffsStatus">WFFS Status</Label>
                  <Select value={formData.wffsStatus} onValueChange={(value) => handleInputChange('wffsStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_TESTED">Not tested</SelectItem>
                      <SelectItem value="0">Clear (N/N)</SelectItem>
                      <SelectItem value="1">Carrier (N/WFFS)</SelectItem>
                      <SelectItem value="2">Affected (WFFS/WFFS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="breeder">Breeder</Label>
                  <Input
                    id="breeder"
                    placeholder="e.g., N.V. de Nethe"
                    value={formData.breeder}
                    onChange={(e) => handleInputChange('breeder', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    placeholder="e.g., Stable Name AB"
                    value={formData.owner}
                    onChange={(e) => handleInputChange('owner', e.target.value)}
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