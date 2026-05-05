import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function SubscriptionCancel() {
    return (
        <div className="min-h-screen bg-[#020813] flex items-center justify-center px-6">
            <div className="text-center max-w-md w-full">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-400/20">
                    <XCircle className="w-12 h-12 text-red-400" />
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-3">Payment Cancelled</h1>
                <p className="text-slate-400 mb-8">
                    No worries — you were not charged. Your listing remains standard.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/pricing"
                        className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all">
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </Link>
                    <Link to="/dashboard/properties"
                        className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-300 font-semibold px-6 py-3 rounded-2xl text-sm hover:bg-white/10 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
