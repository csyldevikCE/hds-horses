import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { horseService } from '@/services/horseService';
import { HorseGallery } from '@/components/HorseGallery';
import { ShareHorse } from '@/components/ShareHorse';
import { EditHorseForm } from '@/components/EditHorseForm';
import { YoutubeManager } from '@/components/YoutubeManager';
import { MediaUpload } from '@/components/MediaUpload';
import { PedigreeTree } from '@/components/PedigreeTree';
import { XRayUpload } from '@/components/XRayUpload';
import { XRayList } from '@/components/XRayList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Heart, CheckCircle, Edit, Share2, Trophy, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const HorseDetail = () => {
  const { id } = useParams();

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
      case 'Available': return 'bg-stable-green text-cream';
      case 'Sold': return 'bg-destructive';
      case 'Reserved': return 'bg-hay-gold text-horse-brown';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div className="bg-white border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Stable Story Hub Logo"
              className="w-48 h-auto"
            />
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="icon" className="border-border hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{horse.name}</h1>
            <p className="text-muted-foreground">{horse.breed} • {horse.age} years old</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ShareHorse horse={horse}>
                <Button variant="outline" size="sm" className="gap-2 hover-scale">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden xs:inline">Share</span>
                </Button>
              </ShareHorse>
              <EditHorseForm horse={horse}>
                <Button variant="outline" size="sm" className="hover-scale">
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Edit Horse</span>
                </Button>
              </EditHorseForm>
              <YoutubeManager horse={horse} />
            </div>
            <Badge className={getStatusColor(horse.status)}>
              {horse.status}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <div className="space-y-6">
            <HorseGallery horse={horse} />
            
            {/* Media Upload */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Add Media</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUpload horseId={horse.id} />
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-horse-brown" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <p className="font-medium">{horse.gender}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Color:</span>
                    <p className="font-medium">{horse.color}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Height:</span>
                    <p className="font-medium">{horse.height}</p>
                  </div>
                  {horse.weight && (
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <p className="font-medium">{horse.weight} lbs</p>
                    </div>
                  )}
                </div>
                
                {horse.price && (
                  <div className="pt-4 border-t border-border">
                    <span className="text-lg font-bold text-horse-brown">
                      ${horse.price.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{horse.description}</p>
              </CardContent>
            </Card>

            {/* Pedigree */}
            {horse.pedigree && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Pedigree</CardTitle>
                </CardHeader>
                <CardContent>
                  <PedigreeTree
                    horseName={horse.name}
                    pedigree={horse.pedigree}
                  />
                </CardContent>
              </Card>
            )}

            {/* Training */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Training & Disciplines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-muted-foreground">Training Level:</span>
                  <p className="font-medium">{horse.training.level}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Competing level:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {horse.training.disciplines.map((discipline) => (
                      <Badge key={discipline} variant="secondary">
                        {discipline}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competition Results */}
            {horse.competitions && horse.competitions.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Competition Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {horse.competitions.map((competition) => (
                    <div key={competition.id} className="border-l-4 border-primary/20 pl-4 py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{competition.event}</h4>
                          <p className="text-sm text-muted-foreground">{competition.discipline}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={competition.placement.includes('1st') ? 'default' : 'secondary'}
                            className={competition.placement.includes('1st') ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          >
                            {competition.placement}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(competition.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {competition.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {competition.notes}
                        </p>
                      )}
                      {competition.equipeLink && (
                        <div className="mt-2">
                          <a 
                            href={competition.equipeLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            View on Equipe →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Health */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-stable-green" />
                  Health Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${horse.health.vaccinations ? 'text-stable-green' : 'text-muted-foreground'}`} />
                  <span className="text-sm">Current Vaccinations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${horse.health.coggins ? 'text-stable-green' : 'text-muted-foreground'}`} />
                  <span className="text-sm">Current Coggins Test</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Vet Check:</span>
                  <p className="font-medium">{new Date(horse.health.lastVetCheck).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* X-Rays */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>X-Rays</CardTitle>
                  <XRayUpload horseId={horse.id} />
                </div>
              </CardHeader>
              <CardContent>
                <XRayList horseId={horse.id} />
              </CardContent>
            </Card>

            {/* Location & Date */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {horse.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Added {new Date(horse.dateAdded).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorseDetail;