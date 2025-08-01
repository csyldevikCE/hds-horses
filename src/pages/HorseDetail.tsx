import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sampleHorses } from '@/data/sampleHorses';
import { HorseGallery } from '@/components/HorseGallery';
import { MediaUpload } from '@/components/MediaUpload';
import { ShareHorse } from '@/components/ShareHorse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Heart, CheckCircle, Edit, Share2, Trophy } from 'lucide-react';

const HorseDetail = () => {
  const { id } = useParams();
  const horse = sampleHorses.find(h => h.id === id);
  const [isEditMode, setIsEditMode] = useState(false);

  if (!horse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Horse not found</h1>
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
    <div className="min-h-screen bg-gradient-hero">
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
          <div className="flex items-center gap-2">
            <ShareHorse horse={horse}>
              <Button variant="outline" size="sm" className="gap-2 hover-scale">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </ShareHorse>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="hover-scale"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode ? 'Done' : 'Edit Media'}
            </Button>
            <Badge className={getStatusColor(horse.status)}>
              {horse.status}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <HorseGallery horse={horse} />
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
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Sire:</span>
                    <p className="font-medium">{horse.pedigree.sire}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dam:</span>
                    <p className="font-medium">{horse.pedigree.dam}</p>
                  </div>
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
                  <span className="text-muted-foreground">Disciplines:</span>
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

            {/* Media Upload */}
            {isEditMode && (
              <div className="animate-fade-in">
                <MediaUpload onMediaAdd={(files) => console.log('New media files:', files)} />
              </div>
            )}

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