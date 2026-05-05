import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Send, MessageSquare, Search, Home,
    Loader2, ChevronLeft, CheckCheck
} from 'lucide-react';
import useUserStore from '../../store/userStore';
import { connectSocket } from '../../lib/socket';

const API = 'http://localhost:5000/api';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(dateStr).toLocaleDateString();
}

function Avatar({ name, src, size = 10, online }) {
    return (
        <div className="relative flex-shrink-0">
            <div className={`w-${size} h-${size} rounded-full bg-brand-600/10 overflow-hidden flex items-center justify-center text-brand-600 font-bold`}>
                {src
                    ? <img src={src.startsWith('http') ? src : `http://localhost:5000${src}`} alt="" className="w-full h-full object-cover" />
                    : <span className={size >= 10 ? 'text-base' : 'text-sm'}>{name?.[0]?.toUpperCase() || '?'}</span>
                }
            </div>
            {online !== undefined && (
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            )}
        </div>
    );
}

export default function Inbox() {
    const { user } = useUserStore();
    const location = useLocation();

    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState({});
    const [mobileView, setMobileView] = useState('list');
    const [search, setSearch] = useState('');

    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);
    const socketRef = useRef(null);
    const activeConvRef = useRef(null); // tracks current conv without stale closure

    const scrollBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollBottom(); }, [messages]);

    // ── Load conversations ──────────────────────────────────
    const loadConversations = useCallback(async () => {
        try {
            const r = await axios.get(`${API}/conversations`, { withCredentials: true });
            setConversations(r.data);
        } catch (e) { console.error(e); }
        finally { setLoadingConvs(false); }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // ── Socket setup ────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        // Reuse the singleton socket already connected from DashboardLayout
        const socket = connectSocket(user.id);
        socketRef.current = socket;

        const onOnlineList = (userIds) => setOnlineUsers(new Set(userIds.map(Number)));

        const onNewMessage = (msg) => {
            // Update chat view only for the currently open conversation
            if (activeConvRef.current?.conversation_id === msg.conversation_id) {
                setMessages(prev => {
                    // Replace matching optimistic message (same body + sender) with real one
                    const optIdx = prev.findIndex(
                        m => String(m.message_id).startsWith('opt_') &&
                             m.body === msg.body &&
                             m.sender_id === msg.sender_id
                    );
                    if (optIdx !== -1) {
                        const next = [...prev];
                        next[optIdx] = { ...msg };
                        return next;
                    }
                    // Exact dedup
                    if (prev.some(m => m.message_id === msg.message_id)) return prev;
                    return [...prev, msg];
                });
            }
            // Always update conversation list preview
            setConversations(prev => prev.map(c =>
                c.conversation_id === msg.conversation_id
                    ? {
                        ...c,
                        last_message: msg.body,
                        last_message_at: msg.sent_at,
                        unread_count:
                            msg.sender_id !== user.id &&
                            activeConvRef.current?.conversation_id !== msg.conversation_id
                                ? (c.unread_count || 0) + 1
                                : 0,
                    }
                    : c
            ));
        };

        const onInboxUpdate = () => loadConversations();

        const onUserOnline = ({ userId, online }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                online ? next.add(Number(userId)) : next.delete(Number(userId));
                return next;
            });
        };

        const onUserTyping = ({ userId, isTyping }) =>
            setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));

        const onMessagesRead = ({ conversation_id }) =>
            setMessages(prev => prev.map(m =>
                m.conversation_id === conversation_id ? { ...m, is_read: 1 } : m
            ));

        socket.on('online_list', onOnlineList);
        socket.on('new_message', onNewMessage);
        socket.on('inbox_update', onInboxUpdate);
        socket.on('user_online', onUserOnline);
        socket.on('user_typing', onUserTyping);
        socket.on('messages_read', onMessagesRead);

        // Remove only OUR listeners on unmount — do NOT disconnect the socket
        return () => {
            socket.off('online_list', onOnlineList);
            socket.off('new_message', onNewMessage);
            socket.off('inbox_update', onInboxUpdate);
            socket.off('user_online', onUserOnline);
            socket.off('user_typing', onUserTyping);
            socket.off('messages_read', onMessagesRead);
        };
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handle navigation from Property Detail ──────────────
    useEffect(() => {
        const state = location.state?.startConversation;
        if (!state || !user || conversations.length === 0) return;
        const existing = conversations.find(c =>
            (c.seller_id === state.sellerId || c.buyer_id === state.sellerId) &&
            (c.property_id === state.propertyId || !state.propertyId)
        );
        if (existing) openConversation(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, conversations]);

    // ── Open a conversation ─────────────────────────────────
    const openConversation = async (conv) => {
        if (activeConvRef.current?.conversation_id === conv.conversation_id) return;

        if (activeConvRef.current) {
            socketRef.current?.emit('leave_conversation', activeConvRef.current.conversation_id);
        }

        activeConvRef.current = conv;
        setActiveConv(conv);
        setMessages([]);
        setLoadingMsgs(true);
        setMobileView('chat');

        socketRef.current?.emit('join_conversation', conv.conversation_id);

        try {
            const r = await axios.get(`${API}/conversations/${conv.conversation_id}/messages`, { withCredentials: true });
            setMessages(r.data);
            socketRef.current?.emit('mark_read', { conversation_id: conv.conversation_id });
            setConversations(prev => prev.map(c =>
                c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
            ));
        } catch (e) { console.error(e); }
        finally { setLoadingMsgs(false); }
    };

    // ── Send message ────────────────────────────────────────
    const sendMessage = (e) => {
        e.preventDefault();
        const body = input.trim();
        if (!body || !activeConv || sending) return;

        const other = activeConv.buyer_id === user.id ? activeConv.seller_id : activeConv.buyer_id;

        // Optimistic insert BEFORE emitting
        const optimisticId = `opt_${Date.now()}`;
        const optimistic = {
            message_id: optimisticId,
            conversation_id: activeConv.conversation_id,
            sender_id: user.id,
            body,
            type: 'text',
            is_read: 0,
            sent_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setInput('');

        socketRef.current?.emit('send_message', {
            conversation_id: activeConv.conversation_id,
            receiver_id: other,
            body,
        });

        clearTimeout(typingTimeout.current);
        socketRef.current?.emit('typing', { conversation_id: activeConv.conversation_id, isTyping: false });
    };

    const handleTyping = (e) => {
        setInput(e.target.value);
        if (!activeConv) return;
        socketRef.current?.emit('typing', { conversation_id: activeConv.conversation_id, isTyping: true });
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socketRef.current?.emit('typing', { conversation_id: activeConv.conversation_id, isTyping: false });
        }, 1500);
    };

    const getOther = (conv) => {
        if (!conv || !user) return {};
        return conv.buyer_id === user.id
            ? { id: conv.seller_id, name: conv.seller_name, avatar: conv.seller_avatar }
            : { id: conv.buyer_id, name: conv.buyer_name, avatar: conv.buyer_avatar };
    };

    const filteredConvs = conversations.filter(c => {
        const other = getOther(c);
        return (other.name || '').toLowerCase().includes(search.toLowerCase())
            || (c.property_title || '').toLowerCase().includes(search.toLowerCase());
    });

    const currentOther = activeConv ? getOther(activeConv) : null;
    const isOtherTyping = currentOther && typingUsers[currentOther.id];

    return (
        <div className="h-[calc(100vh-10rem)] flex bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* ── LEFT: Conversation List ── */}
            <aside className={`w-full md:w-80 border-r border-gray-100 flex flex-col flex-shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-brand-600" /> Inbox
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-3 py-2 bg-surface border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConvs ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 border-b border-gray-50">
                                <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                                    <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : filteredConvs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
                            <MessageSquare className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-slate-400 text-sm">No conversations yet.</p>
                            <p className="text-slate-300 text-xs mt-1">Contact a seller from any listing.</p>
                        </div>
                    ) : filteredConvs.map(conv => {
                        const other = getOther(conv);
                        const isActive = activeConv?.conversation_id === conv.conversation_id;
                        const isOnline = onlineUsers.has(Number(other.id));
                        return (
                            <button
                                key={conv.conversation_id}
                                onClick={() => openConversation(conv)}
                                className={`w-full text-left flex items-center gap-3 p-4 border-b border-gray-50 transition-colors ${isActive ? 'bg-brand-600/5' : 'hover:bg-surface'}`}
                            >
                                <Avatar name={other.name} src={other.avatar} size={10} online={isOnline} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-brand-600' : 'text-slate-800'}`}>{other.name}</p>
                                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
                                    </div>
                                    {conv.property_title && (
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                                            <Home className="w-3 h-3" /> {conv.property_title}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500 truncate">{conv.last_message || 'Start the conversation'}</p>
                                </div>
                                {conv.unread_count > 0 && (
                                    <span className="flex-shrink-0 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── RIGHT: Chat Panel ── */}
            <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
                {!activeConv ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-bold text-slate-700 mb-1">Select a Conversation</h3>
                        <p className="text-sm text-slate-400">Choose a conversation from the left to start chatting.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                            <button onClick={() => setMobileView('list')} className="md:hidden p-1 text-slate-500 hover:text-slate-800">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <Avatar name={currentOther?.name} src={currentOther?.avatar} size={10} online={onlineUsers.has(Number(currentOther?.id))} />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm">{currentOther?.name}</p>
                                <p className="text-xs text-slate-400">
                                    {isOtherTyping ? (
                                        <span className="text-brand-600 font-medium animate-pulse">typing...</span>
                                    ) : onlineUsers.has(Number(currentOther?.id)) ? (
                                        <span className="text-emerald-500">● Online</span>
                                    ) : 'Offline'}
                                </p>
                            </div>
                            {activeConv.property_title && (
                                <div className="hidden sm:flex items-center gap-1.5 bg-surface border border-gray-200 px-3 py-1.5 rounded-xl">
                                    <Home className="w-3.5 h-3.5 text-brand-600" />
                                    <span className="text-xs text-slate-600 font-medium max-w-[140px] truncate">{activeConv.property_title}</span>
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {loadingMsgs ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <MessageSquare className="w-10 h-10 text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm">No messages yet. Say hello! 👋</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => {
                                        const isMine = Number(msg.sender_id) === Number(user.id);
                                        const isOptimistic = String(msg.message_id).startsWith('opt_');
                                        const showDate = idx === 0 || new Date(msg.sent_at).toDateString() !== new Date(messages[idx - 1]?.sent_at).toDateString();
                                        return (
                                            <React.Fragment key={msg.message_id}>
                                                {showDate && (
                                                    <div className="text-center">
                                                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                                            {new Date(msg.sent_at).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="max-w-[70%]">
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                                                            ${isMine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}
                                                            ${isOptimistic ? 'opacity-60' : ''}`}
                                                        >
                                                            {msg.body}
                                                        </div>
                                                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMine && (
                                                                <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-brand-600' : 'text-slate-300'}`} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    {isOtherTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                                                <div className="flex gap-1 items-center">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-3 items-center">
                            <input
                                value={input}
                                onChange={handleTyping}
                                placeholder="Type a message..."
                                className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface"
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || sending}
                                className="w-11 h-11 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
