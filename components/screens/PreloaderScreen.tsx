'use client';

import { useEffect, useState } from 'react';
import { preloadFFmpeg } from '@/lib/ffmpeg-preload';

interface PreloaderScreenProps {
  onComplete: () => void;
}

export default function PreloaderScreen({ onComplete }: PreloaderScreenProps) {
  const [progress, setProgress] = useState(0);
  const [downloadedMB, setDownloadedMB] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const totalMB = 31;

    preloadFFmpeg((prog) => {
      setProgress(prog);
      setDownloadedMB((prog / 100) * totalMB);
      
      if (prog === 100) {
        setTimeout(() => onComplete(), 500);
      }
    }).catch((err) => {
      console.error('FFmpeg preload error:', err);
      setError('Setup failed. Please refresh!');
    });
  }, [onComplete]);

  const estimatedSeconds = Math.max(3, Math.ceil((100 - progress) / 3));

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)'}}>
        <div className="text-center space-y-6 max-w-md rotate-chaos-2">
          <div className="text-8xl sticker">💥</div>
          <div className="space-y-3 bg-red-100 p-6 border-5 border-black neo-shadow-triple">
            <h1 className="text-4xl font-black uppercase">Oops!</h1>
            <p className="text-xl font-bold">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-black font-black px-8 py-4 border-4 border-black neo-shadow-double hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all text-2xl uppercase btn-press"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)'}}>
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Chaotic Logo */}
        <div className="space-y-4 rotate-chaos-1">
          <div className="relative inline-block">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-lime-400 to-lime-600 border-5 border-black neo-shadow-chaos flex items-center justify-center transform -rotate-6">
              <span className="text-7xl">🎬</span>
            </div>
            <div className="absolute -top-2 -right-2 bg-yellow-400 border-3 border-black px-3 py-1 rotate-12 sticker">
              <span className="text-sm font-black">NEW!</span>
            </div>
          </div>
          
          <h1 className="text-7xl font-black uppercase tracking-tighter" style={{
            background: 'linear-gradient(135deg, #84cc16 0%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '3px 3px 0px rgba(0,0,0,0.1)'
          }}>
            GIFFY
          </h1>
          
          <p className="text-2xl font-black text-gray-800">
            Video → GIF <span className="sticker inline-block text-3xl">✨</span>
          </p>
        </div>

        {/* Progress with chaos */}
        <div className="space-y-4 rotate-chaos-2">
          <div className="bg-white p-4 border-4 border-black neo-shadow-double">
            <p className="text-2xl font-black uppercase mb-2">
              Warming up... <span className="sticker inline-block">🔥</span>
            </p>
            <p className="text-lg font-bold text-gray-700">
              ~{estimatedSeconds}s left
            </p>
          </div>

          <div 
            className="w-full bg-white border-5 border-black h-14 overflow-hidden neo-shadow-triple"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div 
              className="h-full transition-all duration-300 flex items-center justify-center relative"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #84cc16 0%, #fbbf24 50%, #22d3ee 100%)'
              }}
            >
              {progress > 5 && (
                <span className="text-xl font-black text-black mix-blend-multiply">
                  {progress}%
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm font-bold text-gray-600">
            {downloadedMB.toFixed(1)} / 31 MB • One-time only!
          </p>
        </div>
      </div>
    </div>
  );
}
