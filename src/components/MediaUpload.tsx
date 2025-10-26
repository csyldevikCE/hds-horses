import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileUploadService, UploadedFile } from '@/services/fileUploadService';
import { horseService } from '@/services/horseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Video, X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onMediaAdd?: (files: UploadedFile[]) => void;
  horseId?: string;
}

interface PendingFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const MediaUpload = ({ onMediaAdd, horseId }: MediaUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => fileUploadService.uploadFile(file),
    onSuccess: async (uploadedFile) => {
      setUploadedFiles(prev => [...prev, uploadedFile]);
      setPendingFiles(prev => prev.filter(f => f.file.name !== uploadedFile.name));
      
      // If we have a horseId, save the file reference to the database
      if (horseId) {
        try {
          if (uploadedFile.type === 'image') {
            await horseService.addHorseImage(horseId, {
              url: uploadedFile.url,
              caption: uploadedFile.name,
              isPrimary: uploadedFile.name.toLowerCase().includes('primary') || uploadedFile.name.toLowerCase().includes('main')
            });
          } else {
            await horseService.addHorseVideo(horseId, {
              url: uploadedFile.url,
              caption: uploadedFile.name,
              thumbnail: uploadedFile.type === 'video' ? uploadedFile.url : undefined
            });
          }
          
          // Invalidate specific horse data
          await queryClient.invalidateQueries({ queryKey: ['horse', horseId] });
          // Note: horses list will refetch naturally when user navigates back (staleTime handles this)

          toast({
            title: "File uploaded successfully!",
            description: `${uploadedFile.name} has been uploaded and added to the horse.`,
          });
        } catch (error) {
          console.error('Error saving file to database:', error);
          toast({
            title: "Upload warning",
            description: "File uploaded but couldn't be saved to horse record. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        onMediaAdd?.([uploadedFile]);
        toast({
          title: "File uploaded successfully!",
          description: `${uploadedFile.name} has been uploaded.`,
        });
      }
    },
    onError: (error, file) => {
      setPendingFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    const newPendingFiles: PendingFile[] = [];

    files.forEach((file) => {
      // Validate file
      const validation = fileUploadService.validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      const pendingFile: PendingFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        preview: URL.createObjectURL(file),
        status: 'pending'
      };
      newPendingFiles.push(pendingFile);
    });

    if (newPendingFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...newPendingFiles]);
      
      // Start uploading each file
      newPendingFiles.forEach(pendingFile => {
        setPendingFiles(prev => prev.map(f => 
          f.id === pendingFile.id ? { ...f, status: 'uploading' } : f
        ));
        uploadMutation.mutate(pendingFile.file);
      });
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
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
              disabled={uploadMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>

        {/* Pending Files */}
        {pendingFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Uploading Files</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pendingFiles.map((file) => (
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
                    
                    {file.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <X className="h-6 w-6 text-white" />
                      </div>
                    )}
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePendingFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-1 left-1 text-xs"
                    >
                      {file.status === 'uploading' ? 'Uploading...' : file.type}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.file.name}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-500 mt-1">
                      {file.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files */}
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
                        src={file.url}
                        alt={file.name}
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
                      onClick={() => removeUploadedFile(file.id)}
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
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fileUploadService.formatFileSize(file.size)}
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