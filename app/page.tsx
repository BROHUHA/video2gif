'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import VideoPreview from '@/components/VideoPreview';
import TrimSlider from '@/components/TrimSlider';
import { getCompressionPreset, getEstimatedFileSize } from '@/lib/compression';

const MAX_DURATION_DESKTOP = 60;
const MAX_DURATION_MOBILE = 30;

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  
  // Detect mobile (simple check)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const maxDuration = isMobile ? MAX_DURATION_MOBILE : MAX_DURATION_DESKTOP;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTrimStart(0);
  };

  const handleDurationLoad = (loadedDuration: number) => {
    setDuration(loadedDuration);
    setTrimEnd(Math.min(loadedDuration, maxDuration));
  };

  const clipDuration = trimEnd - trimStart;
  const preset = getCompressionPreset(clipDuration);
  const estimatedSize = getEstimatedFileSize(clipDuration);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">
          Convert Video to GIF
        </h2>
        <p className="text-[var(--muted)] max-w-2xl mx-auto">
          Drop a video file below (up to {maxDuration} seconds). 
          Trim, convert, and download—all in your browser.
        </p>
      </div>

      {!selectedFile ? (
        <FileUpload onFileSelect={handleFileSelect} />
      ) : (
        <>
          <VideoPreview 
            file={selectedFile} 
            onDurationLoad={handleDurationLoad}
            trimStart={trimStart}
            trimEnd={trimEnd}
          />
          
          <TrimSlider
            duration={duration}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onTrimStartChange={setTrimStart}
            onTrimEndChange={setTrimEnd}
            maxDuration={maxDuration}
          />

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold mb-2">Compression Settings (Auto)</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[var(--muted)]">Max Width</p>
                <p className="font-mono font-bold">{preset.maxWidth}px</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Frame Rate</p>
                <p className="font-mono font-bold">{preset.fps} fps</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Est. Size</p>
                <p className="font-mono font-bold">{estimatedSize}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedFile(null)}
              className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Choose Different File
            </button>
          </div>
        </>
      )}
    </div>
  );
}
