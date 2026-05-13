import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Zap, Check, ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import axios from 'axios';
import useUserStore from '../../store/userStore';
import useCurrencyStore from '../../store/currencyStore';
import useLanguageStore from '../../store/languageStore';

const TIERS = {
    silver: {
        id: 'silver',
        name: 'Silver',
        icon: '🥈',
        priceUsd: 9.99,
        color: 'from-slate-400 to-slate-600',
        borderColor: 'border-slate-400/40',
        glowColor: 'shadow-slate-400/20',
        badgeBg: 'bg-slate-100 text-slate-700',
        features: [
            'Silver badge on your listing',
            'Highlighted card border',
            'Priority above standard listings',
            'Active for 30 days',
        ],
    },
    gold: {
        id: 'gold',
        name: 'Gold',
        icon: '🥇',
        priceUsd: 29.99,
        color: 'from-amber-400 to-yellow-600',
        borderColor: 'border-amber-400/50',
        glowColor: 'shadow-amber-400/30',
        badgeBg: 'bg-amber-100 text-amber-700',
        features: [
            'Gold badge + animated glow',
            'Pinned to the TOP of all results',
            'Featured on the Home page',
            'Highest visibility for 30 days',
            'Everything in Silver',
        ],
        highlight: true,
    },
};



export default function Pricing() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const propertyIdFromUrl = searchParams.get('property_id') || '';

    const { isAuthenticated, user } = useUserStore();
    const { formatPrice, exchangeRates, preferredCurrency, currencies, currencyLabels } = useCurrencyStore();
    const { t } = useLanguageStore();

    const [selectedCurrency, setSelectedCurrency] = useState(preferredCurrency || 'USD');
    const [propertyId, setPropertyId] = useState(propertyIdFromUrl);
    const [myProperties, setMyProperties] = useState([]);
    const [loading, setLoading] = useState(null); // which tier is loading
    const [error, setError] = useState('');
    const [devMode, setDevMode] = useState(false);

    // Fetch user's own properties for the dropdown
    useEffect(() => {
        if (!isAuthenticated) return;
        axios.get('http://localhost:5000/api/properties/me', { withCredentials: true })
            .then(r => setMyProperties(r.data || []))
            .catch(() => { });
    }, [isAuthenticated]);

    const hasStripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_');

    const displayPrice = (usd) => {
        const rate = exchangeRates[selectedCurrency];
        if (!rate) return `$${usd}`;

        // Frankfurter rates are FROM USD: 1 USD = rate units of target currency
        const converted = selectedCurrency === 'USD' ? usd : usd * rate;

        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: selectedCurrency,
            maximumFractionDigits: ['VND', 'KRW', 'JPY'].includes(selectedCurrency) ? 0 : 2,
        }).format(converted);
    };

    const handleUpgrade = async (tierId) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        if (!propertyId) { setError('Please enter your Property ID to boost.'); return; }

        setError('');
        setLoading(tierId);

        try {
            if (!hasStripeKey || devMode) {
                // Dev simulation mode
                await axios.post('http://localhost:5000/api/subscriptions/simulate',
                    { property_id: propertyId, tier: tierId },
                    { withCredentials: true }
                );
                navigate('/subscription/success?simulated=true');
                return;
            }

            const { data } = await axios.post('http://localhost:5000/api/subscriptions/checkout',
                { property_id: propertyId, tier: tierId, currency: selectedCurrency.toLowerCase() },
                { withCredentials: true }
            );
            window.location.href = data.url; // Redirect to Stripe Checkout
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#020813] text-white font-sans">
            {/* Header */}
            <div className="max-w-5xl mx-auto px-6 pt-12 pb-4">
                <Link to="/properties" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" /> {t('pricing.back')}
                </Link>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 px-4 py-1.5 rounded-full text-amber-400 text-sm font-semibold mb-6">
                        <Crown className="w-4 h-4" /> {t('pricing.vipBoosts')}
                    </div>
                    <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
                        {t('pricing.title')}
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                {/* Currency & Property ID selector */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                    {/* Currency selector */}
                    <div className="relative">
                        <select
                            value={selectedCurrency}
                            onChange={e => setSelectedCurrency(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-4 pr-9 py-2.5 outline-none focus:border-brand-600 cursor-pointer"
                        >
                            {currencies.map(c => (
                                <option key={c} value={c}>{currencyLabels[c] || c}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Property selector — dropdown if logged in with listings, else manual input */}
                    {isAuthenticated && myProperties.length > 0 ? (
                        <div className="relative">
                            <select
                                value={propertyId}
                                onChange={e => setPropertyId(e.target.value)}
                                className="appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-4 pr-9 py-2.5 w-72 outline-none focus:border-brand-600 cursor-pointer"
                            >
                                <option value="">{t('pricing.selectProperty')}</option>
                                {myProperties.map(p => (
                                    <option key={p.property_id} value={p.property_id}>
                                        #{p.property_id} · {p.title.length > 40 ? p.title.slice(0, 40) + '…' : p.title}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    ) : (
                        <input
                            type="number"
                            value={propertyId}
                            onChange={e => setPropertyId(e.target.value)}
                            placeholder={t('pricing.enterPropertyId')}
                            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 w-72 outline-none focus:border-brand-600 placeholder:text-slate-600"
                        />
                    )}
                </div>

                {error && (
                    <div className="text-center text-red-400 bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6 text-sm">
                        {error}
                    </div>
                )}

                {(!hasStripeKey) && (
                    <div className="text-center text-amber-400 bg-amber-500/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6 text-sm">
                        <label className="ml-3 inline-flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={devMode} onChange={e => setDevMode(e.target.checked)} className="accent-amber-400" />
                            {t('pricing.forceSimulation')}
                        </label>
                    </div>
                )}

                {/* Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
                    {Object.values(TIERS).map(tier => (
                        <div
                            key={tier.id}
                            className={`relative rounded-3xl p-8 border bg-gradient-to-b from-white/5 to-transparent transition-all duration-300 hover:-translate-y-1
                                ${tier.borderColor}
                                ${tier.highlight ? `shadow-xl ${tier.glowColor}` : 'shadow-md'}
                            `}
                        >
                            {tier.highlight && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                                    {t('pricing.mostPopular')}
                                </div>
                            )}

                            <div className="text-4xl mb-3">{tier.icon}</div>
                            <h2 className="text-2xl font-extrabold text-white mb-1">{tier.name} VIP</h2>
                            <div className="mb-6">
                                <span className={`text-4xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                                    {displayPrice(tier.priceUsd)}
                                </span>
                                <span className="text-slate-400 text-sm ml-2">{t('pricing.per30Days')}</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {(t(`pricing.${tier.id}Features`) || tier.features).map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(tier.id)}
                                disabled={loading !== null}
                                className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2
                                    ${tier.highlight
                                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:brightness-110 shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading === tier.id
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('pricing.processing')}</>
                                    : <><Zap className="w-4 h-4" /> {t('pricing.boostWith')} {tier.name}</>
                                }
                            </button>
                        </div>
                    ))}
                </div>

                {/* Test card note */}
                <div className="text-center text-slate-500 text-xs mb-8">
                    💳 Test card: <code className="bg-white/5 px-2 py-0.5 rounded text-slate-300">4242 4242 4242 4242</code> · Any future expiry · Any CVV
                </div>
            </div>
        </div>
    );
}
