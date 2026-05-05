import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Lock, Unlock, Trash2, ShieldCheck } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);

    const fetchUsers = async (q = '') => {
        setLoading(true);
        try {
            const r = await axios.get(`http://localhost:5000/api/admin/users${q ? `?search=${q}` : ''}`, { withCredentials: true });
            setUsers(r.data.users);
            setTotal(r.data.total);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggle = async (id) => {
        await axios.patch(`http://localhost:5000/api/admin/users/${id}/toggle`, {}, { withCredentials: true });
        fetchUsers(search);
    };

    const remove = async (id) => {
        if (!window.confirm('Permanently delete this user and all their data?')) return;
        await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { withCredentials: true });
        fetchUsers(search);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(search);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Users</h1>
                    <p className="text-slate-500 mt-1">{total} registered accounts</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0033ab] bg-white shadow-sm"
                        />
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-[#0033ab] hover:bg-[#002273] text-white text-sm font-semibold rounded-xl transition-colors">
                        Search
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-slate-50">
                                <th className="text-left px-6 py-4 text-slate-500 font-semibold">User</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Phone</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Role</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Listings</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Status</th>
                                <th className="text-left px-4 py-4 text-slate-500 font-semibold">Joined</th>
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
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-16 text-slate-400">No users found.</td></tr>
                            ) : users.map(u => (
                                <tr key={u.user_id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#0033ab]/10 flex items-center justify-center text-[#0033ab] font-bold text-sm flex-shrink-0">
                                                {u.full_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{u.full_name || '—'}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{u.phone || '—'}</td>
                                    <td className="px-4 py-4">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${u.role === 'admin' ? 'bg-[#0033ab]/10 text-[#0033ab]' : 'bg-slate-100 text-slate-600'}`}>
                                            {u.role === 'admin' && <ShieldCheck className="w-3 h-3 inline mr-1" />}
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 font-semibold text-slate-700">{u.listing_count}</td>
                                    <td className="px-4 py-4">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-400 text-xs">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => toggle(u.user_id)} title={u.is_active ? 'Suspend' : 'Activate'}
                                                className={`p-2 rounded-lg transition-colors ${u.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                                {u.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => remove(u.user_id)} title="Delete user"
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
        </div>
    );
}
