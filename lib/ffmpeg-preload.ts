import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let isLoaded = false;

export async function preloadFFmpeg(
  onProgress?: (progress: number) => void
): Promise<void> {
  if (isLoaded || isLoading) return;
  
  isLoading = true;

  try {
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg Preload]', message);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    // Simulate download progress
    if (onProgress) {
      onProgress(10);
    }
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    if (onProgress) onProgress(40);
    
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
    if (onProgress) onProgress(70);
    
    await ffmpeg.load({
      coreURL,
      wasmURL,
    });

    if (onProgress) onProgress(100);

    ffmpegInstance = ffmpeg;
    isLoaded = true;
    isLoading = false;

    console.log('[FFmpeg] Preloaded successfully');
  } catch (error) {
    console.error('[FFmpeg] Preload failed:', error);
    isLoading = false;
    throw error;
  }
}

export function getFFmpegInstance(): FFmpeg | null {
  return ffmpegInstance;
}

export function isFFmpegLoaded(): boolean {
  return isLoaded;
}

export function isFFmpegLoading(): boolean {
  return isLoading;
}

export function resetFFmpeg(): void {
  ffmpegInstance = null;
  isLoaded = false;
  isLoading = false;
}
