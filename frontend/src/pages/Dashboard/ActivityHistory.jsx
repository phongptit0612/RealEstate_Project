import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clock, Eye, BedDouble, Bath, Maximize2, MapPin, TrendingUp } from 'lucide-react';
import useCurrencyStore from '../../store/currencyStore';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function ActivityHistory() {
    const [history, setHistory]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const { formatPrice } = useCurrencyStore();

    useEffect(() => {
        axios.get('http://localhost:5000/api/properties/recently-viewed', { withCredentials: true })
            .then(res => setHistory(res.data))
            .catch(err => console.error('Failed to load activity', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="space-y-4">
            {[1,2,3].map(i => (
                <div key={i} className="bg-[#051124] border border-white/10 rounded-2xl h-24 animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Activity History</h1>
                    <p className="text-gray-400">Properties you've recently viewed.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#051124] border border-white/10 rounded-xl px-4 py-2">
                    <TrendingUp className="w-4 h-4 text-[#4d88ff]" />
                    <span className="text-white font-medium text-sm">{history.length} viewed</span>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="bg-[#051124] border border-white/10 rounded-3xl p-16 text-center">
                    <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No activity yet</h3>
                    <p className="text-gray-500 mb-6">Browse properties and they'll appear here.</p>
                    <Link
                        to="/properties"
                        className="inline-flex items-center gap-2 bg-[#0033ab] hover:bg-[#002273] text-white font-bold px-6 py-3 rounded-xl transition-all"
                    >
                        Browse Properties
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((prop, idx) => (
                        <Link
                            key={`${prop.property_id}-${idx}`}
                            to={`/properties/${prop.property_id}`}
                            className="group flex items-center gap-5 bg-[#051124] border border-white/10 hover:border-[#0033ab]/50 rounded-2xl p-4 transition-all duration-200 hover:bg-[#051124]/80"
                        >
                            {/* Thumbnail */}
                            <div className="w-20 h-16 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0">
                                {prop.primary_image ? (
                                    <img
                                        src={prop.primary_image.startsWith('http') ? prop.primary_image : `http://localhost:5000${prop.primary_image}`}
                                        alt={prop.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-white font-semibold group-hover:text-[#4d88ff] transition-colors truncate">
                                            {prop.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5">
                                            <MapPin className="w-3 h-3" />
                                            <span>{[prop.district_name, prop.city_name].filter(Boolean).join(', ') || 'Unknown location'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-[#4d88ff] font-bold">{formatPrice(prop.price_usd)}</div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            prop.listing_type === 'sale'
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                            {prop.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs">
                                    {prop.bedrooms  && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{prop.bedrooms} bed</span>}
                                    {prop.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{prop.bathrooms} bath</span>}
                                    {prop.area_m2   && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{prop.area_m2}m²</span>}
                                    <span className="ml-auto flex items-center gap-1 text-gray-600">
                                        <Clock className="w-3 h-3" />
                                        {timeAgo(prop.viewed_at)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
