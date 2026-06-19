import React, { useState } from 'react';
import { User, Phone, Camera, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import useUserStore from '../../store/userStore';
import useLanguageStore from '../../store/languageStore';

const API = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

// ── Toast notification ───────────────────────────────────────
function Toast({ msg, type }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all
            ${isErr ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}>
            {isErr ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {msg}
        </div>
    );
}

// ── Section Wrapper ──────────────────────────────────────────
function Section({ title, children }) {
    return (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">{title}</h2>
            {children}
        </div>
    );
}

export default function Profile() {
    const { user, setUser } = useUserStore();
    const { t } = useLanguageStore();

    // ── Profile state ──────────────────────────────────────
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
    const [profileLoading, setProfileLoading] = useState(false);

    // ── Password state ─────────────────────────────────────
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);

    // ── Toast ──────────────────────────────────────────────
    const [toast, setToast] = useState({ msg: '', type: '' });
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: '' }), 3500);
    };

    // ── Avatar upload ──────────────────────────────────────
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const r = await axios.post(`${API}/auth/avatar`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAvatarUrl(r.data.url);
        } catch {
            showToast(t('profile.toast.uploadFailed', 'Failed to upload image'), 'error');
        }
    };

    // ── Save profile ───────────────────────────────────────
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!name.trim()) { showToast(t('profile.toast.emptyName', 'Name cannot be empty'), 'error'); return; }
        setProfileLoading(true);
        try {
            const r = await axios.put(`${API}/auth/profile`, {
                full_name: name.trim(),
                phone: phone.trim() || null,
                avatar_url: avatarUrl || null,
            }, { withCredentials: true });

            // Update the Zustand user store so navbar etc refresh
            setUser(r.data.user);
            showToast(t('profile.toast.updateSuccess', 'Profile updated successfully!'));
        } catch (err) {
            showToast(err.response?.data?.error || t('profile.toast.updateFailed', 'Failed to update profile'), 'error');
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Change password ────────────────────────────────────
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPw !== confirmPw) { showToast(t('profile.toast.pwMismatch', 'New passwords do not match'), 'error'); return; }
        if (newPw.length < 6) { showToast(t('profile.toast.pwTooShort', 'Password must be at least 6 characters'), 'error'); return; }
        setPwLoading(true);
        try {
            await axios.put(`${API}/auth/change-password`, {
                current_password: currentPw,
                new_password: newPw,
            }, { withCredentials: true });
            showToast(t('profile.toast.pwSuccess', 'Password changed successfully!'));
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
        } catch (err) {
            showToast(err.response?.data?.error || t('profile.toast.pwFailed', 'Failed to change password'), 'error');
        } finally {
            setPwLoading(false);
        }
    };

    const avatarSrc = avatarUrl
        ? (avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${avatarUrl}`)
        : null;

    return (
        <div className="space-y-6 max-w-2xl">
            <Toast msg={toast.msg} type={toast.type} />

            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('profile.title')}</h1>
                <p className="text-slate-500 text-sm mt-1">{t('profile.subtitle')}</p>
            </div>

            {/* ── Profile Info ── */}
            <Section title={<><User className="w-4 h-4 text-[#4d88ff]" /> {t('profile.personalInfo')}</>}>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-brand-600/20 border border-brand-600/30 overflow-hidden flex items-center justify-center text-[#4d88ff] font-bold text-2xl">
                                {avatarSrc
                                    ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                                    : user?.name?.[0]?.toUpperCase() || 'U'
                                }
                            </div>
                            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-700 transition-colors shadow-lg">
                                <Camera className="w-3.5 h-3.5 text-white" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                            <p className="text-xs text-slate-600 mt-1">{t('profile.emailCannotChange')}</p>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('profile.fullName')}</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input
                                type="text" required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={t('profile.fullNamePlaceholder')}
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('profile.phone')}</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder={t('profile.phonePlaceholder')}
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                            />
                        </div>
                    </div>

                    {/* Avatar URL fallback */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('profile.avatarUrl')} <span className="normal-case font-normal text-slate-600">{t('profile.avatarUrlHint')}</span></label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={e => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                        />
                    </div>

                    <button
                        type="submit" disabled={profileLoading}
                        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm"
                    >
                        {profileLoading ? t('profile.saving') : t('profile.saveBtn')}
                    </button>
                </form>
            </Section>

            {/* ── Change Password ── */}
            <Section title={<><Lock className="w-4 h-4 text-[#4d88ff]" /> {t('profile.changePw')}</>}>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('profile.currentPw')}</label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'} required
                                value={currentPw}
                                onChange={e => setCurrentPw(e.target.value)}
                                placeholder={t('profile.currentPwPlaceholder')}
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                            />
                            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors">
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('profile.newPw')}</label>
                        <input
                            type={showPw ? 'text' : 'password'} required minLength={6}
                            value={newPw}
                            onChange={e => setNewPw(e.target.value)}
                            placeholder={t('profile.newPwPlaceholder')}
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('profile.confirmPw')}</label>
                        <input
                            type={showPw ? 'text' : 'password'} required
                            value={confirmPw}
                            onChange={e => setConfirmPw(e.target.value)}
                            placeholder={t('profile.confirmPwPlaceholder')}
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                        />
                    </div>

                    <button
                        type="submit" disabled={pwLoading}
                        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm"
                    >
                        {pwLoading ? t('profile.updating') : t('profile.changePw')}
                    </button>
                </form>
            </Section>

            {/* ── Account Info ── */}
            <Section title={<><User className="w-4 h-4 text-[#4d88ff]" /> {t('profile.accountInfo')}</>}>
                <div className="space-y-3 text-sm">
                    {[
                        { label: 'Email', value: user?.email },
                        { label: t('profile.role'), value: user?.role },
                        { label: t('profile.status'), value: t('common.approved') },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="text-slate-500">{label}</span>
                            <span className="text-slate-900 font-medium capitalize">{value}</span>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}
