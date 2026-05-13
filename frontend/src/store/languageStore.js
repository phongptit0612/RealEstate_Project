import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import translations from '../i18n/translations';

// Map currency codes to language codes
const CURRENCY_LANG_MAP = {
  VND: 'vi',
  // Future: JPY → 'ja', KRW → 'ko', CNY → 'zh', THB → 'th'
  // Currently only 'en' and 'vi' are supported — others fall back to 'en'
};

const SUPPORTED_LANGS = new Set(Object.keys(translations));

/**
 * Language store — provides the reactive t() translate function.
 * Language auto-syncs with the currency selector (VND → vi, all else → en).
 */
const useLanguageStore = create(
  persist(
    (set, get) => ({
      language: 'en',

  /** Manually set the language. Falls back to 'en' for unsupported languages. */
  setLanguage: (lang) => {
    const resolved = SUPPORTED_LANGS.has(lang) ? lang : 'en';
    set({ language: resolved });
    // Update <html lang="..."> for SEO and :lang() CSS selectors
    document.documentElement.lang = resolved;
  },

  /** Called automatically when the user switches currency. */
  setLanguageFromCurrency: (currencyCode) => {
    const lang = CURRENCY_LANG_MAP[currencyCode] || 'en';
    get().setLanguage(lang);
  },

  /**
   * Translate a dot-notation key, e.g. t('card.forSale') → 'For Sale'
   * Falls back to English if the current language doesn't have the key.
   * Falls back to the raw key string if neither language has it.
   */
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
