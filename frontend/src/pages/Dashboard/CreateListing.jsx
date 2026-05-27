import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import useCurrencyStore from '../../store/currencyStore';
import useLanguageStore from '../../store/languageStore';
import { CheckCircle, UploadCloud, Building, MapPin, DollarSign, ListPlus, Home, Tag } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';

const API = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

const inputCls = "w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all hover:border-gray-300 placeholder:text-slate-400";
const labelCls = "block text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider";

export default function CreateListing() {
    const navigate = useNavigate();
    const { formatPrice, preferredCurrency, exchangeRates } = useCurrencyStore();
    const { t } = useLanguageStore();
    const [step, setStep] = useState(1);
    const [propertyId, setPropertyId] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [metadata, setMetadata] = useState({ cities: [], districts: [], types: [], features: [] });
    const [activeDistricts, setActiveDistricts] = useState([]);
    const [images, setImages] = useState([]);
    const [localPriceInput, setLocalPriceInput] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type_id: '',
        listing_type: 'sale',
        price_usd: '',
        area_sqm: '',
        bedrooms: '',
        bathrooms: '',
        direction: '',
        city_id: '',
        district_id: '',
        address: '',
        video_url: '',
        latitude: null,
        longitude: null,
        features: [],
    });

    // Fetch metadata on mount
    useEffect(() => {
        axios.get(`${API}/properties/metadata`)
            .then(res => setMetadata(res.data))
            .catch(err => console.error('Metadata error:', err));
    }, []);

    // Cascade districts when city changes
    useEffect(() => {
        if (formData.city_id) {
            setActiveDistricts(metadata.districts.filter(d => d.city_id === parseInt(formData.city_id)));
            setFormData(prev => ({ ...prev, district_id: '' }));
        } else {
            setActiveDistricts([]);
        }
    }, [formData.city_id, metadata.districts]);

    const toggleFeature = (featureId) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(featureId)
                ? prev.features.filter(f => f !== featureId)
                : [...prev.features, featureId]
        }));
    };

    const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handlePriceChange = (e) => {
        // Strip everything except digits
        const rawValue = e.target.value.replace(/\D/g, '');
        
        if (!rawValue) {
            setLocalPriceInput('');
            set('price_usd', '');
            return;
        }
        
        const num = parseInt(rawValue, 10);
        
        // Format appropriately: VND gets dots (vi-VN), others get commas (en-US)
        const formatted = preferredCurrency === 'VND' 
            ? num.toLocaleString('vi-VN') 
            : num.toLocaleString('en-US');
            
        setLocalPriceInput(formatted);
        
        const rate = exchangeRates[preferredCurrency] || 1;
        set('price_usd', num / rate);
    };

    const handleNext = () => {
        if (step === 3) {
            setShowConfirm(true);
        } else {
            setStep(step + 1);
        }
    };

    const submitListing = async () => {
        setShowConfirm(false);
        setLoading(true);
        try {
            // Find property_type name from type_id for backwards-compat
            const selectedType = metadata.types.find(t => t.type_id === parseInt(formData.type_id));
            const payload = {
                ...formData,
                property_type: selectedType?.name || 'Apartment',
                area_sqm: formData.area_sqm || null,
            };
            const res = await axios.post(`${API}/properties`, payload, { withCredentials: true });
            setPropertyId(res.data.property_id);
            setStep(4);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create property');
        }
        setLoading(false);
    };

    const handleUploadMedia = async () => {
        if (images.length === 0) return navigate('/dashboard/properties');
        setLoading(true);
        const imgData = new FormData();
        imgData.append('property_id', propertyId);
        Array.from(images).forEach(file => imgData.append('images', file));
        try {
            await axios.post(`${API}/media/upload`, imgData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            navigate('/dashboard/properties');
        } catch (error) {
            alert(`Upload Failed: ${error.response?.data?.error || error.message}`);
        }
        setLoading(false);
    };

    const canAdvance = () => {
        if (step === 1) return formData.title && formData.type_id;
        if (step === 2) return formData.price_usd !== '' && formData.price_usd !== null && !isNaN(formData.price_usd) && Number(formData.price_usd) > 0;
        if (step === 3) return formData.city_id && formData.district_id;
        return true;
    };

    const steps = [
        { id: 1, icon: ListPlus, label: t('create.tabBasics') },
        { id: 2, icon: DollarSign, label: t('create.tabMetrics') },
        { id: 3, icon: MapPin, label: t('create.tabLocation') },
        { id: 4, icon: UploadCloud, label: t('create.tabMedia') }
    ];

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t('create.title')}</h1>
            <p className="text-slate-500 font-medium mb-8">{t('create.subtitle')}</p>

            {/* Step indicator */}
            <div className="flex gap-3 mb-10">
                {steps.map(s => (
                    <div key={s.id} className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all shadow-sm ${step >= s.id ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-gray-200 text-slate-400'}`}>
                        <s.icon className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] pointer-events-none" />

                {/* ── STEP 1: Basics + Listing Type + Features ── */}
                {step === 1 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-gray-100 pb-4">{t('create.details')}</h2>

                        {/* Sale vs Rent toggle */}
                        <div>
                            <label className={labelCls}>{t('create.listingFor')}</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => set('listing_type', 'sale')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border transition-all shadow-sm ${formData.listing_type === 'sale' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-gray-200 text-slate-500 hover:bg-slate-100 hover:border-gray-300'}`}
                                >
                                    {t('create.forSale')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => set('listing_type', 'rent')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border transition-all shadow-sm ${formData.listing_type === 'rent' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-50 border-gray-200 text-slate-500 hover:bg-slate-100 hover:border-gray-300'}`}
                                >
                                    {t('create.forRent')}
                                </button>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className={labelCls}>{t('create.titleLabel')}</label>
                            <input
                                value={formData.title}
                                onChange={e => set('title', e.target.value)}
                                className={inputCls}
                                placeholder={t('create.titlePlaceholder')}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelCls}>{t('create.descLabel')}</label>
                            <textarea
                                rows="4"
                                value={formData.description}
                                onChange={e => set('description', e.target.value)}
                                className={inputCls}
                                placeholder={t('create.descPlaceholder')}
                            />
                        </div>

                        {/* Property Type */}
                        <div>
                            <label className={labelCls}>{t('create.propType')}</label>
                            <select
                                value={formData.type_id}
                                onChange={e => set('type_id', e.target.value)}
                                className={inputCls + ' cursor-pointer'}
                            >
                                <option value="">{t('create.selectType')}</option>
                                {metadata.types.map(t => (
                                    <option key={t.type_id} value={t.type_id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Features / Amenities */}
                        {metadata.features.length > 0 && (
                            <div>
                                <label className={labelCls + ' flex items-center gap-2'}>
                                    <Tag className="w-4 h-4" /> Amenities & Features
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {metadata.features.map(f => {
                                        const selected = formData.features.includes(f.feature_id);
                                        return (
                                            <button
                                                key={f.feature_id}
                                                type="button"
                                                onClick={() => toggleFeature(f.feature_id)}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all text-left shadow-sm ${
                                                    selected
                                                        ? 'bg-brand-50 border-brand-200 text-brand-700'
                                                        : 'bg-white border-gray-200 text-slate-500 hover:border-brand-200 hover:text-brand-600'
                                                }`}
                                            >
                                                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 text-xs ${selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300'}`}>
                                                    {selected ? '✓' : ''}
                                                </span>
                                                {f.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {formData.features.length > 0 && (
                                    <p className="text-xs text-brand-400 mt-2 font-medium">{formData.features.length} feature{formData.features.length > 1 ? 's' : ''} selected</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 2: Metrics ── */}
                {step === 2 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-gray-100 pb-4">{t('create.metricsTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls}>
                                    {formData.listing_type === 'rent' ? t('create.rentPrice') : t('create.salePrice')} ({preferredCurrency}) <span className="text-ocean-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={localPriceInput} 
                                    onChange={handlePriceChange} 
                                    className={inputCls} 
                                    placeholder="0" 
                                />
                                {formData.price_usd && preferredCurrency !== 'USD' && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        {t('create.savedToDb')}: <strong className="text-slate-700">${parseFloat(formData.price_usd).toLocaleString(undefined, {maximumFractionDigits: 2})} USD</strong>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={labelCls}>{t('create.totalArea')}</label>
                                <input type="number" value={formData.area_sqm} onChange={e => set('area_sqm', e.target.value)} className={inputCls} placeholder="m²" />
                            </div>
                            <div>
                                <label className={labelCls}>{t('create.bedrooms')}</label>
                                <input type="number" min="0" value={formData.bedrooms} onChange={e => set('bedrooms', e.target.value)} className={inputCls} placeholder="0" />
                            </div>
                            <div>
                                <label className={labelCls}>{t('create.bathrooms')}</label>
                                <input type="number" min="0" value={formData.bathrooms} onChange={e => set('bathrooms', e.target.value)} className={inputCls} placeholder="0" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelCls}>{t('create.facingDir')}</label>
                                <select value={formData.direction} onChange={e => set('direction', e.target.value)} className={inputCls + ' cursor-pointer'}>
                                    <option value="">{t('create.notSpecified')}</option>
                                    <option value="north">{t('create.dirNorth')}</option>
                                    <option value="south">{t('create.dirSouth')}</option>
                                    <option value="east">{t('create.dirEast')}</option>
                                    <option value="west">{t('create.dirWest')}</option>
                                    <option value="northeast">{t('create.dirNE')}</option>
                                    <option value="northwest">{t('create.dirNW')}</option>
                                    <option value="southeast">{t('create.dirSE')}</option>
                                    <option value="southwest">{t('create.dirSW')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Location (Cascading City → District) ── */}
                {step === 3 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-gray-100 pb-4">{t('create.locationTitle')}</h2>

                        <div className="grid grid-cols-2 gap-4">
                            {/* City dropdown — linked to structured cities table */}
                            <div>
                                <label className={labelCls + ' flex items-center gap-1'}>
                                    <MapPin className="w-3 h-3 text-brand-400" /> {t('create.city')} <span className="text-ocean-500">*</span>
                                </label>
                                <select
                                    value={formData.city_id}
                                    onChange={e => set('city_id', e.target.value)}
                                    className={inputCls + ' cursor-pointer'}
                                >
                                    <option value="">{t('create.selectType')}</option>
                                    {metadata.cities.map(c => (
                                        <option key={c.city_id} value={c.city_id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* District dropdown — cascades from selected city */}
                            <div>
                                <label className={labelCls + ' flex items-center gap-1'}>
                                    <MapPin className="w-3 h-3 text-slate-400" /> {t('create.district')} <span className="text-ocean-500">*</span>
                                </label>
                                <select
                                    value={formData.district_id}
                                    onChange={e => set('district_id', e.target.value)}
                                    disabled={!formData.city_id}
                                    className={inputCls + ' cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'}
                                >
                                    <option value="">{formData.city_id ? t('create.selectDistrict') : t('create.selectCityFirst')}</option>
                                    {activeDistricts.map(d => (
                                        <option key={d.district_id} value={d.district_id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Street Address */}
                        <div>
                            <label className={labelCls}>{t('create.streetAddress')}</label>
                            <input
                                value={formData.address}
                                onChange={e => set('address', e.target.value)}
                                className={inputCls}
                                placeholder={t('create.autoFillMap')}
                            />
                        </div>

                        {/* YouTube Video URL */}
                        <div>
                            <label className={labelCls}>{t('create.videoUrl')}</label>
                            <input
                                value={formData.video_url}
                                onChange={e => set('video_url', e.target.value)}
                                className={inputCls}
                                placeholder="https://youtu.be/..."
                            />
                        </div>

                        {/* Map Pin */}
                        <div>
                            <label className={labelCls + ' flex items-center gap-1'}>
                                <MapPin className="inline w-4 h-4 text-brand-400" /> Pin Location on Map
                            </label>
                            <LocationPicker
                                initialLat={formData.latitude}
                                initialLng={formData.longitude}
                                onSelect={({ lat, lng, address }) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        latitude: lat,
                                        longitude: lng,
                                        address: address || prev.address,
                                    }));
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Media Upload ── */}
                {step === 4 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Listing Created!</h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">Your listing is pending admin approval. Upload photos to complete it.</p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-3xl p-12 text-center transition-all bg-slate-50 hover:bg-brand-50 group">
                            <input type="file" multiple id="imageUpload" className="hidden" onChange={e => setImages(prev => [...prev, ...Array.from(e.target.files)])} accept="image/*" />
                            <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-10 h-10" />
                                </div>
                                <span className="text-slate-900 font-bold text-xl mb-2">Click to select photos</span>
                                <span className="text-slate-500">Upload up to 10 photos (JPG, PNG)</span>
                                {images.length > 0 && (
                                    <div className="mt-6 px-6 py-3 bg-ocean-500 text-white rounded-xl font-bold uppercase tracking-wider animate-bounce shadow-[0_0_20px_rgba(73,136,196,0.5)]">
                                        {images.length} file{images.length > 1 ? 's' : ''} ready to upload
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-10 flex justify-between pt-8 border-t border-gray-100 relative z-10">
                    <button
                        onClick={() => setStep(step - 1)}
                        disabled={step === 1 || step === 4}
                        className="px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-0"
                    >
                        Back
                    </button>

                    {step < 4 ? (
                        <button
                            disabled={loading || !canAdvance()}
                            onClick={handleNext}
                            className="bg-ocean-500 hover:bg-ocean-400 text-white font-bold uppercase tracking-wider py-3.5 px-10 rounded-xl transition-all shadow-lg hover:shadow-ocean-500/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Creating...' : step === 3 ? 'Create Listing →' : 'Continue →'}
                        </button>
                    ) : (
                        <button
                            onClick={handleUploadMedia}
                            disabled={loading}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-10 rounded-xl uppercase tracking-wider disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Uploading...' : images.length > 0 ? `Upload ${images.length} Photo${images.length > 1 ? 's' : ''} & Finish` : 'Skip & Finish'}
                        </button>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 text-center mb-4">{t('create.confirmListing')}</h3>
                        <p className="text-slate-600 text-center mb-8">
                            {t('create.confirmDesc')} <Link to="/guidelines" target="_blank" className="text-brand-600 font-bold hover:underline">{t('create.guidelines')}</Link>{t('create.confirmReview')}
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-6 py-3 border border-gray-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                onClick={submitListing}
                                className="flex-1 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-600/30"
                            >
                                {t('create.createListingBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
