import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import useUserStore from '../../store/userStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const login = useUserStore(state => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (res.success) {
            // Redirect based on role from the store after login
            const user = useUserStore.getState().user;
            navigate(user?.role === 'admin' ? '/admin' : '/dashboard/properties');
        } else if (res.requiresVerification) {
            navigate('/verify-otp', { state: { email } });
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 bg-black/80"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ocean-500/10 blur-[120px] rounded-full"></div>

            <Link to="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20">
                <ArrowLeft className="w-5 h-5" /> Back to Home
            </Link>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400 font-light">Sign in to unlock exclusive luxury estates</p>
                </div>

                {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl text-sm font-medium text-center shadow-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ocean-400 transition-colors" />
                            <input 
                                type="email" required
                                value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/50 transition-all font-light placeholder:text-gray-500 shadow-inner"
                                placeholder="Email Address"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ocean-400 transition-colors" />
                            <input 
                                type="password" required
                                value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/50 transition-all font-light placeholder:text-gray-500 shadow-inner"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm text-ocean-400 hover:text-ocean-200 font-medium transition-colors">Forgot Password?</Link>
                    </div>

                    <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 group outline-none border-none shadow-none filter-none">
                        Sign In
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-400 text-sm">
                    Don't have an account? <Link to="/register" className="text-ocean-400 font-bold hover:text-ocean-200 ml-1">Create one</Link>
                </div>
            </div>
        </div>
    );
}
