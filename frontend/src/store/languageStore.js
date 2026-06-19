import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import translations from '../i18n/translations';

const CURRENCY_LANG_MAP = {
  VND: 'vi',
};

const SUPPORTED_LANGS = new Set(Object.keys(translations));

// Read persisted language synchronously from localStorage to avoid flash
const getInitialLang = () => {
  try {
    const stored = localStorage.getItem('language-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      const lang = parsed?.state?.language;
      if (lang && SUPPORTED_LANGS.has(lang)) return lang;
    }
  } catch (_) {}
  return 'vi'; // default to Vietnamese
};

const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: getInitialLang(),
      currentLang: getInitialLang(),

      setLanguage: (lang) => {
        const resolved = SUPPORTED_LANGS.has(lang) ? lang : 'vi';
        set({ language: resolved, currentLang: resolved });
        document.documentElement.lang = resolved;
      },

      setLanguageFromCurrency: (currencyCode) => {
        const lang = CURRENCY_LANG_MAP[currencyCode] || 'vi';
        get().setLanguage(lang);
      },

      t: (path, fallback) => {
        const { language } = get();
        const parts = path.split('.');

        const resolve = (langObj) => {
          let node = langObj;
          for (const part of parts) {
            node = node?.[part];
            if (node === undefined) return undefined;
          }
          return node;
        };

        return resolve(translations[language]) ?? resolve(translations.en) ?? fallback ?? path;
      },
    }),
    {
      name: 'language-storage',
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = SUPPORTED_LANGS.has(state.language) ? state.language : 'vi';
          state.language = resolved;
          state.currentLang = resolved;
          document.documentElement.lang = resolved;
        }
      },
    }
  )
);

export default useLanguageStore;
