import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Building, PlusCircle, LogOut, MessageSquare, Heart, UserCircle, Crown, History, Bell, X, CheckCheck, ArrowLeft } from 'lucide-react';
import useUserStore from '../store/userStore';
import useLanguageStore from '../store/languageStore';
import { connectSocket, disconnectSocket } from '../lib/socket';
import axios from 'axios';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const NOTIF_ICONS = {
    listing_approved: '✅',
    listing_rejected: '❌',
    message: '💬',
    default: '🔔',
};

export default function DashboardLayout() {
    const { logout, user } = useUserStore();
    const { t } = useLanguageStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    // ── Notifications ──────────────────────────────────────────
    const [notifs, setNotifs] = useState([]);
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const bellRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const r = await axios.get('http://localhost:5000/api/notifications', { withCredentials: true });
            setNotifs(r.data.notifications || []);
            setUnreadNotifs(Number(r.data.unread_count) || 0);
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await axios.patch('http://localhost:5000/api/notifications/read-all', {}, { withCredentials: true });
            setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadNotifs(0);
        } catch { /* silent */ }
    };

    // Close notification panel when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Chat unread count ──────────────────────────────────────
    const fetchUnread = async () => {
        try {
            const r = await axios.get('http://localhost:5000/api/conversations/unread-count', { withCredentials: true });
            setUnreadCount(Number(r.data.count) || 0);
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!user?.id) return;

        const socket = connectSocket(user.id);

        fetchUnread();
        fetchNotifications();

        const onNewMessage = (msg) => {
            if (msg.sender_id !== user.id) setUnreadCount(c => c + 1);
        };
        const onInboxUpdate = () => fetchUnread();
        const onMessagesRead = () => fetchUnread();

        socket.on('new_message', onNewMessage);
        socket.on('inbox_update', onInboxUpdate);
        socket.on('messages_read', onMessagesRead);

        return () => {
            socket.off('new_message', onNewMessage);
            socket.off('inbox_update', onInboxUpdate);
            socket.off('messages_read', onMessagesRead);
        };
    }, [user?.id]);

    const handleLogout = async () => {
        disconnectSocket();
        await logout();
        navigate('/login');
    };

    const menu = [
        { path: '/dashboard/properties',     icon: Building,      label: t('dashboard.myProperties') },
        { path: '/dashboard/create',          icon: PlusCircle,    label: t('dashboard.createListing') },
        { path: '/dashboard/favorites',       icon: Heart,         label: t('dashboard.saved') },
        { path: '/dashboard/inbox',           icon: MessageSquare, label: t('dashboard.inbox'), badge: unreadCount },
        { path: '/dashboard/subscriptions',   icon: Crown,         label: t('dashboard.vipBoosts') },
        { path: '/dashboard/activity',        icon: History,       label: t('dashboard.activity') },
        { path: '/dashboard/profile',         icon: UserCircle,    label: t('dashboard.myProfile') },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden md:flex">
                <div className="p-6">
                    <Link to="/" className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 group">
                        <div className="group-hover:scale-110 transition-transform">
                            <img src="/logo.png" alt="LuxEstates" className="w-8 h-8 object-contain invert" />
                        </div>
                        LuxEstates
                    </Link>
                </div>

                <div className="px-4 py-6 flex-1 space-y-2">
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                    ? 'bg-brand-50 text-brand-700 border border-brand-100 shadow-sm'
                                    : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50 border border-transparent'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold uppercase border border-brand-200 shadow-sm overflow-hidden">
                            {user?.avatar
                                ? <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} alt="" className="w-full h-full object-cover" />
                                : user?.name?.[0] || 'U'
                            }
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">{user?.name}</div>
                            <div className="text-xs text-slate-500 font-medium capitalize">{user?.role}</div>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-2 w-full text-left text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all font-medium mb-1"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Main Site
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full text-left text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
                {/* Top bar with notification bell */}
                <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-end px-8 py-3">
                    {/* Notification Bell */}
                    <div className="relative" ref={bellRef}>
                        <button
                            onClick={() => { setNotifOpen(o => !o); if (!notifOpen) fetchNotifications(); }}
                            className="relative w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-gray-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-brand-600 transition-all"
                            title={t('dashboard.notifications')}
                        >
                            <Bell className="w-4.5 h-4.5" />
                            {unreadNotifs > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                                </span>
                            )}
                        </button>

                        {/* Dropdown panel */}
                        {notifOpen && (
                            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50">
                                    <span className="text-slate-900 font-bold text-sm">{t('dashboard.notifications')}</span>
                                    <div className="flex items-center gap-2">
                                        {unreadNotifs > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors font-semibold"
                                                title={t('dashboard.markAllRead')}
                                            >
                                                <CheckCheck className="w-3.5 h-3.5" /> {t('dashboard.markAllRead')}
                                            </button>
                                        )}
                                        <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                    {notifs.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            {t('dashboard.noNotifs')}
                                        </div>
                                    ) : notifs.map(n => (
                                        <div
                                            key={n.notification_id}
                                            className={`flex gap-3 px-4 py-3 transition-colors ${n.is_read ? 'opacity-60 bg-white' : 'bg-brand-50'}`}
                                        >
                                            <span className="text-lg flex-shrink-0 mt-0.5">
                                                {NOTIF_ICONS[n.type] || NOTIF_ICONS.default}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-slate-900 text-xs font-bold">{n.title}</div>
                                                <div className="text-slate-600 text-xs mt-0.5 line-clamp-2">{n.body}</div>
                                                <div className="text-slate-400 text-[10px] mt-1 font-medium">{timeAgo(n.created_at)}</div>
                                            </div>
                                            {!n.is_read && (
                                                <div className="w-2 h-2 bg-brand-600 rounded-full flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 w-full max-w-[1600px] mx-auto mt-2">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
