import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Loader2, MapPin } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';

const API = 'http://localhost:5000/api';

const inputClass = "w-full bg-[#020813] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#0033ab] focus:ring-1 focus:ring-[#0033ab] transition-all";
const labelClass = "text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block";

export default function EditListing() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        price_usd: '',
        area_sqm: '',
        bedrooms: '',
        bathrooms: '',
        listing_type: 'sale',
        address: '',
        video_url: '',
        latitude: null,
        longitude: null,
    });

    // ── Load existing property ──────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                // Fetch from /me to get user's own listings (bypasses approved filter)
                const r = await axios.get(`${API}/properties/me`, { withCredentials: true });
                const prop = r.data.find(p => String(p.property_id) === String(id));
                if (!prop) { setError('Listing not found or you do not own it.'); setLoading(false); return; }
                setForm({
                    title: prop.title || '',
                    description: prop.description || '',
                    price_usd: prop.price_usd || '',
                    area_sqm: prop.area_m2 || '',
                    bedrooms: prop.bedrooms || '',
                    bathrooms: prop.bathrooms || '',
                    listing_type: prop.listing_type || 'sale',
                    address: prop.address || '',
                    video_url: prop.video_url || '',
                    latitude: prop.latitude || null,
                    longitude: prop.longitude || null,
                });
            } catch {
                setError('Failed to load listing data.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await axios.put(`${API}/properties/${id}`, {
                ...form,
                price_usd: parseFloat(form.price_usd),
                area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : undefined,
                bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
                bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
            }, { withCredentials: true });
            setSuccess(true);
            setTimeout(() => navigate('/dashboard/properties'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update listing.');
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
            <Link to="/dashboard/properties" className="mt-4 inline-block text-[#4d88ff] hover:text-white text-sm">← Back to My Listings</Link>
        </div>
    );

    return (
        <div className="max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/dashboard/properties" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Edit Listing</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Changes will require admin re-approval before going live.</p>
                </div>
            </div>

            {/* Success banner */}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    Listing updated! Redirecting to My Properties...
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-[#051124] border border-white/8 rounded-2xl p-6 space-y-5">
                {/* Title */}
                <div>
                    <label className={labelClass}>Listing Title *</label>
                    <input type="text" required value={form.title} onChange={set('title')} placeholder="e.g. Modern Villa in District 2" className={inputClass} />
                </div>

                {/* Description */}
                <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                        rows={4} value={form.description} onChange={set('description')}
                        placeholder="Describe the property..."
                        className={`${inputClass} resize-none`}
                    />
                </div>

                {/* Price & Type */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Price (USD) *</label>
                        <input type="number" required min="0" step="0.01" value={form.price_usd} onChange={set('price_usd')} placeholder="250000" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Listing Type</label>
                        <select value={form.listing_type} onChange={set('listing_type')} className={inputClass}>
                            <option value="sale">For Sale</option>
                            <option value="rent">For Rent</option>
                        </select>
                    </div>
                </div>

                {/* Area, Beds, Baths */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Area (m²)</label>
                        <input type="number" min="0" value={form.area_sqm} onChange={set('area_sqm')} placeholder="120" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Bedrooms</label>
                        <input type="number" min="0" max="20" value={form.bedrooms} onChange={set('bedrooms')} placeholder="3" className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Bathrooms</label>
                        <input type="number" min="0" max="20" value={form.bathrooms} onChange={set('bathrooms')} placeholder="2" className={inputClass} />
                    </div>
                </div>

                {/* Location Map Picker */}
                <div>
                    <label className={labelClass}>
                        <MapPin className="inline w-4 h-4 mr-1 text-[#4d88ff]" />
                        Pin Location on Map
                    </label>
                    <LocationPicker
                        initialLat={form.latitude}
                        initialLng={form.longitude}
                        onSelect={({ lat, lng, address }) => {
                            setForm(f => ({
                                ...f,
                                latitude: lat,
                                longitude: lng,
                                address: address || f.address,
                            }));
                        }}
                    />
                </div>

                {/* Address */}
                <div>
                    <label className={labelClass}>Address</label>
                    <input type="text" value={form.address} onChange={set('address')} placeholder="Auto-filled from map, or type manually" className={inputClass} />
                </div>

                {/* Video */}
                <div>
                    <label className={labelClass}>Video URL <span className="normal-case font-normal text-slate-600">(YouTube/Vimeo, optional)</span></label>
                    <input type="url" value={form.video_url} onChange={set('video_url')} placeholder="https://youtube.com/..." className={inputClass} />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                    <Link to="/dashboard/properties" className="flex-1 py-3 border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white font-semibold rounded-xl text-sm transition-all text-center">
                        Cancel
                    </Link>
                    <button
                        type="submit" disabled={saving || success}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#0033ab] hover:bg-[#002273] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
