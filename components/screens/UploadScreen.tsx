'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm'];

interface UploadScreenProps {
  onFileSelect: (file: File) => void;
}

export default function UploadScreen({ onFileSelect }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    try {
      if (file.size > MAX_FILE_SIZE) {
        return `Too big! Max 100 MB`;
      }
      
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        return 'Wrong format! Use MP4, MOV, or WEBM';
      }
      
      return null;
    } catch (err) {
      return 'Could not read file!';
    }
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setTimeout(() => setError(null), 4000);
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)'}}>
      <div className="w-full max-w-2xl space-y-6">
        {/* Chaotic Header */}
        <div className="text-center space-y-4 rotate-chaos-1">
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-lime-400 to-yellow-400 px-6 py-3 border-5 border-black neo-shadow-chaos">
              <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
                Drop ya Video! <span className="sticker inline-block">📹</span>
              </h1>
            </div>
            <div className="absolute -top-3 -right-3 bg-cyan-400 border-3 border-black px-2 py-1 rotate-12 text-xs font-black sticker">
              STEP 1
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-6 p-8 sm:p-12 text-center transition-all cursor-pointer rotate-chaos-2
            ${isDragging 
              ? 'border-lime-500 bg-lime-100 scale-105' 
              : 'border-black bg-white'
            }
            ${error ? 'border-red-600 wiggle' : ''}
            neo-shadow-double hover:scale-105
          `}
        >
          <input
            type="file"
            id="file-upload"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload video"
            tabIndex={0}
          />
          
          <div className="pointer-events-none space-y-5">
            <div className="text-7xl sm:text-8xl sticker">
              {isDragging ? '🎯' : '📹'}
            </div>
            
            <div className="space-y-3">
              <p className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {isDragging ? 'Drop it!' : 'Drag & Drop'}
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-700">
                or <span className="scribble-underline">click here</span> to browse
              </p>
            </div>

            <div className="pt-3 space-y-2">
              <div className="inline-flex gap-2 flex-wrap justify-center">
                <span className="bg-pink-200 border-2 border-black px-3 py-1 text-sm font-black rotate-chaos-1">MP4</span>
                <span className="bg-yellow-200 border-2 border-black px-3 py-1 text-sm font-black rotate-chaos-3">MOV</span>
                <span className="bg-cyan-200 border-2 border-black px-3 py-1 text-sm font-black rotate-chaos-2">WEBM</span>
              </div>
              <p className="text-sm font-bold text-gray-700">
                Max 100 MB • Under 60 seconds
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-5 bg-red-500 border-5 border-black neo-shadow-triple text-white text-center wiggle rotate-chaos-3">
            <p className="text-xl sm:text-2xl font-black uppercase">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Privacy Badge */}
        <div className="text-center rotate-chaos-1">
          <div className="inline-block bg-purple-200 border-3 border-black px-6 py-3 neo-shadow-pink">
            <p className="text-sm font-black flex items-center gap-2 justify-center">
              <span className="text-2xl">🔒</span>
              <span>100% Private • No Upload • Browser Only</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
