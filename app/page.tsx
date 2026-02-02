'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

type EditorState = 'loading' | 'empty' | 'editing' | 'processing' | 'complete';

export default function VideoEditor() {
  // State
  const [state, setState] = useState<EditorState>('loading');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'preparing' | 'downloading' | 'complete'>('idle');

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
      setLoadingMessage('Loading video processor...');
      setLoadProgress(10);

      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress: prog }) => {
        const percent = Math.round(prog * 100);
        setProgress(percent);
        
        if (percent < 30) {
          setProcessingMessage('Preparing video...');
        } else if (percent < 60) {
          setProcessingMessage('Converting frames...');
        } else if (percent < 90) {
          setProcessingMessage('Optimizing GIF...');
        } else {
          setProcessingMessage('Almost done...');
        }
      });

      setLoadingMessage('Downloading core files...');
      setLoadProgress(30);

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setLoadingMessage('Ready!');
      setLoadProgress(100);
      setTimeout(() => setState('empty'), 500);
    } catch (error) {
      console.error('FFmpeg load error:', error);
      setLoadingMessage('Failed to load. Please refresh.');
      alert('Failed to load video processor. Please refresh.');
    }
  };

  // File selection
  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large! Max 100 MB');
      return;
    }

    setLoadingMessage('Loading video...');
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setState('editing');
    setTrimStart(0);
    setCurrentTime(0);
  };

  // Video loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(Math.min(dur, 60));
      setLoadingMessage('Video loaded successfully!');
    }
  };

  // Time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Play/pause
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

  // Seek
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Convert to GIF
  const handleConvert = async () => {
    if (!videoFile || !ffmpegRef.current) return;

    setState('processing');
    setProgress(0);
    setProcessingMessage('Starting conversion...');

    try {
      const ffmpeg = ffmpegRef.current;
      
      setProcessingMessage('Reading video file...');
      
      // Write input file
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      setProcessingMessage('Processing video...');

      // Convert
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

      setProcessingMessage('Finalizing GIF...');

      // Read output
      const data = await ffmpeg.readFile('output.gif') as Uint8Array;
      const blob = new Blob([new Uint8Array(data)], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      
      setGifBlob(blob);
      setGifUrl(url);
      setProcessingMessage('Complete!');
      setState('complete');

      // Cleanup
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.gif');
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Conversion failed!');
      setProcessingMessage('Conversion failed');
      setState('editing');
    }
  };

  // Download
  const handleDownload = () => {
    if (!gifUrl) return;
    
    setDownloadState('preparing');
    setIsDownloading(true);
    setProcessingMessage('Preparing download...');
    
    // Simulate download preparation
    setTimeout(() => {
      setDownloadState('downloading');
      setProcessingMessage('Downloading GIF...');
      
      const a = document.createElement('a');
      a.href = gifUrl;
      a.download = `giffy-${Date.now()}.gif`;
      a.click();
      
      // Simulate download completion
      setTimeout(() => {
        setDownloadState('complete');
        setProcessingMessage('✓ Downloaded successfully!');
        
        // Reset after showing success
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadState('idle');
          setProcessingMessage('');
        }, 3000);
      }, 800);
    }, 400);
  };

  // New project
  const handleNew = () => {
    if (confirm('Start new? Current work will be lost.')) {
      setVideoFile(null);
      setVideoUrl('');
      setGifBlob(null);
      setGifUrl('');
      setState('empty');
      setTrimStart(0);
      setTrimEnd(0);
      setCurrentTime(0);
      setProgress(0);
      setProcessingMessage('');
      setDownloadState('idle');
      setIsDownloading(false);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clipDuration = trimEnd - trimStart;
  const canExport = clipDuration > 0 && clipDuration <= 60;

  // Get status message
  const getStatusMessage = () => {
    if (state === 'editing') {
      if (!canExport) return '⚠️ Clip duration must be 60s or less';
      return '✓ Ready to export';
    }
    return '';
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brutalism-accent">
        <div className="text-center space-y-6 panel-brutal p-8 max-w-md mx-4">
          <div className="text-6xl">🎬</div>
          <h1 className="text-3xl font-bold uppercase">Giffy</h1>
          
          {/* Progress bar */}
          <div className="w-full">
            <div className="w-full h-4 bg-white border-2 border-black">
              <div 
                className="h-full bg-brutalism-dark transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="font-bold mt-3">{loadProgress}%</p>
          </div>
          
          {/* Status message */}
          <div className="panel-brutal p-3 bg-white">
            <p className="text-sm font-bold">{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (state === 'empty') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brutalism-bg">
        <div className="text-center space-y-8 p-8 max-w-md mx-4">
          <div className="panel-brutal p-12">
            <div className="text-8xl mb-6">📹</div>
            <h1 className="text-4xl font-black uppercase mb-4">Giffy</h1>
            <p className="text-lg mb-8">Professional Video to GIF Editor</p>
            
            {/* Instructions */}
            <div className="panel-brutal p-4 mb-6 text-left text-sm space-y-2">
              <p className="font-bold">How to use:</p>
              <p>1. Import your video file</p>
              <p>2. Trim to desired length (max 60s)</p>
              <p>3. Export as optimized GIF</p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-brutal-primary text-lg px-8 py-4"
            >
              Import Video
            </button>
          </div>
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

  // Main editor
  return (
    <div className="h-screen w-screen flex flex-col bg-brutalism-bg overflow-hidden safe-area">
      {/* Top Toolbar */}
      <div className="h-14 border-b-2 border-black bg-brutalism-panel flex items-center justify-between px-2 sm:px-4 flex-shrink-0 no-select">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-lg sm:text-xl font-black uppercase">Giffy</h1>
          <button onClick={handleNew} className="btn-brutal text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2">
            New
          </button>
        </div>
        
        {/* Status indicator - hidden on mobile */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          {(state === 'editing' || state === 'processing') && (
            <div className="panel-brutal px-4 py-2 text-sm font-bold max-w-md">
              {state === 'editing' && getStatusMessage()}
              {state === 'processing' && (
                <span className="text-brutalism-accent">{processingMessage}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {state === 'editing' && (
            <button
              onClick={handleConvert}
              disabled={!canExport}
              className={`${canExport ? 'btn-brutal-success' : 'btn-brutal opacity-50 cursor-not-allowed'} text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2`}
              title={!canExport ? 'Adjust trim to 60s or less' : 'Export to GIF'}
            >
              <span className="hidden sm:inline">Export GIF</span>
              <span className="sm:hidden">Export</span>
            </button>
          )}
          {state === 'complete' && (
            <>
              <button 
                onClick={handleDownload} 
                className={`btn-brutal-primary text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 ${downloadState === 'downloading' ? 'download-indicator' : ''}`}
                disabled={isDownloading}
              >
                {downloadState === 'idle' && 'Download'}
                {downloadState === 'preparing' && '⏳ Preparing...'}
                {downloadState === 'downloading' && '⬇️ Downloading...'}
                {downloadState === 'complete' && '✓ Downloaded!'}
              </button>
              {downloadState !== 'idle' && (
                <div className="hidden sm:block panel-brutal px-3 py-1 text-xs font-bold">
                  {downloadState === 'preparing' && '📦 Getting ready...'}
                  {downloadState === 'downloading' && '💾 Saving file...'}
                  {downloadState === 'complete' && '✨ Complete!'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - hidden on mobile/tablet */}
        <div className="hidden lg:block w-64 border-r-2 border-black bg-brutalism-panel flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase mb-2">Project</h2>
              {videoFile && (
                <div className="panel-brutal p-3 text-sm space-y-2">
                  <div>
                    <p className="text-xs opacity-60">FILE</p>
                    <p className="font-bold truncate">{videoFile.name}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">SIZE</p>
                    <p className="font-mono">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>

            {state === 'editing' && (
              <div>
                <h2 className="text-sm font-black uppercase mb-2">Clip Info</h2>
                <div className="panel-brutal p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-60">Duration:</span>
                    <span className="font-bold">{formatTime(clipDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Start:</span>
                    <span className="font-mono">{formatTime(trimStart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">End:</span>
                    <span className="font-mono">{formatTime(trimEnd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Status:</span>
                    <span className={`font-bold ${canExport ? 'text-green-600' : 'text-red-600'}`}>
                      {canExport ? 'Ready' : 'Too long'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {state === 'processing' && (
              <div>
                <h2 className="text-sm font-black uppercase mb-2">Processing</h2>
                <div className="panel-brutal p-3 space-y-2 text-sm">
                  <div>
                    <p className="text-xs opacity-60">PROGRESS</p>
                    <p className="font-bold text-lg">{progress}%</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">STATUS</p>
                    <p className="font-bold">{processingMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Preview */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 bg-brutalism-hover">
            {state === 'editing' && videoUrl && (
              <div className="w-full max-w-3xl space-y-2 sm:space-y-4">
                <div className="video-preview-brutal">
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
                
                {/* Playback controls */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  <button 
                    onClick={togglePlayPause} 
                    className="icon-btn-brutal text-lg sm:text-xl"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button 
                    onClick={() => seekTo(trimStart)} 
                    className="icon-btn-brutal text-lg sm:text-xl"
                    title="Jump to trim start"
                  >
                    ⏮
                  </button>
                  <button 
                    onClick={() => seekTo(trimEnd)} 
                    className="icon-btn-brutal text-lg sm:text-xl"
                    title="Jump to trim end"
                  >
                    ⏭
                  </button>
                </div>
                
                {/* Mobile status message */}
                <div className="md:hidden panel-brutal p-3 text-center">
                  <p className={`text-xs sm:text-sm font-bold ${canExport ? 'text-green-600' : 'text-red-600'}`}>
                    {getStatusMessage()}
                  </p>
                </div>
                
                {/* Current action hint - hidden on small mobile */}
                <div className="hidden sm:block panel-brutal p-3 text-center">
                  <p className="text-xs sm:text-sm font-bold">
                    Adjust the trim sliders below to select your clip
                  </p>
                </div>
              </div>
            )}

            {state === 'processing' && (
              <div className="panel-brutal p-6 sm:p-12 text-center max-w-md mx-4">
                <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 spin-brutal inline-block">⚡</div>
                <h2 className="text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4">Processing</h2>
                
                {/* Progress bar */}
                <div className="w-full h-4 sm:h-6 bg-white border-2 border-black mb-3 sm:mb-4">
                  <div 
                    className="h-full bg-brutalism-success transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <p className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">{progress}%</p>
                
                {/* Status message */}
                <div className="panel-brutal p-2 sm:p-3 bg-white">
                  <p className="text-xs sm:text-sm font-bold">{processingMessage}</p>
                </div>
                
                <p className="text-xs mt-3 sm:mt-4 opacity-60">
                  This may take a few moments
                </p>
              </div>
            )}

            {state === 'complete' && gifUrl && (
              <div className="panel-brutal p-4 sm:p-8 max-w-2xl mx-4 w-full">
                <h2 className="text-xl sm:text-2xl font-black uppercase mb-4 sm:mb-6 text-center" style={{ color: 'var(--claude-dark)' }}>
                  ✓ Complete!
                </h2>
                
                <img src={gifUrl} alt="Generated GIF" className="border-2 sm:border-4 border-black mb-4 sm:mb-6 w-full" style={{ borderColor: 'var(--claude-brown)' }} />
                
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {gifBlob && (
                    <>
                      <div className="panel-brutal p-2 sm:p-3 text-center">
                        <p className="text-xs opacity-60">FILE SIZE</p>
                        <p className="font-bold text-sm sm:text-lg" style={{ color: 'var(--claude-dark)' }}>
                          {(gifBlob.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="panel-brutal p-2 sm:p-3 text-center">
                        <p className="text-xs opacity-60">DURATION</p>
                        <p className="font-bold text-sm sm:text-lg" style={{ color: 'var(--claude-dark)' }}>
                          {formatTime(clipDuration)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Download state indicator */}
                {downloadState !== 'idle' && (
                  <div className={`panel-brutal p-3 sm:p-4 mb-4 sm:mb-6 text-center ${downloadState === 'complete' ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center justify-center gap-2">
                      {downloadState === 'preparing' && (
                        <>
                          <span className="text-2xl">📦</span>
                          <div>
                            <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--claude-orange)' }}>
                              Preparing Download
                            </p>
                            <p className="text-xs opacity-60">Getting your GIF ready...</p>
                          </div>
                        </>
                      )}
                      {downloadState === 'downloading' && (
                        <>
                          <span className="text-2xl download-pulse">⬇️</span>
                          <div>
                            <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--claude-orange)' }}>
                              Downloading...
                            </p>
                            <p className="text-xs opacity-60">Saving to your device</p>
                          </div>
                        </>
                      )}
                      {downloadState === 'complete' && (
                        <>
                          <span className="text-2xl">✨</span>
                          <div>
                            <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--claude-success)' }}>
                              Downloaded Successfully!
                            </p>
                            <p className="text-xs opacity-60">Check your downloads folder</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {downloadState === 'idle' && (
                  <p className="text-center text-xs sm:text-sm opacity-60">
                    Click "Download" button above to save your GIF
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          {state === 'editing' && (
            <div className="h-auto border-t-2 border-black bg-brutalism-panel flex-shrink-0">
              <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase">Timeline</span>
                  <span className="font-mono text-xs sm:text-sm font-bold">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Playhead */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold">PLAYHEAD</label>
                    <span className="hidden sm:inline text-xs opacity-60">Scrub through video</span>
                  </div>
                  <input
                    type="range"
                    className="range-brutal"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                  />
                </div>

                {/* Trim Start */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold">TRIM START</label>
                    <span className="text-xs font-mono font-bold">{formatTime(trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    className="range-brutal"
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold">TRIM END</label>
                    <span className="text-xs font-mono font-bold">{formatTime(trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    className="range-brutal"
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
                
                {/* Mobile clip info */}
                <div className="lg:hidden panel-brutal p-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="opacity-60">Clip:</span>
                    <span className="font-bold">{formatTime(clipDuration)}</span>
                  </div>
                  {videoFile && (
                    <div className="flex justify-between">
                      <span className="opacity-60">File:</span>
                      <span className="font-bold truncate max-w-[60%]">{videoFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - hidden on mobile/tablet */}
        <div className="hidden lg:block w-64 border-l-2 border-black bg-brutalism-panel flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase mb-2">Export</h2>
              {state === 'editing' && (
                <div className="panel-brutal p-3 space-y-3 text-sm">
                  <div>
                    <p className="text-xs opacity-60">FORMAT</p>
                    <p className="font-bold">Animated GIF</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">QUALITY</p>
                    <p className="font-bold">Optimized</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">CLIP LENGTH</p>
                    <p className="font-bold">{formatTime(clipDuration)}</p>
                  </div>
                  <div className={`panel-brutal p-2 text-center ${canExport ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-xs font-bold ${canExport ? 'text-green-800' : 'text-red-800'}`}>
                      {canExport ? '✓ Ready to Export' : '⚠ Max 60s'}
                    </p>
                  </div>
                </div>
              )}
              
              {state === 'complete' && gifBlob && (
                <div className="panel-brutal p-3 space-y-3 text-sm">
                  <div>
                    <p className="text-xs opacity-60">OUTPUT SIZE</p>
                    <p className="font-bold">{(gifBlob.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">READY TO</p>
                    <p className="font-bold">Download</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Help section */}
            <div>
              <h2 className="text-sm font-black uppercase mb-2">Help</h2>
              <div className="panel-brutal p-3 text-xs space-y-2">
                <p>• <strong>Import:</strong> Select video file</p>
                <p>• <strong>Trim:</strong> Adjust start/end sliders</p>
                <p>• <strong>Export:</strong> Convert to GIF</p>
                <p>• <strong>Download:</strong> Save to device</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
