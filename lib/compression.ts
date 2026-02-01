export interface CompressionPreset {
  maxWidth: number;
  fps: number;
}

export function getCompressionPreset(duration: number): CompressionPreset {
  if (duration <= 10) {
    return {
      maxWidth: 720,
      fps: 15,
    };
  }
  
  if (duration <= 30) {
    return {
      maxWidth: 480,
      fps: 12,
    };
  }
  
  // 30-60 seconds
  return {
    maxWidth: 360,
    fps: 10,
  };
}

export function getEstimatedFileSize(duration: number): string {
  const preset = getCompressionPreset(duration);
  
  // Rough estimation (very approximate)
  const sizePerSecond = (preset.maxWidth / 720) * (preset.fps / 15) * 150; // KB per second
  const estimatedKB = Math.round(duration * sizePerSecond);
  
  if (estimatedKB > 1024) {
    return `~${(estimatedKB / 1024).toFixed(1)} MB`;
  }
  
  return `~${estimatedKB} KB`;
}
