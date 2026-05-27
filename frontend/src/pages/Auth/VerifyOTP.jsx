import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import useUserStore from '../../store/userStore';
import useLanguageStore from '../../store/languageStore';

export default function VerifyOTP() {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const verifyOTP = useUserStore(state => state.verifyOTP);
    const { t } = useLanguageStore();
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    if (!email) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await verifyOTP(email, token);
        setLoading(false);
        if (res.success) {
            navigate('/login');
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2535&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
            <div className="absolute inset-0 bg-black/80 pointer-events-none"></div>

            <Link to="/login" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors z-20">
                <ArrowLeft className="w-5 h-5" /> {t('auth.backToLogin')}
            </Link>

            <div className="relative z-10 w-full max-w-sm p-8 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                <div className="w-16 h-16 bg-ocean-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-ocean-500/30">
                    <KeyRound className="w-8 h-8 text-ocean-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-center text-white mb-2">{t('auth.verify.title')}</h2>
                <p className="text-center text-gray-400 text-sm mb-8 font-light">
                    {t('auth.verify.subtitle')} <br/><b className="text-emerald-400 font-medium">{email}</b>
                </p>

                {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl text-sm font-medium text-center shadow-lg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        maxLength={6}
                        required
                        value={token}
                        onChange={e => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-center tracking-[0.5em] text-3xl font-mono bg-black/60 border border-white/10 rounded-xl py-5 text-white focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/50 transition-all mb-8 shadow-inner"
                        placeholder="000000"
                    />
                    
                    <button type="submit" disabled={loading || token.length !== 6} className="w-full bg-ocean-500 text-white font-bold py-3.5 rounded-xl hover:bg-ocean-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-ocean-500/20">
                        {loading ? t('auth.verify.verifying') : t('auth.verify.verifyBtn')}
                    </button>
                </form>
            </div>
        </div>
    );
}
