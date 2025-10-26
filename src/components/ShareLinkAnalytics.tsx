import { useQuery } from '@tanstack/react-query'
import { shareService } from '@/services/shareService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, Users, Clock, Globe, TrendingUp, MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'

interface ShareLinkAnalyticsProps {
  shareLinkId: string
  children: React.ReactNode
}

export const ShareLinkAnalytics = ({ shareLinkId, children }: ShareLinkAnalyticsProps) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['share-link-analytics', shareLinkId],
    queryFn: () => shareService.getShareLinkAnalytics(shareLinkId),
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  })

  if (isLoading) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Link Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!analytics) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const then = new Date(dateString)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // World map data
  const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

  // Create color scale for map
  const maxViews = Math.max(...Object.values(analytics.viewsByCountry), 1)
  const colorScale = scaleLinear<string>()
    .domain([0, maxViews])
    .range(['#e0f2fe', '#0369a1']) // Light blue to dark blue

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Link Analytics
          </DialogTitle>
          <CardDescription>
            Detailed tracking and statistics for this share link
          </CardDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalViews}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Unique Visitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.uniqueVisitors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Last 24h
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.recentViews}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {analytics.lastViewed ? formatRelativeTime(analytics.lastViewed) : 'Never'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Views by Date */}
          {Object.keys(analytics.viewsByDate).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Views by Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.viewsByDate)
                    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                    .slice(0, 7) // Show last 7 days
                    .map(([date, count]) => (
                      <div key={date} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{date}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{
                                width: `${(count / Math.max(...Object.values(analytics.viewsByDate))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Geographic Distribution with Map */}
          {Object.keys(analytics.viewsByCountry).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>
                  Views by location around the world
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* World Map */}
                <div className="w-full bg-muted/20 rounded-lg p-4">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 120,
                      center: [0, 20]
                    }}
                    style={{
                      width: '100%',
                      height: 'auto'
                    }}
                  >
                    <ZoomableGroup>
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const countryName = geo.properties.name
                            const viewCount = analytics.viewsByCountry[countryName] || 0

                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={viewCount > 0 ? colorScale(viewCount) : '#f0f0f0'}
                                stroke="#ffffff"
                                strokeWidth={0.5}
                                style={{
                                  default: {
                                    outline: 'none'
                                  },
                                  hover: {
                                    fill: viewCount > 0 ? '#0284c7' : '#e5e5e5',
                                    outline: 'none',
                                    cursor: viewCount > 0 ? 'pointer' : 'default'
                                  },
                                  pressed: {
                                    outline: 'none'
                                  }
                                }}
                              >
                                {viewCount > 0 && (
                                  <title>{`${countryName}: ${viewCount} ${viewCount === 1 ? 'view' : 'views'}`}</title>
                                )}
                              </Geography>
                            )
                          })
                        }
                      </Geographies>
                    </ZoomableGroup>
                  </ComposableMap>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e0f2fe' }} />
                    <span>Low views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0369a1' }} />
                    <span>High views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-200" />
                    <span>No views</span>
                  </div>
                </div>

                {/* Country List */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Top Countries</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.viewsByCountry)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([country, count]) => (
                        <div key={country} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{country}</span>
                          <Badge variant="secondary">{count} views</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Views */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Views</CardTitle>
              <CardDescription>Last 10 views with details</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.views.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No views yet
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.views.slice(0, 10).map((view: any) => {
                    const isNewIP = view.ip_address &&
                      analytics.ipFirstSeen[view.ip_address] === view.viewed_at

                    return (
                      <div
                        key={view.id}
                        className="flex items-start justify-between p-3 border rounded-lg text-sm"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{formatDate(view.viewed_at)}</span>
                            {isNewIP && (
                              <Badge variant="default" className="text-xs">
                                New Visitor
                              </Badge>
                            )}
                          </div>
                          {view.ip_address && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">IP: {view.ip_address}</span>
                              {view.country && (
                                <span className="text-xs">• {view.country}</span>
                              )}
                              {view.city && (
                                <span className="text-xs">• {view.city}</span>
                              )}
                            </div>
                          )}
                          {view.user_agent && (
                            <div className="text-xs text-muted-foreground truncate max-w-md">
                              {view.user_agent}
                            </div>
                          )}
                          {view.referer && (
                            <div className="text-xs text-muted-foreground">
                              From: {view.referer}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unique Visitors List */}
          {analytics.uniqueVisitors > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unique Visitors</CardTitle>
                <CardDescription>
                  IP addresses and when they first accessed the link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.ipFirstSeen)
                    .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
                    .map(([ip, firstSeen]) => {
                      const viewCount = analytics.views.filter(
                        (v: any) => v.ip_address === ip
                      ).length

                      return (
                        <div
                          key={ip}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{ip}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              First seen: {formatRelativeTime(firstSeen)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {viewCount} {viewCount === 1 ? 'view' : 'views'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
