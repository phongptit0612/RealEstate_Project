import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Heart, Search, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import PropertyCard from '../../components/PropertyCard';
import useFavoriteStore from '../../store/favoriteStore';
import useLanguageStore from '../../store/languageStore';

export default function Favorites() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const { favoriteIds, loadFavorites } = useFavoriteStore();
    const { t } = useLanguageStore();

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/favorites`, { withCredentials: true });
            setProperties(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    // Re-fetch when a favorite is toggled from a card (favoriteIds set changes)
    useEffect(() => {
        if (!loading) fetchFavorites();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [favoriteIds.size]);

    if (loading) return (
        <div className="space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-72 bg-slate-200 rounded-3xl animate-pulse" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-500 fill-current" />
                        {t('favorites.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {properties.length} {properties.length === 1 ? t('favorites.count') : t('favorites.counts')}
                    </p>
                </div>
                <Link
                    to="/properties"
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                    <Search className="w-4 h-4" /> {t('favorites.browseMore')}
                </Link>
            </div>

            {/* Empty state */}
            {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <Heart className="w-9 h-9 text-red-300" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">{t('favorites.noFavorites')}</h2>
                    <p className="text-slate-400 text-sm mb-6 max-w-sm">
                        {t('favorites.noFavoritesHint')}
                    </p>
                    <Link
                        to="/properties"
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
                    >
                        <Home className="w-4 h-4" /> {t('favorites.exploreBtn')}
                    </Link>
                </div>
            ) : (
                <>
                    {/* Property Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {properties.map(property => (
                            <PropertyCard key={property.property_id} property={property} />
                        ))}
                    </div>

                    {/* Tip */}
                    <p className="text-center text-xs text-slate-400 pt-2">
                        {t('favorites.removeHint')}
                    </p>
                </>
            )}
        </div>
    );
}
