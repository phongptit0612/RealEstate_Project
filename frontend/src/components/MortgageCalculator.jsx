import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';
import useCurrencyStore from '../store/currencyStore';

export default function MortgageCalculator({ basePriceUsd = 1000000 }) {
    const { formatPrice, preferredCurrency } = useCurrencyStore();

    const [downPaymentPct, setDownPaymentPct] = useState(20);
    const [interestRate, setInterestRate] = useState(5.5); // 5.5% annual
    const [loanTerm, setLoanTerm] = useState(30); // 30 Years

    // The magical math (done in USD)
    const calculateMortgage = () => {
        const principal = basePriceUsd - (basePriceUsd * (downPaymentPct / 100));
        if (principal <= 0) return 0;
        
        const monthlyInterestRate = (interestRate / 100) / 12;
        const numberOfPayments = loanTerm * 12;

        if (monthlyInterestRate === 0) return principal / numberOfPayments;

        const mathNumerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments);
        const mathDenominator = Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1;
        
        return principal * (mathNumerator / mathDenominator);
    };

    const monthlyPaymentUsd = calculateMortgage();
    const principalAmountUsd = basePriceUsd - (basePriceUsd * (downPaymentPct / 100));

    // Dynamic color gradient based on loan term
    const getTermGradient = () => {
        if (loanTerm <= 15) return 'from-emerald-500 to-emerald-400';
        if (loanTerm <= 20) return 'from-ocean-500 to-ocean-400';
        return 'from-purple-500 to-indigo-500';
    };

    return (
        <div className="bg-[#051124] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Background Accent Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10 blur-[100px] bg-brand-600"></div>

            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                <div className="p-3 rounded-2xl bg-brand-600 shadow-lg">
                    <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white leading-tight">Mortgage Calculator</h3>
                    <p className="text-sm text-gray-400 font-light">Estimate your financial roadmap</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                {/* Inputs */}
                <div className="space-y-6">
                    {/* Down Payment */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-ocean-500" /> Down Payment
                            </label>
                            <span className="text-white font-bold">{downPaymentPct}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" step="5" 
                            value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                            className="w-full accent-ocean-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-right text-xs text-ocean-400 mt-1 font-mono">
                            {formatPrice(basePriceUsd * (downPaymentPct / 100))}
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
                                <Percent className="w-3 h-3 text-ocean-500" /> Interest Rate
                            </label>
                            <span className="text-white font-bold">{interestRate.toFixed(1)}%</span>
                        </div>
                        <input 
                            type="range" min="1" max="15" step="0.1" 
                            value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                            className="w-full accent-ocean-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Loan Term */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-ocean-500" /> Loan Term
                            </label>
                            <span className="text-white font-bold">{loanTerm} Years</span>
                        </div>
                        <input 
                            type="range" min="5" max="30" step="5" 
                            value={loanTerm} onChange={(e) => setLoanTerm(Number(e.target.value))}
                            className={`w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer transition-colors accent-${loanTerm <= 15 ? 'emerald' : loanTerm <= 20 ? 'ocean' : 'purple'}-500`}
                        />
                    </div>
                </div>

                {/* Visual Data Output */}
                <div className="flex flex-col justify-center">
                    <div className="bg-black/60 border border-white/5 rounded-3xl p-8 text-center shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-600"></div>
                        
                        <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-3">Estimated Monthly Payment</p>
                        <div className="text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                            {formatPrice(monthlyPaymentUsd)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 text-left">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Principal Loan</p>
                                <p className="text-sm text-white font-bold">{formatPrice(principalAmountUsd)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Target Currency</p>
                                <p className="text-sm text-white font-bold uppercase">{preferredCurrency}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
