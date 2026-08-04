import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { TRANSLATIONS, type Lang, type Translations } from './translations';

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ja');

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      t: TRANSLATIONS[lang],
      toggleLang: () => setLang((prev) => (prev === 'ja' ? 'en' : 'ja')),
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
