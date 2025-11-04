import { useState } from 'react';
import { Horse } from '@/types/horse';
import { SharedHorseData } from '@/services/shareService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';

interface HorseGalleryProps {
  horse: Horse | SharedHorseData;
}

export const HorseGallery = ({ horse }: HorseGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === horse.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? horse.images.length - 1 : prev - 1
    );
  };

  const selectedImage = horse.images[selectedImageIndex];

  // If no images, show placeholder
  if (horse.images.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="h-96 flex items-center justify-center bg-muted">
          <div className="text-center">
            <div className="text-6xl mb-4">🐎</div>
            <p className="text-muted-foreground">No images uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload some photos to see them here</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image Display */}
        <Card className="overflow-hidden">
          <div className="relative group bg-black">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.caption || horse.name}
              className="w-full max-h-[500px] md:max-h-[600px] object-contain cursor-pointer mx-auto"
              onClick={() => setIsFullscreen(true)}
              onError={(e) => {
                console.error('Image failed to load:', selectedImage?.url);
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-96 flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-muted-foreground">Image failed to load</p>
                <p className="text-sm text-muted-foreground">URL: {selectedImage?.url}</p>
              </div>
            </div>
            
            {/* Navigation Arrows */}
            {horse.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Image Counter */}
            {horse.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-sm">
                {selectedImageIndex + 1} / {horse.images.length}
              </div>
            )}
          </div>
          
          {selectedImage?.caption && (
            <div className="p-3 bg-muted/50">
              <p className="text-sm text-muted-foreground">{selectedImage.caption}</p>
            </div>
          )}
        </Card>

        {/* Thumbnail Grid */}
        {horse.images.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {horse.images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                  index === selectedImageIndex 
                    ? 'border-horse-brown shadow-md' 
                    : 'border-transparent hover:border-border'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.caption || `${horse.name} ${index + 1}`}
                  className="w-full h-16 object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Video Section */}
        {horse.videos && horse.videos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Videos</h3>
            
            {/* Main Video Player */}
            <Card className="overflow-hidden">
              <div className="relative bg-black">
                <video
                  key={horse.videos[selectedVideoIndex]?.id}
                  controls
                  className="w-full max-h-[500px] md:max-h-[600px] object-contain mx-auto"
                  poster={horse.videos[selectedVideoIndex]?.thumbnail}
                  preload="metadata"
                >
                  <source src={horse.videos[selectedVideoIndex]?.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Video Counter */}
                {horse.videos.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-sm">
                    {selectedVideoIndex + 1} / {horse.videos.length}
                  </div>
                )}
              </div>
              
              {horse.videos[selectedVideoIndex]?.caption && (
                <div className="p-3 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {horse.videos[selectedVideoIndex].caption}
                  </p>
                </div>
              )}
            </Card>

            {/* Video Thumbnails */}
            {horse.videos.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {horse.videos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideoIndex(index)}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      index === selectedVideoIndex 
                        ? 'border-horse-brown shadow-md' 
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <div className="relative">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.caption || `Video ${index + 1}`}
                          className="w-full h-16 object-cover"
                        />
                      ) : (
                        <div className="w-full h-16 bg-black flex items-center justify-center">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="relative max-w-7xl max-h-full">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.caption || horse.name}
              className="max-w-full max-h-full object-contain"
            />
            
            {horse.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};