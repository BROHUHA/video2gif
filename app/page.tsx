'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// --- ICONS ---

const PixelArrow = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixel-art">
    <path fillRule="evenodd" clipRule="evenodd" d="M11 2H13V8H17L12 13L7 8H11V2ZM5 16H19V18H5V16Z" fill="#00FFFF" />
    <path d="M11 2H13V8H17L12 13L7 8H11V2ZM5 16H19V18H5V16Z" stroke="black" strokeWidth="0.5" />
  </svg>
);

const IconScissors = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const IconText = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <path d="M4 7V4h16v3" />
    <path d="M9 20h6" />
    <path d="M12 4v16" />
  </svg>
);

const IconSpeed = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <path d="m12 13 4-3" />
    <path d="M12 21a9 9 0 1 0-.25-17.98" />
  </svg>
);

const IconLightning = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const IconLock = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconStar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// --- COMPONENTS ---

const GlitchBlocks = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="glitch-block w-8 h-8 top-10 left-10" />
    <div className="glitch-block w-16 h-4 top-1/4 right-20" />
    <div className="glitch-block w-4 h-16 bottom-1/3 left-4" />
    <div className="glitch-block w-12 h-12 bottom-10 right-10" />
    <div className="glitch-block w-6 h-6 top-1/2 left-1/3" />
    <div className="glitch-block w-20 h-2 top-20 left-1/2" />
  </div>
);

// Draggable Text Overlay Component
interface DraggableTextProps {
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  onPositionChange: (x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const DraggableTextOverlay: React.FC<DraggableTextProps> = ({ text, x, y, onPositionChange, containerRef }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const newX = Math.min(100, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const newY = Math.min(100, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100));
      onPositionChange(newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!text) return null;

  return (
    <div
      className="absolute cursor-move select-none px-3 py-1 bg-black/70 text-white font-heading text-lg border-2 border-[var(--color-cyan)] shadow-lg hover:border-[var(--color-pink)] transition-colors"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
    >
      {text}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-pink)] border border-black"></div>
    </div>
  );
};

// --- MAIN COMPONENT ---

type AppState = 'init' | 'idle' | 'loaded' | 'processing' | 'ready';
type ToolMode = 'none' | 'crop' | 'text' | 'speed';

export default function RetroGiffy() {
  const [state, setState] = useState<AppState>('init');
  const [loadProgress, setLoadProgress] = useState(0);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState('');
  const [outputType, setOutputType] = useState(''); // 'gif', 'mp4', etc.

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>('none');

  // Tool Configs
  const [speed, setSpeed] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  // Trim tool state
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  // Text overlay state
  const [overlayText, setOverlayText] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  // Draggable text position (percentage of video dimensions)
  const [textX, setTextX] = useState(50); // 50% = center
  const [textY, setTextY] = useState(80); // 80% = near bottom
  const [isDragging, setIsDragging] = useState(false);
  // Crop state (percentage of video dimensions)
  const [cropEnabled, setCropEnabled] = useState(false);
  const [cropX, setCropX] = useState(10); // Left offset %
  const [cropY, setCropY] = useState(10); // Top offset %
  const [cropW, setCropW] = useState(80); // Width %
  const [cropH, setCropH] = useState(80); // Height %
  // Preview mode state
  const [showPreview, setShowPreview] = useState(false);

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initFFmpeg();
  }, []);

  // Prevent browser from opening dropped files in new tab
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const initFFmpeg = async () => {
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('progress', ({ progress }) => {
        setConversionProgress(Math.round(progress * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

      // Fake loading sequence
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p > 100) {
          clearInterval(interval);
          setLoadProgress(100);
          setTimeout(() => setState('idle'), 500);
        } else {
          setLoadProgress(p);
        }
      }, 100);

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setVideoFile(file);
    // Create preview URL
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setState('loaded');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUnload = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setVideoFile(null);
    setState('idle');
    setActiveTool('none');
    setOutputUrl('');
    // Reset tool configs
    setSpeed(1);
    setTrimStart(0);
    setTrimEnd(10);
    setOverlayText('');
    // Reset crop
    setCropEnabled(false);
    setCropX(10);
    setCropY(10);
    setCropW(80);
    setCropH(80);
  };

  const convertFile = async (format: 'gif' | 'mp4' | 'webm' | 'mp3' | 'webp' | 'avi' | 'mov' | 'wav' | 'flac') => {
    if (!videoFile || !ffmpegRef.current) return;
    setState('processing');
    setConversionProgress(0);
    setOutputType(format);

    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      let outputName = `output.${format}`;
      let mimeType = '';
      let command: string[] = [];

      // Build input arguments (with trim if enabled)
      const inputArgs: string[] = [];
      if (trimEnabled && trimStart > 0) {
        inputArgs.push('-ss', trimStart.toString());
      }
      inputArgs.push('-i', 'input.mp4');
      if (trimEnabled && trimEnd > trimStart) {
        inputArgs.push('-t', (trimEnd - trimStart).toString());
      }

      // Build video filter (simplified - no drawtext for wasm compatibility)
      let videoFilters: string[] = [];

      // Crop filter (uses iw/ih for input width/height expressions)
      if (cropEnabled) {
        // crop=w:h:x:y - w/h are dimensions, x/y are offset from top-left
        // Using expressions: iw=input width, ih=input height
        const w = `iw*${cropW / 100}`;
        const h = `ih*${cropH / 100}`;
        const x = `iw*${cropX / 100}`;
        const y = `ih*${cropY / 100}`;
        videoFilters.push(`crop=${w}:${h}:${x}:${y}`);
      }

      // Speed filter
      if (speed !== 1) {
        videoFilters.push(`setpts=PTS/${speed}`);
      }

      const vfString = videoFilters.length > 0 ? videoFilters.join(',') : '';

      switch (format) {
        case 'gif':
          if (vfString) {
            command = [...inputArgs, '-vf', `${vfString},fps=10,scale=480:-1:flags=lanczos`, '-loop', '0', outputName];
          } else {
            command = [...inputArgs, '-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0', outputName];
          }
          mimeType = 'image/gif';
          break;
        case 'webm':
          if (vfString) {
            command = [...inputArgs, '-vf', vfString, '-c:v', 'libvpx', '-b:v', '1M', '-c:a', 'libvorbis', outputName];
          } else {
            command = [...inputArgs, '-c:v', 'libvpx', '-b:v', '1M', '-c:a', 'libvorbis', outputName];
          }
          mimeType = 'video/webm';
          break;
        case 'mp3':
          command = [...inputArgs, '-map', 'a', '-q:a', '0', outputName];
          mimeType = 'audio/mpeg';
          break;
        case 'webp':
          if (vfString) {
            command = [...inputArgs, '-vf', vfString, '-vcodec', 'libwebp', '-lossless', '1', '-loop', '0', '-an', '-vsync', '0', outputName];
          } else {
            command = [...inputArgs, '-vcodec', 'libwebp', '-lossless', '1', '-loop', '0', '-an', '-vsync', '0', outputName];
          }
          mimeType = 'image/webp';
          break;
        case 'mp4':
          if (vfString || speed !== 1) {
            const audioFilter = speed !== 1 ? `-af atempo=${speed}` : '';
            if (audioFilter) {
              command = [...inputArgs, '-vf', vfString || `setpts=PTS/${speed}`, '-af', `atempo=${speed}`, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', outputName];
            } else {
              command = [...inputArgs, '-vf', vfString, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', outputName];
            }
          } else {
            command = [...inputArgs, '-c:v', 'libx264', '-crf', '23', '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '128k', outputName];
          }
          mimeType = 'video/mp4';
          break;
        case 'avi':
          if (vfString) {
            command = [...inputArgs, '-vf', vfString, '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'mp3', outputName];
          } else {
            command = [...inputArgs, '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'mp3', outputName];
          }
          mimeType = 'video/x-msvideo';
          break;
        case 'mov':
          if (vfString) {
            command = [...inputArgs, '-vf', vfString, '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'aac', outputName];
          } else {
            command = [...inputArgs, '-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'aac', outputName];
          }
          mimeType = 'video/quicktime';
          break;
        case 'wav':
          command = [...inputArgs, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', outputName];
          mimeType = 'audio/wav';
          break;
        case 'flac':
          command = [...inputArgs, '-vn', '-acodec', 'flac', outputName];
          mimeType = 'audio/flac';
          break;
      }

      await ffmpeg.exec(command);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: mimeType }));
      setOutputUrl(url);
      setState('ready');

      // Cleanup
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile(outputName);

    } catch (e) {
      console.error(e);
      alert('Conversion failed!');
      setState('loaded');
    }
  };

  // --- PRELOADER ---
  if (state === 'init') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--color-bg-dark)] text-white relative overflow-hidden">
        <GlitchBlocks />
        <div className="relative w-64 h-64 flex items-center justify-center z-10">
          <svg className="absolute w-full h-full animate-spin-slow" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#333" strokeWidth="8" fill="none" strokeDasharray="4 2" />
            <circle cx="50" cy="50" r="45" stroke="var(--color-cyan)" strokeWidth="8" fill="none" strokeDasharray="4 2" strokeDashoffset={280 - (280 * loadProgress) / 100} pathLength="100" />
          </svg>
          <div className="text-4xl font-heading glitch-text" data-text="GIF">GIF</div>
        </div>
        <h2 className="mt-8 text-2xl font-heading tracking-widest text-center z-10">INITIALIZING SYSTEMS... {loadProgress}%</h2>
      </div>
    );
  }

  const isMp4 = videoFile?.type === 'video/mp4';

  // --- MAIN UI ---
  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 bg-[var(--color-bg-dark)] text-black relative overflow-hidden">

      {/* BACKGROUND ELEMENTS */}
      <GlitchBlocks />

      {/* ANIMATED DECORATIONS */}
      <div className="floating-shape floating-shape-1"></div>
      <div className="floating-shape floating-shape-2"></div>
      <div className="floating-shape floating-shape-3"></div>
      <div className="floating-shape floating-shape-4"></div>
      <div className="corner-glow corner-glow-tl"></div>
      <div className="corner-glow corner-glow-br"></div>
      <div className="scanlines"></div>

      <header className="mb-6 relative z-10 w-full max-w-5xl flex justify-between items-center px-4">
        {/* LOGO + TITLE */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Giffy Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
        </div>

        {/* GUIDE BUTTON - RESPONSIVE */}
        <button
          onClick={() => setShowGuide(true)}
          className="btn-retro btn-yellow px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm sm:text-base"
        >
          <span className="bg-black text-[var(--color-yellow)] w-6 h-6 flex items-center justify-center font-bold">?</span>
          <span className="hidden sm:inline">GUIDE</span>
        </button>
      </header>

      {/* GUIDE POPUP MODAL */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowGuide(false)}>
          <div className="bg-[var(--color-card)] border-4 border-black max-w-lg w-full p-6 relative shadow-[8px_8px_0px_0px_#00FFFF]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowGuide(false)} className="absolute top-3 right-3 bg-red-500 text-white p-2 hover:scale-110 transition-transform border-2 border-black">
              <IconX />
            </button>
            <h2 className="font-heading text-3xl mb-4 text-[var(--color-pink)]">HOW TO USE</h2>
            <ol className="list-decimal list-inside space-y-3 text-lg">
              <li><strong>Upload:</strong> Drag & drop a video or click <span className="bg-[var(--color-pink)] text-white px-1">CHOOSE VIDEO</span>.</li>
              <li><strong>Edit:</strong> Use <span className="bg-[var(--color-cyan)] text-black px-1">TOOLS</span> on the left (Speed, Crop, Text).</li>
              <li><strong>Convert:</strong> Select a format from the <span className="bg-black text-white px-1">FORMAT MATRIX</span>.</li>
              <li><strong>Wait:</strong> Conversion happens in your browser (no uploads).</li>
              <li><strong>Download:</strong> Click the download button when ready!</li>
            </ol>
            <div className="mt-6 text-center">
              <button onClick={() => setShowGuide(false)} className="btn-retro btn-lime px-6 py-2 font-heading">GOT IT!</button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW SCREEN MODAL */}
      {showPreview && videoPreviewUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-[var(--color-card)] border-4 border-black max-w-4xl w-full p-6 relative shadow-[8px_8px_0px_0px_#FF0055]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPreview(false)} className="absolute top-3 right-3 bg-red-500 text-white p-2 hover:scale-110 transition-transform border-2 border-black">
              <IconX />
            </button>
            <h2 className="font-heading text-3xl mb-4 text-[var(--color-cyan)]">PREVIEW CHANGES</h2>

            {/* Video Preview with Text Overlay */}
            <div ref={previewContainerRef} className="relative w-full aspect-video bg-black border-4 border-[var(--color-pink)] mb-4 overflow-hidden">
              <video src={videoPreviewUrl} controls autoPlay muted loop className="w-full h-full object-contain" />
              <DraggableTextOverlay
                text={overlayText}
                x={textX}
                y={textY}
                onPositionChange={(x, y) => { setTextX(x); setTextY(y); }}
                containerRef={previewContainerRef}
              />
            </div>

            {/* Settings Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-gray-100 border-2 border-black text-center">
                <div className="text-xs text-gray-500">SPEED</div>
                <div className="font-heading text-xl text-[var(--color-pink)]">{speed}x</div>
              </div>
              <div className="p-3 bg-gray-100 border-2 border-black text-center">
                <div className="text-xs text-gray-500">TRIM START</div>
                <div className="font-heading text-xl text-[var(--color-cyan)]">{trimStart}s</div>
              </div>
              <div className="p-3 bg-gray-100 border-2 border-black text-center">
                <div className="text-xs text-gray-500">TRIM END</div>
                <div className="font-heading text-xl text-[var(--color-cyan)]">{trimEnd}s</div>
              </div>
              <div className="p-3 bg-gray-100 border-2 border-black text-center">
                <div className="text-xs text-gray-500">TEXT</div>
                <div className="font-heading text-sm truncate text-[var(--color-lime)]">{overlayText || 'None'}</div>
              </div>
            </div>

            <div className="text-center">
              <button onClick={() => setShowPreview(false)} className="btn-retro btn-cyan px-8 py-3 font-heading text-lg">CLOSE PREVIEW</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="retro-card w-full max-w-5xl flex flex-col md:flex-row min-h-[600px] overflow-hidden z-10 relative">

        {/* SIDEBAR TOOLS */}
        <aside className="w-full md:w-64 bg-black border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col relative z-20">
          <div className="p-4 bg-[var(--color-cyan)] text-black font-heading text-xl tracking-wider border-b-4 border-black flex justify-between items-center">
            <span>TOOLS</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-black"></div>
              <div className="w-2 h-2 bg-black"></div>
            </div>
          </div>
          <div className="flex-1 flex flex-col p-2 gap-2">
            <button
              className={`w-full text-left p-4 font-heading tracking-wide border-2 border-transparent hover:border-[var(--color-pink)] hover:bg-[var(--color-pink)] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 flex items-center gap-3 group ${activeTool === 'crop' ? 'bg-[var(--color-yellow)] text-black shadow-[4px_4px_0px_0px_#fff] border-black' : 'text-white border-white/20'} ${!videoFile ? 'opacity-70' : ''}`}
              onClick={() => videoFile ? setActiveTool('crop') : fileInputRef.current?.click()}
            >
              <div className={`transform transition-transform ${activeTool === 'crop' ? 'scale-110' : 'group-hover:scale-110'}`}>
                <IconScissors />
              </div>
              <span>{videoFile ? 'CROP & TRIM' : 'SELECT VIDEO'}</span>
            </button>

            <button
              className={`w-full text-left p-4 font-heading tracking-wide border-2 border-transparent hover:border-[var(--color-lime)] hover:bg-[var(--color-lime)] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 flex items-center gap-3 group ${activeTool === 'speed' ? 'bg-[var(--color-yellow)] text-black shadow-[4px_4px_0px_0px_#fff] border-black' : 'text-white border-white/20'} ${!videoFile ? 'opacity-70' : ''}`}
              onClick={() => videoFile ? setActiveTool('speed') : fileInputRef.current?.click()}
            >
              <div className={`transform transition-transform ${activeTool === 'speed' ? 'scale-110' : 'group-hover:scale-110'}`}>
                <IconSpeed />
              </div>
              <span>{videoFile ? 'SPEED CONTROL' : 'SELECT VIDEO'}</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 bg-[var(--color-card)] p-6 lg:p-10 flex flex-col relative w-full">

          {/* Top Info Bar */}
          <div className="absolute top-0 right-0 p-2 flex gap-2">
            <div className="w-4 h-4 bg-[var(--color-pink)]"></div>
            <div className="w-4 h-4 bg-[var(--color-cyan)]"></div>
            <div className="w-4 h-4 bg-[var(--color-lime)]"></div>
          </div>

          {(state === 'idle' || state === 'loaded') && (
            <>
              {/* TOOL EDITORS */}
              {activeTool === 'speed' && videoFile && (
                <div className="mb-8 border-4 border-black bg-white p-6 relative">
                  <button onClick={() => setActiveTool('none')} className="absolute top-2 right-2 p-1 hover:bg-gray-200"><IconX /></button>
                  <h3 className="font-heading text-xl mb-4">SPEED CONTROL</h3>
                  {/* VIDEO PREVIEW */}
                  {videoPreviewUrl && (
                    <div className="w-full max-w-sm mx-auto mb-4 border-4 border-black bg-black">
                      <video src={videoPreviewUrl} controls muted className="w-full max-h-32 object-contain" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <span className="font-bold">0.5x</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.5"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="font-bold">2.0x</span>
                  </div>
                  <div className="text-center font-heading text-2xl text-[var(--color-pink)]">{speed}x SPEED</div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => setActiveTool('none')} className="btn-retro btn-cyan px-4 py-2 flex items-center gap-2">
                      <IconCheck /> DONE
                    </button>
                  </div>
                </div>
              )}

              {activeTool === 'text' && videoFile && (
                <div className="mb-8 border-4 border-black bg-white p-6 relative">
                  <button onClick={() => setActiveTool('none')} className="absolute top-2 right-2 p-1 hover:bg-gray-200"><IconX /></button>
                  <h3 className="font-heading text-xl mb-4">ADD TEXT OVERLAY</h3>

                  {/* Text Input */}
                  <div className="mb-4">
                    <label className="block font-bold mb-2">Your Text:</label>
                    <input
                      type="text"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Type your text here..."
                      className="w-full border-4 border-black p-3 font-heading text-lg focus:outline-none focus:border-[var(--color-pink)]"
                    />
                  </div>

                  {/* Draggable Preview Area */}
                  <div className="mb-4">
                    <label className="block font-bold mb-2">Drag text to position:</label>
                    <div
                      ref={previewContainerRef}
                      className="relative w-full aspect-video bg-black border-4 border-[var(--color-cyan)] overflow-hidden"
                    >
                      {videoPreviewUrl && (
                        <video src={videoPreviewUrl} muted loop autoPlay className="w-full h-full object-contain" />
                      )}
                      <DraggableTextOverlay
                        text={overlayText}
                        x={textX}
                        y={textY}
                        onPositionChange={(x, y) => { setTextX(x); setTextY(y); }}
                        containerRef={previewContainerRef}
                      />
                    </div>
                    <p className="text-gray-500 text-sm mt-2 text-center">Click and drag the text to move it</p>
                  </div>

                  {/* Position Display */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 text-center p-2 bg-gray-100 border-2 border-black font-heading">
                      X: <span className="text-[var(--color-pink)]">{textX.toFixed(0)}%</span>
                    </div>
                    <div className="flex-1 text-center p-2 bg-gray-100 border-2 border-black font-heading">
                      Y: <span className="text-[var(--color-pink)]">{textY.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-100 border-2 border-yellow-500 mb-4 text-sm">
                    <p className="text-yellow-800">⚠️ Text position is saved but won&apos;t appear in output due to browser FFmpeg limitations.</p>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => { setOverlayText(''); setTextX(50); setTextY(80); }} className="btn-retro btn-black px-4 py-2 text-white">RESET</button>
                    <button onClick={() => setActiveTool('none')} className="btn-retro btn-cyan px-4 py-2 flex items-center gap-2"><IconCheck /> DONE</button>
                  </div>
                </div>
              )}

              {activeTool === 'crop' && videoFile && (
                <div className="mb-8 border-4 border-black bg-white p-6 relative">
                  <button onClick={() => setActiveTool('none')} className="absolute top-2 right-2 p-1 hover:bg-gray-200"><IconX /></button>
                  <h3 className="font-heading text-xl mb-4">CROP & TRIM</h3>

                  {/* Visual Crop Preview */}
                  <div className="mb-4">
                    <label className="block font-bold mb-2">Crop Preview:</label>
                    <div className="relative w-full aspect-video bg-black border-4 border-[var(--color-cyan)] overflow-hidden">
                      {videoPreviewUrl && (
                        <video src={videoPreviewUrl} muted loop autoPlay className="w-full h-full object-contain" />
                      )}
                      {/* Crop overlay - darkened areas outside crop zone */}
                      {cropEnabled && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Dark overlays */}
                          <div className="absolute bg-black/60" style={{ top: 0, left: 0, right: 0, height: `${cropY}%` }}></div>
                          <div className="absolute bg-black/60" style={{ bottom: 0, left: 0, right: 0, height: `${100 - cropY - cropH}%` }}></div>
                          <div className="absolute bg-black/60" style={{ top: `${cropY}%`, left: 0, width: `${cropX}%`, height: `${cropH}%` }}></div>
                          <div className="absolute bg-black/60" style={{ top: `${cropY}%`, right: 0, width: `${100 - cropX - cropW}%`, height: `${cropH}%` }}></div>
                          {/* Crop border */}
                          <div
                            className="absolute border-2 border-dashed border-[var(--color-pink)]"
                            style={{ left: `${cropX}%`, top: `${cropY}%`, width: `${cropW}%`, height: `${cropH}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enable Crop Toggle */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-100 border-2 border-black">
                    <input
                      type="checkbox"
                      id="enableCrop"
                      checked={cropEnabled}
                      onChange={(e) => setCropEnabled(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <label htmlFor="enableCrop" className="font-heading text-lg cursor-pointer">ENABLE CROP</label>
                  </div>

                  {/* Crop Controls */}
                  {cropEnabled && (
                    <div className="space-y-3 mb-4 p-4 bg-gray-50 border-2 border-dashed border-black">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-bold mb-1">X Offset: {cropX}%</label>
                          <input type="range" min="0" max="50" value={cropX} onChange={(e) => setCropX(parseInt(e.target.value))} className="w-full" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">Y Offset: {cropY}%</label>
                          <input type="range" min="0" max="50" value={cropY} onChange={(e) => setCropY(parseInt(e.target.value))} className="w-full" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">Width: {cropW}%</label>
                          <input type="range" min="20" max="100" value={cropW} onChange={(e) => setCropW(parseInt(e.target.value))} className="w-full" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">Height: {cropH}%</label>
                          <input type="range" min="20" max="100" value={cropH} onChange={(e) => setCropH(parseInt(e.target.value))} className="w-full" />
                        </div>
                      </div>
                      {/* Presets */}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => { setCropX(0); setCropY(0); setCropW(100); setCropH(100); }} className="px-2 py-1 bg-gray-200 border-2 border-black text-sm font-heading hover:bg-gray-300">FULL</button>
                        <button onClick={() => { setCropX(0); setCropY(12); setCropW(100); setCropH(56); }} className="px-2 py-1 bg-gray-200 border-2 border-black text-sm font-heading hover:bg-gray-300">16:9</button>
                        <button onClick={() => { setCropX(12); setCropY(0); setCropW(75); setCropH(100); }} className="px-2 py-1 bg-gray-200 border-2 border-black text-sm font-heading hover:bg-gray-300">4:3</button>
                        <button onClick={() => { setCropX(22); setCropY(0); setCropW(56); setCropH(100); }} className="px-2 py-1 bg-gray-200 border-2 border-black text-sm font-heading hover:bg-gray-300">9:16</button>
                        <button onClick={() => { setCropX(12); setCropY(0); setCropW(75); setCropH(75); }} className="px-2 py-1 bg-gray-200 border-2 border-black text-sm font-heading hover:bg-gray-300">1:1</button>
                      </div>
                    </div>
                  )}

                  {/* Trim Controls */}
                  <div className="space-y-4 mb-4">
                    <h4 className="font-heading text-lg border-b-2 border-black pb-1">TRIM</h4>

                    {/* Enable Trim Toggle */}
                    <div className="flex items-center gap-3 p-3 bg-gray-100 border-2 border-black">
                      <input
                        type="checkbox"
                        id="enableTrim"
                        checked={trimEnabled}
                        onChange={(e) => setTrimEnabled(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <label htmlFor="enableTrim" className="font-heading text-lg cursor-pointer">ENABLE TRIM</label>
                    </div>

                    {/* Trim Inputs - Only show when enabled */}
                    {trimEnabled && (
                      <div className="flex gap-4 items-center p-4 bg-gray-50 border-2 border-dashed border-black">
                        <div className="flex-1">
                          <label className="block font-bold mb-2">Start (s):</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={trimStart}
                            onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                            className="w-full border-4 border-black p-2 font-heading focus:outline-none focus:border-[var(--color-pink)]"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block font-bold mb-2">End (s):</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(parseFloat(e.target.value) || 0)}
                            className="w-full border-4 border-black p-2 font-heading focus:outline-none focus:border-[var(--color-pink)]"
                          />
                        </div>
                        <div className="text-center px-3 py-2 bg-white border-2 border-black">
                          <span className="text-xs">Duration</span>
                          <div className="font-heading text-[var(--color-pink)]">{Math.max(0, trimEnd - trimStart).toFixed(1)}s</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => { setCropEnabled(false); setCropX(10); setCropY(10); setCropW(80); setCropH(80); setTrimStart(0); setTrimEnd(10); }} className="btn-retro btn-black px-4 py-2 text-white">RESET</button>
                    <button onClick={() => setActiveTool('none')} className="btn-retro btn-cyan px-4 py-2 flex items-center gap-2"><IconCheck /> DONE</button>
                  </div>
                </div>
              )}

              {/* DROP ZONE */}
              {activeTool === 'none' && (
                <div
                  className={`border-dashed border-4 border-black bg-white/50 p-8 mb-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors group relative ${state === 'loaded' ? 'bg-green-100 border-green-500' : ''}`}
                  onClick={() => !videoFile && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="text-4xl md:text-5xl font-heading text-center mb-4 leading-none relative z-10">
                    {state === 'loaded' ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-[var(--color-lime)] px-3 py-1 text-2xl">FILE LOADED</span>
                        </div>
                        <span className="text-xl sm:text-2xl break-all line-clamp-2 mb-4">{videoFile?.name}</span>
                        {/* VIDEO PREVIEW */}
                        {videoPreviewUrl && (
                          <div className="w-full max-w-md mb-4 border-4 border-black bg-black">
                            <video src={videoPreviewUrl} controls className="w-full max-h-48 object-contain" />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUnload(); }}
                          className="btn-retro bg-red-500 text-white px-6 py-3 flex items-center gap-2 hover:bg-red-600 border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none transition-all"
                          title="Unload File"
                        >
                          <IconX />
                          <span className="font-heading">UNLOAD FILE</span>
                        </button>
                        {/* PREVIEW CHANGES BUTTON */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                          className="btn-retro btn-lime px-6 py-3 flex items-center gap-2 mt-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none transition-all"
                        >
                          <span className="font-heading">PREVIEW CHANGES</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="bg-[var(--color-yellow)] px-2">DROP YOUR</span><br />
                        VIDEO HERE
                      </>
                    )}
                  </div>

                  {state === 'idle' && (
                    <div className="transform group-hover:-translate-y-2 transition-transform duration-300">
                      <PixelArrow />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 w-full h-full border-2 border-dashed border-black opacity-20 pointer-events-none transform translate-x-2 translate-y-2"></div>
                </div>
              )}

              {/* CHOOSE BTN */}
              {state === 'idle' && activeTool === 'none' && (
                <div className="flex justify-center mb-8">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative btn-retro btn-pink px-10 py-4 text-xl font-heading flex items-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    CHOOSE VIDEO
                  </button>
                </div>
              )}

              <div className="w-full h-1 bg-black mb-8 opacity-20"></div>

              {/* FORMAT MATRIX */}
              {activeTool === 'none' && (
                <div className={`mb-4 ${state === 'idle' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                  <h3 className="font-heading text-xl mb-4 uppercase tracking-wider flex justify-between">
                    FORMAT MATRIX
                    {state === 'idle' && <span className="text-sm bg-black text-white px-2">SELECT VIDEO FIRST</span>}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* VIDEO FORMATS */}
                    <button onClick={() => convertFile('gif')} className={`btn-retro py-3 px-4 flex items-center justify-between group bg-[#1a1a1a] text-white border-4 border-black shadow-[4px_4px_0px_0px_#FF0055] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${!isMp4 ? '' : 'sm:col-span-2 lg:col-span-3'}`}>
                      <span className="bg-[var(--color-pink)] text-white px-2 py-0.5 text-xs font-heading">GIF</span>
                      <span className="font-heading text-sm">CONVERT TO GIF</span>
                    </button>
                    {!isMp4 && (
                      <button onClick={() => convertFile('mp4')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-[var(--color-lime)] text-black border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                        <span className="bg-black text-[var(--color-lime)] px-2 py-0.5 text-xs font-heading">MP4</span>
                        <span className="font-heading text-sm">CONVERT TO MP4</span>
                      </button>
                    )}
                    <button onClick={() => convertFile('webm')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-[var(--color-cyan)] text-black border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                      <span className="bg-black text-[var(--color-cyan)] px-2 py-0.5 text-xs font-heading">WEBM</span>
                      <span className="font-heading text-sm">CONVERT TO WEBM</span>
                    </button>
                    <button onClick={() => convertFile('webp')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-[var(--color-yellow)] text-black border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                      <span className="bg-black text-[var(--color-yellow)] px-2 py-0.5 text-xs font-heading">WEBP</span>
                      <span className="font-heading text-sm">CONVERT TO WEBP</span>
                    </button>
                    <button onClick={() => convertFile('avi')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-orange-500 text-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                      <span className="bg-black text-orange-400 px-2 py-0.5 text-xs font-heading">AVI</span>
                      <span className="font-heading text-sm">CONVERT TO AVI</span>
                    </button>
                    <button onClick={() => convertFile('mov')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-purple-500 text-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                      <span className="bg-black text-purple-400 px-2 py-0.5 text-xs font-heading">MOV</span>
                      <span className="font-heading text-sm">CONVERT TO MOV</span>
                    </button>

                    {/* AUDIO FORMATS - distinct section */}
                    <div className="sm:col-span-2 lg:col-span-3 mt-2 pt-3 border-t-2 border-dashed border-black/30">
                      <div className="text-xs text-gray-500 font-heading mb-2">AUDIO EXTRACTION</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button onClick={() => convertFile('mp3')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-[var(--color-pink)] text-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                          <span className="bg-white text-black px-2 py-0.5 text-xs font-heading">MP3</span>
                          <span className="font-heading text-sm">EXTRACT MP3</span>
                        </button>
                        <button onClick={() => convertFile('wav')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-teal-500 text-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                          <span className="bg-black text-teal-400 px-2 py-0.5 text-xs font-heading">WAV</span>
                          <span className="font-heading text-sm">EXTRACT WAV</span>
                        </button>
                        <button onClick={() => convertFile('flac')} className="btn-retro py-3 px-4 flex items-center justify-between group bg-indigo-500 text-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                          <span className="bg-black text-indigo-400 px-2 py-0.5 text-xs font-heading">FLAC</span>
                          <span className="font-heading text-sm">EXTRACT FLAC</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {state === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <h2 className="text-4xl font-heading mb-6 blink">CONVERTING...</h2>
              <div className="retro-progress w-full max-w-md h-8 border-4 border-black bg-white relative">
                <div className="h-full bg-[var(--color-cyan)] relative overflow-hidden" style={{ width: `${conversionProgress}%` }}>
                  <div className="absolute inset-0 bg-[url('/stripe.png')] opacity-20"></div>
                </div>
              </div>
              <p className="mt-4 font-heading text-xl">{conversionProgress}% / 100%</p>
            </div>
          )}

          {state === 'ready' && outputUrl && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-white p-2 border-4 border-black mb-6 shadow-retro-lg max-w-md w-full">
                {outputType.startsWith('image') || outputType === 'gif' ? (
                  <img src={outputUrl} alt="Output" className="w-full h-auto border-2 border-black" />
                ) : (
                  <div className="w-full h-48 bg-black flex items-center justify-center text-white font-heading">VIDEO READY</div>
                )}
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                <a href={outputUrl} download={`retro-output.${outputType === 'gif' ? 'gif' : outputType}`} className="btn-retro btn-cyan px-8 py-3 text-xl">DOWNLOAD {outputType.toUpperCase()}</a>
                <button onClick={() => setState('loaded')} className="btn-retro btn-black px-8 py-3 text-xl">BACK TO MATRIX</button>
                <button onClick={() => handleUnload()} className="btn-retro btn-pink px-8 py-3 text-xl">NEW FILE</button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

        </main>
      </div>

      {/* FOOTER FEATURE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12 mb-8 z-10 text-white">
        <div className="border-4 border-white p-6 flex flex-col items-center justify-center hover:bg-white/10 transition-colors cursor-default bg-black">
          <IconLightning />
          <h3 className="font-heading mt-2 tracking-widest">LIGHTNING FAST</h3>
          <p className="text-xs text-center mt-1 text-gray-400">Uses WASM Technology</p>
        </div>
        <div className="border-4 border-white p-6 flex flex-col items-center justify-center hover:bg-white/10 transition-colors cursor-default bg-black">
          <IconLock />
          <h3 className="font-heading mt-2 tracking-widest">100% PRIVATE</h3>
          <p className="text-xs text-center mt-1 text-gray-400">Local Browser Processing</p>
        </div>
        <div className="border-4 border-white p-6 flex flex-col items-center justify-center hover:bg-white/10 transition-colors cursor-default bg-black">
          <IconStar />
          <h3 className="font-heading mt-2 tracking-widest">PRO QUALITY</h3>
          <p className="text-xs text-center mt-1 text-gray-400">Optimized Palettes</p>
        </div>
      </div>

      <footer className="text-gray-500 text-xs text-center py-6 z-10 w-full max-w-5xl border-t border-gray-800">
        <div className="flex justify-center items-center gap-6">
          <span>© {new Date().getFullYear()} Giffy</span>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="https://abinbinoy.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-cyan)] transition-colors">@abinbinoy</a>
        </div>
      </footer>

    </div>
  );
}
