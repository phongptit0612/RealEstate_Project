import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import axios from 'axios';
import useLanguageStore from '../../store/languageStore';

export default function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(location.state?.email || '');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { t } = useLanguageStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) { setError(t('auth.reset.errors.mismatch')); return; }
        if (newPassword.length < 6) { setError(t('auth.reset.errors.tooShort')); return; }

        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
                email, token: token.trim(), new_password: newPassword,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || t('auth.reset.errors.failed'));
        } finally {
            setLoading(false);
        }
    };

    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-[#020813]">
            <div className="bg-[#051124] border border-white/10 rounded-3xl p-10 max-w-md w-full mx-6 text-center shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('auth.reset.successTitle')}</h2>
                <p className="text-slate-400 text-sm mb-6">{t('auth.reset.successDesc')}</p>
                <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                    {t('auth.reset.signInNow')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020813] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#020813] via-[#051124] to-[#0a1e3d]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />

            <Link to="/forgot-password" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-20 text-sm">
                <ArrowLeft className="w-4 h-4" /> {t('auth.back')}
            </Link>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="bg-[#051124] border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-7 h-7 text-[#4d88ff]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">{t('auth.reset.title')}</h1>
                        <p className="text-slate-400 text-sm">{t('auth.reset.subtitle')}</p>
                    </div>

                    {error && (
                        <div className="mb-5 p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{t('auth.reset.emailLabel')}</label>
                            <input
                                type="email" required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={t('auth.forgot.emailPlaceholder')}
                                className="w-full bg-[#020813] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                            />
                        </div>

                        {/* OTP Code */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{t('auth.reset.codeLabel')}</label>
                            <input
                                type="text" required maxLength={6}
                                value={token}
                                onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                                placeholder={t('auth.reset.codePlaceholder')}
                                className="w-full bg-[#020813] border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono tracking-[0.3em] text-center placeholder:text-slate-600 placeholder:tracking-normal focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                            />
                        </div>

                        {/* New password */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{t('auth.reset.newPwLabel')}</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'} required minLength={6}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder={t('auth.reset.newPwPlaceholder')}
                                    className="w-full bg-[#020813] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{t('auth.reset.confirmPwLabel')}</label>
                            <input
                                type={showPw ? 'text' : 'password'} required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder={t('auth.reset.confirmPwPlaceholder')}
                                className="w-full bg-[#020813] border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                            />
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors mt-2"
                        >
                            {loading ? t('auth.reset.resetting') : t('auth.reset.resetBtn')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
