import { create } from 'zustand';
import axios from 'axios';

const useFavoriteStore = create((set, get) => ({
    favoriteIds: new Set(), // Set of property_id numbers for O(1) lookup
    loading: false,

    // Load all favorited IDs for the current user (called on login / mount)
    loadFavorites: async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/favorites/ids`, { withCredentials: true });
            set({ favoriteIds: new Set(res.data.map(Number)) });
        } catch {
            set({ favoriteIds: new Set() });
        }
    },

    // Toggle a single property — optimistic UI update
    toggleFavorite: async (propertyId) => {
        const id = Number(propertyId);
        const { favoriteIds } = get();
        const isFav = favoriteIds.has(id);

        // Optimistic update
        const newSet = new Set(favoriteIds);
        if (isFav) newSet.delete(id); else newSet.add(id);
        set({ favoriteIds: newSet });

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/favorites/${id}`, {}, { withCredentials: true });
        } catch {
            // Revert on failure
            set({ favoriteIds });
        }
    },

    isFavorited: (propertyId) => get().favoriteIds.has(Number(propertyId)),

    clearFavorites: () => set({ favoriteIds: new Set() }),
}));

export default useFavoriteStore;
