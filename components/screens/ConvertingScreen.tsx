'use client';

interface ConvertingScreenProps {
  progress: number;
  clipDuration: number;
  onCancel: () => void;
}

export default function ConvertingScreen({ progress, clipDuration, onCancel }: ConvertingScreenProps) {
  const estimatedTotalSeconds = Math.max(5, Math.ceil(clipDuration * 2));
  const elapsedSeconds = Math.ceil((progress / 100) * estimatedTotalSeconds);
  const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);

  const handleCancel = () => {
    if (confirm('Cancel conversion? You\'ll go back!')) {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background: 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)'}}>
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Animated Icon */}
        <div className="relative rotate-chaos-2">
          <div className="w-40 h-40 mx-auto bg-gradient-to-br from-lime-400 via-yellow-400 to-cyan-400 border-6 border-black neo-shadow-chaos flex items-center justify-center animate-pulse">
            <span className="text-8xl sticker">⚡</span>
          </div>
          <div className="absolute -top-4 -right-4 bg-pink-400 border-3 border-black px-3 py-2 rotate-12 sticker">
            <span className="text-lg font-black">WORKING!</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight" style={{
            background: 'linear-gradient(135deg, #84cc16 0%, #fbbf24 50%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            CONVERTING!
          </h1>
          <p className="text-2xl font-black text-gray-800">
            ~{remainingSeconds}s left <span className="sticker inline-block">⏱️</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-4 rotate-chaos-1">
          <div 
            className="w-full bg-white border-6 border-black h-20 overflow-hidden neo-shadow-triple"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div 
              className="h-full transition-all duration-300 flex items-center justify-center relative"
              style={{ 
                width: `${progress}%`,
                background: 'repeating-linear-gradient(45deg, #84cc16, #84cc16 20px, #fbbf24 20px, #fbbf24 40px)'
              }}
            >
              {progress > 5 && (
                <span className="text-3xl font-black text-black mix-blend-multiply">
                  {progress}%
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-purple-200 border-3 border-black px-4 py-2 inline-block neo-shadow-pink">
            <p className="text-sm font-black">
              Processing in your browser • No upload
            </p>
          </div>
        </div>

        {/* Cancel */}
        <button
          onClick={handleCancel}
          className="text-base font-black text-gray-700 hover:text-black underline decoration-4 decoration-red-500 transition-colors"
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}
