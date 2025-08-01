import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Trash2, Eye, EyeOff, ExternalLink, Play, Youtube } from 'lucide-react';
import { Horse } from '@/types/horse';

interface YoutubeManagerProps {
  horse: Horse;
  onUpdate?: (updatedHorse: Horse) => void;
}

interface YoutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  youtubeId: string;
  isPublic: boolean;
  uploadDate: string;
  views?: number;
}

export const YoutubeManager = ({ horse, onUpdate }: YoutubeManagerProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isPublicUpload, setIsPublicUpload] = useState(true);

  // Mock YouTube videos for demonstration
  const [youtubeVideos, setYoutubeVideos] = useState<YoutubeVideo[]>([
    {
      id: '1',
      title: `${horse.name} - Training Session`,
      description: 'Daily training routine',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      youtubeId: 'dQw4w9WgXcQ',
      isPublic: true,
      uploadDate: '2024-01-15',
      views: 1250
    },
    {
      id: '2',
      title: `${horse.name} - Jumping Practice`,
      description: 'Show jumping training',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      youtubeId: 'dQw4w9WgXcQ',
      isPublic: false,
      uploadDate: '2024-01-20',
      views: 856
    }
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        if (!uploadTitle) {
          setUploadTitle(`${horse.name} - ${new Date().toLocaleDateString()}`);
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter a title",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      const newVideo: YoutubeVideo = {
        id: Date.now().toString(),
        title: uploadTitle,
        description: uploadDescription,
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        youtubeId: 'new_video_id',
        isPublic: isPublicUpload,
        uploadDate: new Date().toISOString().split('T')[0],
        views: 0
      };

      setYoutubeVideos(prev => [...prev, newVideo]);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploading(false);

      toast({
        title: "Upload successful",
        description: "Video uploaded to YouTube successfully",
      });
    }, 3000);
  };

  const toggleVideoVisibility = (videoId: string) => {
    setYoutubeVideos(prev =>
      prev.map(video =>
        video.id === videoId
          ? { ...video, isPublic: !video.isPublic }
          : video
      )
    );

    toast({
      title: "Visibility updated",
      description: "Video visibility changed successfully",
    });
  };

  const deleteVideo = (videoId: string) => {
    setYoutubeVideos(prev => prev.filter(video => video.id !== videoId));
    
    toast({
      title: "Video deleted",
      description: "Video removed from YouTube successfully",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Youtube className="h-4 w-4" />
          YouTube Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            YouTube Management - {horse.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload to YouTube
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-file">Select Video File</Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="upload-title">Video Title</Label>
                <Input
                  id="upload-title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="upload-description">Description (Optional)</Label>
                <Input
                  id="upload-description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter video description"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public-upload"
                  checked={isPublicUpload}
                  onCheckedChange={setIsPublicUpload}
                />
                <Label htmlFor="public-upload">Make video public</Label>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !uploadTitle || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload to YouTube'}
              </Button>
            </div>
          </Card>

          {/* YouTube Videos List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5" />
              YouTube Videos ({youtubeVideos.length})
            </h3>

            {youtubeVideos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No videos uploaded to YouTube yet
              </p>
            ) : (
              <div className="space-y-4">
                {youtubeVideos.map((video) => (
                  <div key={video.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{video.title}</h4>
                          {video.description && (
                            <p className="text-sm text-muted-foreground">{video.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(video.uploadDate).toLocaleDateString()}
                            </span>
                            {video.views !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {video.views.toLocaleString()} views
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={video.isPublic ? "default" : "secondary"}>
                            {video.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View on YouTube
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVideoVisibility(video.id)}
                        >
                          {video.isPublic ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Make Private
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Make Public
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteVideo(video.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};