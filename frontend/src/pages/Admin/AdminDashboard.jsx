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

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:5000/api/admin/stats', { withCredentials: true })
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">Platform overview and key metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="bg-brand-600" />
                <StatCard icon={ListChecks} label="Total Listings" value={stats?.total_listings} color="bg-emerald-500" />
                <StatCard icon={Clock} label="Pending Approval" value={stats?.pending_listings} color="bg-amber-500" />
                <StatCard icon={CheckCircle} label="Approved Listings" value={stats?.approved_listings} color="bg-sky-500" />
                <StatCard icon={Flag} label="Pending Reports" value={stats?.total_reports} color="bg-rose-500" />
                <StatCard icon={UserPlus} label="New Users Today" value={stats?.new_users_today} color="bg-violet-500" />
            </div>

            {/* 7-day Trend */}
            {stats?.trend?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-brand-600" />
                        <h2 className="font-bold text-slate-800">Listings Created — Last 7 Days</h2>
                    </div>
                    <div className="flex items-end gap-3 h-28">
                        {stats.trend.map(({ day, count }) => {
                            const max = Math.max(...stats.trend.map(t => t.count), 1);
                            const heightPct = Math.round((count / max) * 100);
                            return (
                                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-slate-500 font-semibold">{count}</span>
                                    <div
                                        className="w-full bg-brand-600 rounded-t-lg transition-all"
                                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                                    />
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(day).toLocaleDateString('en', { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
