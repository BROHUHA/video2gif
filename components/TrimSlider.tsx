'use client';

interface TrimSliderProps {
  duration: number;
  trimStart: number;
  trimEnd: number;
  onTrimStartChange: (value: number) => void;
  onTrimEndChange: (value: number) => void;
  maxDuration: number;
}

export default function TrimSlider({
  duration,
  trimStart,
  trimEnd,
  onTrimStartChange,
  onTrimEndChange,
  maxDuration,
}: TrimSliderProps) {
  const clipDuration = trimEnd - trimStart;
  const exceedsLimit = clipDuration > maxDuration;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="trim-start" className="text-sm font-medium">Trim Start</label>
          <span className="text-sm text-[var(--muted)]" aria-live="polite">
            {formatTime(trimStart)}
          </span>
        </div>
        <input
          id="trim-start"
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={trimStart}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value < trimEnd) {
              onTrimStartChange(value);
            }
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          aria-label="Trim start time"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="trim-end" className="text-sm font-medium">Trim End</label>
          <span className="text-sm text-[var(--muted)]" aria-live="polite">
            {formatTime(trimEnd)}
          </span>
        </div>
        <input
          id="trim-end"
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={trimEnd}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value > trimStart) {
              onTrimEndChange(value);
            }
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          aria-label="Trim end time"
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div>
          <p className="text-sm font-medium">Clip Duration</p>
          <p className="text-2xl font-bold mt-1">
            {formatTime(clipDuration)}
          </p>
        </div>
        
        <div className={`text-right ${exceedsLimit ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>
          <p className="text-sm font-medium">
            {exceedsLimit ? '⚠ Too Long' : '✓ Valid'}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Max: {formatTime(maxDuration)}
          </p>
        </div>
      </div>

      {exceedsLimit && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-[var(--error)] rounded-lg">
          <p className="text-sm text-[var(--error)] font-medium">
            Clip duration exceeds the {maxDuration}s limit. Please adjust your trim points.
          </p>
        </div>
      )}
    </div>
  );
}
