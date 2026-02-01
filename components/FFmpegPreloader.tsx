'use client';

import { useEffect, useState } from 'react';
import { preloadFFmpeg, isFFmpegLoaded } from '@/lib/ffmpeg-preload';

export default function FFmpegPreloader() {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isFFmpegLoaded()) {
      setIsLoaded(true);
      return;
    }

    // Start preloading FFmpeg in background
    preloadFFmpeg((prog) => {
      setProgress(prog);
      if (prog === 100) {
        setTimeout(() => setIsLoaded(true), 500);
      }
    }).catch((err) => {
      console.error('FFmpeg preload error:', err);
    });
  }, []);

  if (isLoaded) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-50 dark:bg-blue-950 border-t border-blue-200 dark:border-blue-800 px-4 py-2 z-40">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--foreground)]">
              Loading FFmpeg...
            </span>
            <span className="text-xs font-mono font-bold text-[var(--primary)]">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[var(--primary)] h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-[var(--muted)]">
          One-time setup
        </span>
      </div>
    </div>
  );
}
