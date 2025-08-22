import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, CheckCircle, AlertCircle, File } from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface LargeFileUploaderProps {
  maxFileSize?: number; // in MB
  maxFiles?: number;
  allowedTypes?: string[];
  onUploadComplete?: (files: { fileName: string; url: string }[]) => void;
  onUploadError?: (error: string) => void;
}

export function LargeFileUploader({
  maxFileSize = 500, // 500MB default
  maxFiles = 5,
  allowedTypes = ['image/', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  onUploadComplete,
  onUploadError
}: LargeFileUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `File too large. Maximum size is ${maxFileSize}MB`;
    }

    // Check file type
    const isAllowedType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isAllowedType) {
      return 'File type not supported. Please upload images, videos, PDF, or MS Office documents.';
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: UploadFile[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Check if we're at max files limit
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        return;
      }

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        progress: 0
      });
    });

    if (errors.length > 0 && onUploadError) {
      onUploadError(errors.join(', '));
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const uploadFileToObjectStorage = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      // Get presigned URL
      const presignedResponse = await fetch('/api/large-upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFile.file.name,
          fileType: uploadFile.file.type
        })
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await presignedResponse.json();

      // Upload directly to Object Storage with progress tracking
      const xhr = new XMLHttpRequest();

      return new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, progress } : f
            ));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            // Extract file name from upload URL for the final URL
            const fileName = uploadURL.split('/').pop()?.split('?')[0];
            const finalUrl = `/objects/${fileName}`;
            
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'completed', progress: 100, url: finalUrl }
                : f
            ));
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));

        xhr.open('PUT', uploadURL);
        xhr.setRequestHeader('Content-Type', uploadFile.file.type);
        xhr.send(uploadFile.file);
      });

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ));
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFileToObjectStorage(file);
    }

    // Check if all uploads completed successfully
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(completedFiles.map(f => ({
        fileName: f.file.name,
        url: f.url!
      })));
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Large File Upload
        </CardTitle>
        <CardDescription>
          Upload large files up to {maxFileSize}MB each. Supports images, videos, PDF, and MS Office documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Maximum {maxFileSize}MB per file, up to {maxFiles} files
          </p>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Selected Files</h4>
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {file.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {(file.status === 'pending' || file.status === 'uploading') && (
                    <File className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file.size)}
                  </p>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-1">
                      <Progress value={file.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {file.progress}% uploaded
                      </p>
                    </div>
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {file.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={file.status === 'uploading'}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.some(f => f.status === 'pending') && (
          <Button 
            onClick={handleUpload}
            className="w-full"
            disabled={files.some(f => f.status === 'uploading')}
          >
            {files.some(f => f.status === 'uploading') ? 'Uploading...' : 'Upload Files'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}