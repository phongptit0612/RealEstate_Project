import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Building, PlusCircle, LogOut, MessageSquare, Heart, UserCircle, Crown } from 'lucide-react';
import useUserStore from '../store/userStore';
import { connectSocket, disconnectSocket } from '../lib/socket';
import axios from 'axios';

export default function DashboardLayout() {
    const { logout, user } = useUserStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = async () => {
        try {
            const r = await axios.get('http://localhost:5000/api/conversations/unread-count', { withCredentials: true });
            setUnreadCount(Number(r.data.count) || 0);
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!user?.id) return;

        // Connect socket — idempotent, safe to call multiple times
        const socket = connectSocket(user.id);

        // Fetch initial unread count
        fetchUnread();

        // Listen for new messages from any conversation
        const onNewMessage = (msg) => {
            if (msg.sender_id !== user.id) {
                setUnreadCount(c => c + 1);
            }
        };
        const onInboxUpdate = () => fetchUnread();
        const onMessagesRead = () => fetchUnread();

        socket.on('new_message', onNewMessage);
        socket.on('inbox_update', onInboxUpdate);
        socket.on('messages_read', onMessagesRead);

        // Do NOT disconnect on cleanup — socket must stay alive across re-renders.
        // Only disconnect on explicit logout (see handleLogout below).
        return () => {
            socket.off('new_message', onNewMessage);
            socket.off('inbox_update', onInboxUpdate);
            socket.off('messages_read', onMessagesRead);
        };
    }, [user?.id]); // Only re-run if user ID actually changes

    const handleLogout = async () => {
        disconnectSocket(); // Only place we hard-disconnect
        await logout();
        navigate('/login');
    };

    const menu = [
        { path: '/dashboard/properties',     icon: Building,      label: 'My Properties' },
        { path: '/dashboard/create',          icon: PlusCircle,    label: 'Create Listing' },
        { path: '/dashboard/favorites',       icon: Heart,         label: 'Saved' },
        { path: '/dashboard/inbox',           icon: MessageSquare, label: 'Inbox', badge: unreadCount },
        { path: '/dashboard/subscriptions',   icon: Crown,         label: 'VIP Boosts' },
        { path: '/dashboard/profile',         icon: UserCircle,    label: 'My Profile' },
    ];

    return (
        <div className="min-h-screen bg-black flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#051124] border-r border-white/10 flex-col hidden md:flex">
                <div className="p-6">
                    <Link to="/" className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 group">
                        <div className="group-hover:scale-110 transition-transform">
                            <img src="/logo.png" alt="LuxEstates" className="w-8 h-8 object-contain" />
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
                                    ? 'bg-[#0033ab]/20 text-[#4d88ff] border border-[#0033ab]/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="w-5 h-5 bg-[#0033ab] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-[#0033ab]/30 flex items-center justify-center text-white font-bold uppercase border border-[#0033ab]/50 shadow-md overflow-hidden">
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
                <div className="p-8 max-w-6xl mx-auto mt-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
