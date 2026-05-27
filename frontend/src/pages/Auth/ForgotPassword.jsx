import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/forgot-password`, { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020813] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#020813] via-[#051124] to-[#0a1e3d]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />

            <Link to="/login" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-20 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="bg-[#051124] border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                If <span className="text-white font-medium">{email}</span> is registered, we've sent a 6-digit reset code. Check your inbox (and spam folder).
                            </p>
                            <Link
                                to="/reset-password"
                                state={{ email }}
                                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Enter Reset Code <ArrowRight className="w-4 h-4" />
                            </Link>
                            <button onClick={() => setSent(false)} className="mt-3 w-full py-2.5 text-slate-400 hover:text-white text-sm transition-colors">
                                Try a different email
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-7 h-7 text-[#4d88ff]" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                                <p className="text-slate-400 text-sm">Enter your email and we'll send you a reset code.</p>
                            </div>

                            {error && (
                                <div className="mb-5 p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email" required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full bg-[#020813] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    {loading ? 'Sending...' : <><ArrowRight className="w-4 h-4" /> Send Reset Code</>}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-slate-500">
                                Already have a code?{' '}
                                <Link to="/reset-password" className="text-[#4d88ff] hover:text-white font-semibold transition-colors">
                                    Enter it here
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
