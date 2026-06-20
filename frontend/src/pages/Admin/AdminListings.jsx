import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Trash2, Pencil, Save, X, Loader2, Eye, MapPin, Bed, Bath, Square, Compass, Video, Hash } from 'lucide-react';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];
const API = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

// Format price as VND (price_usd stored in DB is actually VND)
const formatVND = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
};

export default function AdminListings() {

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
        if (!window.confirm('Xóa vĩnh viễn tin đăng này?')) return;
        await axios.delete(`${API}/admin/listings/${id}`, { withCredentials: true });
        fetchListings(tab);
    };

    // ── Edit handlers ────────────────────────────────────────
    const openEdit = (listing) => {
        const priceDb = listing.price_usd || 0;
        setEditForm({
            title: listing.title,
            description: listing.description || '',
            price_usd: priceDb,
            listing_type: listing.listing_type || 'sale',
        });
        setLocalPriceInput(priceDb.toLocaleString('vi-VN'));
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
        setLocalPriceInput(num.toLocaleString('vi-VN'));
        setEditForm(f => ({ ...f, price_usd: num }));
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
        return <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[status] || 'bg-gray-100 text-gray-600'}`}>{({'pending':'Chờ duyệt','approved':'Đã duyệt','rejected':'Từ chối'})[status] || status}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tin đăng</h1>
                    <p className="text-slate-500 mt-1">{total} tin đăng</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {STATUS_TABS.map(tOption => (
                    <button
                        key={tOption}
                        onClick={() => setTab(tOption)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === tOption ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {({'all':'Tất cả','pending':'Chờ duyệt','approved':'Đã duyệt','rejected':'Từ chối'})[tOption] || tOption}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-surface">
                                <th className="text-left px-6 py-4 text-slate-500 font-semibold">Tiêu đề</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Chủ tin</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Giá (VNĐ)</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Loại BĐS</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Trạng thái</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Ngày đăng</th>
                                <th className="text-right px-6 py-4 text-slate-500 font-semibold">Thao tác</th>
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
                                        Không có tin đăng nào trong danh mục này.
                                    </td>
                                </tr>
                            ) : listings.map(l => (
                                <tr key={l.property_id} className="border-b border-gray-50 hover:bg-surface transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">{l.title}</p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.listing_type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {l.listing_type === 'sale' ? 'Bán' : 'Cho thuê'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-slate-700">{l.owner_name}</p>
                                        <p className="text-xs text-slate-400">{l.owner_email}</p>
                                    </td>
                                    <td className="px-4 py-4 font-semibold text-slate-800">
                                        {formatVND(l.price_usd)}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{l.type_name}</td>
                                    <td className="px-4 py-4">{statusBadge(l.mod_status)}</td>
                                    <td className="px-4 py-4 text-slate-400 text-xs">
                                        {new Date(l.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            {/* View */}
                                            <button onClick={() => openView(l.property_id)} title={t('admin.viewDetails', 'View Details')}
                                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {/* Edit */}
                                            <button onClick={() => openEdit(l)} title={t('admin.editTitle', 'Edit Listing')}
                                                className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {l.mod_status !== 'approved' && (
                                                <button onClick={() => approve(l.property_id)} title={t('common.approved', 'Approve')}
                                                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {l.mod_status !== 'rejected' && (
                                                <button onClick={() => setRejectModal({ id: l.property_id, title: l.title })} title={t('admin.rejectTitle', 'Reject')}
                                                    className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => remove(l.property_id)} title={t('common.delete', 'Delete')}
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
                            <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa tin đăng</h2>
                            <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tiêu đề</label>
                                <input
                                    value={editForm.title}
                                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Mô tả</label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Giá (VNĐ)</label>
                                    <input
                                        type="text"
                                        value={localPriceInput}
                                        onChange={handlePriceChange}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Loại tin</label>
                                    <select
                                        value={editForm.listing_type}
                                        onChange={e => setEditForm(f => ({ ...f, listing_type: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                                    >
                                        <option value="sale">Bán</option>
                                        <option value="rent">Cho thuê</option>
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
                                Hủy
                            </button>
                            <button onClick={saveEdit} disabled={editSaving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                                {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Save className="w-4 h-4" /> Lưu thay đổi</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Modal ── */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Từ chối tin đăng</h2>
                        <p className="text-sm text-slate-500 mb-4">"{rejectModal.title}"</p>
                        <textarea
                            rows={4}
                            placeholder="Lý do từ chối (sẽ được gửi đến chủ tin)..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-semibold hover:bg-surface">
                                Hủy
                            </button>
                            <button onClick={reject}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">
                                Xác nhận từ chối
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
                            <h2 className="text-xl font-bold text-slate-900">Chi tiết tin đăng</h2>
                            <button onClick={() => { setViewModal(null); setViewData(null); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {viewLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
                                <p className="text-slate-500">Đang tải...</p>
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
                                            {viewData.mod_status === 'approved' ? 'Đã duyệt' : viewData.mod_status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                                            viewData.listing_status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {({'active':'Đang hoạt động','negotiating':'Đang thương lượng','deposited':'Đã đặt cọc','sold':'Đã bán','rented':'Đã cho thuê','hidden':'Ẩn'})[viewData.listing_status] || viewData.listing_status}
                                        </span>
                                    </div>
                                    <p className="flex items-center gap-1.5 text-slate-500 mt-2 text-sm">
                                        <MapPin className="w-4 h-4" /> {viewData.address}, {viewData.district_name}, {viewData.city_name}
                                    </p>
                                </div>
                                
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Giá</div>
                                        <div className="text-lg font-bold text-brand-600">{formatVND(viewData.price_usd)}</div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Loại tin</div>
                                        <div className="text-lg font-bold text-slate-800">{viewData.listing_type === 'sale' ? 'Bán' : 'Cho thuê'}</div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Phòng ngủ</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Bed className="w-4 h-4 text-slate-400" /> {viewData.bedrooms || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Phòng tắm</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Bath className="w-4 h-4 text-slate-400" /> {viewData.bathrooms || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Diện tích</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Square className="w-4 h-4 text-slate-400" /> {viewData.area_m2 || '—'} m²
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Hướng</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800 capitalize">
                                            <Compass className="w-4 h-4 text-slate-400" /> {({'north':'Bắc','south':'Nam','east':'Đông','west':'Tây','northeast':'Đông Bắc','northwest':'Tây Bắc','southeast':'Đông Nam','southwest':'Tây Nam'})[viewData.direction] || viewData.direction || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Mã bưu chính</div>
                                        <div className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
                                            <Hash className="w-4 h-4 text-slate-400" /> {viewData.zipcode || '—'}
                                        </div>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                        <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">Video</div>
                                        {viewData.video_url ? (
                                            <a href={viewData.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline">
                                                <Video className="w-4 h-4" /> Xem video
                                            </a>
                                        ) : (
                                            <div className="text-sm text-slate-500">—</div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Description */}
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Mô tả</h4>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{viewData.description || 'Chưa có mô tả.'}</p>
                                </div>
                                
                                {/* Features */}
                                {viewData.features && viewData.features.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">Tiện ích</h4>
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
                                        <h4 className="font-bold text-slate-900 mb-2">Hình ảnh ({viewData.images.length})</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {viewData.images.map((img, i) => (
                                                <img key={i} src={img.image_url.startsWith('http') ? img.image_url : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`} alt="Property" className="w-full h-24 object-cover rounded-lg" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Seller Info */}
                                <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                                    <h4 className="font-bold text-slate-900 mb-1">Thông tin chủ tin</h4>
                                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Tên:</span> {viewData.seller_name}</p>
                                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Email:</span> {viewData.seller_email}</p>
                                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Điện thoại:</span> {viewData.seller_phone || '—'}</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
