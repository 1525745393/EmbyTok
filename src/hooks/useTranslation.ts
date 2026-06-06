import { useState, useEffect, useCallback } from 'react';
import { translations, Language, Translations } from '../locales';

const LANGUAGE_KEY = 'embyLanguage';
const DEFAULT_LANGUAGE: Language = 'zh';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved && (saved === 'zh' || saved === 'en')) {
        return saved as Language;
      }
    } catch {
      // ignore
    }
    return DEFAULT_LANGUAGE;
  });

  const t: Translations = translations[language];

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === 'zh' ? 'en' : 'zh';
      try {
        localStorage.setItem(LANGUAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setLanguageDirectly = useCallback((lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  return {
    language,
    t,
    toggleLanguage,
    setLanguage: setLanguageDirectly,
  };
}

export default useTranslation;
