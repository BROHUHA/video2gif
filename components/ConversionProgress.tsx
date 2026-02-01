'use client';

import { useState } from 'react';

interface ConversionProgressProps {
  progress: number;
  isConverting: boolean;
  error: string | null;
}

export default function ConversionProgress({ 
  progress, 
  isConverting,
  error 
}: ConversionProgressProps) {
  if (!isConverting && !error) return null;

  return (
    <div className="space-y-4">
      {isConverting && (
        <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg" role="status" aria-live="polite">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Converting to GIF...</h3>
            <span className="text-2xl font-bold font-mono" aria-label={`Conversion progress: ${progress} percent`}>{progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-[var(--primary)] h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          
          <p className="text-xs text-[var(--muted)] mt-2">
            Please wait... Processing in your browser.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-[var(--error)] rounded-lg" role="alert">
          <p className="text-sm text-[var(--error)] font-medium">
            ❌ {error}
          </p>
        </div>
      )}
    </div>
  );
}
