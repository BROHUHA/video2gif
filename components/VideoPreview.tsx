'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPreviewProps {
  file: File;
  onDurationLoad: (duration: number) => void;
  trimStart: number;
  trimEnd: number;
}

export default function VideoPreview({ 
  file, 
  onDurationLoad,
  trimStart,
  trimEnd 
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      onDurationLoad(duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      
      // Loop between trim points
      if (currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && !isLoading) {
      videoRef.current.currentTime = trimStart;
    }
  }, [trimStart, isLoading]);

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          controls
          loop
          className="w-full max-h-[500px] object-contain"
          aria-label="Video preview"
        />
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
        <span>Preview (looping between trim points)</span>
        <span>
          {trimStart.toFixed(1)}s - {trimEnd.toFixed(1)}s
        </span>
      </div>
    </div>
  );
}
