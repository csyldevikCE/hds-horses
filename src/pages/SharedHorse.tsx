import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shareService } from '@/services/shareService'
import { HorseGallery } from '@/components/HorseGallery'
import { PedigreeTree } from '@/components/PedigreeTree'
import { DicomViewer } from '@/components/DicomViewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Heart, Loader2, Trophy, AlertTriangle, Lock, Eye, EyeOff, FileImage, Calendar, User, FileText, Download, Building2, Mail, Phone, Globe, MapPin, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'

const SharedHorse = () => {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordAttempted, setPasswordAttempted] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [viewLogged, setViewLogged] = useState(false)
  const [viewingXRay, setViewingXRay] = useState<string | null>(null)

  // First, get the share link metadata to check if password is required
  const { data: shareLink, isLoading: isLoadingMetadata, error: metadataError } = useQuery({
    queryKey: ['share-link-metadata', token],
    queryFn: () => shareService.getSharedHorseMetadata(token!),
    enabled: !!token,
    retry: false,
  })

  // Then, get the horse data (with password if needed)
  const { data: horse, isLoading, error, refetch } = useQuery({
    queryKey: ['shared-horse', token, password],
    queryFn: () => shareService.getSharedHorse(token!, password || undefined),
    enabled: !!token && (shareLink?.link_type !== 'password_protected' || (shareLink?.link_type === 'password_protected' && passwordAttempted)),
    retry: false,
  })

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordAttempted(true)
    setPasswordError('')
    refetch()
  }

  // Log view when horse is successfully loaded
  // Uses server-side Edge Function for GDPR-compliant geolocation (no third-party US services)
  useEffect(() => {
    if (horse && shareLink && !viewLogged) {
      const logViewWithGeo = async () => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

          // Call Edge Function - geolocation is determined server-side from request headers
          // IP is anonymized (last octet removed) for GDPR compliance
          const response = await fetch(`${supabaseUrl}/functions/v1/log-share-view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              shareLinkId: shareLink.id,
              userAgent: navigator.userAgent,
              referer: document.referrer || undefined,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to log view')
          }

          setViewLogged(true)
        } catch (error) {
          // Fallback: log without geo data using direct service call
          shareService.logView(shareLink.id, undefined, navigator.userAgent, document.referrer || undefined)
          setViewLogged(true)
        }
      }

      logViewWithGeo()
    }
  }, [horse, shareLink, viewLogged])

  // Show loading while fetching metadata
  if (isLoadingMetadata) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    )
  }

  // Show metadata errors
  if (metadataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="HDS Logo" className="w-32 h-auto" />
            </div>
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Link Not Available</h1>
              <p className="text-muted-foreground">
                This share link is invalid or no longer available.
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

  // Show password form for password-protected links
  if (shareLink?.link_type === 'password_protected' && !horse) {
    const hasError = error?.message === 'Incorrect password' || error?.message === 'Password required'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="HDS Logo" className="w-32 h-auto" />
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Password Required</h1>
              <p className="text-muted-foreground">
                This horse profile is password protected. Please enter the password to view.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordError('')
                      setPasswordAttempted(false)
                    }}
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {hasError && (
                  <p className="text-sm text-red-500">
                    Incorrect password. Please try again.
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!password.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Unlock
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show errors for horse data
  if (error) {
    const errorMessage = error.message || 'Unknown error'
    let title = 'Link Not Available'
    let description = 'This share link is invalid or no longer available.'

    if (errorMessage === 'Share link has expired') {
      title = 'Link Expired'
      description = 'This share link has expired. Please contact the owner for a new link.'
    } else if (errorMessage === 'Share link has been used and is no longer available') {
      title = 'Link Already Used'
      description = 'This one-time share link has already been viewed and is no longer available.'
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="HDS Logo" className="w-32 h-auto" />
            </div>
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
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

  // Show loading while fetching horse data
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

  if (!horse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="HDS Logo" className="w-32 h-auto" />
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

  // Render horse details
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo */}
      <div className="bg-white border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="HDS Logo"
              className="w-48 h-auto"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Horse Name - centered on mobile, left-aligned on desktop */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">{horse.name}</h1>
          <p className="text-lg text-muted-foreground mt-2">{horse.breed} • {horse.age} years old</p>
        </div>

        {/* Gallery - Full width */}
        {horse.images && horse.images.length > 0 && (
          <div className="mb-8">
            <HorseGallery horse={horse} />
          </div>
        )}

        {/* Details - Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Basic Info - Always shown */}
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
                    <p className="font-medium">{horse.height} cm</p>
                  </div>
                  {horse.price !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium">
                        {horse.price ? `$${horse.price.toLocaleString()}` : 'Contact for price'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {horse.description && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{horse.description}</p>
                </CardContent>
              </Card>
            )}

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

            {/* Health Records */}
            {horse.health && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Health Records</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vaccinations:</span>
                    <Badge variant={horse.health.vaccinations ? 'default' : 'secondary'}>
                      {horse.health.vaccinations ? 'Up to date' : 'Not current'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coggins:</span>
                    <Badge variant={horse.health.coggins ? 'default' : 'secondary'}>
                      {horse.health.coggins ? 'Current' : 'Not current'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Vet Check:</span>
                    <span className="font-medium">
                      {new Date(horse.health.lastVetCheck).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* X-Rays */}
            {horse.xrays && horse.xrays.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>X-Rays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {horse.xrays.map((xray) => (
                      <Card key={xray.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon/Thumbnail */}
                            <div className="flex-shrink-0">
                              {xray.format === 'dicom' ? (
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                                  <FileImage className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                              ) : (
                                <img
                                  src={xray.file_url}
                                  alt="X-ray"
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={xray.file_type === 'upload' ? 'default' : 'secondary'}>
                                      {xray.file_type === 'upload' ? 'Uploaded' : 'URL'}
                                    </Badge>
                                    <Badge variant="outline">{xray.format.toUpperCase()}</Badge>
                                  </div>
                                  {xray.body_part && (
                                    <p className="font-medium text-sm">{xray.body_part}</p>
                                  )}
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {xray.date_taken && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(xray.date_taken).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {xray.veterinarian_name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    <span>{xray.veterinarian_name}</span>
                                  </div>
                                )}
                                {xray.notes && (
                                  <div className="flex items-start gap-2 mt-2">
                                    <FileText className="h-3 w-3 mt-0.5" />
                                    <span className="line-clamp-3">{xray.notes}</span>
                                  </div>
                                )}
                              </div>

                              {/* View/Download buttons */}
                              <div className="mt-3 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingXRay(xray.id)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(xray.file_url, '_blank')}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Training */}
            {horse.training && (
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
            )}

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

        {/* Contact Information */}
        {(horse.organization || (horse.contacts && horse.contacts.length > 0)) && (
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6 text-center">Contact Information</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Organization Info */}
              {horse.organization && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {horse.organization.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {horse.organization.description && (
                      <p className="text-sm text-muted-foreground">{horse.organization.description}</p>
                    )}

                    {horse.organization.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${horse.organization.email}`} className="text-blue-600 hover:underline">
                          {horse.organization.email}
                        </a>
                      </div>
                    )}

                    {horse.organization.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${horse.organization.phone}`} className="text-blue-600 hover:underline">
                          {horse.organization.phone}
                        </a>
                      </div>
                    )}

                    {horse.organization.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={horse.organization.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {horse.organization.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}

                    {(horse.organization.address_line1 || horse.organization.city) && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          {horse.organization.address_line1 && <div>{horse.organization.address_line1}</div>}
                          {horse.organization.address_line2 && <div>{horse.organization.address_line2}</div>}
                          <div>
                            {[
                              horse.organization.city,
                              horse.organization.state,
                              horse.organization.postal_code
                            ].filter(Boolean).join(', ')}
                          </div>
                          {horse.organization.country && <div>{horse.organization.country}</div>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact Persons */}
              {horse.contacts && horse.contacts.length > 0 && horse.contacts.map((contact) => (
                <Card key={contact.id} className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      {contact.name}
                      {contact.is_primary && (
                        <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                          Primary
                        </Badge>
                      )}
                    </CardTitle>
                    {contact.title && (
                      <p className="text-sm text-muted-foreground">{contact.title}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}

                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* X-Ray Viewer Dialog */}
        {horse.xrays && horse.xrays.length > 0 && (
          <Dialog open={!!viewingXRay} onOpenChange={(open) => !open && setViewingXRay(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {(() => {
                    const xray = horse.xrays.find(x => x.id === viewingXRay)
                    return xray?.body_part ? `X-Ray: ${xray.body_part}` : 'X-Ray Image'
                  })()}
                </DialogTitle>
                <DialogDescription>
                  View and examine the X-ray image in detail
                </DialogDescription>
              </DialogHeader>
              {viewingXRay && (() => {
                const xray = horse.xrays.find(x => x.id === viewingXRay)
                if (!xray) return null

                // Show DICOM viewer for DICOM files
                if (xray.format === 'dicom') {
                  return (
                    <DicomViewer
                      fileUrl={xray.file_url}
                      className="w-full"
                    />
                  )
                }

                // Show regular image for JPEG/PNG
                return (
                  <div className="flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg p-4">
                    <img
                      src={xray.file_url}
                      alt="X-ray"
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  </div>
                )
              })()}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default SharedHorse
