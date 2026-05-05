import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Crown, Zap, Clock, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react';
import useCurrencyStore from '../../store/currencyStore';

const TIER_META = {
    silver: { label: 'Silver VIP', icon: '🥈', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20' },
    gold:   { label: 'Gold VIP',   icon: '🥇', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
};

const STATUS_META = {
    active:  { label: 'Active',  icon: CheckCircle, color: 'text-emerald-400' },
    pending: { label: 'Pending', icon: Clock,        color: 'text-amber-400'  },
    expired: { label: 'Expired', icon: XCircle,      color: 'text-slate-500'  },
};

export default function MySubscriptions() {
    const { formatPrice } = useCurrencyStore();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/subscriptions/mine', { withCredentials: true })
            .then(r => setSubs(r.data))
            .catch(() => setError('Failed to load subscriptions.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Crown className="w-8 h-8 text-amber-400" /> My VIP Boosts
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your listing boosts and subscription history</p>
                </div>
                <Link to="/pricing"
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg">
                    <Plus className="w-4 h-4" /> Boost a Listing
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#4d88ff] animate-spin" />
                </div>
            ) : error ? (
                <div className="text-red-400 text-sm py-8 text-center">{error}</div>
            ) : subs.length === 0 ? (
                <div className="text-center py-24 border border-white/5 rounded-3xl bg-white/2">
                    <div className="text-5xl mb-4">🥈</div>
                    <h3 className="text-lg font-bold text-white mb-2">No VIP boosts yet</h3>
                    <p className="text-slate-400 text-sm mb-6">Boost a listing to get more visibility and sell faster.</p>
                    <Link to="/pricing"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-sm px-6 py-3 rounded-xl hover:brightness-110 transition-all">
                        <Zap className="w-4 h-4" /> View Pricing Plans
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {subs.map(sub => {
                        const tier = TIER_META[sub.tier] || TIER_META.silver;
                        const status = STATUS_META[sub.status] || STATUS_META.expired;
                        const StatusIcon = status.icon;

                        return (
                            <div key={sub.sub_id}
                                className="bg-[#051124] border border-white/8 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Tier badge */}
                                <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border self-start ${tier.bg} ${tier.color}`}>
                                    {tier.icon} {tier.label}
                                </div>

                                {/* Property title */}
                                <div className="flex-1 min-w-0">
                                    <Link to={`/properties/${sub.property_id}`} className="font-bold text-white hover:text-[#4d88ff] transition-colors truncate block">
                                        {sub.property_title || `Property #${sub.property_id}`}
                                    </Link>
                                    <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-400">
                                        <span>Purchased: {new Date(sub.created_at).toLocaleDateString()}</span>
                                        {sub.expires_at && (
                                            <span>Expires: {new Date(sub.expires_at).toLocaleDateString()}</span>
                                        )}
                                        <span>Paid: {formatPrice(sub.amount_usd)}</span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className={`flex items-center gap-1.5 text-sm font-semibold ${status.color} flex-shrink-0`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {status.label}
                                </div>

                                {/* Re-boost */}
                                {sub.status === 'expired' && (
                                    <Link to={`/pricing?property_id=${sub.property_id}`}
                                        className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors border border-amber-400/20 px-3 py-1.5 rounded-lg hover:bg-amber-400/10 flex-shrink-0">
                                        Renew Boost
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
