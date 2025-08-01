import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shareService } from '@/services/shareService'
import { HorseGallery } from '@/components/HorseGallery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Heart, Clock, AlertTriangle, Loader2, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'

const SharedHorse = () => {
  const { token } = useParams()

  const { data: horse, isLoading, error } = useQuery({
    queryKey: ['shared-horse', token],
    queryFn: () => shareService.getSharedHorse(token!),
    enabled: !!token,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Loading horse information...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Stable Story Hub Logo" className="w-32 h-auto" />
            </div>
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Link Not Available</h1>
              <p className="text-muted-foreground">
                {error.message === 'Share link has expired' 
                  ? 'This share link has expired. Please contact the owner for a new link.'
                  : 'This share link is invalid or no longer available.'
                }
              </p>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!horse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Stable Story Hub Logo" className="w-32 h-auto" />
            </div>
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Horse Not Found</h1>
              <p className="text-muted-foreground">
                The horse you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
        {/* Horse Name - spans full width above content */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{horse.name}</h1>
          <p className="text-muted-foreground">{horse.breed} • {horse.age} years old</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <div className="space-y-6">
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
                </div>
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
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {/* Generation 1 */}
                    <div className="col-span-4 p-2 bg-muted/20 rounded border">
                      <div className="font-semibold text-center">{horse.name}</div>
                    </div>
                    
                    {/* Generation 2 */}
                    <div className="col-span-2 p-2 bg-muted/10 rounded border">
                      <div className="text-muted-foreground text-xs">Sire</div>
                      <div className="font-medium">{horse.pedigree.sire}</div>
                    </div>
                    <div className="col-span-2 p-2 bg-muted/10 rounded border">
                      <div className="text-muted-foreground text-xs">Dam</div>
                      <div className="font-medium">{horse.pedigree.dam}</div>
                    </div>
                    
                    {/* Generation 3 */}
                    {horse.pedigree.sireSire && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">Sire's Sire</div>
                        <div className="font-medium text-xs">{horse.pedigree.sireSire}</div>
                      </div>
                    )}
                    {horse.pedigree.sireDam && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">Sire's Dam</div>
                        <div className="font-medium text-xs">{horse.pedigree.sireDam}</div>
                      </div>
                    )}
                    {horse.pedigree.damSire && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">Dam's Sire</div>
                        <div className="font-medium text-xs">{horse.pedigree.damSire}</div>
                      </div>
                    )}
                    {horse.pedigree.damDam && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">Dam's Dam</div>
                        <div className="font-medium text-xs">{horse.pedigree.damDam}</div>
                      </div>
                    )}
                    
                    {/* Generation 4 - Only show if we have data */}
                    {horse.pedigree.sireSireSire && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">SSS</div>
                        <div className="font-medium text-xs">{horse.pedigree.sireSireSire}</div>
                      </div>
                    )}
                    {horse.pedigree.sireSireDam && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">SSD</div>
                        <div className="font-medium text-xs">{horse.pedigree.sireSireDam}</div>
                      </div>
                    )}
                    {horse.pedigree.sireDamSire && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">SDS</div>
                        <div className="font-medium text-xs">{horse.pedigree.sireDamSire}</div>
                      </div>
                    )}
                    {horse.pedigree.sireDamDam && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">SDD</div>
                        <div className="font-medium text-xs">{horse.pedigree.sireDamDam}</div>
                      </div>
                    )}
                    {horse.pedigree.damSireSire && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">DSS</div>
                        <div className="font-medium text-xs">{horse.pedigree.damSireSire}</div>
                      </div>
                    )}
                    {horse.pedigree.damSireDam && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">DSD</div>
                        <div className="font-medium text-xs">{horse.pedigree.damSireDam}</div>
                      </div>
                    )}
                    {horse.pedigree.damDamSire && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">DDS</div>
                        <div className="font-medium text-xs">{horse.pedigree.damDamSire}</div>
                      </div>
                    )}
                    {horse.pedigree.damDamDam && (
                      <div className="p-1 bg-muted/5 rounded border text-center">
                        <div className="text-muted-foreground text-xs">DDD</div>
                        <div className="font-medium text-xs">{horse.pedigree.damDamDam}</div>
                      </div>
                    )}
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


          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedHorse 