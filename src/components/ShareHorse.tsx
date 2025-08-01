import { useState } from 'react';
import { Horse } from '@/types/horse';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, MessageCircle, Mail, Image, Video, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareHorseProps {
  horse: Horse;
  children?: React.ReactNode;
}

export const ShareHorse = ({ horse, children }: ShareHorseProps) => {
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState(
    `Check out this amazing horse! ${horse.name} - ${horse.breed}, ${horse.age} years old. Perfect for ${horse.training.disciplines.join(', ')}. ${horse.price ? `Price: $${horse.price.toLocaleString()}` : ''}`
  );
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareableLink = `${window.location.origin}/horse/${horse.id}`;

  const handleMediaToggle = (mediaUrl: string) => {
    setSelectedMedia(prev => 
      prev.includes(mediaUrl) 
        ? prev.filter(url => url !== mediaUrl)
        : [...prev, mediaUrl]
    );
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`${customMessage}\n\nView details: ${shareableLink}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
    toast({
      title: "Opening WhatsApp",
      description: "WhatsApp will open with your message ready to send.",
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${horse.name} - Horse for Sale`);
    const body = encodeURIComponent(`${customMessage}\n\nView full details and photos: ${shareableLink}\n\n--- Horse Details ---\nName: ${horse.name}\nBreed: ${horse.breed}\nAge: ${horse.age} years\nGender: ${horse.gender}\nColor: ${horse.color}\nHeight: ${horse.height}\nTraining: ${horse.training.level}\nDisciplines: ${horse.training.disciplines.join(', ')}\nStatus: ${horse.status}\n${horse.price ? `Price: $${horse.price.toLocaleString()}` : ''}\n\nLocation: ${horse.location}`);
    
    const emailUrl = recipientEmail 
      ? `mailto:${recipientEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    
    window.open(emailUrl);
    toast({
      title: "Opening Email",
      description: "Your email client will open with the message ready to send.",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${customMessage}\n\n${shareableLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Horse details and link copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually.",
        variant: "destructive",
      });
    }
  };

  const mockMediaFiles = [
    { url: horse.images[0]?.url || '', type: 'image', name: `${horse.name}_profile.jpg` },
    { url: horse.images[1]?.url || '', type: 'image', name: `${horse.name}_side.jpg` },
    { url: horse.images[2]?.url || '', type: 'image', name: `${horse.name}_action.jpg` },
    { url: '/mock-video.mp4', type: 'video', name: `${horse.name}_training.mp4` },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {horse.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom Message</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Media Selection */}
          <div className="space-y-3">
            <Label>Select Media to Include</Label>
            <div className="grid grid-cols-2 gap-3">
              {mockMediaFiles.map((media, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedMedia.includes(media.url) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleMediaToggle(media.url)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {media.type === 'image' ? (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{media.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{media.type}</p>
                      </div>
                      {selectedMedia.includes(media.url) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected media will be referenced in your message. Recipients can view all media via the shared link.
            </p>
          </div>

          {/* Email Recipient (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Recipient (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          {/* Share Actions */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleWhatsAppShare} className="gap-2" variant="outline">
                <MessageCircle className="h-4 w-4" />
                Share via WhatsApp
              </Button>
              <Button onClick={handleEmailShare} className="gap-2" variant="outline">
                <Mail className="h-4 w-4" />
                Share via Email
              </Button>
            </div>
            
            <Button onClick={copyToClipboard} variant="secondary" className="gap-2">
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>

          {/* Share Link Preview */}
          <div className="bg-muted p-3 rounded-lg">
            <Label className="text-xs text-muted-foreground">Share Link</Label>
            <p className="text-sm font-mono break-all">{shareableLink}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};