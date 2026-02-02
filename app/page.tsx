'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

type AppState = 'loading' | 'empty' | 'editing' | 'processing' | 'complete';
type DownloadState = 'idle' | 'preparing' | 'downloading' | 'complete';

export default function VideoEditor() {
  // State
  const [state, setState] = useState<AppState>('loading');
  const [loadProgress, setLoadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string>('');
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load FFmpeg
  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('progress', ({ progress: prog }) => {
        const percent = Math.round(prog * 100);
        setProgress(percent);
        
        if (percent < 30) setProcessingStage('Analyzing video');
        else if (percent < 60) setProcessingStage('Converting frames');
        else if (percent < 90) setProcessingStage('Optimizing output');
        else setProcessingStage('Finalizing');
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setLoadProgress(100);
      setTimeout(() => setState('empty'), 300);
    } catch (error) {
      console.error('Failed to load video processor:', error);
      alert('Failed to initialize. Please refresh the page.');
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be under 100 MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setState('editing');
    setTrimStart(0);
    setCurrentTime(0);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(Math.min(dur, 60));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleConvert = async () => {
    if (!videoFile || !ffmpegRef.current) return;

    setState('processing');
    setProgress(0);
    setProcessingStage('Starting conversion');

    try {
      const ffmpeg = ffmpegRef.current;
      
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      const clipDuration = trimEnd - trimStart;
      const fps = clipDuration <= 5 ? 20 : clipDuration <= 15 ? 15 : 12;
      const width = 480;

      await ffmpeg.exec([
        '-ss', trimStart.toString(),
        '-t', (clipDuration).toString(),
        '-i', 'input.mp4',
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
        '-loop', '0',
        'output.gif'
      ]);

      const data = await ffmpeg.readFile('output.gif') as Uint8Array;
      const blob = new Blob([new Uint8Array(data)], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      
      setGifBlob(blob);
      setGifUrl(url);
      setState('complete');

      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.gif');
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed. Please try again.');
      setState('editing');
    }
  };

  const handleDownload = () => {
    if (!gifUrl) return;
    
    setDownloadState('preparing');
    
    setTimeout(() => {
      setDownloadState('downloading');
      
      const a = document.createElement('a');
      a.href = gifUrl;
      a.download = `giffy-${Date.now()}.gif`;
      a.click();
      
      setTimeout(() => {
        setDownloadState('complete');
        
        setTimeout(() => {
          setDownloadState('idle');
        }, 3000);
      }, 600);
    }, 400);
  };

  const handleNew = () => {
    if (confirm('Start a new project? Current work will be lost.')) {
      setVideoFile(null);
      setVideoUrl('');
      setGifBlob(null);
      setGifUrl('');
      setState('empty');
      setTrimStart(0);
      setTrimEnd(0);
      setCurrentTime(0);
      setProgress(0);
      setDownloadState('idle');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clipDuration = trimEnd - trimStart;
  const canExport = clipDuration > 0 && clipDuration <= 60;

  // Loading Screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 100%)' }}>
        <div className="card card-elevated p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#D97757] to-[#E9A87E] rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-2xl font-semibold mb-2">Giffy</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Initializing video processor
            </p>
          </div>
          
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${loadProgress}%` }}></div>
          </div>
          
          <p className="text-sm font-medium">{loadProgress}%</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (state === 'empty') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 100%)' }}>
        <div className="card card-elevated p-8 sm:p-12 max-w-2xl w-full text-center space-y-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#D97757] to-[#E9A87E] rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-3">Giffy</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Convert videos to optimized GIFs
            </p>
          </div>
          
          <div className="card p-6 text-left space-y-3">
            <h3 className="font-medium mb-3">How it works</h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>1. Import a video file (up to 100 MB)</p>
              <p>2. Trim to your desired length (max 60 seconds)</p>
              <p>3. Export as an optimized GIF</p>
            </div>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary text-base px-6 py-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import Video
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Main Editor or Processing/Complete
  return (
    <div className="min-h-screen flex flex-col safe-area" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#D97757] to-[#E9A87E] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-lg">Giffy</span>
            </div>
            
            {state === 'editing' && (
              <button onClick={handleNew} className="btn-secondary hidden sm:inline-flex">
                New Project
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {state === 'editing' && (
              <button
                onClick={handleConvert}
                disabled={!canExport}
                className={canExport ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'}
              >
                Export GIF
              </button>
            )}
            
            {state === 'complete' && (
              <button 
                onClick={handleDownload} 
                className="btn-primary"
                disabled={downloadState !== 'idle'}
              >
                {downloadState === 'idle' && 'Download'}
                {downloadState === 'preparing' && 'Preparing...'}
                {downloadState === 'downloading' && 'Downloading...'}
                {downloadState === 'complete' && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Downloaded
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {state === 'editing' && videoUrl && (
          <div className="h-full flex flex-col">
            {/* Video Preview Area */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-4xl space-y-4">
                <div className="video-container">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-auto"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlayPause}
                    playsInline
                  />
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => seekTo(trimStart)} className="btn-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </button>
                  
                  <button onClick={togglePlayPause} className="btn-icon">
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  
                  <button onClick={() => seekTo(trimEnd)} className="btn-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                    </svg>
                  </button>
                </div>
                
                {/* Status */}
                {!canExport && (
                  <div className="status-badge error mx-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Clip must be 60 seconds or less
                  </div>
                )}
              </div>
            </div>
            
            {/* Timeline */}
            <div className="border-t p-4 sm:p-6" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Timeline</span>
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                
                {/* Playhead */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                    PLAYHEAD
                  </label>
                  <input
                    type="range"
                    className="range-slider"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                  />
                </div>
                
                {/* Trim Start */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      TRIM START
                    </label>
                    <span className="text-xs font-mono">{formatTime(trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < trimEnd) setTrimStart(val);
                    }}
                  />
                </div>
                
                {/* Trim End */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      TRIM END
                    </label>
                    <span className="text-xs font-mono">{formatTime(trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > trimStart) setTrimEnd(val);
                    }}
                  />
                </div>
                
                {/* Info */}
                <div className="flex items-center justify-between text-sm pt-2">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Clip duration: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatTime(clipDuration)}</span>
                  </span>
                  {videoFile && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {state === 'processing' && (
          <div className="h-full flex items-center justify-center p-4">
            <div className="card card-elevated p-8 sm:p-12 max-w-md w-full text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#D97757] to-[#E9A87E] rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Processing</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {processingStage}
                </p>
              </div>
              
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              
              <p className="text-2xl font-semibold">{progress}%</p>
            </div>
          </div>
        )}
        
        {state === 'complete' && gifUrl && (
          <div className="h-full flex items-center justify-center p-4 overflow-auto">
            <div className="card card-elevated p-6 sm:p-8 max-w-2xl w-full space-y-6">
              <div className="text-center">
                <div className="status-badge success mx-auto mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Conversion Complete
                </div>
                <h2 className="text-2xl font-semibold">Your GIF is Ready</h2>
              </div>
              
              <img 
                src={gifUrl} 
                alt="Generated GIF" 
                className="w-full rounded-lg" 
                style={{ border: '1px solid var(--border)' }}
              />
              
              <div className="grid grid-cols-2 gap-4">
                {gifBlob && (
                  <>
                    <div className="card p-4 text-center">
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>File Size</p>
                      <p className="text-lg font-semibold">
                        {(gifBlob.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Duration</p>
                      <p className="text-lg font-semibold">
                        {formatTime(clipDuration)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {downloadState !== 'idle' && (
                <div className={`status-badge ${downloadState === 'complete' ? 'success' : 'info'} fade-in`}>
                  {downloadState === 'preparing' && 'Preparing download...'}
                  {downloadState === 'downloading' && (
                    <>
                      <span className="pulse">Downloading...</span>
                    </>
                  )}
                  {downloadState === 'complete' && (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Downloaded successfully
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
