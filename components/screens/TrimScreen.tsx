'use client';

import { useEffect, useRef, useState } from 'react';

interface TrimScreenProps {
  file: File;
  onConfirm: (trimStart: number, trimEnd: number) => void;
  onBack: () => void;
  maxDuration: number;
}

export default function TrimScreen({ file, onConfirm, onBack, maxDuration }: TrimScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setTrimEnd(Math.min(videoDuration, maxDuration));
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (time >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && !isLoading) {
      videoRef.current.currentTime = trimStart;
    }
  }, [trimStart, isLoading]);

  const clipDuration = trimEnd - trimStart;
  const exceedsLimit = clipDuration > maxDuration;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (confirm('Go back? Your clip will be lost!')) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)'}}>
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 rotate-chaos-1">
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-400 px-6 py-3 border-5 border-black neo-shadow-chaos">
              <h1 className="text-4xl sm:text-5xl font-black uppercase">
                Pick your Clip! ✂️
              </h1>
            </div>
            <div className="absolute -top-3 -right-3 bg-yellow-400 border-3 border-black px-2 py-1 rotate-12 text-xs font-black sticker">
              STEP 2
            </div>
          </div>
          <p className="text-base font-bold text-gray-700">
            Choose which part to turn into a GIF
          </p>
        </div>

        {/* Video */}
        <div className="bg-black border-5 border-black neo-shadow-double overflow-hidden rotate-chaos-2">
          {isLoading && (
            <div className="aspect-video flex items-center justify-center bg-gray-900">
              <div className="text-white text-5xl sticker">⏳</div>
            </div>
          )}
          
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            controls
            loop
            className="w-full"
          />
        </div>

        {/* Timeline */}
        {!isLoading && (
          <div className="relative w-full h-16 bg-white border-4 border-black neo-shadow-triple rotate-chaos-3">
            <div 
              className="absolute h-full transition-all"
              style={{
                left: `${(trimStart / duration) * 100}%`,
                width: `${((trimEnd - trimStart) / duration) * 100}%`,
                background: 'repeating-linear-gradient(45deg, #84cc16, #84cc16 10px, #fbbf24 10px, #fbbf24 20px)'
              }}
            />
            <div 
              className="absolute top-0 bottom-0 w-1 bg-black z-10"
              style={{ left: `${(trimStart / duration) * 100}%` }}
            />
            <div 
              className="absolute top-0 bottom-0 w-1 bg-black z-10"
              style={{ left: `${(trimEnd / duration) * 100}%` }}
            />
            <div 
              className="absolute top-0 bottom-0 w-1 bg-red-600 z-20 pulse-glow"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}

        {/* Controls */}
        <div className="space-y-5 bg-white border-5 border-black p-4 sm:p-6 neo-shadow-pink rotate-chaos-1">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-lg sm:text-xl font-black uppercase bg-lime-300 border-2 border-black px-3 py-1">
                START
              </label>
              <span className="text-xl sm:text-2xl font-black bg-yellow-300 px-4 py-2 border-3 border-black font-mono">
                {formatTime(trimStart)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={trimStart}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value < trimEnd) setTrimStart(value);
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-lg sm:text-xl font-black uppercase bg-cyan-300 border-2 border-black px-3 py-1">
                END
              </label>
              <span className="text-xl sm:text-2xl font-black bg-pink-300 px-4 py-2 border-3 border-black font-mono">
                {formatTime(trimEnd)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={trimEnd}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value > trimStart) setTrimEnd(value);
              }}
            />
          </div>

          <div className={`text-center p-5 border-5 ${exceedsLimit ? 'border-red-600 bg-red-100 wiggle' : 'border-black bg-gradient-to-r from-lime-100 to-yellow-100'}`}>
            <p className="text-sm font-black uppercase text-gray-700">Clip Length</p>
            <p className="text-4xl sm:text-5xl font-black font-mono mt-1">
              {formatTime(clipDuration)}
            </p>
            {exceedsLimit && (
              <p className="text-lg font-black text-red-600 mt-2 uppercase sticker">
                ⚠️ Too long! Max {maxDuration}s
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBack}
            className="flex-1 bg-white text-black font-black px-6 py-5 border-5 border-black neo-shadow-double hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all text-xl uppercase btn-press rotate-chaos-2"
          >
            ← BACK
          </button>
          
          <button
            onClick={() => onConfirm(trimStart, trimEnd)}
            disabled={exceedsLimit}
            className={`
              flex-1 font-black px-6 py-5 border-5 border-black transition-all text-xl uppercase btn-press rotate-chaos-1
              ${exceedsLimit 
                ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                : 'bg-gradient-to-r from-lime-400 to-yellow-400 neo-shadow-chaos hover:translate-x-2 hover:translate-y-2 hover:shadow-none'
              }
            `}
          >
            {exceedsLimit ? '❌ TOO LONG' : 'CONVERT! →'}
          </button>
        </div>
      </div>
    </div>
  );
}
