import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Trash2, Pencil, Save, X, Loader2, Eye, MapPin, Bed, Bath, Square, Compass, Video, Hash } from 'lucide-react';
import useCurrencyStore from '../../store/currencyStore';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];
const API = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

export default function AdminListings() {
    const { formatPrice, preferredCurrency } = useCurrencyStore();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [total, setTotal] = useState(0);
    const [rejectModal, setRejectModal] = useState(null); // { id, title }
    const [rejectReason, setRejectReason] = useState('');
    const [editModal, setEditModal] = useState(null);     // full listing object
    const [editForm, setEditForm] = useState({});
    const [localPriceInput, setLocalPriceInput] = useState('');
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState('');
    
    // View Modal
    const [viewModal, setViewModal] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const fetchListings = async (status) => {
        setLoading(true);
        try {
            const params = status !== 'all' ? `?status=${status}` : '';
            const r = await axios.get(`${API}/admin/listings${params}`, { withCredentials: true });
            setListings(r.data.listings);
            setTotal(r.data.total);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchListings(tab); }, [tab]);

    const approve = async (id) => {
        await axios.patch(`${API}/admin/listings/${id}/approve`, {}, { withCredentials: true });
        fetchListings(tab);
    };

    const reject = async () => {
        await axios.patch(`${API}/admin/listings/${rejectModal.id}/reject`, { reason: rejectReason }, { withCredentials: true });
        setRejectModal(null);
        setRejectReason('');
        fetchListings(tab);
    };

    const remove = async (id) => {
        if (!window.confirm('Permanently delete this listing?')) return;
        await axios.delete(`${API}/admin/listings/${id}`, { withCredentials: true });
        fetchListings(tab);
    };

    // ── Edit handlers ────────────────────────────────────────
    const openEdit = (listing) => {
        const priceDb = listing.price_usd || 0;
        const uiPrice = preferredCurrency === 'USD' ? (priceDb / 25400) : priceDb;
        setEditForm({
            title: listing.title,
            description: listing.description || '',
            price_usd: priceDb,
            listing_type: listing.listing_type || 'sale',
        });
        setLocalPriceInput(preferredCurrency === 'VND' 
            ? uiPrice.toLocaleString('vi-VN') 
            : uiPrice.toLocaleString('en-US'));
        setEditError('');
        setEditModal(listing);
    };

    const handlePriceChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        if (!rawValue) {
            setLocalPriceInput('');
            setEditForm(f => ({ ...f, price_usd: '' }));
            return;
        }
        const num = parseInt(rawValue, 10);
        const formatted = preferredCurrency === 'VND' 
            ? num.toLocaleString('vi-VN') 
            : num.toLocaleString('en-US');
        setLocalPriceInput(formatted);
        const rate = preferredCurrency === 'USD' ? 25400 : 1;
        setEditForm(f => ({ ...f, price_usd: num * rate }));
    };

    const saveEdit = async () => {
        setEditSaving(true);
        setEditError('');
        try {
            await axios.patch(`${API}/admin/listings/${editModal.property_id}`, {
                ...editForm,
                price_usd: parseFloat(editForm.price_usd)
            }, { withCredentials: true });
            setEditModal(null);
            fetchListings(tab);
        } catch (err) {
            setEditError(err.response?.data?.error || 'Failed to save');
        }
        setEditSaving(false);
    };

    const openView = async (id) => {
        setViewModal(id);
        setViewLoading(true);
        try {
            const r = await axios.get(`${API}/admin/listings/${id}`, { withCredentials: true });
            setViewData(r.data);
        } catch (e) {
            console.error('Failed to load full listing', e);
        } finally {
            setViewLoading(false);
        }
    };

    const statusBadge = (status) => {
        const map = {
            pending:  'bg-amber-100 text-amber-700',
            approved: 'bg-emerald-100 text-emerald-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
                    <p className="text-slate-500 mt-1">{total} total listings</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {STATUS_TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-surface">
                                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Title</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Owner</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Price</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Type</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Status</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Date</th>
                                <th className="text-right px-6 py-4 text-slate-500 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : listings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-400">
                                        No listings found in this category.
                                    </td>
                                </tr>
                            ) : listings.map(l => (
                                <tr key={l.property_id} className="border-b border-gray-50 hover:bg-surface transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">{l.title}</p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.listing_type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {l.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-slate-700">{l.owner_name}</p>
                                        <p className="text-xs text-slate-400">{l.owner_email}</p>
                                    </td>
                                    <td className="px-4 py-4 font-semibold text-slate-800">
                                        {formatPrice(l.price_usd)}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{l.type_name}</td>
                                    <td className="px-4 py-4">{statusBadge(l.mod_status)}</td>
                                    <td className="px-4 py-4 text-slate-400 text-xs">
                                        {new Date(l.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            {/* View */}
                                            <button onClick={() => openView(l.property_id)} title="View full details"
                                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {/* Edit */}
                                            <button onClick={() => openEdit(l)} title="Edit content"
                                                className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {l.mod_status !== 'approved' && (
                                                <button onClick={() => approve(l.property_id)} title="Approve"
                                                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {l.mod_status !== 'rejected' && (
                                                <button onClick={() => setRejectModal({ id: l.property_id, title: l.title })} title="Reject"
                                                    className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => remove(l.property_id)} title="Delete"
                                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Edit Modal ── */}
            {editModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-900">Edit Listing</h2>
                            <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Title</label>
                                <input
                                    value={editForm.title}
                                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Price ({preferredCurrency})</label>
                                    <input
                                        type="text"
                                        value={localPriceInput}
                                        onChange={handlePriceChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Listing Type</label>
                                    <select
                                        value={editForm.listing_type}
                                        onChange={e => setEditForm(f => ({ ...f, listing_type: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                                    >
                                        <option value="sale">For Sale</option>
                                        <option value="rent">For Rent</option>
                                    </select>
                                </div>
                            </div>

                            {editError && (
                                <p className="text-red-500 text-sm">{editError}</p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setEditModal(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-semibold hover:bg-surface">
                                Cancel
                            </button>
                            <button onClick={saveEdit} disabled={editSaving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                                {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Modal ── */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Reject Listing</h2>
                        <p className="text-sm text-slate-500 mb-4">"{rejectModal.title}"</p>
                        <textarea
                            rows={4}
                            placeholder="Reason for rejection (will be sent to the owner)..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-semibold hover:bg-surface">
                                Cancel
                            </button>
                            <button onClick={reject}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── View Modal ── */}
            {viewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-slate-900">Listing Details</h2>
                            <button onClick={() => { setViewModal(null); setViewData(null); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {viewLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
                                <p className="text-slate-500">Loading details...</p>
                            </div>
                        ) : viewData ? (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-2xl font-bold text-slate-900">{viewData.title}</h3>
                                        {/* Status Badges */}
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                                            viewData.mod_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            viewData.mod_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {viewData.mod_status}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                                            viewData.listing_status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {viewData.listing_status}
                                        </span>
                                    </div>
                                    <p className="flex items-center gap-1.5 text-slate-500 mt-2 text-sm">
                                        <MapPin className="w-4 h-4" /> {viewData.address}, {viewData.district_name}, {viewData.city_name}
                                    </p>
                                </div>
                                
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Price</div>
                                        <div className="text-lg font-bold text-brand-600">{formatPrice(viewData.price_usd)}</div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Type</div>
                                        <div className="text-lg font-bold text-slate-800 capitalize">{viewData.listing_type}</div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Bedrooms</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Bed className="w-4 h-4 text-slate-400" /> {viewData.bedrooms || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Bathrooms</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Bath className="w-4 h-4 text-slate-400" /> {viewData.bathrooms || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Area</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Square className="w-4 h-4 text-slate-400" /> {viewData.area_m2 || '—'} m²
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Direction</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800 capitalize">
                                            <Compass className="w-4 h-4 text-slate-400" /> {viewData.direction || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Zipcode</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Hash className="w-4 h-4 text-slate-400" /> {viewData.zipcode || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Video URL</div>
                                        {viewData.video_url ? (
                                            <a href={viewData.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline">
                                                <Video className="w-4 h-4" /> View Video
                                            </a>
                                        ) : (
                                            <div className="text-sm text-slate-500">—</div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Description */}
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Description</h4>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{viewData.description || 'No description provided.'}</p>
                                </div>
                                
                                {/* Features */}
                                {viewData.features && viewData.features.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">Features</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {viewData.features.map(f => (
                                                <span key={f.feature_id} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                    {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Images */}
                                {viewData.images && viewData.images.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">Images ({viewData.images.length})</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {viewData.images.map((img, i) => (
                                                <img key={i} src={img.image_url.startsWith('http') ? img.image_url : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`} alt="Property" className="w-full h-24 object-cover rounded-lg" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Seller Info */}
                                <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                                    <h4 className="font-bold text-slate-900 mb-1">Seller Information</h4>
                                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Name:</span> {viewData.seller_name}</p>
                                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Email:</span> {viewData.seller_email}</p>
                                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Phone:</span> {viewData.seller_phone || '—'}</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
