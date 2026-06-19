import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import useCurrencyStore from '../../store/currencyStore';
import useLanguageStore from '../../store/languageStore';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Loader2, MapPin, X, UploadCloud, Trash2, Compass } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';

const API = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

const inputClass = "w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all";
const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";

export default function EditListing() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { formatPrice, preferredCurrency } = useCurrencyStore();
    const { t } = useLanguageStore();

    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [success, setSuccess]     = useState(false);
    const [error, setError]         = useState('');
    const [localPriceInput, setLocalPriceInput] = useState('');
    const [metadata, setMetadata]   = useState({ cities: [], districts: [], features: [] });
    const [activeDistricts, setActiveDistricts] = useState([]);
    const [existingImages, setExistingImages]   = useState([]);
    const [deletingImg, setDeletingImg]         = useState(null);
    const [newImages, setNewImages]             = useState(null);
    const [uploadingImg, setUploadingImg]       = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        price_usd: '',
        area_sqm: '',
        bedrooms: '',
        bathrooms: '',
        listing_type: 'sale',
        direction: '',
        city_id: '',
        district_id: '',
        address: '',
        video_url: '',
        latitude: null,
        longitude: null,
    });

    // ── Fetch metadata & property ───────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                // Load metadata (cities, districts)
                const metaRes = await axios.get(`${API}/properties/metadata`);
                setMetadata(metaRes.data);

                // Load my listing
                const r = await axios.get(`${API}/properties/me`, { withCredentials: true });
                const prop = r.data.find(p => String(p.property_id) === String(id));
                if (!prop) { setError(t('edit.notFound', 'Listing not found or you do not own it.')); setLoading(false); return; }

                // Derive city_id from the metadata districts (district_id is in the property)
                const district_id = prop.district_id;
                const matchedDistrict = metaRes.data.districts.find(d => d.district_id === parseInt(district_id));
                const city_id = matchedDistrict?.city_id || prop.city_id || '';

                const priceDb = prop.price_usd || 0;
                const uiPrice = preferredCurrency === 'USD' ? (priceDb / 25400) : priceDb;
                setForm({
                    title: prop.title || '',
                    description: prop.description || '',
                    price_usd: priceDb,
                    area_sqm: prop.area_m2 || '',
                    bedrooms: prop.bedrooms || '',
                    bathrooms: prop.bathrooms || '',
                    listing_type: prop.listing_type || 'sale',
                    direction: prop.direction || '',
                    city_id: city_id,
                    district_id: prop.district_id || '',
                    address: prop.address || '',
                    video_url: prop.video_url || '',
                    latitude: prop.latitude || null,
                    longitude: prop.longitude || null,
                });
                setLocalPriceInput(preferredCurrency === 'VND' 
                    ? uiPrice.toLocaleString('vi-VN') 
                    : uiPrice.toLocaleString('en-US'));

                // Load existing images
                const imgRes = await axios.get(`${API}/properties/${id}/images`, { withCredentials: true });
                setExistingImages(imgRes.data || []);
            } catch {
                setError(t('edit.loadFailed', 'Failed to load listing data.'));
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    // Cascade districts when city changes
    useEffect(() => {
        if (form.city_id && metadata.districts.length > 0) {
            setActiveDistricts(metadata.districts.filter(d => d.city_id === parseInt(form.city_id)));
        } else {
            setActiveDistricts([]);
        }
    }, [form.city_id, metadata.districts]);

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    const setVal = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handlePriceChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        if (!rawValue) {
            setLocalPriceInput('');
            setVal('price_usd', '');
            return;
        }
        const num = parseInt(rawValue, 10);
        const formatted = preferredCurrency === 'VND' 
            ? num.toLocaleString('vi-VN') 
            : num.toLocaleString('en-US');
        setLocalPriceInput(formatted);
        const rate = preferredCurrency === 'USD' ? 25400 : 1;
        setVal('price_usd', num * rate);
    };

    // ── Delete an existing image ────────────────────────────
    const handleDeleteImage = async (image_id) => {
        if (!window.confirm(t('edit.confirmDeletePhoto', 'Remove this photo?'))) return;
        setDeletingImg(image_id);
        try {
            await axios.delete(`${API}/media/${image_id}`, { withCredentials: true });
            setExistingImages(prev => prev.filter(img => img.image_id !== image_id));
        } catch (err) {
            alert(err.response?.data?.error || t('edit.deleteImgFailed', 'Failed to delete image'));
        }
        setDeletingImg(null);
    };

    // ── Upload new images ───────────────────────────────────
    const handleUploadNewImages = async () => {
        if (!newImages || newImages.length === 0) return;
        setUploadingImg(true);
        const fd = new FormData();
        fd.append('property_id', id);
        Array.from(newImages).forEach(f => fd.append('images', f));
        try {
            await axios.post(`${API}/media/upload`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });
            // Refresh image list
            const imgRes = await axios.get(`${API}/properties/${id}/images`, { withCredentials: true });
            setExistingImages(imgRes.data || []);
            setNewImages(null);
        } catch (err) {
            alert(err.response?.data?.error || t('edit.uploadFailed', 'Upload failed'));
        }
        setUploadingImg(false);
    };

    // ── Save form ───────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await axios.put(`${API}/properties/${id}`, {
                ...form,
                price_usd: parseFloat(form.price_usd),
                area_sqm: form.area_sqm  ? parseFloat(form.area_sqm)  : undefined,
                bedrooms:  form.bedrooms  ? parseInt(form.bedrooms)   : undefined,
                bathrooms: form.bathrooms ? parseInt(form.bathrooms)  : undefined,
            }, { withCredentials: true });
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/properties'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || t('edit.updateFailed', 'Failed to update listing.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#4d88ff] animate-spin" />
        </div>
    );

    if (error && !form.title) return (
        <div className="text-center py-20 text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p>{error}</p>
            <Link to="/dashboard/properties" className="mt-4 inline-block text-[#4d88ff] hover:text-white text-sm">{t('create.backToListings')}</Link>
        </div>
    );

    return (
        <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/dashboard/properties" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('create.editTitle')}</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{t('create.editWarning')}</p>
                </div>
            </div>

            {/* Alerts */}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    {t('edit.updateSuccess', 'Listing updated! Redirecting...')}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
            )}

            {/* ── Photo Management ── */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t('create.photos')}</h2>

                {/* Existing images grid */}
                {existingImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {existingImages.map(img => (
                            <div key={img.image_id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-gray-200">
                                <img
                                    src={img.image_url.startsWith('http') ? img.image_url : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${img.image_url}`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => handleDeleteImage(img.image_id)}
                                    disabled={deletingImg === img.image_id}
                                    className="absolute top-1 right-1 w-7 h-7 bg-red-500/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    title="Remove photo"
                                >
                                    {deletingImg === img.image_id
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <X className="w-3 h-3" />}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm">{t('create.noPhotos')}</p>
                )}

                {/* Add new photos */}
                <div className="border border-dashed border-gray-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50 rounded-xl p-5 transition-all">
                    <input type="file" id="newImgUpload" multiple accept="image/*" className="hidden"
                        onChange={e => setNewImages(e.target.files)} />
                    <label htmlFor="newImgUpload" className="flex items-center gap-3 cursor-pointer text-slate-600 hover:text-brand-600 transition-colors">
                        <UploadCloud className="w-5 h-5 text-brand-400 flex-shrink-0" />
                        <span className="text-sm">
                            {newImages && newImages.length > 0
                                ? `${newImages.length} ${newImages.length > 1 ? t('edit.filesSelected', 'files selected — ') : t('edit.fileSelected', 'file selected — ')}`
                                : t('create.addPhotos')}
                            <span className="text-slate-500 text-xs">JPG, PNG, WebP</span>
                        </span>
                    </label>
                    {newImages && newImages.length > 0 && (
                        <button
                            onClick={handleUploadNewImages}
                            disabled={uploadingImg}
                            className="mt-3 flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {uploadingImg ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('create.uploading')}</> : <><UploadCloud className="w-4 h-4" /> {t('create.uploadPhotos')}</>}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Edit Form ── */}
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-5">
                {/* Title */}
                <div>
                    <label className={labelClass}>{t('create.titleLabel')}</label>
                    <input type="text" required value={form.title} onChange={set('title')} placeholder="e.g. Modern Villa in District 2" className={inputClass} />
                </div>

                {/* Description */}
                <div>
                    <label className={labelClass}>{t('create.descLabel')}</label>
                    <textarea rows={4} value={form.description} onChange={set('description')} placeholder="Describe the property..." className={`${inputClass} resize-none`} />
                </div>

                {/* Listing Type + Price */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>{t('create.listingFor')}</label>
                        <div className="flex gap-2">
                            {[['sale', `🏷️ ${t('create.forSale')}`], ['rent', `🔑 ${t('create.forRent')}`]].map(([val, label]) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setVal('listing_type', val)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${form.listing_type === val
                                        ? val === 'sale' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-slate-50 border-gray-200 text-slate-500 hover:bg-slate-100 hover:border-gray-300'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{form.listing_type === 'rent' ? t('create.rentPrice') : t('create.salePrice')} ({preferredCurrency}) *</label>
                        <input type="text" required value={localPriceInput} onChange={handlePriceChange} placeholder="0" className={inputClass} />
                        {form.price_usd && (
                            <p className="text-xs text-slate-500 mt-2">
                                {t('create.savedToDb', 'Saved to database as')}: <strong className="text-slate-700">đ{parseFloat(form.price_usd).toLocaleString('vi-VN')} VND</strong>
                            </p>
                        )}
                    </div>
                </div>

                {/* Area, Beds, Baths, Direction */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>{t('create.totalArea')} (m²)</label>
                        <input type="number" min="0" value={form.area_sqm} onChange={set('area_sqm')} placeholder="120" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('create.bedrooms')}</label>
                        <input type="number" min="0" max="20" value={form.bedrooms} onChange={set('bedrooms')} placeholder="3" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>{t('create.bathrooms')}</label>
                        <input type="number" min="0" max="20" value={form.bathrooms} onChange={set('bathrooms')} placeholder="2" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass + ' flex items-center gap-1'}><Compass className="w-3 h-3" />{t('create.facingDir')}</label>
                        <select value={form.direction} onChange={set('direction')} className={inputClass + ' cursor-pointer'}>
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

                {/* City + District (cascading dropdowns) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass + ' flex items-center gap-1'}><MapPin className="w-3 h-3 text-brand-400" />{t('create.city')}</label>
                        <select value={form.city_id} onChange={e => { setVal('city_id', e.target.value); setVal('district_id', ''); }} className={inputClass + ' cursor-pointer'}>
                            <option value="">{t('create.selectCity')}</option>
                            {metadata.cities.map(c => <option key={c.city_id} value={c.city_id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass + ' flex items-center gap-1'}><MapPin className="w-3 h-3 text-slate-500" />{t('create.district')}</label>
                        <select value={form.district_id} onChange={set('district_id')} disabled={!form.city_id} className={inputClass + ' cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'}>
                            <option value="">{form.city_id ? t('create.selectDistrict') : t('create.selectCityFirst')}</option>
                            {activeDistricts.map(d => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Street Address */}
                <div>
                    <label className={labelClass}>{t('create.streetAddress')}</label>
                    <input type="text" value={form.address} onChange={set('address')} placeholder={t('create.autoFillMap')} className={inputClass} />
                </div>

                {/* Video URL */}
                <div>
                    <label className={labelClass}>{t('create.videoUrl')}</label>
                    <input type="url" value={form.video_url} onChange={set('video_url')} placeholder="https://youtube.com/..." className={inputClass} />
                </div>

                {/* Map Picker */}
                <div>
                    <label className={labelClass}><MapPin className="inline w-4 h-4 mr-1 text-[#4d88ff]" />{t('create.pinLocation')}</label>
                    <LocationPicker
                        initialLat={form.latitude}
                        initialLng={form.longitude}
                        onSelect={({ lat, lng, address }) => {
                            setForm(f => ({ ...f, latitude: lat, longitude: lng, address: address || f.address }));
                        }}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Link to="/dashboard/properties" className="flex-1 py-3 border border-gray-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold rounded-xl text-sm transition-all text-center">
                        {t('common.cancel')}
                    </Link>
                    <button
                        type="submit" disabled={saving || success}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('create.saving')}</> : <><Save className="w-4 h-4" /> {t('create.saveChanges')}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
