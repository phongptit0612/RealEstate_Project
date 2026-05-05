import { create } from 'zustand';
import axios from 'axios';
import Decimal from 'decimal.js';

const useCurrencyStore = create((set, get) => ({
  preferredCurrency: 'USD',
  exchangeRates: { USD: 1 }, // Default base rate

  // Initialize rates from backend
  fetchRates: async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rates');
      // Ensure USD is present as base
      const rates = { ...response.data, USD: 1 };
      set({ exchangeRates: rates });
    } catch (error) {
      console.error('Failed to fetch exchange rates', error);
    }
  },

  // Set local preferred currency
  setCurrency: (currencyCode) => {
    set({ preferredCurrency: currencyCode });
    // TODO: Send API request to save to `user_preferences` if the user is authenticated
  },

  // Convert USD to preferred currency
  convertPrice: (priceInUSD) => {
    const { preferredCurrency, exchangeRates } = get();
    const rate = exchangeRates[preferredCurrency] || 1;
    
    // Using decimal.js to prevent JS float inaccuracy 
    return new Decimal(priceInUSD).times(rate).toNumber();
  },

  // Utility to format price for UI display safely
  formatPrice: (priceInUSD) => {
    const convertedAmount = get().convertPrice(priceInUSD);
    const { preferredCurrency } = get();
    
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: preferredCurrency,
      maximumFractionDigits: 0
    }).format(convertedAmount);
  }
}));

export default useCurrencyStore;
