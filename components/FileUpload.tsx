'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm'];

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    try {
      if (file.size > MAX_FILE_SIZE) {
        return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`;
      }
      
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        return 'Unsupported format. Please use MP4, MOV, or WEBM.';
      }
      
      return null;
    } catch (err) {
      return 'Failed to validate file. Please try again.';
    }
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-lg border-2 border-dashed p-8 sm:p-12 text-center transition-colors
          ${isDragging 
            ? 'border-[var(--primary)] bg-blue-50 dark:bg-blue-950' 
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
          }
          ${error ? 'border-[var(--error)]' : ''}
        `}
      >
        <input
          type="file"
          id="file-upload"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload video file"
          tabIndex={0}
        />
        
        <div className="pointer-events-none space-y-4">
          <svg
            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
            />
          </svg>
          
          <div>
            <p className="text-base sm:text-lg font-semibold">
              Drop video here or click to select
            </p>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              MP4, MOV, or WEBM • Max 100 MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950 border border-[var(--error)] rounded-lg">
          <p className="text-xs sm:text-sm text-[var(--error)] font-medium">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
