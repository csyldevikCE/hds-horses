import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { shareService, ShareLinkType, ShareableField } from '@/services/shareService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Share2, Copy, Clock, Trash2, ExternalLink, Loader2, Lock, Eye, Calendar, CheckSquare, Edit, BarChart3 } from 'lucide-react'
import { ShareLinkAnalytics } from '@/components/ShareLinkAnalytics'

interface ShareHorseProps {
  horse: { id: string; name: string }
  children: React.ReactNode
}

const EXPIRY_PRESETS = [
  { label: '1 Hour', hours: 1 },
  { label: '12 Hours', hours: 12 },
  { label: '1 Day', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '1 Week', hours: 168 },
  { label: '1 Month', hours: 720 },
]

const SHAREABLE_FIELDS: { value: ShareableField; label: string; description: string }[] = [
  { value: 'basic_info', label: 'Basic Info', description: 'Name, breed, age, color, gender, height' },
  { value: 'description', label: 'Description', description: 'Full text description' },
  { value: 'pedigree', label: 'Pedigree', description: '4-generation pedigree tree' },
  { value: 'health', label: 'Health Records', description: 'Vaccinations, coggins, vet check dates' },
  { value: 'training', label: 'Training', description: 'Training level and disciplines' },
  { value: 'competitions', label: 'Competition Results', description: 'Event history and placements' },
  { value: 'images', label: 'Images', description: 'Photo gallery' },
  { value: 'videos', label: 'Videos', description: 'YouTube videos' },
  { value: 'xrays', label: 'X-Rays', description: 'Veterinary X-ray images and reports' },
  { value: 'price', label: 'Price', description: 'Asking price' },
]

export const ShareHorse = ({ horse, children }: ShareHorseProps) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [editingLink, setEditingLink] = useState<any | null>(null)

  // Form state
  const [recipientName, setRecipientName] = useState('')
  const [linkType, setLinkType] = useState<ShareLinkType>('standard')
  const [expiryPreset, setExpiryPreset] = useState('12')
  const [password, setPassword] = useState('')
  const [maxViews, setMaxViews] = useState('1')
  const [sharedFields, setSharedFields] = useState<ShareableField[]>([
    'basic_info',
    'description',
    'pedigree',
    'training',
    'competitions',
    'images',
    'videos'
  ])

  const { user, organization } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get existing share links for this organization
  const { data: shareLinks = [], isLoading } = useQuery({
    queryKey: ['share-links', organization?.id],
    queryFn: () => shareService.getOrganizationShareLinks(organization?.id || ''),
    enabled: !!organization?.id,
    refetchOnMount: true,
  })

  const horseShareLinks = shareLinks.filter((link: any) => link.horse_id === horse.id)

  // Calculate expiry date
  const getExpiryDate = (): string => {
    const hours = parseInt(expiryPreset)
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
  }

  // Create new share link
  const createShareLinkMutation = useMutation({
    mutationFn: () => {
      const params = {
        horseId: horse.id,
        organizationId: organization?.id || '',
        userId: user?.id || '',
        recipientName,
        linkType,
        expiresAt: getExpiryDate(),
        password: linkType === 'password_protected' ? password : undefined,
        maxViews: linkType === 'one_time' ? parseInt(maxViews) : undefined,
        sharedFields,
      }
      return shareService.createShareLink(params)
    },
    onSuccess: async () => {
      // Invalidate and refetch the share links immediately
      await queryClient.invalidateQueries({ queryKey: ['share-links', organization?.id] })
      await queryClient.refetchQueries({ queryKey: ['share-links', organization?.id] })

      // Reset form
      setRecipientName('')
      setPassword('')
      setMaxViews('1')
      setSharedFields(['basic_info', 'description', 'pedigree', 'training', 'competitions', 'images', 'videos'])

      toast({
        title: "Share link created!",
        description: `Share link for ${recipientName} is now active.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error creating share link",
        description: error.message || "Failed to create share link. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Delete share link
  const deleteShareLinkMutation = useMutation({
    mutationFn: ({ shareLinkId }: { shareLinkId: string }) =>
      shareService.deleteShareLink(shareLinkId),
    onSuccess: async () => {
      // Invalidate and refetch the share links immediately
      await queryClient.invalidateQueries({ queryKey: ['share-links', organization?.id] })
      await queryClient.refetchQueries({ queryKey: ['share-links', organization?.id] })

      toast({
        title: "Share link deleted",
        description: "The share link has been removed.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error deleting share link",
        description: "Failed to delete share link. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Update share link
  const updateShareLinkMutation = useMutation({
    mutationFn: () => {
      if (!editingLink) throw new Error('No link selected for editing')

      return shareService.updateShareLink({
        shareLinkId: editingLink.id,
        recipientName,
        expiresAt: getExpiryDate(),
        sharedFields,
      })
    },
    onSuccess: async () => {
      // Invalidate and refetch the share links immediately
      await queryClient.invalidateQueries({ queryKey: ['share-links', organization?.id] })
      await queryClient.refetchQueries({ queryKey: ['share-links', organization?.id] })

      setEditingLink(null)

      // Reset form
      setRecipientName('')
      setExpiryPreset('12')
      setSharedFields(['basic_info', 'description', 'pedigree', 'training', 'competitions', 'images', 'videos'])

      toast({
        title: "Share link updated!",
        description: "The share link has been updated successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error updating share link",
        description: error.message || "Failed to update share link. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Start editing a link
  const startEdit = (link: any) => {
    setEditingLink(link)
    setRecipientName(link.recipient_name)
    setSharedFields(link.shared_fields || ['basic_info'])

    // Calculate hours until expiry for preset
    const now = new Date()
    const expires = new Date(link.expires_at)
    const hoursRemaining = Math.max(1, Math.round((expires.getTime() - now.getTime()) / (1000 * 60 * 60)))

    // Find closest preset or use current value
    const presets = EXPIRY_PRESETS.map(p => p.hours)
    const closest = presets.reduce((prev, curr) =>
      Math.abs(curr - hoursRemaining) < Math.abs(prev - hoursRemaining) ? curr : prev
    )
    setExpiryPreset(closest.toString())
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingLink(null)
    setRecipientName('')
    setExpiryPreset('12')
    setSharedFields(['basic_info', 'description', 'pedigree', 'training', 'competitions', 'images', 'videos'])
  }

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(linkId)
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard.",
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`
  }

  const toggleField = (field: ShareableField) => {
    setSharedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    )
  }

  const selectAllFields = () => {
    setSharedFields(SHAREABLE_FIELDS.map(f => f.value))
  }

  const deselectAllFields = () => {
    setSharedFields(['basic_info']) // Always include basic_info
  }

  const isFormValid = () => {
    if (!recipientName.trim()) return false
    if (linkType === 'password_protected' && !password.trim()) return false
    if (sharedFields.length === 0) return false
    return true
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {horse.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Share Link Form */}
          <Card>
            <CardHeader>
              <CardTitle>{editingLink ? 'Edit Share Link' : 'Create Share Link'}</CardTitle>
              <CardDescription>
                {editingLink
                  ? 'Update recipient name, expiry time, or shared content'
                  : 'Generate a custom share link with configurable security and content options'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {editingLink && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Editing:</strong> {shareService.getLinkTypeLabel(editingLink.link_type)} link for {editingLink.recipient_name}
                  </p>
                </div>
              )}

              {/* Recipient Name */}
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient Name</Label>
                <Input
                  id="recipient-name"
                  placeholder="Enter client's name or organization"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>

              {/* Link Type - Only show when creating */}
              {!editingLink && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Link Type
                  </Label>
                  <RadioGroup value={linkType} onValueChange={(value) => setLinkType(value as ShareLinkType)}>
                    <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="standard" id="standard" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="standard" className="font-medium cursor-pointer">
                          Standard (Time-based)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Link expires after a set time period. Can be viewed multiple times until expiration.
                        </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="one_time" className="font-medium cursor-pointer flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        One-Time View
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Link can only be viewed a limited number of times, then becomes invalid.
                      </p>
                      {linkType === 'one_time' && (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor="max-views" className="text-sm">Maximum Views</Label>
                          <Input
                            id="max-views"
                            type="number"
                            min="1"
                            max="10"
                            value={maxViews}
                            onChange={(e) => setMaxViews(e.target.value)}
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="password_protected" id="password_protected" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="password_protected" className="font-medium cursor-pointer flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password Protected
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Requires a password to access. Most secure option.
                      </p>
                      {linkType === 'password_protected' && (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor="password" className="text-sm">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="max-w-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Share this password with the recipient separately
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </RadioGroup>
              </div>
              )}

              {/* Expiry Time */}
              <div className="space-y-2">
                <Label htmlFor="expiry" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expires After
                </Label>
                <Select value={expiryPreset} onValueChange={setExpiryPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_PRESETS.map((preset) => (
                      <SelectItem key={preset.hours} value={preset.hours.toString()}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shared Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    What to Share
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllFields}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllFields}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/20">
                  {SHAREABLE_FIELDS.map((field) => (
                    <div
                      key={field.value}
                      className="flex items-start space-x-2 p-2 rounded hover:bg-background transition-colors"
                    >
                      <Checkbox
                        id={field.value}
                        checked={sharedFields.includes(field.value)}
                        onCheckedChange={() => toggleField(field.value)}
                        disabled={field.value === 'basic_info'} // Always required
                      />
                      <div className="flex-1">
                        <Label htmlFor={field.value} className="font-medium cursor-pointer">
                          {field.label}
                          {field.value === 'basic_info' && (
                            <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2">
                {editingLink && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={updateShareLinkMutation.isPending}
                    className="flex-1"
                    size="lg"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={() => editingLink ? updateShareLinkMutation.mutate() : createShareLinkMutation.mutate()}
                  disabled={
                    (editingLink ? updateShareLinkMutation.isPending : createShareLinkMutation.isPending) ||
                    !isFormValid()
                  }
                  className="flex-1"
                  size="lg"
                >
                  {editingLink ? (
                    updateShareLinkMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Update Share Link
                      </>
                    )
                  ) : (
                    createShareLinkMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Create Share Link
                      </>
                    )
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Share Links */}
          <Card>
            <CardHeader>
              <CardTitle>Active Share Links</CardTitle>
              <CardDescription>
                Manage existing share links for {horse.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : horseShareLinks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active share links for this horse.
                </p>
              ) : (
                <div className="space-y-4">
                  {horseShareLinks.map((shareLink: any) => {
                    const status = shareService.getShareLinkStatus(shareLink)
                    const timeRemaining = shareService.getTimeRemaining(shareLink.expires_at)
                    const shareUrl = getShareUrl(shareLink.token)

                    return (
                      <div key={shareLink.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={status === 'active' ? 'default' : 'destructive'}
                              className="flex items-center gap-1"
                            >
                              {status === 'active' && <Clock className="h-3 w-3" />}
                              {status === 'expired' && 'Expired'}
                              {status === 'used' && 'Used'}
                              {status === 'active' && 'Active'}
                            </Badge>
                            <Badge variant="outline">
                              {shareService.getLinkTypeLabel(shareLink.link_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              For: <span className="font-medium">{shareLink.recipient_name}</span>
                            </span>
                            {shareLink.link_type === 'one_time' && (
                              <span className="text-sm text-muted-foreground">
                                Views: {shareLink.view_count}/{shareLink.max_views}
                              </span>
                            )}
                            {shareLink.link_type === 'standard' && shareLink.view_count > 0 && (
                              <span className="text-sm text-muted-foreground">
                                Views: {shareLink.view_count}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Created {new Date(shareLink.created_at).toLocaleDateString()}
                            </span>
                            {status === 'active' && (
                              <>
                                <ShareLinkAnalytics shareLinkId={shareLink.id}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="View analytics"
                                  >
                                    <BarChart3 className="h-4 w-4" />
                                  </Button>
                                </ShareLinkAnalytics>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(shareLink)}
                                  disabled={deleteShareLinkMutation.isPending || updateShareLinkMutation.isPending}
                                  title="Edit link"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteShareLinkMutation.mutate({ shareLinkId: shareLink.id })}
                                  disabled={deleteShareLinkMutation.isPending || updateShareLinkMutation.isPending}
                                  title="Delete link"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {status === 'active' && (
                          <>
                            <div className="flex items-center gap-2">
                              <Input
                                value={shareUrl}
                                readOnly
                                className="text-sm font-mono"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(shareUrl, shareLink.id)}
                                disabled={copied === shareLink.id}
                              >
                                {copied === shareLink.id ? (
                                  'Copied!'
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(shareUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{timeRemaining}</span>
                              {shareLink.link_type === 'password_protected' && (
                                <span className="flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Password protected
                                </span>
                              )}
                            </div>

                            {/* Show shared fields */}
                            <div className="pt-2 border-t">
                              <p className="text-xs font-medium mb-2">Shared Content:</p>
                              <div className="flex flex-wrap gap-1">
                                {shareLink.shared_fields?.map((field: string) => (
                                  <Badge key={field} variant="secondary" className="text-xs">
                                    {SHAREABLE_FIELDS.find(f => f.value === field)?.label || field}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
