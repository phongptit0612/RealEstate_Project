import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import useUserStore from '../../store/userStore';
import useLanguageStore from '../../store/languageStore';

export default function Register() {
    const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const register = useUserStore(state => state.register);
    const { t } = useLanguageStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await register(formData);
        setLoading(false);
        if (res.success) {
            navigate('/verify-otp', { state: { email: formData.email } });
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden py-12">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1628624747186-a941c476b7ef?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 bg-black/80"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-ocean-500/10 blur-[150px] rounded-full pointer-events-none"></div>

            <Link to="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20">
                <ArrowLeft className="w-5 h-5" /> {t('auth.backToHome')}
            </Link>

            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">{t('auth.register.title')}</h1>
                    <p className="text-gray-400 font-light">{t('auth.register.subtitle')}</p>
                </div>

                {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl text-sm font-medium text-center shadow-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ocean-400 transition-colors" />
                        <input 
                            type="text" required placeholder={t('auth.register.fullName')}
                            value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/50 transition-all font-light placeholder:text-gray-500 shadow-inner"
                        />
                    </div>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ocean-400 transition-colors" />
                        <input 
                            type="email" required placeholder={t('auth.register.email')}
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/50 transition-all font-light placeholder:text-gray-500 shadow-inner"
                        />
                    </div>
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ocean-400 transition-colors" />
                        <input 
                            type="tel" placeholder={t('auth.register.phone')}
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/50 transition-all font-light placeholder:text-gray-500 shadow-inner"
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ocean-400 transition-colors" />
                        <input 
                            type="password" required placeholder={t('auth.register.password')}
                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/50 transition-all font-light placeholder:text-gray-500 shadow-inner"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-8 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center outline-none border-none shadow-none filter-none">
                        {loading ? t('auth.register.creating') : t('auth.register.registerBtn')}
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-400 text-sm">
                    {t('auth.register.alreadyHaveAccount')} <Link to="/login" className="text-ocean-400 font-bold hover:text-ocean-200 ml-1">{t('auth.register.signIn')}</Link>
                </div>
            </div>
        </div>
    );
}
