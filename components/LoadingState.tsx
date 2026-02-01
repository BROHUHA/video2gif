'use client';

interface LoadingStateProps {
  message: string;
}

export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-sm mx-4 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-[var(--primary)] rounded-full animate-spin"></div>
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-lg mb-1">{message}</p>
            <p className="text-sm text-[var(--muted)]">
              This may take a moment...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
