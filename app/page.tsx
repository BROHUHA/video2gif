'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

type AppState = 'init' | 'empty' | 'loaded' | 'editing' | 'processing' | 'ready';

// Icon Components
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

const SkipBackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19 20 9 12 19 4 19 20"></polygon>
    <line x1="5" y1="19" x2="5" y2="5"></line>
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4"></polygon>
    <line x1="19" y1="5" x2="19" y2="19"></line>
  </svg>
);

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const LoaderIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const FilmIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>
);

export default function Giffy() {
  const [state, setState] = useState<AppState>('init');
  const [loadProgress, setLoadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { initFFmpeg(); }, []);
  
  const initFFmpeg = async () => {
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      ffmpeg.on('progress', ({ progress }) => {
        setConversionProgress(Math.round(progress * 100));
      });
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const progressInterval = setInterval(() => {
        setLoadProgress(prev => prev >= 95 ? prev : prev + 5);
      }, 200);
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      clearInterval(progressInterval);
      setLoadProgress(100);
      setTimeout(() => setState('empty'), 300);
    } catch (error) {
      console.error('FFmpeg init failed:', error);
      alert('Failed to initialize. Please refresh.');
    }
  };
  
  const handleFileSelect = (file: File) => {
    if (!file?.type.startsWith('video/')) return alert('Please select a video file');
    if (file.size > 100 * 1024 * 1024) return alert('File must be under 100 MB');
    
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setState('loaded');
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('drag-over');
  };
  
  const handleDragLeave = () => {
    dropZoneRef.current?.classList.remove('drag-over');
  };
  
  const handleVideoLoad = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(Math.min(dur, 10));
      setState('editing');
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };
  
  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
    setIsPlaying(!isPlaying);
  };
  
  const seekTo = (time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
  };
  
  const handleExport = async () => {
    if (!videoFile || !ffmpegRef.current) return;
    
    setState('processing');
    setConversionProgress(0);
    
    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
      
      const clipDuration = trimEnd - trimStart;
      const fps = clipDuration <= 3 ? 24 : clipDuration <= 10 ? 15 : 12;
      
      await ffmpeg.exec([
        '-ss', trimStart.toString(),
        '-t', clipDuration.toString(),
        '-i', 'input.mp4',
        '-vf', `fps=${fps},scale=600:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer`,
        '-loop', '0',
        'output.gif'
      ]);
      
      const data = await ffmpeg.readFile('output.gif') as Uint8Array;
      const blob = new Blob([new Uint8Array(data)], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      
      setGifBlob(blob);
      setGifUrl(url);
      setState('ready');
      
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.gif');
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed. Try again.');
      setState('editing');
    }
  };
  
  const handleDownload = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `giffy-${Date.now()}.gif`;
    a.click();
  };
  
  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    setVideoFile(null);
    setVideoUrl('');
    setGifBlob(null);
    setGifUrl('');
    setTrimStart(0);
    setTrimEnd(0);
    setCurrentTime(0);
    setState('empty');
  };
  
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };
  
  const clipDuration = trimEnd - trimStart;
  const canExport = clipDuration > 0.5 && clipDuration <= 60;
  
  // INIT State
  if (state === 'init') {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF2E63 0%, #08D9D6 50%, #FFD93D 100%)' }}>
        <div className="card card-glow-pink animate-popin" style={{ maxWidth: '450px', width: '90%' }}>
          <div className="icon-box mx-auto mb-6 animate-bounce">
            <div className="animate-spin text-white">
              <LoaderIcon />
            </div>
          </div>
          <h1 className="text-h1 text-center mb-4 text-gradient">GIFFY</h1>
          <p className="text-center mb-6" style={{ fontWeight: 600 }}>LOADING VIDEO PROCESSOR</p>
          <div className="progress mb-4">
            <div className="progress-fill" style={{ width: `${loadProgress}%` }}></div>
          </div>
          <p className="text-center text-bold text-h2">{loadProgress}%</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Fixed Header */}
      <header className="header flex-shrink-0" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container flex items-center justify-between" style={{ padding: 'var(--space-base)' }}>
          <div className="flex items-center gap-base">
            <div className="icon-box" style={{ width: '48px', height: '48px' }}>
              <div className="text-white">
                <FilmIcon />
              </div>
            </div>
            <h1 className="text-h2 text-gradient" style={{ fontWeight: 800 }}>GIFFY</h1>
          </div>
          
          {state !== 'empty' && (
            <button onClick={handleReset} className="btn-accent flex items-center gap-sm" style={{ padding: '10px 20px', fontSize: '14px' }}>
              <PlusIcon />
              NEW
            </button>
          )}
        </div>
      </header>
      
      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-lg) 0' }}>
        <div className="container h-full">
          {/* EMPTY State */}
          {state === 'empty' && (
            <div className="h-full flex items-center justify-center">
              <div className="animate-popin" style={{ maxWidth: '700px', width: '100%' }}>
                <div className="text-center mb-8">
                  <h2 className="text-display text-gradient mb-4" style={{ lineHeight: 0.9, fontSize: 'clamp(40px, 8vw, 64px)' }}>
                    CREATE<br/>AMAZING<br/>GIFS
                  </h2>
                  <p className="text-h3 text-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    FAST • SIMPLE • FREE
                  </p>
                </div>
                
                <div
                  ref={dropZoneRef}
                  className="drop-zone mb-8"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{ padding: 'var(--space-2xl) var(--space-lg)' }}
                >
                  <div className="icon-box icon-box-accent mx-auto mb-4 animate-bounce" style={{ width: '80px', height: '80px' }}>
                    <div style={{ color: 'var(--color-border)' }}>
                      <UploadIcon />
                    </div>
                  </div>
                  <h3 className="text-h2 text-bold mb-3">DROP VIDEO HERE</h3>
                  <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    OR CLICK TO BROWSE
                  </p>
                  <button className="btn-primary btn-lg flex items-center gap-base mx-auto">
                    <UploadIcon />
                    CHOOSE VIDEO
                  </button>
                  <p style={{ marginTop: 'var(--space-base)', fontSize: 'var(--font-small)', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                    MP4, MOV, WEBM • MAX 100 MB
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                
                <div className="grid gap-base" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="feature-card" style={{ padding: 'var(--space-base)' }}>
                    <div className="text-h1 mb-2">
                      <ZapIcon />
                    </div>
                    <h4 className="text-body text-bold mb-1">LIGHTNING FAST</h4>
                    <p style={{ fontSize: 'var(--font-small)', color: 'var(--color-text-secondary)' }}>
                      Browser-based processing
                    </p>
                  </div>
                  <div className="feature-card" style={{ padding: 'var(--space-base)' }}>
                    <div className="text-h1 mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <h4 className="text-body text-bold mb-1">100% PRIVATE</h4>
                    <p style={{ fontSize: 'var(--font-small)', color: 'var(--color-text-secondary)' }}>
                      Never leaves your device
                    </p>
                  </div>
                  <div className="feature-card" style={{ padding: 'var(--space-base)' }}>
                    <div className="text-h1 mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                    </div>
                    <h4 className="text-body text-bold mb-1">PRO QUALITY</h4>
                    <p style={{ fontSize: 'var(--font-small)', color: 'var(--color-text-secondary)' }}>
                      Optimized output
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* LOADED/EDITING State */}
          {(state === 'loaded' || state === 'editing') && videoUrl && (
            <div className="h-full flex items-center justify-center">
              <div className="animate-popin w-full" style={{ maxWidth: '900px' }}>
                <div className="card card-glow-cyan" style={{ padding: 'var(--space-lg)' }}>
                  {/* Video Container */}
                  <div className="video-container mb-4" style={{ maxHeight: '50vh' }}>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      onLoadedMetadata={handleVideoLoad}
                      onTimeUpdate={handleTimeUpdate}
                      onClick={togglePlay}
                      playsInline
                      style={{ cursor: 'pointer', maxHeight: '50vh', width: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  
                  {state === 'editing' && (
                    <>
                      {/* Controls */}
                      <div className="flex items-center justify-center gap-base mb-4">
                        <button onClick={() => seekTo(trimStart)} className="btn-secondary flex items-center gap-sm" style={{ padding: '12px 16px', fontSize: '14px' }}>
                          <SkipBackIcon />
                          START
                        </button>
                        <button onClick={togglePlay} className="btn-primary flex items-center justify-center" style={{ width: '56px', height: '56px', padding: 0, borderRadius: '12px' }}>
                          {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button onClick={() => seekTo(trimEnd)} className="btn-secondary flex items-center gap-sm" style={{ padding: '12px 16px', fontSize: '14px' }}>
                          END
                          <SkipForwardIcon />
                        </button>
                      </div>
                      
                      <div className="divider" style={{ margin: 'var(--space-base) 0' }}></div>
                      
                      {/* Timeline */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-body text-bold">TIMELINE</span>
                          <span className="badge" style={{ padding: '4px 10px', fontSize: '12px' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        
                        <div className="mb-3">
                          <label className="text-bold" style={{ fontSize: '11px', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                            PLAYHEAD
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={duration}
                            step={0.01}
                            value={currentTime}
                            onChange={(e) => seekTo(parseFloat(e.target.value))}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-base mb-4">
                          <div>
                            <label className="text-bold" style={{ fontSize: '11px', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                              START: {formatTime(trimStart)}
                            </label>
                            <input
                              type="range"
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
                          <div>
                            <label className="text-bold" style={{ fontSize: '11px', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                              END: {formatTime(trimEnd)}
                            </label>
                            <input
                              type="range"
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
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-body text-bold">DURATION: {formatTime(clipDuration)}</span>
                          {!canExport && (
                            <div className="badge-error flex items-center gap-xs" style={{ padding: '6px 12px', fontSize: '12px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              MAX 60 SEC
                            </div>
                          )}
                          {canExport && (
                            <button onClick={handleExport} className="btn-primary flex items-center gap-sm" style={{ padding: '12px 24px', fontSize: '14px' }}>
                              <ZapIcon />
                              EXPORT GIF
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* PROCESSING State */}
          {state === 'processing' && (
            <div className="h-full flex items-center justify-center">
              <div className="animate-popin" style={{ maxWidth: '500px', width: '90%' }}>
                <div className="card card-glow-pink text-center" style={{ padding: 'var(--space-xl)' }}>
                  <div className="icon-box mx-auto mb-6 animate-wiggle">
                    <div className="animate-spin text-white">
                      <LoaderIcon />
                    </div>
                  </div>
                  <h2 className="text-h1 text-bold mb-3">CREATING YOUR GIF</h2>
                  <p className="text-body mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                    USUALLY TAKES 3-8 SECONDS
                  </p>
                  <div className="progress mb-4">
                    <div className="progress-fill" style={{ width: `${conversionProgress}%` }}></div>
                  </div>
                  <p className="text-display text-bold">{conversionProgress}%</p>
                </div>
              </div>
            </div>
          )}
          
          {/* READY State */}
          {state === 'ready' && gifUrl && (
            <div className="h-full flex items-center justify-center">
              <div className="animate-popin w-full" style={{ maxWidth: '800px' }}>
                <div className="card card-glow-pink" style={{ padding: 'var(--space-lg)' }}>
                  <div className="text-center mb-6">
                    <div className="badge-success flex items-center gap-xs mx-auto" style={{ display: 'inline-flex', marginBottom: 'var(--space-base)', padding: '6px 12px', fontSize: '12px' }}>
                      <CheckIcon />
                      READY TO DOWNLOAD
                    </div>
                    <h2 className="text-h1 text-gradient">YOUR GIF IS READY</h2>
                  </div>
                  
                  <div className="video-container mb-6" style={{ maxHeight: '50vh' }}>
                    <img src={gifUrl} alt="Generated GIF" style={{ maxHeight: '50vh', width: '100%', objectFit: 'contain' }} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-base mb-6">
                    <div className="stat-box" style={{ padding: 'var(--space-base)' }}>
                      <p className="text-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>FILE SIZE</p>
                      <p className="text-h2 text-bold">{gifBlob && formatBytes(gifBlob.size)}</p>
                    </div>
                    <div className="stat-box" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-light))', padding: 'var(--space-base)' }}>
                      <p className="text-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>DURATION</p>
                      <p className="text-h2 text-bold">{formatTime(clipDuration)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-base">
                    <button onClick={handleDownload} className="btn-primary flex items-center gap-sm justify-center" style={{ padding: '14px 20px', fontSize: '14px' }}>
                      <DownloadIcon />
                      DOWNLOAD
                    </button>
                    <button onClick={handleReset} className="btn-secondary flex items-center gap-sm justify-center" style={{ padding: '14px 20px', fontSize: '14px' }}>
                      <PlusIcon />
                      NEW GIF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
