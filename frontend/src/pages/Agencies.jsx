import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Building2, MapPin, Home, Users, ArrowRight, Eye, ArrowLeft } from 'lucide-react';
import useCurrencyStore from '../store/currencyStore';
import useLanguageStore from '../store/languageStore';
import useUserStore from '../store/userStore';

export default function Agencies() {
    const { isAuthenticated } = useUserStore();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrencyStore();
    const { t } = useLanguageStore();

    useEffect(() => {
        // Fetch users who have at least one approved listing
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/agents`)
            .then(res => setAgents(res.data))
            .catch(err => {
                console.error(err);
                setAgents([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-surface">
            {/* Hero */}
            <div className="bg-gradient-to-br from-[#0033ab] to-[#001f7a] pt-12 pb-16 px-4">
                <div className="max-w-6xl mx-auto mb-8">
                    <Link to={isAuthenticated ? "/dashboard/properties" : "/"} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> {t('pricing.back')}
                    </Link>
                </div>
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 text-white/80 text-sm font-medium mb-6">
                        <Users className="w-4 h-4" /> Trusted Sellers & Agents
                    </div>
                    <h1 className="text-5xl font-black text-white mb-4">{t('agencies.title')}</h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        {t('agencies.subtitle')}
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-6 animate-pulse h-48 border border-gray-100" />
                        ))}
                    </div>
                ) : agents.length === 0 ? (
                    <div className="text-center py-24">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">{t('agencies.noResults')}</h3>
                        <p className="text-slate-400">Check back soon as sellers join the platform.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map(agent => (
                            <div key={agent.user_id} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-600/30 transition-all duration-300">
                                {/* Avatar */}
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0033ab] to-[#4d88ff] flex items-center justify-center text-white text-xl font-black overflow-hidden flex-shrink-0">
                                        {agent.avatar_url
                                            ? <img src={agent.avatar_url.startsWith('http') ? agent.avatar_url : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${agent.avatar_url}`} alt="" className="w-full h-full object-cover" />
                                            : agent.full_name?.[0]?.toUpperCase() || 'A'
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                         <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{agent.full_name || 'Anonymous'}</h3>
                                         <p className="text-slate-400 text-sm truncate mb-1">{agent.email}</p>
                                         <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                                             <span>★</span>
                                             <span className="text-slate-700 text-sm">{agent.avg_rating > 0 ? parseFloat(agent.avg_rating).toFixed(1) : 'New'}</span>
                                             {agent.review_count > 0 && (
                                                 <span className="text-slate-400 font-medium text-xs">({agent.review_count} {agent.review_count === 1 ? 'review' : 'reviews'})</span>
                                             )}
                                         </div>
                                     </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-surface rounded-xl p-3 text-center">
                                        <div className="text-2xl font-black text-brand-600">{agent.listing_count}</div>
                                        <div className="text-xs text-slate-400 font-medium">Active Listings</div>
                                    </div>
                                    <div className="bg-surface rounded-xl p-3 text-center">
                                        <div className="text-2xl font-black text-slate-800">{formatPrice(agent.avg_price || 0)}</div>
                                        <div className="text-xs text-slate-400 font-medium">Avg. Price</div>
                                    </div>
                                </div>

                                {/* View Properties Link */}
                                <Link
                                    to={`/properties?seller=${agent.user_id}`}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-brand-600/20 text-brand-600 hover:bg-brand-600 hover:text-white font-semibold text-sm transition-all group-hover:border-brand-600"
                                >
                                    <Eye className="w-4 h-4" /> {t('agencies.viewListings')} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
