'use client';

import { useState, useEffect } from 'react';

interface ResultScreenProps {
  gifBlob: Blob;
  onNewUpload: () => void;
}

export default function ResultScreen({ gifBlob, onNewUpload }: ResultScreenProps) {
  const [gifUrl, setGifUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDownloadHint, setShowDownloadHint] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(gifBlob);
    setGifUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [gifBlob]);

  const handleDownload = () => {
    setDownloading(true);
    
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `giffy-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
      setShowDownloadHint(true);
      setTimeout(() => setShowDownloadHint(false), 4000);
    }, 500);
  };

  const handleShare = async () => {
    if (navigator.share && navigator.canShare()) {
      try {
        const file = new File([gifBlob], `giffy-${Date.now()}.gif`, { type: 'image/gif' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My GIF from Giffy',
          });
        } else {
          await copyToClipboard();
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      const item = new ClipboardItem({ 'image/gif': gifBlob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Could not copy! Use download instead.');
    }
  };

  const fileSizeMB = (gifBlob.size / (1024 * 1024)).toFixed(2);
  const fileSizeKB = (gifBlob.size / 1024).toFixed(0);
  const displaySize = gifBlob.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

  const handleNewUpload = () => {
    if (confirm('Start over? Current GIF will be lost!')) {
      onNewUpload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)'}}>
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 rotate-chaos-1">
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-lime-400 via-yellow-400 to-pink-400 px-6 py-4 border-6 border-black neo-shadow-chaos">
              <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight flex items-center justify-center gap-3">
                <span className="sticker text-5xl">🎉</span>
                SUCCESS!
                <span className="sticker text-5xl">✨</span>
              </h1>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-cyan-400 border-3 border-black px-3 py-1 rotate-12 text-xs font-black sticker">
              YOUR GIF!
            </div>
          </div>
          <p className="text-xl font-black text-gray-800">
            Ready to download!
          </p>
        </div>

        {/* GIF Preview */}
        <div className="relative bg-black border-6 border-black neo-shadow-double overflow-hidden rotate-chaos-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={gifUrl} 
            alt="Your GIF" 
            className="w-full"
          />
          <div className="absolute top-4 right-4 bg-yellow-400 border-3 border-black px-3 py-2 rotate-6 sticker">
            <p className="text-sm font-black">{displaySize}</p>
          </div>
        </div>

        {/* Download hint */}
        {showDownloadHint && (
          <div className="p-4 bg-lime-400 border-5 border-black neo-shadow-triple text-center rotate-chaos-1 wiggle">
            <p className="text-lg font-black flex items-center justify-center gap-2">
              <span className="text-2xl">✓</span>
              Saved to Downloads!
            </p>
          </div>
        )}

        {/* Primary Download */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-gradient-to-r from-lime-400 to-yellow-400 text-black font-black px-8 py-6 border-6 border-black neo-shadow-chaos hover:translate-x-3 hover:translate-y-3 hover:shadow-none transition-all text-2xl sm:text-3xl uppercase disabled:opacity-60 btn-press rotate-chaos-3"
        >
          {downloading ? '⬇ DOWNLOADING...' : '⬇ DOWNLOAD GIF'}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleShare}
            className="bg-pink-300 text-black font-black px-5 py-4 border-4 border-black neo-shadow-pink hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all text-lg sm:text-xl uppercase btn-press rotate-chaos-1"
          >
            {copied ? '✓ COPIED' : '📋 COPY'}
          </button>
          
          <button
            onClick={handleNewUpload}
            className="bg-cyan-300 text-black font-black px-5 py-4 border-4 border-black neo-shadow-triple hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all text-lg sm:text-xl uppercase btn-press rotate-chaos-2"
          >
            + NEW
          </button>
        </div>

        {/* Footer */}
        <div className="text-center rotate-chaos-1">
          <div className="inline-block bg-purple-200 border-3 border-black px-6 py-3 neo-shadow-double">
            <p className="text-sm font-black flex items-center gap-2 justify-center">
              <span>Made with</span>
              <span className="sticker inline-block text-xl">❤️</span>
              <span>by Giffy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
