import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Zap, Check, ArrowLeft, Loader2, ChevronDown, X } from 'lucide-react';
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
    
    // Mock Checkout State
    const [showCheckout, setShowCheckout] = useState(null); // Stores the selected tier ID
    const [checkoutProcessing, setCheckoutProcessing] = useState(false);
    const [cardData, setCardData] = useState({ number: '4242 4242 4242 4242', expiry: '12/26', cvv: '123' });

    // Fetch user's own properties for the dropdown
    useEffect(() => {
        if (!isAuthenticated) return;
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/me`, { withCredentials: true })
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
        
        if (!hasStripeKey) {
            // Show mock checkout modal instead of redirecting directly
            setShowCheckout(tierId);
            return;
        }

        setLoading(tierId);
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/subscriptions/checkout`,
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

    const processMockPayment = async () => {
        setCheckoutProcessing(true);
        setError('');
        try {
            // Fake delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/subscriptions/simulate`,
                { property_id: propertyId, tier: showCheckout },
                { withCredentials: true }
            );
            navigate('/subscription/success?simulated=true');
        } catch (err) {
            setError(err.response?.data?.error || 'Payment failed. Try again.');
            setCheckoutProcessing(false);
            setShowCheckout(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <div className="max-w-5xl mx-auto px-6 pt-12 pb-4">
                <Link to="/properties" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-brand-600 transition-colors text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" /> {t('pricing.back')}
                </Link>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 px-4 py-1.5 rounded-full text-brand-600 text-sm font-semibold mb-6">
                        <Crown className="w-4 h-4" /> {t('pricing.vipBoosts')}
                    </div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        {t('pricing.title')}
                    </h1>
                    <p className="text-slate-600 text-lg max-w-xl mx-auto">
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
                            className="appearance-none bg-white border border-gray-200 text-slate-800 text-sm rounded-xl pl-4 pr-9 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer shadow-sm"
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
                                className="appearance-none bg-white border border-gray-200 text-slate-800 text-sm rounded-xl pl-4 pr-9 py-2.5 w-72 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer shadow-sm"
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
                            className="bg-white border border-gray-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 w-72 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400 shadow-sm"
                        />
                    )}
                </div>

                {error && (
                    <div className="text-center text-red-400 bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
                    {Object.values(TIERS).map(tier => (
                        <div
                            key={tier.id}
                            className={`relative rounded-3xl p-8 bg-white border transition-all duration-300 hover:-translate-y-1
                                ${tier.highlight ? `border-amber-300 shadow-xl ${tier.glowColor}` : 'border-gray-200 shadow-sm hover:shadow-md'}
                            `}
                        >
                            {tier.highlight && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                                    {t('pricing.mostPopular')}
                                </div>
                            )}

                            <div className="text-4xl mb-3">{tier.icon}</div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{tier.name} VIP</h2>
                            <div className="mb-6">
                                <span className={`text-4xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                                    {displayPrice(tier.priceUsd)}
                                </span>
                                <span className="text-slate-500 text-sm ml-2">{t('pricing.per30Days')}</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {(t(`pricing.${tier.id}Features`) || tier.features).map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(tier.id)}
                                disabled={loading !== null}
                                className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2
                                    ${tier.highlight
                                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white hover:brightness-110 shadow-md'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
                    💳 Test card: <code className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-slate-700">4242 4242 4242 4242</code> · Any future expiry · Any CVV
                </div>
            </div>

            {/* Mock Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                        {checkoutProcessing && (
                            <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center">
                                <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-slate-900">Processing Payment...</h3>
                                <p className="text-sm text-slate-500">Securing your connection</p>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <span className="bg-brand-100 text-brand-600 p-1.5 rounded-lg"><Zap className="w-5 h-5" /></span>
                                Secure Checkout
                            </h2>
                            <button onClick={() => setShowCheckout(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 mb-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Subscription</p>
                                <p className="text-lg font-bold text-slate-900">{TIERS[showCheckout].name} VIP</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 font-medium">Total</p>
                                <p className="text-xl font-bold text-brand-600">{displayPrice(TIERS[showCheckout].priceUsd)}</p>
                            </div>
                        </div>

                        <form className="space-y-4" onSubmit={e => { e.preventDefault(); processMockPayment(); }}>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Card Number</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={cardData.number}
                                        onChange={e => setCardData({...cardData, number: e.target.value})}
                                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono text-slate-700 tracking-widest"
                                        placeholder="0000 0000 0000 0000"
                                        required
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1">
                                        <div className="w-4 h-4 bg-red-500 rounded-full opacity-80 mix-blend-multiply"></div>
                                        <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-80 mix-blend-multiply -ml-2"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expiry Date</label>
                                    <input 
                                        type="text" 
                                        value={cardData.expiry}
                                        onChange={e => setCardData({...cardData, expiry: e.target.value})}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono text-slate-700"
                                        placeholder="MM/YY"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">CVC / CVV</label>
                                    <input 
                                        type="text" 
                                        value={cardData.cvv}
                                        onChange={e => setCardData({...cardData, cvv: e.target.value})}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono text-slate-700"
                                        placeholder="123"
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full mt-6 py-4 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                            >
                                Pay {displayPrice(TIERS[showCheckout].priceUsd)}
                            </button>
                            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 text-emerald-500" /> Payments are secure and encrypted
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
