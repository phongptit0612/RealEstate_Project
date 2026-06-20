import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Crown, Zap, RefreshCw, Eye, Heart, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCurrencyStore from '../../store/currencyStore';
import useLanguageStore from '../../store/languageStore';

export default function ManageListings() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrencyStore();
    const { t } = useLanguageStore();

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/me`, { withCredentials: true });
                setProperties(res.data);
            } catch (error) {
                console.error('Failed to load properties', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/${id}/status`, { status: newStatus }, { withCredentials: true });
            setProperties(properties.map(p => p.property_id === id ? { ...p, status: newStatus } : p));
        } catch (error) {
            alert(t('manage.updateStatusFailed', 'Failed to update status'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('manage.confirmDelete', 'Are you sure you want to permanently delete this listing?'))) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/${id}`, { withCredentials: true });
            setProperties(properties.filter(p => p.property_id !== id));
        } catch (error) {
            alert(t('manage.deleteFailed', 'Failed to delete listing'));
        }
    };

    const handleRenew = async (id) => {
        try {
            const res = await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/${id}/renew`, {}, { withCredentials: true });
            const newExpiry = res.data.expires_at;
            setProperties(properties.map(p => p.property_id === id ? { ...p, expires_at: newExpiry } : p));
            alert(t('manage.renewSuccess', '✅ Listing renewed! New expiry: {date}').replace('{date}', new Date(newExpiry).toLocaleDateString()));
        } catch (error) {
            alert(t('manage.renewFailed', 'Failed to renew listing'));
        }
    };

    if (loading) return <div className="text-ocean-200 animate-pulse font-medium">{t('manage.loadingPortfolio', 'Loading private portfolios...')}</div>;

    const totalViews = properties.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const totalFavorites = properties.reduce((sum, p) => sum + (p.favorites_count || 0), 0);
    const totalInquiries = properties.reduce((sum, p) => sum + (p.inquiry_count || 0), 0);
    const topProperties = [...properties].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('manage.title')}</h1>
                    <p className="text-slate-500">{t('manage.subtitle')}</p>
                </div>
            </div>

            {/* Analytics Section */}
            {properties.length > 0 && (
                <div className="mb-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-600">
                                <Eye className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">{t('manage.totalViews', 'Total Views')}</p>
                                <p className="text-2xl font-bold text-slate-900">{totalViews}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">{t('manage.totalFavorites', 'Total Favorites')}</p>
                                <p className="text-2xl font-bold text-slate-900">{totalFavorites}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-500">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">{t('manage.totalInquiries', 'Total Inquiries')}</p>
                                <p className="text-2xl font-bold text-slate-900">{totalInquiries}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                <h2 className="font-bold text-slate-800">{t('manage.topListings', 'Top Performing Listings (Views)')}</h2>
                            </div>
                        </div>
                        {(() => {
                            const max = Math.max(...topProperties.map(p => p.view_count || 0), 1);
                            const ticks = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0];
                            return (
                                <div className="flex items-stretch h-56 mt-auto">
                                    {/* Y-axis */}
                                    <div className="flex flex-col justify-between text-[10px] sm:text-xs text-slate-400 font-semibold pr-3 border-r border-slate-100 select-none pb-7 h-full w-8">
                                        {ticks.map((t, idx) => (
                                            <span key={idx} className="text-right h-4 flex items-center justify-end">{t}</span>
                                        ))}
                                    </div>
                                    {/* Chart area */}
                                    <div className="flex-grow h-full relative">
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pr-1">
                                            {[...Array(4)].map((_, idx) => (
                                                <div key={idx} className="border-t border-dashed border-slate-100 w-full h-0" />
                                            ))}
                                        </div>
                                        {/* Bars */}
                                        <div className="flex items-end gap-3 h-full relative z-10 pl-2">
                                            {topProperties.map(prop => {
                                                const count = prop.view_count || 0;
                                                const heightPct = Math.round((count / max) * 100);
                                                return (
                                                    <div key={prop.property_id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-[calc(100%-1.5rem)] mb-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-800 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-lg font-semibold flex flex-col items-center max-w-[150px]">
                                                            <span className="font-bold text-center line-clamp-1">{prop.title}</span>
                                                            <span className="text-brand-300 font-bold mt-0.5">{count} {t('manage.views', 'views')}</span>
                                                        </div>
                                                        {/* Bar column */}
                                                        <div className="w-full bg-slate-50 hover:bg-slate-100/80 rounded-t-lg flex items-end flex-1 transition-all h-[calc(100%-1.75rem)] relative cursor-pointer overflow-hidden border border-transparent hover:border-slate-200/50">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg transition-all duration-500"
                                                                style={{ height: `${Math.max(heightPct, 3)}%` }}
                                                            />
                                                        </div>
                                                        {/* X Label */}
                                                        <span className="h-5 flex items-end text-[10px] sm:text-xs text-slate-500 font-semibold mt-1 truncate w-full max-w-[80px] justify-center px-1">
                                                            {prop.title}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-gray-100 bg-slate-50 text-slate-500 text-sm tracking-wide">
                                <th className="p-5 font-medium pl-8">{t('manage.propMatrix')}</th>
                                <th className="p-5 font-medium">{t('manage.liveVal')}</th>
                                <th className="p-5 font-medium">{t('manage.vipStatus')}</th>
                                <th className="p-5 font-medium">{t('manage.approval')}</th>
                                <th className="p-5 font-medium">{t('manage.stats')}</th>
                                <th className="p-5 font-medium">{t('manage.expiry')}</th>
                                <th className="p-5 font-medium">{t('manage.assetStatus')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {properties.map(prop => (
                                <tr key={prop.property_id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-5 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-gray-200 overflow-hidden flex-shrink-0 shadow-inner">
                                                {prop.primary_image ? (
                                                    <img src={prop.primary_image.startsWith('http') ? prop.primary_image : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${prop.primary_image}`} alt={prop.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 bg-slate-100">{t('manage.noMedia', 'No Media')}</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-slate-900 font-bold group-hover:text-brand-600 transition-colors text-lg">{prop.title}</div>
                                                <div className="text-sm text-slate-500 font-medium">{prop.city}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-brand-600 font-bold text-lg">
                                            {formatPrice(prop.price_usd)}
                                        </div>
                                    </td>
                                    {/* VIP Status */}
                                    <td className="p-5">
                                        {prop.vip_tier && prop.vip_tier !== 'none' ? (
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold w-fit
                                                    ${prop.vip_tier === 'gold'
                                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                    <Crown className="w-3 h-3" />
                                                    {prop.vip_tier === 'gold' ? t('manage.goldBadge', '🥇 Gold') : t('manage.silverBadge', '🥈 Silver')}
                                                </span>
                                                {prop.vip_expires_at && (
                                                    <span className="text-xs text-slate-500">
                                                        {t('manage.vipExp', 'Exp')}: {new Date(prop.vip_expires_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Link
                                                to={`/pricing?property_id=${prop.property_id}`}
                                                onClick={(e) => {
                                                    if (prop.mod_status !== 'approved') {
                                                        e.preventDefault();
                                                        alert(t('manage.boostNotApproved') || 'You can only boost listings that have been approved by admin.');
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 border border-amber-200 hover:border-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all bg-white"
                                            >
                                                <Zap className="w-3 h-3" /> {t('manage.btnBoost')}
                                            </Link>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${prop.mod_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : prop.mod_status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                            {prop.mod_status === 'approved' ? t('common.approved', 'Approved') : prop.mod_status === 'rejected' ? t('common.rejected', 'Rejected') : t('common.pending', 'Pending')}
                                        </span>
                                    </td>
                                    {/* Stats: views, saved, inquiries */}
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1 text-xs text-slate-500 min-w-[80px] font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <Eye className="w-3 h-3 text-sky-400" />
                                                {Number(prop.view_count || 0).toLocaleString()} {t('manage.views')}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Heart className="w-3 h-3 text-red-400" />
                                                {Number(prop.favorites_count || 0)} {t('manage.saved')}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MessageSquare className="w-3 h-3 text-emerald-400" />
                                                {Number(prop.inquiry_count || 0)} {t('manage.inquiries')}
                                            </span>
                                        </div>
                                    </td>
                                    {/* Expiry + Renew */}
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`text-xs font-semibold ${
                                                prop.expires_at && new Date(prop.expires_at) < new Date()
                                                    ? 'text-red-500' : 'text-slate-400'
                                            }`}>
                                                {prop.expires_at
                                                    ? (new Date(prop.expires_at) < new Date() ? t('manage.expired', '⚠️ Expired') : `📅 ${new Date(prop.expires_at).toLocaleDateString()}`)
                                                    : '—'}
                                            </span>
                                            <button
                                                onClick={() => handleRenew(prop.property_id)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-white border border-emerald-200 hover:bg-emerald-500 px-2.5 py-1 rounded-lg transition-all w-fit bg-emerald-50"
                                                title="Extend listing by 7 days"
                                            >
                                                <RefreshCw className="w-3 h-3" /> {t('manage.btnRenew')}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={prop.status} 
                                                onChange={(e) => updateStatus(prop.property_id, e.target.value)}
                                                className="bg-white border border-gray-200 text-slate-700 font-bold rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-600 outline-none text-sm cursor-pointer"
                                            >
                                                <option value="active">✅ {t('manage.statusActive')}</option>
                                                <option value="negotiating">💬 {t('manage.statusNegotiating', 'Negotiating')}</option>
                                                <option value="deposited">📋 {t('manage.statusDeposited', 'Deposited')}</option>
                                                <option value="sold">🛑 {t('manage.statusSold')}</option>
                                                <option value="rented">🔑 {t('manage.statusRented')}</option>
                                                <option value="hidden">👁 {t('manage.statusInactive')}</option>
                                            </select>
                                            <Link
                                                to={`/dashboard/edit/${prop.property_id}`}
                                                className="p-2 bg-brand-50 text-brand-600 border border-brand-100 rounded-lg hover:bg-brand-600 hover:text-white transition-all"
                                                title="Edit Listing"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(prop.property_id)}
                                                className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                title="Delete Listing"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {properties.length === 0 && (
                                <tr><td colSpan="7" className="p-12 text-center text-slate-500 font-medium">{t('manage.emptyPortfolio', 'Your private portfolio is currently empty.')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
