import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Decimal from 'decimal.js';

// Used when the live API is unavailable or for currencies not in Frankfurter
const FALLBACK_RATES = {
  USD: 1,
  VND: 25400,    // Vietnamese Dong
};

const EXTRA_CURRENCIES = { VND: 25400 };

const CURRENCY_LABELS = {
  USD: '🇺🇸 USD – US Dollar',
  VND: '🇻🇳 VND – Vietnamese Dong',
};

const useCurrencyStore = create(
  persist(
    (set, get) => ({
      preferredCurrency: 'USD',
      exchangeRates: FALLBACK_RATES,
      ratesLoaded: false,
      currencies: Object.keys(FALLBACK_RATES),
      currencyLabels: CURRENCY_LABELS,

      // Fetch live rates
      fetchRates: async () => {
        // Since we only support USD and VND, and Frankfurter does not support VND,
        // we just use our static fallback rates.
        set({ exchangeRates: FALLBACK_RATES, ratesLoaded: true });
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
    }), {
    name: 'currency-storage',
    partialize: (state) => ({ preferredCurrency: state.preferredCurrency })
  }));

export default useCurrencyStore;
