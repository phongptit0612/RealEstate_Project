import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Trash2, Search, Filter } from 'lucide-react';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

export default function AdminListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [total, setTotal] = useState(0);
    const [rejectModal, setRejectModal] = useState(null); // { id, title }
    const [rejectReason, setRejectReason] = useState('');

    const fetch = async (status) => {
        setLoading(true);
        try {
            const params = status !== 'all' ? `?status=${status}` : '';
            const r = await axios.get(`http://localhost:5000/api/admin/listings${params}`, { withCredentials: true });
            setListings(r.data.listings);
            setTotal(r.data.total);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(tab); }, [tab]);

    const approve = async (id) => {
        await axios.patch(`http://localhost:5000/api/admin/listings/${id}/approve`, {}, { withCredentials: true });
        fetch(tab);
    };

    const reject = async () => {
        await axios.patch(`http://localhost:5000/api/admin/listings/${rejectModal.id}/reject`, { reason: rejectReason }, { withCredentials: true });
        setRejectModal(null);
        setRejectReason('');
        fetch(tab);
    };

    const remove = async (id) => {
        if (!window.confirm('Permanently delete this listing?')) return;
        await axios.delete(`http://localhost:5000/api/admin/listings/${id}`, { withCredentials: true });
        fetch(tab);
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
                        className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white shadow text-[#0033ab]' : 'text-slate-500 hover:text-slate-700'}`}
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
                            <tr className="border-b border-gray-100 bg-slate-50">
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
                                <tr key={l.property_id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">{l.title}</p>
                                        <p className="text-xs text-slate-400 capitalize">{l.listing_type}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-slate-700">{l.owner_name}</p>
                                        <p className="text-xs text-slate-400">{l.owner_email}</p>
                                    </td>
                                    <td className="px-4 py-4 font-semibold text-slate-800">
                                        ${Number(l.price_usd).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{l.type_name}</td>
                                    <td className="px-4 py-4">{statusBadge(l.mod_status)}</td>
                                    <td className="px-4 py-4 text-slate-400 text-xs">
                                        {new Date(l.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 justify-end">
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

            {/* Reject Modal */}
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
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#0033ab] resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
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
        </div>
    );
}
