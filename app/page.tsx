'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { isFFmpegLoaded, preloadFFmpeg } from '@/lib/ffmpeg-preload';
import { getCompressionPreset } from '@/lib/compression';

type AppState = 'loading' | 'empty' | 'editing' | 'converting' | 'complete';

export default function MobileEditorPage() {
  const [state, setState] = useState<AppState>(isFFmpegLoaded() ? 'empty' : 'loading');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const maxDuration = 60;

  // Preload FFmpeg
  useEffect(() => {
    if (!isFFmpegLoaded()) {
      preloadFFmpeg((prog) => {
        setLoadProgress(prog);
        if (prog === 100) {
          setTimeout(() => setState('empty'), 500);
        }
      }).catch((err) => {
        console.error('FFmpeg preload error:', err);
        alert('Setup failed. Please refresh the page.');
      });
    }
  }, []);

  // Generate thumbnails
  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 56;
    canvas.height = 56;

    const thumbs: string[] = [];
    const count = Math.min(10, Math.floor(duration));
    
    for (let i = 0; i < count; i++) {
      const time = (duration / count) * i;
      video.currentTime = time;
      
      await new Promise<void>((resolve) => {
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
          resolve();
        };
      });
    }
    
    setThumbnails(thumbs);
    video.currentTime = trimStart;
  }, [duration, trimStart]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large! Max 100 MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setSelectedFile(file);
    setState('editing');
    setTrimStart(0);
    setCurrentTime(0);
    setThumbnails([]);
  }, []);

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(Math.min(dur, maxDuration));
      generateThumbnails();
    }
  };

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Loop within trim range
      if (time >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  // Seek to time
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(trimStart, Math.min(time, trimEnd));
      setCurrentTime(time);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Convert to GIF
  const handleConvert = async () => {
    if (!selectedFile) return;

    setState('converting');
    setProgress(0);

    try {
      const clipDuration = trimEnd - trimStart;
      const preset = getCompressionPreset(clipDuration);

      workerRef.current = new Worker(
        new URL('../workers/converter.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setProgress(e.data.progress);
        } else if (e.data.type === 'complete') {
          const blob = e.data.gifBlob;
          setGifBlob(blob);
          const url = URL.createObjectURL(blob);
          setGifUrl(url);
          setState('complete');
          workerRef.current?.terminate();
          workerRef.current = null;
        } else if (e.data.type === 'error') {
          alert('Conversion failed: ' + e.data.error);
          setState('editing');
          workerRef.current?.terminate();
          workerRef.current = null;
        }
      };

      workerRef.current.postMessage({
        videoBlob: selectedFile,
        trimStart,
        trimEnd,
        width: preset.maxWidth,
        fps: preset.fps,
      });
    } catch (err) {
      alert('Conversion failed');
      setState('editing');
    }
  };

  // Download GIF
  const handleDownload = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `giffy-${Date.now()}.gif`;
    a.click();
  };

  // New project
  const handleNewProject = () => {
    setSelectedFile(null);
    setVideoUrl('');
    setGifBlob(null);
    setGifUrl('');
    setState('empty');
    setProgress(0);
    setTrimStart(0);
    setTrimEnd(0);
    setThumbnails([]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clipDuration = trimEnd - trimStart;
  const canConvert = clipDuration > 0 && clipDuration <= maxDuration;
  const clipProgress = duration > 0 ? ((currentTime - trimStart) / clipDuration) * 100 : 0;

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #667eea 0%, #a855f7 100%)'}}>
        <div className="text-center space-y-6 max-w-md px-6 animate-fade-in">
          <div className="text-8xl animate-pulse">🎬</div>
          <h1 className="text-4xl font-bold text-white">Giffy</h1>
          <div className="space-y-3">
            <div className="w-64 h-2 rounded-full overflow-hidden glass">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{width: `${loadProgress}%`}}
              />
            </div>
            <p className="text-sm text-white opacity-80">
              Loading {loadProgress}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (state === 'empty') {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-6" style={{background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)'}}>
        <div className="text-center space-y-8 max-w-md animate-fade-in">
          <div className="text-9xl">📹</div>
          <h1 className="text-5xl font-bold text-white">Giffy</h1>
          <p className="text-xl text-white opacity-90">
            Turn videos into amazing GIFs
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="fab"
            style={{width: '64px', height: '64px', fontSize: '32px'}}
          >
            +
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Main editor
  return (
    <div className="h-screen w-screen flex flex-col" style={{background: 'var(--bg-main)'}}>
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Video (hidden for thumbnail generation) */}
      <video
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        className="hidden"
      />

      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 select-none" style={{background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)'}}>
        <button onClick={handleNewProject} className="icon-btn" style={{background: 'transparent', color: 'var(--text-primary)'}}>
          <span className="text-2xl">✕</span>
        </button>
        <h1 className="text-lg font-semibold">{state === 'complete' ? 'Complete' : 'Edit'}</h1>
        <button
          onClick={state === 'complete' ? handleDownload : handleConvert}
          disabled={state === 'editing' && !canConvert}
          className="icon-btn"
          style={{
            background: state === 'complete' ? 'var(--accent-teal)' : canConvert ? 'var(--accent-purple)' : '#ccc',
            color: 'white'
          }}
        >
          <span className="text-xl">{state === 'complete' ? '⬇' : '✓'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md">
          <div className="video-card animate-slide-up">
            {/* Preview */}
            <div className="relative" style={{aspectRatio: '9/16', background: '#000'}}>
              {state === 'editing' && videoUrl && (
                <video
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onClick={togglePlayPause}
                />
              )}
              
              {state === 'converting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center glass-dark">
                  <div className="text-6xl mb-4 animate-pulse">⚡</div>
                  <p className="text-xl font-semibold text-white mb-2">Converting...</p>
                  <p className="text-3xl font-bold text-white">{progress}%</p>
                </div>
              )}

              {state === 'complete' && gifUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={gifUrl} 
                  alt="Generated GIF" 
                  className="w-full h-full object-contain"
                />
              )}

              {/* Floating controls (editing only) */}
              {state === 'editing' && (
                <>
                  <div className="absolute top-4 right-4">
                    <button className="fab" style={{width: '40px', height: '40px'}}>
                      <span className="text-lg">⚙️</span>
                    </button>
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button onClick={togglePlayPause} className="fab" style={{width: '64px', height: '64px'}}>
                      <span className="text-3xl">{isPlaying ? '⏸' : '▶'}</span>
                    </button>
                  </div>

                  <div className="absolute bottom-4 right-4">
                    <button className="fab" style={{width: '40px', height: '40px'}}>
                      <span className="text-lg">⛶</span>
                    </button>
                  </div>

                  {/* Time display */}
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 glass px-4 py-2 rounded-full">
                    <p className="text-sm text-white font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Timeline Section */}
            {state === 'editing' && (
              <div className="p-4 space-y-4" style={{background: 'var(--bg-dark)'}}>
                {/* Timeline markers */}
                <div className="flex justify-between text-xs" style={{color: 'var(--text-on-dark)'}}>
                  <span>0s</span>
                  <span>{Math.floor(duration / 2)}s</span>
                  <span>{Math.floor(duration)}s</span>
                </div>

                {/* Thumbnails */}
                {thumbnails.length > 0 && (
                  <div className="timeline-thumbnails">
                    {thumbnails.map((thumb, i) => (
                      <div
                        key={i}
                        className="timeline-thumb"
                        onClick={() => seekTo((duration / thumbnails.length) * i)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt={`Frame ${i}`} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Trim controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white opacity-60">START</span>
                    <input
                      type="range"
                      className="custom-range flex-1"
                      min={0}
                      max={duration}
                      step={0.1}
                      value={trimStart}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val < trimEnd) {
                          setTrimStart(val);
                          seekTo(val);
                        }
                      }}
                    />
                    <span className="text-xs text-white font-mono">{formatTime(trimStart)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white opacity-60">END</span>
                    <input
                      type="range"
                      className="custom-range flex-1"
                      min={0}
                      max={duration}
                      step={0.1}
                      value={trimEnd}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > trimStart) setTrimEnd(val);
                      }}
                    />
                    <span className="text-xs text-white font-mono">{formatTime(trimEnd)}</span>
                  </div>
                </div>

                {/* Clip info */}
                <div className="glass-dark px-4 py-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{color: 'var(--text-on-dark)'}}>Clip Duration</span>
                    <span className={`text-lg font-semibold ${canConvert ? 'text-green-400' : 'text-red-400'}`}>
                      {formatTime(clipDuration)}
                    </span>
                  </div>
                  {!canConvert && (
                    <p className="text-xs text-red-400 mt-2">
                      ⚠️ Max {maxDuration}s allowed
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Complete state footer */}
            {state === 'complete' && gifBlob && (
              <div className="p-4" style={{background: 'var(--bg-dark)'}}>
                <div className="glass-dark px-4 py-3 rounded-xl text-center">
                  <p className="text-sm text-white opacity-80">File Size</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {(gifBlob.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Toolbar */}
      {state === 'editing' && (
        <div className="toolbar h-20 flex items-center justify-around px-4">
          <button className="icon-btn">
            <span className="text-2xl">✂️</span>
          </button>
          <button className="icon-btn">
            <span className="text-2xl">🎨</span>
          </button>
          <button className="icon-btn">
            <span className="text-2xl">🔊</span>
          </button>
          <button className="icon-btn">
            <span className="text-2xl">⚡</span>
          </button>
          <button className="icon-btn">
            <span className="text-2xl">📋</span>
          </button>
          <button className="icon-btn" onClick={handleNewProject}>
            <span className="text-2xl">🗑️</span>
          </button>
        </div>
      )}
    </div>
  );
}
