import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ListChecks, Users, Flag, FolderTree,
    ChevronRight, LogOut, Menu, X, ShieldCheck
} from 'lucide-react';
import useUserStore from '../../store/userStore';

const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/listings', label: 'Listings', icon: ListChecks },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: Flag },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
];

export default function AdminLayout() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const logout = useUserStore(s => s.logout);
    const user = useUserStore(s => s.user);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const isActive = (to, exact) => exact ? pathname === to : pathname.startsWith(to) && to !== '/admin';

    const Sidebar = () => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
                <div className="w-9 h-9 bg-[#0033ab] rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-bold text-slate-900 text-sm leading-none">LuxEstates</p>
                    <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map(({ to, label, icon: Icon, exact }) => {
                    const active = exact ? pathname === to : pathname.startsWith(to);
                    return (
                        <Link
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                active
                                    ? 'bg-[#0033ab] text-white shadow-md shadow-[#0033ab]/20'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-[#0033ab]/10 flex items-center justify-center text-[#0033ab] font-bold text-sm">
                        {user?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <Sidebar />
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative w-64 h-full bg-white shadow-2xl flex flex-col">
                        <button className="absolute top-4 right-4 p-1" onClick={() => setSidebarOpen(false)}>
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                        <Sidebar />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile topbar */}
                <div className="md:hidden flex items-center gap-4 px-4 py-4 bg-white border-b border-gray-200">
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-6 h-6 text-slate-600" />
                    </button>
                    <span className="font-bold text-slate-900">Admin Panel</span>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
