import { create } from 'zustand';
import Decimal from 'decimal.js';

// ── Hardcoded fallback rates (approximate 2025 rates, USD base)
// Used when the live API is unavailable or for currencies not in Frankfurter
const FALLBACK_RATES = {
  USD: 1,
  VND: 25400,    // Vietnamese Dong
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157,
  KRW: 1380,
  CNY: 7.24,
  SGD: 1.34,
  THB: 36.2,
  AUD: 1.54,
  CAD: 1.37,
};

// Currencies Frankfurter doesn't support — must use fallback
const EXTRA_CURRENCIES = { VND: 25400, KRW: 1380, THB: 36.2 };

const CURRENCY_LABELS = {
  USD: '🇺🇸 USD – US Dollar',
  VND: '🇻🇳 VND – Vietnamese Dong',
  EUR: '🇪🇺 EUR – Euro',
  GBP: '🇬🇧 GBP – British Pound',
  JPY: '🇯🇵 JPY – Japanese Yen',
  KRW: '🇰🇷 KRW – Korean Won',
  CNY: '🇨🇳 CNY – Chinese Yuan',
  SGD: '🇸🇬 SGD – Singapore Dollar',
  THB: '🇹🇭 THB – Thai Baht',
  AUD: '🇦🇺 AUD – Australian Dollar',
  CAD: '🇨🇦 CAD – Canadian Dollar',
};

const useCurrencyStore = create((set, get) => ({
  preferredCurrency: 'USD',
  exchangeRates: FALLBACK_RATES,
  ratesLoaded: false,
  currencies: Object.keys(FALLBACK_RATES),
  currencyLabels: CURRENCY_LABELS,

  // Fetch live rates from Frankfurter (free, no API key)
  fetchRates: async () => {
    try {
      // Frankfurter supports most major currencies but NOT VND/KRW/THB
      const symbols = Object.keys(FALLBACK_RATES)
        .filter(c => c !== 'USD' && !Object.keys(EXTRA_CURRENCIES).includes(c))
        .join(',');

      const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${symbols}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      // Merge live rates with hardcoded extras (VND, KRW, THB)
      const liveRates = { USD: 1, ...data.rates, ...EXTRA_CURRENCIES };
      set({ exchangeRates: liveRates, ratesLoaded: true });
    } catch (err) {
      // Silently fall back to hardcoded rates — app still works
      console.warn('Live exchange rates unavailable, using fallback rates:', err.message);
      set({ exchangeRates: FALLBACK_RATES, ratesLoaded: true });
    }
  },

  // Set preferred currency
  setCurrency: (currencyCode) => {
    set({ preferredCurrency: currencyCode });
  },

  // Convert a USD amount to the preferred currency
  convertPrice: (priceInUSD) => {
    if (!priceInUSD) return 0;
    const { preferredCurrency, exchangeRates } = get();
    const rate = exchangeRates[preferredCurrency] ?? 1;
    return new Decimal(priceInUSD).times(rate).toNumber();
  },

  // Format a USD amount as a localized currency string
  formatPrice: (priceInUSD) => {
    if (priceInUSD === null || priceInUSD === undefined) return '—';
    const convertedAmount = get().convertPrice(priceInUSD);
    const { preferredCurrency } = get();

    // VND and KRW never use decimal places
    const noDecimals = ['VND', 'KRW', 'JPY', 'THB'].includes(preferredCurrency);

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: preferredCurrency,
      maximumFractionDigits: noDecimals ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(convertedAmount);
  },
}));

export default useCurrencyStore;
