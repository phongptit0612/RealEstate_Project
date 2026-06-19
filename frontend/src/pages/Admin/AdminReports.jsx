import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Flag, CheckCircle, XCircle } from 'lucide-react';

const STATUS_TABS = [
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'reviewed', label: 'Đã xem xét' },
    { key: 'dismissed', label: 'Đã bỏ qua' },
];

const REASON_MAP = {
    spam: 'Spam hoặc trùng lặp',
    fraud: 'Lừa đảo',
    wrongInfo: 'Thông tin sai lệch',
    offensive: 'Nội dung phản cảm',
    other: 'Khác',
};

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('pending');
    const [total, setTotal] = useState(0);

    const fetchReports = async (status) => {
        setLoading(true);
        try {
            const r = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/reports?status=${status}`, { withCredentials: true });
            setReports(r.data.reports);
            setTotal(r.data.total);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(tab); }, [tab]);

    const updateStatus = async (id, status) => {
        await axios.patch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/reports/${id}`, { status }, { withCredentials: true });
        fetchReports(tab);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Báo cáo</h1>
                <p className="text-slate-500 mt-1">{total} báo cáo trong danh mục này</p>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {STATUS_TABS.map(({ key, label }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse border border-gray-100" />
                    ))
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <Flag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400">Không có báo cáo nào trong danh mục này.</p>
                    </div>
                ) : reports.map(r => (
                    <div key={r.report_id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full uppercase">
                                        {REASON_MAP[r.reason] || r.reason || 'Khác'}
                                    </span>
                                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <p className="font-semibold text-slate-800">Tin đăng: {r.property_title}</p>
                                <p className="text-sm text-slate-600">Người báo cáo: <span className="font-medium">{r.reporter_name}</span> — {r.reporter_email}</p>
                                {r.details && (
                                    <p className="text-sm text-slate-500 bg-surface rounded-lg px-3 py-2 mt-2 border border-slate-100">
                                        "{r.details}"
                                    </p>
                                )}
                            </div>
                            {tab === 'pending' && (
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => updateStatus(r.report_id, 'reviewed')}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors">
                                        <CheckCircle className="w-4 h-4" /> Đã xem xét
                                    </button>
                                    <button onClick={() => updateStatus(r.report_id, 'dismissed')}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                                        <XCircle className="w-4 h-4" /> Bỏ qua
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
