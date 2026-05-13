import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useCurrencyStore from '../../store/currencyStore';
import useLanguageStore from '../../store/languageStore';
import { CheckCircle, UploadCloud, Building, MapPin, DollarSign, ListPlus, Home, Tag } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';

const API = 'http://localhost:5000/api';

const inputCls = "w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all hover:border-gray-300 placeholder:text-slate-400";
const labelCls = "block text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider";

export default function CreateListing() {
    const navigate = useNavigate();
    const { formatPrice } = useCurrencyStore();
    const { t } = useLanguageStore();
    const [step, setStep] = useState(1);
    const [propertyId, setPropertyId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [metadata, setMetadata] = useState({ cities: [], districts: [], types: [], features: [] });
    const [activeDistricts, setActiveDistricts] = useState([]);
    const [images, setImages] = useState([]);

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

    const handleNext = async () => {
        if (step === 3) {
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
        } else {
            setStep(step + 1);
        }
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
        if (step === 2) return formData.price_usd;
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
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-gray-100 pb-4">Valuation & Metrics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls}>
                                    {formData.listing_type === 'rent' ? 'Rent Price (USD) / month' : 'Sale Price (USD)'} <span className="text-ocean-500">*</span>
                                </label>
                                <input type="number" value={formData.price_usd} onChange={e => set('price_usd', e.target.value)} className={inputCls} placeholder="$0.00" />
                                <p className="text-xs text-slate-500 mt-2">Will auto-convert to VND/EUR for buyers.</p>
                            </div>
                            <div>
                                <label className={labelCls}>Total Area</label>
                                <input type="number" value={formData.area_sqm} onChange={e => set('area_sqm', e.target.value)} className={inputCls} placeholder="m²" />
                            </div>
                            <div>
                                <label className={labelCls}>Bedrooms</label>
                                <input type="number" min="0" value={formData.bedrooms} onChange={e => set('bedrooms', e.target.value)} className={inputCls} placeholder="0" />
                            </div>
                            <div>
                                <label className={labelCls}>Bathrooms</label>
                                <input type="number" min="0" value={formData.bathrooms} onChange={e => set('bathrooms', e.target.value)} className={inputCls} placeholder="0" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelCls}>Facing Direction</label>
                                <select value={formData.direction} onChange={e => set('direction', e.target.value)} className={inputCls + ' cursor-pointer'}>
                                    <option value="">Not specified</option>
                                    <option value="north">North</option>
                                    <option value="south">South</option>
                                    <option value="east">East</option>
                                    <option value="west">West</option>
                                    <option value="northeast">North-East</option>
                                    <option value="northwest">North-West</option>
                                    <option value="southeast">South-East</option>
                                    <option value="southwest">South-West</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Location (Cascading City → District) ── */}
                {step === 3 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-gray-100 pb-4">Location</h2>

                        <div className="grid grid-cols-2 gap-4">
                            {/* City dropdown — linked to structured cities table */}
                            <div>
                                <label className={labelCls + ' flex items-center gap-1'}>
                                    <MapPin className="w-3 h-3 text-brand-400" /> City <span className="text-ocean-500">*</span>
                                </label>
                                <select
                                    value={formData.city_id}
                                    onChange={e => set('city_id', e.target.value)}
                                    className={inputCls + ' cursor-pointer'}
                                >
                                    <option value="">Select city...</option>
                                    {metadata.cities.map(c => (
                                        <option key={c.city_id} value={c.city_id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* District dropdown — cascades from selected city */}
                            <div>
                                <label className={labelCls + ' flex items-center gap-1'}>
                                    <MapPin className="w-3 h-3 text-slate-400" /> District <span className="text-ocean-500">*</span>
                                </label>
                                <select
                                    value={formData.district_id}
                                    onChange={e => set('district_id', e.target.value)}
                                    disabled={!formData.city_id}
                                    className={inputCls + ' cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'}
                                >
                                    <option value="">{formData.city_id ? 'Select district...' : 'Select city first'}</option>
                                    {activeDistricts.map(d => (
                                        <option key={d.district_id} value={d.district_id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Street Address */}
                        <div>
                            <label className={labelCls}>Street Address</label>
                            <input
                                value={formData.address}
                                onChange={e => set('address', e.target.value)}
                                className={inputCls}
                                placeholder="Auto-filled from map pin, or type manually"
                            />
                        </div>

                        {/* YouTube Video URL */}
                        <div>
                            <label className={labelCls}>Video Tour URL (YouTube)</label>
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
                            <input type="file" multiple id="imageUpload" className="hidden" onChange={e => setImages(e.target.files)} accept="image/*" />
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
        </div>
    );
}
