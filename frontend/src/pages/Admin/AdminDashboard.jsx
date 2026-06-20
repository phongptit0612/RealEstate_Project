import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, ListChecks, Clock, Flag, TrendingUp, CheckCircle, UserPlus } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        </div>
    </div>
);

const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/stats`, { withCredentials: true })
            .then(r => setStats(r.data))
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-24 animate-pulse border border-gray-100" />
            ))}
        </div>
    );

    const trend = stats?.trend || [];
    const userTrend = stats?.userTrend || [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển</h1>
                <p className="text-slate-500 mt-1">Tổng quan hệ thống và các chỉ số chính</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={Users} label="Tổng người dùng" value={stats?.total_users} color="bg-brand-600" />
                <StatCard icon={ListChecks} label="Tổng tin đăng" value={stats?.total_listings} color="bg-emerald-500" />
                <StatCard icon={Clock} label="Chờ phê duyệt" value={stats?.pending_listings} color="bg-amber-500" />
                <StatCard icon={CheckCircle} label="Tin đã duyệt" value={stats?.approved_listings} color="bg-sky-500" />
                <StatCard icon={Flag} label="Báo cáo chờ xử lý" value={stats?.total_reports} color="bg-rose-500" />
                <StatCard icon={UserPlus} label="Thành viên mới hôm nay" value={stats?.new_users_today} color="bg-violet-500" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 7-day Listing Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-brand-600" />
                            <h2 className="font-bold text-slate-800">Tin đăng mới tạo</h2>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">7 ngày qua</span>
                    </div>
                    {trend.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-slate-400 text-sm py-16 h-56">
                            Không có tin đăng nào trong 7 ngày qua
                        </div>
                    ) : (
                        (() => {
                            const maxListing = Math.max(...trend.map(item => item.count), 1);
                            const ticksListing = [maxListing, Math.round(maxListing * 0.66), Math.round(maxListing * 0.33), 0];
                            return (
                                <div className="flex items-stretch h-56 mt-auto">
                                    {/* Y-axis */}
                                    <div className="flex flex-col justify-between text-[10px] sm:text-xs text-slate-400 font-semibold pr-3 border-r border-slate-100 select-none pb-7 h-full w-8">
                                        {ticksListing.map((t, idx) => (
                                            <span key={idx} className="text-right h-4 flex items-center justify-end">{t}</span>
                                        ))}
                                    </div>
                                    {/* Chart area */}
                                    <div className="flex-grow h-full relative">
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pr-1">
                                            {[...Array(4)].map((_, idx) => (
                                                <div key={idx} className="border-t border-dashed border-slate-100 w-full h-0" />
                                            ))}
                                        </div>
                                        {/* Bars */}
                                        <div className="flex items-end gap-2.5 h-full relative z-10 pl-2">
                                            {trend.map(({ day, count }) => {
                                                const heightPct = Math.round((count / maxListing) * 100);
                                                return (
                                                    <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-[calc(100%-1.5rem)] mb-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-800 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-lg font-semibold flex flex-col items-center">
                                                            <span className="whitespace-nowrap">{new Date(day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                                                            <span className="text-brand-300 font-bold mt-0.5">{count} tin</span>
                                                        </div>
                                                        {/* Bar column */}
                                                        <div className="w-full bg-slate-50 hover:bg-slate-100/80 rounded-t-lg flex items-end flex-1 transition-all h-[calc(100%-1.75rem)] relative cursor-pointer overflow-hidden border border-transparent hover:border-slate-200/50">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg transition-all duration-500"
                                                                style={{ height: `${Math.max(heightPct, 3)}%` }}
                                                            />
                                                        </div>
                                                        {/* X Label */}
                                                        <span className="h-5 flex items-end text-[10px] sm:text-xs text-slate-400 font-semibold mt-1">
                                                            {WEEKDAYS_VI[new Date(day).getDay()]}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>

                {/* 7-day User Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-violet-600" />
                            <h2 className="font-bold text-slate-800">Người dùng đăng ký mới</h2>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">7 ngày qua</span>
                    </div>
                    {userTrend.length === 0 ? (
                        <div className="w-full flex items-center justify-center text-slate-400 text-sm py-16 h-56">
                            Không có thành viên mới trong 7 ngày qua
                        </div>
                    ) : (
                        (() => {
                            const maxUser = Math.max(...userTrend.map(item => item.count), 1);
                            const ticksUser = [maxUser, Math.round(maxUser * 0.66), Math.round(maxUser * 0.33), 0];
                            return (
                                <div className="flex items-stretch h-56 mt-auto">
                                    {/* Y-axis */}
                                    <div className="flex flex-col justify-between text-[10px] sm:text-xs text-slate-400 font-semibold pr-3 border-r border-slate-100 select-none pb-7 h-full w-8">
                                        {ticksUser.map((t, idx) => (
                                            <span key={idx} className="text-right h-4 flex items-center justify-end">{t}</span>
                                        ))}
                                    </div>
                                    {/* Chart area */}
                                    <div className="flex-grow h-full relative">
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7 pr-1">
                                            {[...Array(4)].map((_, idx) => (
                                                <div key={idx} className="border-t border-dashed border-slate-100 w-full h-0" />
                                            ))}
                                        </div>
                                        {/* Bars */}
                                        <div className="flex items-end gap-2.5 h-full relative z-10 pl-2">
                                            {userTrend.map(({ day, count }) => {
                                                const heightPct = Math.round((count / maxUser) * 100);
                                                return (
                                                    <div key={day} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-[calc(100%-1.5rem)] mb-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-800 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-lg font-semibold flex flex-col items-center">
                                                            <span className="whitespace-nowrap">{new Date(day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                                                            <span className="text-violet-300 font-bold mt-0.5">{count} người</span>
                                                        </div>
                                                        {/* Bar column */}
                                                        <div className="w-full bg-slate-50 hover:bg-slate-100/80 rounded-t-lg flex items-end flex-1 transition-all h-[calc(100%-1.75rem)] relative cursor-pointer overflow-hidden border border-transparent hover:border-slate-200/50">
                                                            <div
                                                                className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all duration-500"
                                                                style={{ height: `${Math.max(heightPct, 3)}%` }}
                                                            />
                                                        </div>
                                                        {/* X Label */}
                                                        <span className="h-5 flex items-end text-[10px] sm:text-xs text-slate-400 font-semibold mt-1">
                                                            {WEEKDAYS_VI[new Date(day).getDay()]}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
}
