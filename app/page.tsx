'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { isFFmpegLoaded, preloadFFmpeg } from '@/lib/ffmpeg-preload';
import { getCompressionPreset } from '@/lib/compression';

type EditorState = 'loading' | 'empty' | 'editing' | 'converting' | 'complete';

export default function VideoEditorPage() {
  const [state, setState] = useState<EditorState>(isFFmpegLoaded() ? 'empty' : 'loading');
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Seek to time
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
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
    if (confirm('Start new project? Current work will be lost.')) {
      setSelectedFile(null);
      setVideoUrl('');
      setGifBlob(null);
      setGifUrl('');
      setState('empty');
      setProgress(0);
      setTrimStart(0);
      setTrimEnd(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const clipDuration = trimEnd - trimStart;
  const canConvert = clipDuration > 0 && clipDuration <= maxDuration;

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{background: 'var(--bg-dark)'}}>
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="text-6xl">🎬</div>
          <h1 className="text-3xl font-semibold">Giffy</h1>
          <div className="space-y-3">
            <p className="text-base" style={{color: 'var(--text-secondary)'}}>
              Initializing editor...
            </p>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{background: 'var(--bg-panel)'}}>
              <div 
                className="h-full transition-all duration-300"
                style={{
                  width: `${loadProgress}%`,
                  background: 'var(--accent-primary)'
                }}
              />
            </div>
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
              {loadProgress}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{background: 'var(--bg-dark)'}}>
      {/* Top Toolbar */}
      <div className="h-14 flex items-center justify-between px-4 border-b select-none" style={{background: 'var(--bg-panel)', borderColor: 'var(--border-color)'}}>
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Giffy</h1>
          <div className="h-6 w-px" style={{background: 'var(--border-color)'}} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-sm"
            disabled={state === 'converting'}
          >
            📁 Import Video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileInput}
            className="hidden"
          />
          {selectedFile && (
            <button onClick={handleNewProject} className="btn-icon" title="New Project">
              <span className="text-lg">🗑️</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state === 'editing' && (
            <button 
              onClick={handleConvert}
              disabled={!canConvert}
              className="btn-success"
            >
              ⚡ Export GIF
            </button>
          )}
          {state === 'complete' && (
            <button onClick={handleDownload} className="btn-success">
              ⬇ Download GIF
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r flex flex-col" style={{background: 'var(--bg-panel)', borderColor: 'var(--border-color)'}}>
          <div className="p-4 border-b" style={{borderColor: 'var(--border-color)'}}>
            <h2 className="text-sm font-semibold uppercase" style={{color: 'var(--text-secondary)'}}>
              Project
            </h2>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {selectedFile && (
              <div className="space-y-2">
                <p className="text-xs uppercase font-semibold" style={{color: 'var(--text-secondary)'}}>
                  Source File
                </p>
                <div className="p-3 rounded-lg" style={{background: 'var(--bg-panel-light)'}}>
                  <p className="text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs mt-1" style={{color: 'var(--text-secondary)'}}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
            {state === 'editing' && (
              <div className="space-y-2">
                <p className="text-xs uppercase font-semibold" style={{color: 'var(--text-secondary)'}}>
                  Clip Info
                </p>
                <div className="p-3 rounded-lg space-y-2" style={{background: 'var(--bg-panel-light)'}}>
                  <div className="flex justify-between text-sm">
                    <span style={{color: 'var(--text-secondary)'}}>Duration:</span>
                    <span>{formatTime(clipDuration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{color: 'var(--text-secondary)'}}>Start:</span>
                    <span>{formatTime(trimStart)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{color: 'var(--text-secondary)'}}>End:</span>
                    <span>{formatTime(trimEnd)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-8" style={{background: 'var(--bg-dark)'}}>
            {state === 'empty' && (
              <div className="text-center space-y-6 max-w-md">
                <div className="text-8xl">🎬</div>
                <h2 className="text-2xl font-semibold">Import a Video</h2>
                <p className="text-base" style={{color: 'var(--text-secondary)'}}>
                  Drop a video file or click "Import Video" to get started
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  Choose File
                </button>
              </div>
            )}

            {(state === 'editing' || state === 'converting') && videoUrl && (
              <div className="w-full max-w-4xl">
                <div className="rounded-lg overflow-hidden" style={{background: '#000'}}>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full"
                  />
                </div>
                {state === 'converting' && (
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Converting...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{background: 'var(--bg-panel)'}}>
                      <div 
                        className="h-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background: 'var(--accent-success)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {state === 'complete' && gifUrl && (
              <div className="w-full max-w-4xl text-center space-y-6">
                <h2 className="text-2xl font-semibold">✨ Export Complete!</h2>
                <div className="rounded-lg overflow-hidden inline-block" style={{background: '#000'}}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gifUrl} alt="Generated GIF" className="max-w-full" />
                </div>
                {gifBlob && (
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                    {(gifBlob.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          {state === 'editing' && (
            <div className="h-48 border-t" style={{background: 'var(--bg-panel)', borderColor: 'var(--border-color)'}}>
              <div className="h-12 border-b flex items-center px-4 gap-4" style={{borderColor: 'var(--border-color)'}}>
                <button onClick={togglePlayPause} className="btn-icon">
                  <span className="text-xl">{isPlaying ? '⏸️' : '▶️'}</span>
                </button>
                <button onClick={() => seekTo(trimStart)} className="btn-icon" title="Go to start">
                  <span className="text-sm">⏮️</span>
                </button>
                <span className="text-sm font-mono select-none">{formatTime(currentTime)}</span>
                <div className="h-6 w-px" style={{background: 'var(--border-color)'}} />
                <span className="text-xs" style={{color: 'var(--text-secondary)'}}>
                  Duration: {formatTime(duration)}
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2" style={{color: 'var(--text-secondary)'}}>
                    <span>PLAYHEAD</span>
                    <span>{formatTime(currentTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2" style={{color: 'var(--text-secondary)'}}>
                    <span>TRIM START</span>
                    <span>{formatTime(trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={trimStart}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < trimEnd) setTrimStart(val);
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2" style={{color: 'var(--text-secondary)'}}>
                    <span>TRIM END</span>
                    <span>{formatTime(trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={trimEnd}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > trimStart) setTrimEnd(val);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l flex flex-col" style={{background: 'var(--bg-panel)', borderColor: 'var(--border-color)'}}>
          <div className="p-4 border-b" style={{borderColor: 'var(--border-color)'}}>
            <h2 className="text-sm font-semibold uppercase" style={{color: 'var(--text-secondary)'}}>
              Export Settings
            </h2>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {state === 'editing' && (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase font-semibold" style={{color: 'var(--text-secondary)'}}>
                    Output
                  </p>
                  <div className="p-3 rounded-lg" style={{background: 'var(--bg-panel-light)'}}>
                    <p className="text-sm">Animated GIF</p>
                    <p className="text-xs mt-1" style={{color: 'var(--text-secondary)'}}>
                      Optimized for web
                    </p>
                  </div>
                </div>

                {clipDuration > maxDuration && (
                  <div className="p-3 rounded-lg" style={{background: '#7f1d1d', border: '1px solid #991b1b'}}>
                    <p className="text-sm font-semibold" style={{color: '#fca5a5'}}>
                      ⚠️ Clip too long
                    </p>
                    <p className="text-xs mt-1" style={{color: '#fecaca'}}>
                      Maximum {maxDuration}s allowed. Adjust trim points.
                    </p>
                  </div>
                )}

                {canConvert && (
                  <div className="p-3 rounded-lg" style={{background: '#064e3b', border: '1px solid #059669'}}>
                    <p className="text-sm font-semibold" style={{color: '#6ee7b7'}}>
                      ✓ Ready to export
                    </p>
                    <p className="text-xs mt-1" style={{color: '#a7f3d0'}}>
                      {formatTime(clipDuration)} clip
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
