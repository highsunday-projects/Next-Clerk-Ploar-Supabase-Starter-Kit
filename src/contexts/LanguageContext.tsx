'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Language,
  defaultLanguage,
  getInitialLanguage,
  setStoredLanguage,
  getTranslation
} from '@/locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // 使用函數初始化來避免語言閃爍
  const [language, setLanguageState] = useState<Language>(() => {
    // 在客戶端環境下立即檢測語言
    if (typeof window !== 'undefined') {
      return getInitialLanguage();
    }
    // 服務器端使用預設語言
    return defaultLanguage;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 確保客戶端和服務器端的一致性
  useEffect(() => {
    if (!isInitialized) {
      const initialLanguage = getInitialLanguage();
      if (language !== initialLanguage) {
        setLanguageState(initialLanguage);
      }
      setIsInitialized(true);

      // 短暫延遲以確保語言設定完成，避免閃爍
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 50);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [language, isInitialized]);

  // 切換語言函數
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  };

  // 翻譯函數
  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
