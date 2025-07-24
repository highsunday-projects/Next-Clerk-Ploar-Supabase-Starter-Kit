'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageLoaderProps {
  children: React.ReactNode;
}

export default function LanguageLoader({ children }: LanguageLoaderProps) {
  const { isLoading } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="opacity-100 transition-opacity duration-200">
      {children}
    </div>
  );
}
