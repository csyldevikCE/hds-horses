import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { horseService } from '@/services/horseService';
import { isAdmin } from '@/types/organization';
import { HorseGallery } from '@/components/HorseGallery';
import { ShareHorse } from '@/components/ShareHorse';
import { EditHorseForm } from '@/components/EditHorseForm';
import { MediaUpload } from '@/components/MediaUpload';
import { PedigreeTree } from '@/components/PedigreeTree';
import { XRayUpload } from '@/components/XRayUpload';
import { XRayList } from '@/components/XRayList';
import { CompetitionManager } from '@/components/CompetitionManager';
import { VaccinationManager } from '@/components/VaccinationManager';
import { VaccinationLog } from '@/components/VaccinationLog';
import { VetVisitManager } from '@/components/VetVisitManager';
import { VetVisitList } from '@/components/VetVisitList';
import { VetDocUpload } from '@/components/VetDocUpload';
import { VetDocList } from '@/components/VetDocList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Info, CheckCircle, Edit, Share2, Trophy, Loader2, Ruler, DollarSign, GitBranch, Images, Syringe, Activity, Award, FileText, ExternalLink } from 'lucide-react';

const HorseDetail = () => {
  const { id } = useParams();
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: horse, isLoading, isFetching, error } = useQuery({
    queryKey: ['horse', id],
    queryFn: () => horseService.getHorse(id!),
    enabled: !!id,
    retry: 2,
    staleTime: 30000, // 30 seconds
  });

  // Only show loading if query is enabled and actively fetching
  const isActuallyLoading = !!id && (isLoading || isFetching) && !horse;

  if (isActuallyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Loading horse...</h1>
        </div>
      </div>
    );
  }

  if (error || !horse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Horse not found</h1>
          <p className="text-muted-foreground mb-4">
            The horse you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link to="/">
            <Button>Return to Inventory</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'Sold': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
      case 'Reserved': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'Not for Sale': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const primaryImage = horse.images?.find(img => img.isPrimary) || horse.images?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>

            {isAdmin(userRole) && (
              <div className="flex items-center gap-2">
                <ShareHorse horse={horse}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </ShareHorse>
                <EditHorseForm horse={horse}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                </EditHorseForm>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section with Image */}
      <div className="relative h-[300px] md:h-[400px] bg-muted overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={horse.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-9xl">🐎</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{horse.name}</h1>
                <p className="text-lg md:text-xl text-white/90 mb-3">
                  {horse.breed} • {horse.age} years • {horse.gender} • {horse.color}
                </p>
                <Badge className={`${getStatusColor(horse.status)} backdrop-blur-sm`}>
                  {horse.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            {horse.pedigree && (
              <TabsTrigger value="pedigree" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Pedigree
              </TabsTrigger>
            )}
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="font-semibold">{horse.height} cm</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-semibold">{horse.age} years</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold text-sm">{horse.location}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">{horse.price ? `$${horse.price.toLocaleString()}` : 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About {horse.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{horse.description}</p>
              </CardContent>
            </Card>

            {/* Training Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Training & Disciplines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Training Level</p>
                  <Badge variant="secondary" className="text-sm">{horse.training.level}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Competing Levels</p>
                  <div className="flex flex-wrap gap-2">
                    {horse.training.disciplines.map((discipline) => (
                      <Badge key={discipline} variant="outline">
                        {discipline}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Information */}
            {(horse.regno || horse.chipNumber || horse.lifeNo || horse.studBookNo || horse.foreignNo || horse.owner || horse.breeder || horse.wffsStatus !== undefined || horse.blupUrl) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Registration Information
                    </CardTitle>
                    {horse.blupUrl && (
                      <a
                        href={horse.blupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on BLUP
                      </a>
                    )}
                  </div>
                  {horse.lastBlupSync && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last synced with BLUP: {new Date(horse.lastBlupSync).toLocaleDateString()} at {new Date(horse.lastBlupSync).toLocaleTimeString()}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {horse.regno && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Registration Number</p>
                        <p className="font-medium">{horse.regno}</p>
                      </div>
                    )}
                    {horse.chipNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Microchip Number</p>
                        <p className="font-medium font-mono text-sm">{horse.chipNumber}</p>
                      </div>
                    )}
                    {horse.lifeNo && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Life Number</p>
                        <p className="font-medium font-mono text-sm">{horse.lifeNo}</p>
                      </div>
                    )}
                    {horse.studBookNo && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Studbook Number</p>
                        <p className="font-medium">{horse.studBookNo}</p>
                      </div>
                    )}
                    {horse.foreignNo && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Foreign Registration</p>
                        <p className="font-medium">{horse.foreignNo}</p>
                      </div>
                    )}
                    {horse.owner && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Owner</p>
                        <p className="font-medium">{horse.owner}</p>
                      </div>
                    )}
                    {horse.breeder && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Breeder</p>
                        <p className="font-medium">{horse.breeder}</p>
                      </div>
                    )}
                    {horse.wffsStatus !== undefined && horse.wffsStatus !== null && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">WFFS Status</p>
                        <Badge variant={horse.wffsStatus === 0 ? 'default' : horse.wffsStatus === 1 ? 'secondary' : 'destructive'} className="font-medium">
                          {horse.wffsStatus === 0 ? 'Clear (N/N)' :
                           horse.wffsStatus === 1 ? 'Carrier (N/WFFS)' :
                           horse.wffsStatus === 2 ? 'Affected (WFFS/WFFS)' :
                           'Not tested'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <HorseGallery horse={horse} />

            {isAdmin(userRole) && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <MediaUpload horseId={horse.id} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pedigree Tab */}
          {horse.pedigree && (
            <TabsContent value="pedigree">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    4-Generation Pedigree
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PedigreeTree
                    horseName={horse.name}
                    pedigree={horse.pedigree}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-6">
            {/* Veterinary Visits */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-base sm:text-lg">Veterinary Visits</span>
                  </CardTitle>
                  {isAdmin(userRole) && <VetVisitManager horseId={horse.id} />}
                </div>
              </CardHeader>
              <CardContent>
                <VetVisitList horseId={horse.id} />
              </CardContent>
            </Card>

            {/* Vaccination Log */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5 text-primary" />
                    <span className="text-base sm:text-lg">Vaccination Records</span>
                  </CardTitle>
                  {isAdmin(userRole) && <VaccinationManager horseId={horse.id} />}
                </div>
              </CardHeader>
              <CardContent>
                <VaccinationLog horseId={horse.id} />
              </CardContent>
            </Card>

            {/* X-Rays */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">X-Ray Records</CardTitle>
                  {isAdmin(userRole) && <XRayUpload horseId={horse.id} />}
                </div>
              </CardHeader>
              <CardContent>
                <XRayList horseId={horse.id} />
              </CardContent>
            </Card>

            {/* Veterinary Documents */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-base sm:text-lg">Veterinary Documents</span>
                  </CardTitle>
                  {isAdmin(userRole) && <VetDocUpload horseId={horse.id} />}
                </div>
              </CardHeader>
              <CardContent>
                <VetDocList horseId={horse.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <span className="text-base sm:text-lg">Competition Results</span>
                  </CardTitle>
                  {isAdmin(userRole) && <CompetitionManager horseId={horse.id} />}
                </div>
              </CardHeader>
              <CardContent>
                {!horse.competitions || horse.competitions.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No competition results yet.
                    </p>
                    {isAdmin(userRole) && (
                      <p className="text-sm text-muted-foreground">
                        Click "Add Result" above to record competition achievements.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {horse.competitions.map((competition) => (
                      <div key={competition.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{competition.event}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{competition.discipline}</p>
                            {competition.notes && (
                              <p className="text-sm text-foreground mt-2 p-3 bg-muted/50 rounded-md">
                                {competition.notes}
                              </p>
                            )}
                            {competition.equipeLink && (
                              <a
                                href={competition.equipeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                              >
                                <Trophy className="h-4 w-4" />
                                View Full Results →
                              </a>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              variant={competition.placement.includes('1st') ? 'default' : 'secondary'}
                              className={`text-base ${competition.placement.includes('1st') ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                            >
                              {competition.placement}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {new Date(competition.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HorseDetail;