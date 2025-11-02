import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { horseService } from '@/services/horseService';
import { isAdmin } from '@/types/organization';
import { HorseGallery } from '@/components/HorseGallery';
import { ShareHorse } from '@/components/ShareHorse';
import { EditHorseForm } from '@/components/EditHorseForm';
import { YoutubeManager } from '@/components/YoutubeManager';
import { MediaUpload } from '@/components/MediaUpload';
import { PedigreeTree } from '@/components/PedigreeTree';
import { XRayUpload } from '@/components/XRayUpload';
import { XRayList } from '@/components/XRayList';
import { CompetitionManager } from '@/components/CompetitionManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Heart, CheckCircle, Edit, Share2, Trophy, Loader2, Ruler, Weight, DollarSign, Award, Activity, Syringe } from 'lucide-react';

const HorseDetail = () => {
  const { id } = useParams();
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: horse, isLoading, error } = useQuery({
    queryKey: ['horse', id],
    queryFn: () => horseService.getHorse(id!),
    enabled: !!id,
  });

  if (isLoading) {
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
      default: return 'bg-muted border-border';
    }
  };

  const primaryImage = horse.images?.find(img => img.isPrimary) || horse.images?.[0];
  const defaultImage = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1200&q=80';

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
                <YoutubeManager horse={horse} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section with Image */}
      <div className="relative h-[300px] md:h-[400px] bg-muted overflow-hidden">
        <img
          src={primaryImage?.url || defaultImage}
          alt={horse.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = defaultImage;
          }}
        />
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
              {horse.price && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 md:px-6 md:py-4">
                  <p className="text-sm text-white/70 mb-1">Asking Price</p>
                  <p className="text-2xl md:text-3xl font-bold">${horse.price.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            {horse.pedigree && (
              <TabsTrigger value="pedigree" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
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
                    <p className="font-semibold">{horse.height}</p>
                  </div>
                </CardContent>
              </Card>
              {horse.weight && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Weight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-semibold">{horse.weight} lbs</p>
                    </div>
                  </CardContent>
                </Card>
              )}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Health Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-5 w-5 ${horse.health.vaccinations ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Vaccinations</span>
                  </div>
                  <Badge variant={horse.health.vaccinations ? 'default' : 'secondary'}>
                    {horse.health.vaccinations ? 'Current' : 'Needs Update'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-5 w-5 ${horse.health.coggins ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Coggins Test</span>
                  </div>
                  <Badge variant={horse.health.coggins ? 'default' : 'secondary'}>
                    {horse.health.coggins ? 'Current' : 'Needs Update'}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Last Veterinary Check</p>
                  <p className="font-medium">{new Date(horse.health.lastVetCheck).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* X-Rays */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>X-Ray Records</CardTitle>
                  {isAdmin(userRole) && <XRayUpload horseId={horse.id} />}
                </div>
              </CardHeader>
              <CardContent>
                <XRayList horseId={horse.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Competition Results
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