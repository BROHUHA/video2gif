'use client';

import { useState, useRef } from 'react';
import FileUpload from '@/components/FileUpload';
import VideoPreview from '@/components/VideoPreview';
import TrimSlider from '@/components/TrimSlider';
import ConversionProgress from '@/components/ConversionProgress';
import { getCompressionPreset, getEstimatedFileSize } from '@/lib/compression';

const MAX_DURATION_DESKTOP = 60;
const MAX_DURATION_MOBILE = 30;

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  
  // Detect mobile (simple check)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const maxDuration = isMobile ? MAX_DURATION_MOBILE : MAX_DURATION_DESKTOP;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTrimStart(0);
    setError(null);
    setProgress(0);
  };

  const handleDurationLoad = (loadedDuration: number) => {
    setDuration(loadedDuration);
    setTrimEnd(Math.min(loadedDuration, maxDuration));
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setProgress(0);
    setError(null);

    try {
      const clipDuration = trimEnd - trimStart;
      
      // Validate clip duration
      if (clipDuration > maxDuration) {
        throw new Error(`Clip duration exceeds ${maxDuration}s limit`);
      }

      if (clipDuration < 0.1) {
        throw new Error('Clip duration is too short (minimum 0.1s)');
      }

      // Check memory availability
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
        if (availableMemory < 100 * 1024 * 1024) {
          throw new Error('Not enough memory available. Please close other tabs and try again.');
        }
      }

      const preset = getCompressionPreset(clipDuration);

      // Create new worker with error handling
      workerRef.current = new Worker(
        new URL('../workers/converter.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set worker timeout (max 5 minutes)
      const workerTimeout = setTimeout(() => {
        setError('Conversion timed out. Please try a shorter video.');
        setIsConverting(false);
        workerRef.current?.terminate();
        workerRef.current = null;
      }, 5 * 60 * 1000);

      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setProgress(e.data.progress);
        } else if (e.data.type === 'complete') {
          clearTimeout(workerTimeout);
          const gifBlob = e.data.gifBlob;
          
          // Download GIF
          const url = URL.createObjectURL(gifBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `giffy-${Date.now()}.gif`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setIsConverting(false);
          setProgress(100);
          
          // Reset after download
          setTimeout(() => {
            setSelectedFile(null);
            setProgress(0);
          }, 2000);

          // Terminate worker
          workerRef.current?.terminate();
          workerRef.current = null;
        } else if (e.data.type === 'error') {
          clearTimeout(workerTimeout);
          throw new Error(e.data.error || 'Conversion failed');
        }
      };

      workerRef.current.onerror = (err) => {
        clearTimeout(workerTimeout);
        console.error('Worker error:', err);
        setError('Conversion failed. Please try again with a different video.');
        setIsConverting(false);
        workerRef.current?.terminate();
        workerRef.current = null;
      };

      // Send conversion job to worker
      workerRef.current.postMessage({
        videoBlob: selectedFile,
        trimStart,
        trimEnd,
        width: preset.maxWidth,
        fps: preset.fps,
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsConverting(false);
      workerRef.current?.terminate();
      workerRef.current = null;
    }
  };

  const clipDuration = trimEnd - trimStart;
  const preset = getCompressionPreset(clipDuration);
  const estimatedSize = getEstimatedFileSize(clipDuration);
  const canConvert = selectedFile && clipDuration > 0 && clipDuration <= maxDuration && !isConverting;

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

          <ConversionProgress 
            progress={progress}
            isConverting={isConverting}
            error={error}
          />
          
          <div className="flex gap-4">
            <button
              onClick={handleConvert}
              disabled={!canConvert}
              className={`
                px-6 py-3 rounded-lg font-semibold text-white transition-all
                ${canConvert 
                  ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isConverting ? 'Converting...' : 'Convert to GIF'}
            </button>
            
            <button
              onClick={() => {
                setSelectedFile(null);
                setError(null);
                workerRef.current?.terminate();
                workerRef.current = null;
              }}
              disabled={isConverting}
              className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
            >
              Choose Different File
            </button>
          </div>
        </>
      )}
    </div>
  );
}
