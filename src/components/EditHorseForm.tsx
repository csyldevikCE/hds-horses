import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Horse } from '@/types/horse';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MediaUpload } from '@/components/MediaUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { horseService } from '@/services/horseService';
import { blupService, BlupHorseData } from '@/services/blupService';
import { Edit, Loader2, Download, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface EditHorseFormProps {
  horse: Horse;
  children: React.ReactNode;
}

export const EditHorseForm = ({ horse, children }: EditHorseFormProps) => {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // BLUP Import State
  const [blupRegno, setBlupRegno] = useState('');
  const [isLoadingBlup, setIsLoadingBlup] = useState(false);
  const [blupError, setBlupError] = useState<string | null>(null);
  const [blupSuccess, setBlupSuccess] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize form data from horse prop
  const getInitialFormData = () => ({
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

    // BLUP fields
    regno: horse.regno || '',
    chipNumber: horse.chipNumber || '',
    wffsStatus: horse.wffsStatus !== undefined ? horse.wffsStatus.toString() : 'NOT_TESTED',
    studBookNo: horse.studBookNo || '',
    lifeNo: horse.lifeNo || '',
    foreignNo: horse.foreignNo || '',
    owner: horse.owner || '',
    breeder: horse.breeder || '',
    blupUrl: horse.blupUrl || '',
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form when dialog opens (only on initial open, not on every state change)
  useEffect(() => {
    if (open && !hasInitialized) {
      // Only reset when dialog first opens, not on subsequent re-renders
      setFormData(getInitialFormData());
      setBlupRegno('');
      setBlupError(null);
      setBlupSuccess(false);
      setHasInitialized(true);
    } else if (!open && hasInitialized) {
      // Reset initialization flag when dialog closes
      setHasInitialized(false);
    }
    // Only depend on 'open' to avoid resetting when other state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasInitialized]);

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      // Update form with BLUP data
      const updatedFormData = {
        ...formData,
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
      };

      setFormData(updatedFormData);
      setBlupSuccess(true);
      toast({
        title: 'Horse data imported successfully!',
        description: `${blupData.name} data has been loaded from BLUP. Review and save changes.`,
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

  // Update horse mutation
  const updateHorseMutation = useMutation({
    mutationFn: async () => {
      const updatedHorse: Partial<Horse> & {
        regno?: string;
        chipNumber?: string;
        wffsStatus?: number;
        studBookNo?: string;
        lifeNo?: string;
        foreignNo?: string;
        owner?: string;
        breeder?: string;
        blupUrl?: string;
        lastBlupSync?: string;
      } = {
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
        // BLUP fields - only if they exist in formData (TypeScript type widening)
        ...(formData.regno && { regno: formData.regno }),
        ...(formData.chipNumber && { chipNumber: formData.chipNumber }),
        ...(formData.wffsStatus !== '' && formData.wffsStatus !== 'NOT_TESTED' && { wffsStatus: parseInt(formData.wffsStatus) }),
        ...(formData.studBookNo && { studBookNo: formData.studBookNo }),
        ...(formData.lifeNo && { lifeNo: formData.lifeNo }),
        ...(formData.foreignNo && { foreignNo: formData.foreignNo }),
        ...(formData.owner && { owner: formData.owner }),
        ...(formData.breeder && { breeder: formData.breeder }),
        ...(formData.blupUrl && { blupUrl: formData.blupUrl }),
        ...(formData.regno && { lastBlupSync: new Date().toISOString() }),
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update horse. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete horse mutation
  const deleteHorseMutation = useMutation({
    mutationFn: () => horseService.deleteHorse(horse.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses', organization?.id] });
      toast({
        title: "Horse Deleted",
        description: `${horse.name} has been permanently deleted.`,
      });
      setOpen(false);
      setShowDeleteConfirm(false);
      navigate('/');
    },
    onError: (error) => {
      console.error('Error deleting horse:', error);
      toast({
        title: "Error",
        description: "Failed to delete horse. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHorseMutation.mutate();
  };

  const handleDelete = () => {
    deleteHorseMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit {horse.name}
          </DialogTitle>
          <DialogDescription>
            Update horse information, pedigree, training details, and registration data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* BLUP Import Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Update from BLUP System</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Enter a registration number to update this horse with latest data from the BLUP system
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
                    Horse data updated successfully! Review the changes below and click "Update Horse" to save.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

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

          {/* Registration Details (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Details (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regno">Registration Number</Label>
                <Input
                  id="regno"
                  placeholder="e.g., 04204021"
                  value={formData.regno}
                  onChange={(e) => handleInputChange('regno', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chipNumber">Microchip Number</Label>
                <Input
                  id="chipNumber"
                  placeholder="e.g., 981100004755899"
                  value={formData.chipNumber}
                  onChange={(e) => handleInputChange('chipNumber', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifeNo">Life Number</Label>
                <Input
                  id="lifeNo"
                  placeholder="e.g., 528003202010695"
                  value={formData.lifeNo}
                  onChange={(e) => handleInputChange('lifeNo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studBookNo">Studbook Number</Label>
                <Input
                  id="studBookNo"
                  value={formData.studBookNo}
                  onChange={(e) => handleInputChange('studBookNo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foreignNo">Foreign Registration</Label>
                <Input
                  id="foreignNo"
                  placeholder="e.g., 528003202010695 Reg. A"
                  value={formData.foreignNo}
                  onChange={(e) => handleInputChange('foreignNo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="breeder">Breeder</Label>
                <Input
                  id="breeder"
                  placeholder="e.g., N.V. de Nethe"
                  value={formData.breeder}
                  onChange={(e) => handleInputChange('breeder', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  placeholder="e.g., Stable Name AB"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
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
              <MediaUpload 
                horseId={horse.id}
                onMediaAdd={() => {}}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteHorseMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Horse
            </Button>
            <div className="flex gap-2">
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
          </div>
          </div>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete {horse.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the horse and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Images and videos</li>
                <li>Competition results</li>
                <li>Vaccination records</li>
                <li>Veterinary visits and documents</li>
                <li>X-ray records</li>
                <li>Share links</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteHorseMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteHorseMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteHorseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Horse'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};