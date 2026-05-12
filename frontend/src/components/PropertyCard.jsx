import React from 'react';
import { Bed, Bath, Square, MapPin, Heart } from 'lucide-react';
import useCurrencyStore from '../store/currencyStore';
import useFavoriteStore from '../store/favoriteStore';
import useUserStore from '../store/userStore';
import { Link, useNavigate } from 'react-router-dom';

export default function PropertyCard({ property }) {
    const { formatPrice } = useCurrencyStore();
    const { isFavorited, toggleFavorite } = useFavoriteStore();
    const { isAuthenticated } = useUserStore();
    const navigate = useNavigate();

    const favorited = isFavorited(property.property_id);

    const imageUrl = property.primary_image
        ? (property.primary_image.startsWith('http') ? property.primary_image : `http://localhost:5000${property.primary_image}`)
        : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop';

    const handleFavorite = (e) => {
        e.preventDefault(); // Prevent navigating to detail page
        e.stopPropagation();
        if (!isAuthenticated) { navigate('/login'); return; }
        toggleFavorite(property.property_id);
    };

    return (
        <Link to={`/properties/${property.property_id}`} className="group block bg-white border border-gray-200 rounded-3xl overflow-hidden hover:border-[#0033ab] transition-all duration-300 shadow-sm hover:shadow-xl relative">

            {/* Top Badges */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="bg-white/95 backdrop-blur-md border border-gray-200 text-slate-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                    {property.type_name || 'Estate'}
                </span>
                {property.listing_type && (
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm ${property.listing_type === 'rent'
                            ? 'bg-violet-100 text-violet-700 border border-violet-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                        {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                )}
            </div>

            {/* ❤️ Favorite Button */}
            <button
                onClick={handleFavorite}
                title={favorited ? 'Remove from favorites' : 'Save to favorites'}
                className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md
                    ${favorited
                        ? 'bg-red-500 text-white scale-110'
                        : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white'
                    }`}
            >
                <Heart className={`w-4 h-4 transition-transform duration-200 ${favorited ? 'fill-current scale-110' : ''}`} />
            </button>

            {/* Image */}
            <div className="relative h-60 overflow-hidden">
                <div className="absolute inset-0 bg-black/5 z-10" />
                <img
                    src={imageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Price */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-[#0033ab] transition-colors flex-1">
                        {property.title}
                    </h3>
                    <p className="text-lg font-bold text-[#0033ab] flex-shrink-0">
                        {formatPrice(property.price_usd)}
                    </p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-slate-500 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">
                        {property.district_name ? `${property.district_name}, ` : ''}{property.city_name || property.address || 'Location N/A'}
                    </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700 font-semibold">{property.bedrooms ?? '—'}</span>
                        <span className="text-xs text-slate-400">bd</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 border-x border-gray-100">
                        <Bath className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700 font-semibold">{property.bathrooms ?? '—'}</span>
                        <span className="text-xs text-slate-400">ba</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                        <Square className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700 font-semibold">{property.area_m2 ? `${property.area_m2}` : '—'}</span>
                        <span className="text-xs text-slate-400">m²</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
