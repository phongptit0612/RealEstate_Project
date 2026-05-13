import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Bed, Bath, Square, MapPin, Compass, Home, Phone, Mail,
    ChevronLeft, ChevronRight, Tag, TrendingDown, Flag,
    Calendar, User, CheckCircle, Heart, Share2, ArrowLeft, Crown, Zap,
    Printer, Eye, Video
} from 'lucide-react';
import useCurrencyStore from '../store/currencyStore';
import useLanguageStore from '../store/languageStore';
import useUserStore from '../store/userStore';
import useFavoriteStore from '../store/favoriteStore';
import MortgageCalculator from '../components/MortgageCalculator';
import MapView from '../components/MapView';
import Footer from '../components/Footer';



export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { formatPrice } = useCurrencyStore();
    const { t } = useLanguageStore();
    const { isAuthenticated, user } = useUserStore();
    const { isFavorited, toggleFavorite } = useFavoriteStore();

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImg, setActiveImg] = useState(0);
    const [reportModal, setReportModal] = useState(false);
    const [reportData, setReportData] = useState({ reason: '', details: '' });
    const [reportSent, setReportSent] = useState(false);
    const [similar, setSimilar] = useState([]);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        setLoading(true);
        axios.get(`http://localhost:5000/api/properties/${id}`, { withCredentials: true })
            .then(r => { setProperty(r.data); setLoading(false); })
            .catch(() => { setError('Property not found or not approved.'); setLoading(false); });
        // Fetch similar listings
        axios.get(`http://localhost:5000/api/properties/${id}/similar`)
            .then(r => setSimilar(r.data || []))
            .catch(() => {});
    }, [id]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        });
    };

    const submitReport = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/reports', {
                property_id: id, ...reportData
            }, { withCredentials: true });
            setReportSent(true);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit report');
        }
    };

    // Loading skeleton
    if (loading) return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 animate-pulse space-y-6">
                <div className="h-96 bg-slate-200 rounded-3xl" />
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                        <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
                        <div className="h-4 bg-slate-200 rounded-xl w-1/2" />
                        <div className="h-32 bg-slate-200 rounded-xl" />
                    </div>
                    <div className="h-64 bg-slate-200 rounded-3xl" />
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
            <Home className="w-16 h-16 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-700">{error}</h2>
            <Link to="/properties" className="text-brand-600 font-semibold hover:underline">← Back to listings</Link>
        </div>
    );

    const images = property.images?.length > 0
        ? property.images.map(i => i.image_url.startsWith('http') ? i.image_url : `http://localhost:5000${i.image_url}`)
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop'];

    const fullAddress = [property.address, property.district_name, property.city_name, property.country].filter(Boolean).join(', ');

    return (
        <div className="min-h-screen bg-surface font-sans">
            {/* Slim Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-brand-600 font-semibold transition-colors">
                        <ArrowLeft className="w-5 h-5" /> {t('common.back')}
                    </button>
                    <Link to="/" className="text-lg font-bold text-slate-900">LuxEstates</Link>
                    <div className="flex items-center gap-2">
                        <button
                            className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium ${
                                copiedLink ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                            onClick={handleShare}
                            title="Share listing"
                        >
                            <Share2 className="w-5 h-5" />
                            {copiedLink && <span className="text-xs">Copied!</span>}
                        </button>
                        <button
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors hidden sm:block"
                            onClick={() => window.print()}
                            title="Print listing"
                        >
                            <Printer className="w-5 h-5 text-slate-600" />
                        </button>
                        <button
                            onClick={() => { if(!isAuthenticated) navigate('/login'); else toggleFavorite(id); }}
                            className={`p-2 rounded-full transition-all ${isFavorited(id) ? 'bg-red-500 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorited(id) ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">

                {/* ── IMAGE GALLERY ── */}
                <div className="relative rounded-3xl overflow-hidden mb-10 shadow-xl group mt-6">
                    <img
                        src={images[activeImg]}
                        alt={property.title}
                        className="w-full h-[480px] object-cover transition-all duration-500"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Type + Status badges */}
                    <div className="absolute top-5 left-5 flex gap-2 z-10">
                        <span className="bg-white/95 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                            {property.type_name || 'Estate'}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${
                            property.listing_type === 'rent' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            {property.listing_type === 'sale' ? t('card.forSale') : t('card.forRent')}
                        </span>
                    </div>

                    {/* Nav arrows */}
                    {images.length > 1 && (<>
                        <button
                            onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        ><ChevronLeft className="w-5 h-5" /></button>
                        <button
                            onClick={() => setActiveImg(i => (i + 1) % images.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        ><ChevronRight className="w-5 h-5" /></button>
                    </>)}

                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(i)}
                                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-white scale-110' : 'border-white/40 opacity-70'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Image count */}
                    <div className="absolute top-5 right-5 bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {activeImg + 1} / {images.length}
                    </div>
                </div>

                {/* ── MAIN LAYOUT ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN — Property Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Header */}
                        <div>
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap mb-1">
                                        <h1 className="text-3xl font-bold text-slate-900">{property.title}</h1>
                                        {/* VIP badge */}
                                        {property.vip_tier === 'gold' && (
                                            <span className="inline-flex items-center gap-1 bg-amber-400 text-black text-xs font-extrabold px-3 py-1 rounded-full shadow">
                                                <Crown className="w-3 h-3" /> Gold VIP
                                            </span>
                                        )}
                                        {property.vip_tier === 'silver' && (
                                            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-xs font-extrabold px-3 py-1 rounded-full shadow">
                                                <Crown className="w-3 h-3" /> Silver VIP
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
                                        <span className="text-sm">{fullAddress}</span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-3xl font-bold text-brand-600">{formatPrice(property.price_usd)}</p>
                                    {property.listing_type === 'rent' && <p className="text-sm text-slate-400">/month</p>}
                                    {property.expires_at && (
                                        <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Expires {new Date(property.expires_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    {/* Boost button — owner only */}
                                    {user && user.id === property.seller_id && property.vip_tier === 'none' && (
                                        <Link
                                            to={`/pricing?property_id=${property.property_id}`}
                                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 border border-amber-300 hover:border-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all"
                                        >
                                            <Zap className="w-3 h-3" /> Boost this listing
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* View / Favorites counter row */}
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                                {property.view_count > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3.5 h-3.5" /> {Number(property.view_count).toLocaleString()} {t('detail.views')}
                                    </span>
                                )}
                                {property.favorites_count > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3.5 h-3.5 text-red-400 fill-current" /> {Number(property.favorites_count).toLocaleString()} {t('detail.savedCount')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { icon: Bed, label: t('detail.bedrooms'), value: property.bedrooms ?? '—' },
                                { icon: Bath, label: t('detail.bathrooms'), value: property.bathrooms ?? '—' },
                                { icon: Square, label: t('detail.area'), value: property.area_m2 ? `${property.area_m2} m²` : '—' },
                                { icon: Compass, label: t('detail.direction'), value: property.direction ? t(`directionMap.${property.direction}`) : '—' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                                    <Icon className="w-5 h-5 text-brand-600 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                                    <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Video Tour */}
                        {property.video_url && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Video className="w-5 h-5 text-brand-600" /> {t('detail.videoTour')}
                                </h2>
                                <div className="aspect-video rounded-xl overflow-hidden bg-slate-100">
                                    {property.video_url.includes('youtube.com') || property.video_url.includes('youtu.be') ? (
                                        <iframe
                                            src={property.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                                            className="w-full h-full"
                                            allowFullScreen
                                            title="Property video tour"
                                        />
                                    ) : (
                                        <video src={property.video_url} controls className="w-full h-full object-cover" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Features / Tags */}
                        {property.features?.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-brand-600" /> {t('detail.featuresAmenities')}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {property.features.map(f => (
                                        <span key={f.feature_id} className="bg-brand-600/8 text-brand-600 text-sm font-semibold px-4 py-2 rounded-full border border-brand-600/15">
                                            {f.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {property.description && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('detail.aboutProperty')}</h2>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
                            </div>
                        )}

                        {/* Location */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-brand-600" /> {t('detail.location')}
                            </h2>
                            <p className="text-slate-600 text-sm mb-4">{fullAddress}</p>
                            <MapView
                                properties={[{ ...property, primary_image: property.images?.[0]?.image_url || null }]}
                                center={property.latitude && property.longitude
                                    ? [parseFloat(property.latitude), parseFloat(property.longitude)]
                                    : null
                                }
                                zoom={15}
                                height="280px"
                                singlePin={true}
                            />
                        </div>

                        {/* Price History */}
                        {property.priceHistory?.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-brand-600" /> {t('detail.priceHistory')}
                                </h2>
                                <div className="space-y-3">
                                    {property.priceHistory.map((h, i) => {
                                        const dropped = h.new_price_usd < h.old_price_usd;
                                        return (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                <span className="text-xs text-slate-400">{new Date(h.changed_at).toLocaleDateString()}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-500 line-through">{formatPrice(h.old_price_usd)}</span>
                                                    <span className={`text-sm font-bold ${dropped ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {dropped ? '▼' : '▲'} {formatPrice(h.new_price_usd)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Mortgage Calculator */}
                        <MortgageCalculator basePriceUsd={parseFloat(property.price_usd)} />

                        {/* Report */}
                        <div className="text-center pt-2">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => setReportModal(true)}
                                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors font-medium"
                                >
                                    <Flag className="w-4 h-4" /> {t('detail.reportListing')}
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    state={{ from: `/properties/${id}` }}
                                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-600 transition-colors font-medium"
                                >
                                    <Flag className="w-4 h-4" /> {t('detail.loginToReport')}
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN — Seller Card (sticky) */}
                    <div className="space-y-6">
                        <div className="sticky top-24 space-y-4">
                            {/* Price Summary */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                                <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-1">{t('detail.askingPrice')}</p>
                                <p className="text-3xl font-bold text-brand-600">{formatPrice(property.price_usd)}</p>
                                {property.area_m2 && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        ≈ {formatPrice(property.price_usd / property.area_m2)} /m²
                                    </p>
                                )}
                            </div>

                            {/* Seller Card */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-brand-600" /> {t('detail.listedBy')}
                                </h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-600/10 flex items-center justify-center text-brand-600 font-bold text-lg flex-shrink-0 overflow-hidden">
                                        {property.seller_avatar
                                            ? <img src={property.seller_avatar.startsWith('http') ? property.seller_avatar : `http://localhost:5000${property.seller_avatar}`} alt="" className="w-full h-full object-cover" />
                                            : property.seller_name?.[0]?.toUpperCase()
                                        }
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{property.seller_name}</p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-emerald-500" /> {t('detail.verifiedMember')}
                                        </p>
                                    </div>
                                </div>

                                {property.seller_phone && (
                                    <a href={`tel:${property.seller_phone}`}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors mb-2">
                                        <Phone className="w-4 h-4" /> {property.seller_phone}
                                    </a>
                                )}

                                {/* ── SEND MESSAGE BUTTON — always visible ── */}
                                {isAuthenticated ? (
                                    // Don't show if viewing your own listing
                                    Number(user?.id) !== Number(property.seller_id) ? (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await axios.post('http://localhost:5000/api/conversations', {
                                                        property_id: property.property_id,
                                                        seller_id: property.seller_id,
                                                    }, { withCredentials: true });
                                                    navigate('/dashboard/inbox', {
                                                        state: {
                                                            startConversation: {
                                                                sellerId: property.seller_id,
                                                                propertyId: property.property_id,
                                                                propertyTitle: property.title,
                                                            }
                                                        }
                                                    });
                                                } catch (err) {
                                                    console.error(err);
                                                    navigate('/dashboard/inbox');
                                                }
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors shadow-md"
                                        >
                                            <Mail className="w-4 h-4" /> {t('detail.sendMessage')}
                                        </button>
                                    ) : (
                                        <div className="w-full py-3 rounded-xl bg-surface border border-slate-200 text-slate-400 text-sm font-semibold text-center">
                                            This is your listing
                                        </div>
                                    )
                                ) : (
                                    <Link
                                        to="/login"
                                        state={{ from: `/properties/${id}` }}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors shadow-md"
                                    >
                                        <Mail className="w-4 h-4" /> {t('detail.loginToSendMessage')}
                                    </Link>
                                )}
                            </div>

                            {/* Quick info card */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
                                <h3 className="font-bold text-slate-900 text-sm">{t('detail.propertyDetails')}</h3>
                                {[
                                    { label: t('detail.status'), value: property.listing_status },
                                    { label: t('detail.listingType'), value: property.listing_type === 'sale' ? t('search.sale') : t('search.rent') },
                                    { label: t('detail.posted'), value: new Date(property.created_at).toLocaleDateString() },
                                    { label: 'ID', value: `#${property.property_id}` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between text-sm">
                                        <span className="text-slate-400">{label}</span>
                                        <span className="font-semibold text-slate-800 capitalize">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Report Modal */}
            {reportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        {reportSent ? (
                            <div className="text-center py-4">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <h3 className="font-bold text-slate-900 text-lg mb-1">Report Submitted</h3>
                                <p className="text-slate-500 text-sm mb-4">Our team will review this listing shortly.</p>
                                <button onClick={() => { setReportModal(false); setReportSent(false); }}
                                    className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl">Close</button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Flag className="w-5 h-5 text-red-500" /> Report Listing
                                </h2>
                                {!isAuthenticated ? (
                                    <div className="text-center py-4">
                                        <p className="text-slate-500 mb-4">You must be logged in to report a listing.</p>
                                        <Link to="/login" className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl">Login</Link>
                                    </div>
                                ) : (
                                    <form onSubmit={submitReport} className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 mb-1 block">Reason</label>
                                            <select value={reportData.reason} onChange={e => setReportData(d => ({ ...d, reason: e.target.value }))} required
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-600">
                                                <option value="">Select a reason</option>
                                                <option value="spam">Spam or duplicate</option>
                                                <option value="fraud">Fraud or scam</option>
                                                <option value="wrong_info">Wrong information</option>
                                                <option value="offensive">Offensive content</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 mb-1 block">Details (optional)</label>
                                            <textarea rows={3} value={reportData.details}
                                                onChange={e => setReportData(d => ({ ...d, details: e.target.value }))}
                                                placeholder="Describe the issue..."
                                                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-brand-600 resize-none" />
                                        </div>
                                        <div className="flex gap-3 pt-1">
                                            <button type="button" onClick={() => setReportModal(false)}
                                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-surface">
                                                Cancel
                                            </button>
                                            <button type="submit"
                                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
                                                Submit Report
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── SIMILAR LISTINGS ── */}
            {similar.length > 0 && (
                <div className="max-w-6xl mx-auto px-4 pb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('detail.similarProperties')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {similar.map(p => {
                            const img = p.primary_image
                                ? (p.primary_image.startsWith('http') ? p.primary_image : `http://localhost:5000${p.primary_image}`)
                                : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop';
                            return (
                                <Link
                                    key={p.property_id}
                                    to={`/properties/${p.property_id}`}
                                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-brand-600/30 transition-all duration-300"
                                >
                                    <div className="h-40 overflow-hidden">
                                        <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{p.title}</p>
                                        <p className="text-brand-600 font-bold text-sm mt-1">{formatPrice(p.price_usd)}</p>
                                        <p className="text-xs text-slate-400 mt-1">{p.district_name || p.city_name || 'N/A'}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
