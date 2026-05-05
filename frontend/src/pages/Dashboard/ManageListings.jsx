import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Crown, Zap, RefreshCw, Eye, Heart, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCurrencyStore from '../../store/currencyStore';

export default function ManageListings() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrencyStore();

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/properties/me', { withCredentials: true });
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
            await axios.patch(`http://localhost:5000/api/properties/${id}/status`, { status: newStatus }, { withCredentials: true });
            setProperties(properties.map(p => p.property_id === id ? { ...p, status: newStatus } : p));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/properties/${id}`, { withCredentials: true });
            setProperties(properties.filter(p => p.property_id !== id));
        } catch (error) {
            alert('Failed to delete listing');
        }
    };

    const handleRenew = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:5000/api/properties/${id}/renew`, {}, { withCredentials: true });
            const newExpiry = res.data.expires_at;
            setProperties(properties.map(p => p.property_id === id ? { ...p, expires_at: newExpiry } : p));
            alert(`✅ Listing renewed! New expiry: ${new Date(newExpiry).toLocaleDateString()}`);
        } catch (error) {
            alert('Failed to renew listing');
        }
    };

    if (loading) return <div className="text-ocean-200 animate-pulse font-medium">Loading private portfolios...</div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Properties</h1>
                    <p className="text-gray-400">Manage your active, rented, and sold listings globally.</p>
                </div>
            </div>

            <div className="bg-[#051124] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/40 text-gray-400 text-sm tracking-wide">
                                <th className="p-5 font-medium pl-8">Property Matrix</th>
                                <th className="p-5 font-medium">Original Val (USD)</th>
                                <th className="p-5 font-medium">Live Converted Val</th>
                                <th className="p-5 font-medium">VIP Status</th>
                                <th className="p-5 font-medium">Approval</th>
                                <th className="p-5 font-medium">Stats</th>
                                <th className="p-5 font-medium">Expiry</th>
                                <th className="p-5 font-medium">Asset Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {properties.map(prop => (
                                <tr key={prop.property_id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-5 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 shadow-inner">
                                                {prop.primary_image ? (
                                                    <img src={prop.primary_image.startsWith('http') ? prop.primary_image : `http://localhost:5000${prop.primary_image}`} alt={prop.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 bg-ocean-900/30">No Media</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold group-hover:text-ocean-400 transition-colors text-lg">{prop.title}</div>
                                                <div className="text-sm text-gray-500 font-light">{prop.city}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-gray-300 font-mono text-sm">${Number(prop.price_usd).toLocaleString()}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="text-[#0033ab] font-bold text-lg">
                                            {formatPrice(prop.price_usd)}
                                        </div>
                                    </td>
                                    {/* VIP Status */}
                                    <td className="p-5">
                                        {prop.vip_tier && prop.vip_tier !== 'none' ? (
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold w-fit
                                                    ${prop.vip_tier === 'gold'
                                                        ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                                                        : 'bg-slate-400/15 text-slate-300 border border-slate-400/30'
                                                    }`}>
                                                    <Crown className="w-3 h-3" />
                                                    {prop.vip_tier === 'gold' ? '🥇 Gold' : '🥈 Silver'}
                                                </span>
                                                {prop.vip_expires_at && (
                                                    <span className="text-xs text-slate-500">
                                                        Exp: {new Date(prop.vip_expires_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Link
                                                to={`/pricing?property_id=${prop.property_id}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 border border-amber-400/25 hover:border-amber-400/50 px-3 py-1.5 rounded-lg hover:bg-amber-400/10 transition-all"
                                            >
                                                <Zap className="w-3 h-3" /> Boost
                                            </Link>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${prop.mod_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : prop.mod_status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                            {prop.mod_status}
                                        </span>
                                    </td>
                                    {/* Stats: views, saved, inquiries */}
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1 text-xs text-gray-400 min-w-[80px]">
                                            <span className="flex items-center gap-1.5">
                                                <Eye className="w-3 h-3 text-sky-400" />
                                                {Number(prop.view_count || 0).toLocaleString()} views
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Heart className="w-3 h-3 text-red-400" />
                                                {Number(prop.favorites_count || 0)} saved
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MessageSquare className="w-3 h-3 text-emerald-400" />
                                                {Number(prop.inquiry_count || 0)} inquiries
                                            </span>
                                        </div>
                                    </td>
                                    {/* Expiry + Renew */}
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`text-xs font-medium ${
                                                prop.expires_at && new Date(prop.expires_at) < new Date()
                                                    ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                                {prop.expires_at
                                                    ? (new Date(prop.expires_at) < new Date() ? '⚠️ Expired' : `📅 ${new Date(prop.expires_at).toLocaleDateString()}`)
                                                    : '—'}
                                            </span>
                                            <button
                                                onClick={() => handleRenew(prop.property_id)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-white border border-emerald-500/25 hover:bg-emerald-500 px-2.5 py-1 rounded-lg transition-all w-fit"
                                                title="Extend listing by 7 days"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Renew
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={prop.status} 
                                                onChange={(e) => updateStatus(prop.property_id, e.target.value)}
                                                className="bg-black/50 border border-white/10 text-white font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0033ab] outline-none text-sm cursor-pointer"
                                            >
                                                <option value="active">✅ Active</option>
                                                <option value="negotiating">💬 Negotiating</option>
                                                <option value="deposited">📋 Deposited</option>
                                                <option value="sold">🛑 Sold</option>
                                                <option value="rented">🔑 Rented</option>
                                                <option value="hidden">👁 Hidden</option>
                                            </select>
                                            <Link
                                                to={`/dashboard/edit/${prop.property_id}`}
                                                className="p-2 bg-[#0033ab]/10 text-[#4d88ff] border border-[#0033ab]/20 rounded-lg hover:bg-[#0033ab] hover:text-white transition-all"
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
                                <tr><td colSpan="5" className="p-12 text-center text-gray-500 font-light">Your private portfolio is currently empty.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
