import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Video, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
}

interface MediaUploadProps {
  onMediaAdd?: (files: MediaFile[]) => void;
}

export const MediaUpload = ({ onMediaAdd }: MediaUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newFiles: MediaFile[] = [];

    files.forEach((file) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const mediaFile: MediaFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          preview: URL.createObjectURL(file)
        };
        newFiles.push(mediaFile);
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      onMediaAdd?.(newFiles);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-horse-brown" />
          Upload Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
            dragActive 
              ? "border-horse-brown bg-horse-brown/5 scale-[1.02]" 
              : "border-border hover:border-horse-brown/50 hover:bg-muted/30"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Image className="h-8 w-8" />
                <span className="font-medium">Images</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Video className="h-8 w-8" />
                <span className="font-medium">Videos</span>
              </div>
            </div>
            
            <div>
              <p className="text-foreground font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports images and videos up to 100MB
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={openFileDialog}
              className="hover-scale"
            >
              <Plus className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>

        {/* Uploaded Files Grid */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Uploaded Files</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="relative group animate-fade-in"
                >
                  <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                    {file.type === 'image' ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-1 left-1 text-xs"
                    >
                      {file.type}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};