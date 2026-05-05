import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Crown, ArrowRight, Sparkles } from 'lucide-react';

export default function SubscriptionSuccess() {
    const [searchParams] = useSearchParams();
    const simulated = searchParams.get('simulated') === 'true';
    const [count, setCount] = useState(5);

    useEffect(() => {
        const t = setInterval(() => setCount(c => c - 1), 1000);
        const r = setTimeout(() => { window.location.href = '/dashboard/properties'; }, 5500);
        return () => { clearInterval(t); clearTimeout(r); };
    }, []);

    return (
        <div className="min-h-screen bg-[#020813] flex items-center justify-center px-6">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 text-center max-w-md w-full">
                {/* Animated checkmark */}
                <div className="relative inline-flex items-center justify-center w-28 h-28 mb-8">
                    <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="relative w-28 h-28 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-400/40">
                        <CheckCircle className="w-14 h-14 text-black" />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-400 font-bold text-sm uppercase tracking-widest">VIP Activated</span>
                    <Sparkles className="w-5 h-5 text-amber-400" />
                </div>

                <h1 className="text-4xl font-extrabold text-white mb-4">
                    You're now VIP! 🎉
                </h1>
                <p className="text-slate-400 mb-2">
                    {simulated
                        ? 'Your VIP boost was simulated in dev mode.'
                        : 'Payment confirmed! Your listing is now boosted.'
                    }
                </p>
                <p className="text-slate-500 text-sm mb-8">
                    Your listing is now highlighted and prioritized in search results for the next 30 days.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/dashboard/properties"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold px-6 py-3 rounded-2xl text-sm hover:brightness-110 transition-all shadow-lg">
                        <Crown className="w-4 h-4" /> View My Listings
                    </Link>
                    <Link to="/dashboard/subscriptions"
                        className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-300 font-semibold px-6 py-3 rounded-2xl text-sm hover:bg-white/10 transition-all">
                        <ArrowRight className="w-4 h-4" /> My Subscriptions
                    </Link>
                </div>

                <p className="text-slate-600 text-xs mt-8">
                    Redirecting to your dashboard in {Math.max(count, 0)}s…
                </p>
            </div>
        </div>
    );
}
