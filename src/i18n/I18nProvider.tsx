import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { I18nContext } from './i18nContextValue';
import { messages, DEFAULT_LANG, LANG_STORAGE_KEY, type Lang, type MessageKey } from './messages';

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  return stored === 'ja' || stored === 'en' ? stored : DEFAULT_LANG;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors (private mode, etc.)
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleLang = useCallback(
    () => setLangState((prev) => (prev === 'ja' ? 'en' : 'ja')),
    [],
  );
  const t = useCallback(
    (key: MessageKey) => messages[lang][key] ?? messages[DEFAULT_LANG][key] ?? key,
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
