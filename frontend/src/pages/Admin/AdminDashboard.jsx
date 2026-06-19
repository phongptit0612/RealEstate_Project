import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, ListChecks, Clock, Flag, TrendingUp, CheckCircle, UserPlus } from 'lucide-react';
import useLanguageStore from '../../store/languageStore';

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

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t, currentLang } = useLanguageStore();

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
                <h1 className="text-2xl font-bold text-slate-900">{t('admin.dashboard', 'Dashboard')}</h1>
                <p className="text-slate-500 mt-1">{t('admin.overview', 'Platform overview and key metrics')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={Users} label={t('admin.totalUsers', 'Total Users')} value={stats?.total_users} color="bg-brand-600" />
                <StatCard icon={ListChecks} label={t('admin.totalListings', 'Total Listings')} value={stats?.total_listings} color="bg-emerald-500" />
                <StatCard icon={Clock} label={t('admin.pendingApproval', 'Pending Approval')} value={stats?.pending_listings} color="bg-amber-500" />
                <StatCard icon={CheckCircle} label={t('admin.approvedListings', 'Approved Listings')} value={stats?.approved_listings} color="bg-sky-500" />
                <StatCard icon={Flag} label={t('admin.pendingReports', 'Pending Reports')} value={stats?.total_reports} color="bg-rose-500" />
                <StatCard icon={UserPlus} label={t('admin.newUsersToday', 'New Users Today')} value={stats?.new_users_today} color="bg-violet-500" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 7-day Listing Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-brand-600" />
                                <h2 className="font-bold text-slate-800">{t('admin.listingsCreated', 'Listings Created')}</h2>
                            </div>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">{t('admin.last7Days', 'Last 7 Days')}</span>
                        </div>
                        <div className="flex items-end gap-2 h-40 mt-auto">
                            {trend.map(({ day, count }) => {
                                const max = Math.max(...trend.map(item => item.count), 1);
                                const heightPct = Math.round((count / max) * 100);
                                return (
                                    <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                                        <span className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 px-2 py-0.5 rounded-md">
                                            {count}
                                        </span>
                                        <div className="w-full relative flex justify-center items-end flex-1 bg-slate-50 rounded-t-xl overflow-hidden">
                                            <div
                                                className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-xl transition-all duration-500 hover:brightness-110"
                                                style={{ height: `${Math.max(heightPct, 5)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                                            {new Date(day).toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' })}
                                        </span>
                                    </div>
                                );
                            })}
                            {trend.length === 0 && (
                                <div className="w-full flex items-center justify-center text-slate-400 text-sm pb-4">{t('admin.noListingsTrend', 'No listings in the last 7 days')}</div>
                            )}
                        </div>
                    </div>

                {/* 7-day User Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-violet-600" />
                                <h2 className="font-bold text-slate-800">{t('admin.newRegistrations', 'New User Registrations')}</h2>
                            </div>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">{t('admin.last7Days', 'Last 7 Days')}</span>
                        </div>
                        <div className="flex items-end gap-2 h-40 mt-auto">
                            {userTrend.map(({ day, count }) => {
                                const max = Math.max(...userTrend.map(item => item.count), 1);
                                const heightPct = Math.round((count / max) * 100);
                                return (
                                    <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                                        <span className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 px-2 py-0.5 rounded-md">
                                            {count}
                                        </span>
                                        <div className="w-full relative flex justify-center items-end flex-1 bg-slate-50 rounded-t-xl overflow-hidden">
                                            <div
                                                className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-xl transition-all duration-500 hover:brightness-110"
                                                style={{ height: `${Math.max(heightPct, 5)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                                            {new Date(day).toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' })}
                                        </span>
                                    </div>
                                );
                            })}
                            {userTrend.length === 0 && (
                                <div className="w-full flex items-center justify-center text-slate-400 text-sm pb-4">{t('admin.noUsersTrend', 'No users joined in the last 7 days')}</div>
                            )}
                        </div>
                    </div>
            </div>
        </div>
    );
}
