import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { shareService } from '@/services/shareService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Share2, Copy, Clock, Trash2, ExternalLink, Loader2 } from 'lucide-react'

interface ShareHorseProps {
  horse: { id: string; name: string }
  children: React.ReactNode
}

export const ShareHorse = ({ horse, children }: ShareHorseProps) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState('')
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get existing share links for this horse
  const { data: shareLinks = [], isLoading } = useQuery({
    queryKey: ['share-links', user?.id],
    queryFn: () => shareService.getUserShareLinks(user?.id || ''),
    enabled: !!user?.id && open,
  })

  const horseShareLinks = shareLinks.filter(link => link.horse_id === horse.id)

  // Create new share link
  const createShareLinkMutation = useMutation({
    mutationFn: () => shareService.createShareLink(horse.id, user?.id || '', recipientName),
    onSuccess: (newShareLink) => {
      queryClient.invalidateQueries({ queryKey: ['share-links', user?.id] })
      setRecipientName('') // Reset form
      toast({
        title: "Share link created!",
        description: `Share link for ${recipientName} is now active for 12 hours.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Error creating share link",
        description: "Failed to create share link. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Delete share link
  const deleteShareLinkMutation = useMutation({
    mutationFn: ({ shareLinkId }: { shareLinkId: string }) => 
      shareService.deleteShareLink(shareLinkId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links', user?.id] })
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {horse.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Share Link */}
          <Card>
            <CardHeader>
              <CardTitle>Create Share Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a temporary link to share {horse.name} with clients. The link will be active for 12 hours.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient Name</Label>
                <Input
                  id="recipient-name"
                  placeholder="Enter client's name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                onClick={() => createShareLinkMutation.mutate()}
                disabled={createShareLinkMutation.isPending || !recipientName.trim()}
                className="w-full"
              >
                {createShareLinkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Create Share Link
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Share Links */}
          <Card>
            <CardHeader>
              <CardTitle>Active Share Links</CardTitle>
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
                  {horseShareLinks.map((shareLink) => {
                    const isExpired = shareService.getShareLinkStatus(shareLink.expires_at) === 'expired'
                    const timeRemaining = shareService.getTimeRemaining(shareLink.expires_at)
                    const shareUrl = getShareUrl(shareLink.token)

                    return (
                      <div key={shareLink.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-2">
                             <Badge 
                               variant={isExpired ? "destructive" : "default"}
                               className="flex items-center gap-1"
                             >
                               <Clock className="h-3 w-3" />
                               {isExpired ? 'Expired' : 'Active'}
                             </Badge>
                             <span className="text-sm text-muted-foreground">
                               For: {shareLink.recipient_name}
                             </span>
                             <span className="text-sm text-muted-foreground">
                               • Created {new Date(shareLink.created_at).toLocaleDateString()}
                             </span>
                           </div>
                          
                          {!isExpired && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteShareLinkMutation.mutate({ shareLinkId: shareLink.id })}
                              disabled={deleteShareLinkMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={shareUrl}
                              readOnly
                              className="text-sm"
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
                          
                          <p className="text-xs text-muted-foreground">
                            {isExpired ? 'This link has expired' : timeRemaining}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>What's Shared?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  The shared view includes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Images and videos</li>
                  <li>Basic information (name, breed, age, gender, color, height)</li>
                  <li>Description</li>
                  <li>Pedigree information</li>
                  <li>Training level and disciplines</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  <strong>Not included:</strong> Price, health records, competition history, location, or contact information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}