import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import translations from '../i18n/translations';

const CURRENCY_LANG_MAP = {
  VND: 'vi',
};

const SUPPORTED_LANGS = new Set(Object.keys(translations));


const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'en',

      setLanguage: (lang) => {
        const resolved = SUPPORTED_LANGS.has(lang) ? lang : 'en';
        set({ language: resolved });
        document.documentElement.lang = resolved;
      },

      setLanguageFromCurrency: (currencyCode) => {
        const lang = CURRENCY_LANG_MAP[currencyCode] || 'en';
        get().setLanguage(lang);
      },


      t: (path) => {
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

        return resolve(translations[language]) ?? resolve(translations.en) ?? path;
      },
    }), {
    name: 'language-storage',
    partialize: (state) => ({ language: state.language })
  }));

export default useLanguageStore;
