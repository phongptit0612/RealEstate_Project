import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Building, PlusCircle, LogOut, MessageSquare, Heart, UserCircle, Crown, History, Bell, X, CheckCheck } from 'lucide-react';
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
        <div className="min-h-screen bg-black flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#051124] border-r border-white/10 flex-col hidden md:flex">
                <div className="p-6">
                    <Link to="/" className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 group">
                        <div className="group-hover:scale-110 transition-transform">
                            <img src="/logo.png" alt="LuxEstates" className="w-8 h-8 object-contain brightness-0 invert" />
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
                                    ? 'bg-brand-600/20 text-[#4d88ff] border border-brand-600/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
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

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-brand-600/30 flex items-center justify-center text-white font-bold uppercase border border-brand-600/50 shadow-md overflow-hidden">
                            {user?.avatar
                                ? <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} alt="" className="w-full h-full object-cover" />
                                : user?.name?.[0] || 'U'
                            }
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">{user?.name}</div>
                            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full text-left text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#020813]">
                {/* Top bar with notification bell */}
                <div className="sticky top-0 z-30 bg-[#020813]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-end px-8 py-3">
                    {/* Notification Bell */}
                    <div className="relative" ref={bellRef}>
                        <button
                            onClick={() => { setNotifOpen(o => !o); if (!notifOpen) fetchNotifications(); }}
                            className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            title={t('dashboard.notifications')}
                        >
                            <Bell className="w-4.5 h-4.5" />
                            {unreadNotifs > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                                </span>
                            )}
                        </button>

                        {/* Dropdown panel */}
                        {notifOpen && (
                            <div className="absolute right-0 top-12 w-80 bg-[#051124] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                    <span className="text-white font-bold text-sm">{t('dashboard.notifications')}</span>
                                    <div className="flex items-center gap-2">
                                        {unreadNotifs > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                className="flex items-center gap-1 text-xs text-[#4d88ff] hover:text-white transition-colors font-medium"
                                                title={t('dashboard.markAllRead')}
                                            >
                                                <CheckCheck className="w-3.5 h-3.5" /> {t('dashboard.markAllRead')}
                                            </button>
                                        )}
                                        <button onClick={() => setNotifOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                                    {notifs.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            {t('dashboard.noNotifs')}
                                        </div>
                                    ) : notifs.map(n => (
                                        <div
                                            key={n.notification_id}
                                            className={`flex gap-3 px-4 py-3 transition-colors ${n.is_read ? 'opacity-60' : 'bg-brand-600/5'}`}
                                        >
                                            <span className="text-lg flex-shrink-0 mt-0.5">
                                                {NOTIF_ICONS[n.type] || NOTIF_ICONS.default}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-xs font-semibold">{n.title}</div>
                                                <div className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.body}</div>
                                                <div className="text-gray-600 text-[10px] mt-1">{timeAgo(n.created_at)}</div>
                                            </div>
                                            {!n.is_read && (
                                                <div className="w-2 h-2 bg-[#4d88ff] rounded-full flex-shrink-0 mt-1" />
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
