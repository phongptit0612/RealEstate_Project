import { create } from 'zustand';
import axios from 'axios';

// Critical Security Fix: Ensure all Axios requests pass HttpOnly Cookies
axios.defaults.withCredentials = true;
const API_URL = 'http://localhost:5000/api/auth';

const useUserStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    loading: true,

    checkAuth: async () => {
        try {
            const res = await axios.get(`${API_URL}/me`);
            set({ user: res.data.user, isAuthenticated: true, loading: false });
        } catch (error) {
            set({ user: null, isAuthenticated: false, loading: false });
        }
    },

    login: async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            set({ user: res.data.user, isAuthenticated: true });
            return { success: true };
        } catch (error) {
            // Check if OTP verification is still required
            if (error.response?.data?.requiresVerification) {
                return { success: false, requiresVerification: true, error: error.response.data.error };
            }
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    },

    register: async (userData) => {
        try {
            const res = await axios.post(`${API_URL}/register`, userData);
            return { success: true, message: res.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    },

    verifyOTP: async (email, token) => {
        try {
            await axios.post(`${API_URL}/verify-otp`, { email, token });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Verification failed' };
        }
    },

    setUser: (updatedUser) => {
        set(state => ({ user: { ...state.user, ...updatedUser } }));
    },

    logout: async () => {
        try {
            await axios.post(`${API_URL}/logout`);
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Logout failed');
        }
    }
}));

export default useUserStore;
