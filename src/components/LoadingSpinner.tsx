import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ className = '', fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90">
        <div className="text-center">
          {spinner}
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
} 