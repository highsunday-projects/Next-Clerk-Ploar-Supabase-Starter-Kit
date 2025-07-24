import zhTW from './zh-TW.json';
import en from './en.json';

export type Language = 'zh-TW' | 'en';

export type TranslationKeys = typeof zhTW;

export const languages = {
  'zh-TW': zhTW,
  'en': en,
} as const;

export const languageNames = {
  'zh-TW': '繁體中文',
  'en': 'English',
} as const;

export const defaultLanguage: Language = 'en';

// 獲取翻譯文字的工具函數
export function getTranslation(
  language: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const translations = languages[language];
  
  // 支援巢狀鍵值，例如 'header.navigation.dashboard'
  const keys = key.split('.');
  let value: unknown = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // 如果找不到翻譯，返回鍵值本身
      console.warn(`Translation key not found: ${key} for language: ${language}`);
      return key;
    }
  }
  
  if (typeof value !== 'string' && !Array.isArray(value)) {
    console.warn(`Translation value is not a string or array: ${key} for language: ${language}`);
    return key;
  }

  // 如果是陣列，直接返回（用於 features 和 highlights）
  if (Array.isArray(value)) {
    return value as unknown as string;
  }
  
  // 替換參數
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
}

// 檢測瀏覽器語言
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') {
    return defaultLanguage;
  }
  
  const browserLang = navigator.language || navigator.languages?.[0];
  
  if (browserLang?.startsWith('zh')) {
    return 'zh-TW';
  }
  
  if (browserLang?.startsWith('en')) {
    return 'en';
  }
  
  return defaultLanguage;
}

// 從 localStorage 獲取語言設定
export function getStoredLanguage(): Language | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem('language');
    if (stored && (stored === 'zh-TW' || stored === 'en')) {
      return stored as Language;
    }
  } catch (error) {
    console.warn('Failed to get language from localStorage:', error);
  }
  
  return null;
}

// 儲存語言設定到 localStorage
export function setStoredLanguage(language: Language): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('language', language);
  } catch (error) {
    console.warn('Failed to save language to localStorage:', error);
  }
}

// 獲取初始語言（優先級：localStorage > 瀏覽器語言 > 預設語言）
export function getInitialLanguage(): Language {
  const stored = getStoredLanguage();
  if (stored) {
    return stored;
  }

  return detectBrowserLanguage();
}
