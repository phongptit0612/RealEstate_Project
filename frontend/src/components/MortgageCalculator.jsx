import React, { useState } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';
import useCurrencyStore from '../store/currencyStore';
import useLanguageStore from '../store/languageStore';

export default function MortgageCalculator({ basePriceUsd = 1000000 }) {
    const { formatPrice, preferredCurrency } = useCurrencyStore();
    const { t } = useLanguageStore();

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

    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 relative overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
                <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 shadow-sm border border-brand-100">
                    <Calculator className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">{t('mortgage.title') || 'Mortgage Calculator'}</h3>
                    <p className="text-sm text-slate-500">{t('mortgage.subtitle') || 'Estimate your financial roadmap'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                {/* Inputs */}
                <div className="space-y-6">
                    {/* Down Payment */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-brand-500" /> {t('mortgage.downPayment') || 'Down Payment'}
                            </label>
                            <span className="text-slate-900 font-bold">{downPaymentPct}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" step="5" 
                            value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                            className="w-full accent-brand-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-right text-xs text-slate-500 mt-1 font-mono font-medium">
                            {formatPrice(basePriceUsd * (downPaymentPct / 100))}
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                                <Percent className="w-3 h-3 text-brand-500" /> {t('mortgage.interestRate') || 'Interest Rate'}
                            </label>
                            <span className="text-slate-900 font-bold">{interestRate.toFixed(1)}%</span>
                        </div>
                        <input 
                            type="range" min="1" max="15" step="0.1" 
                            value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                            className="w-full accent-brand-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Loan Term */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-brand-500" /> {t('mortgage.loanTerm') || 'Loan Term'}
                            </label>
                            <span className="text-slate-900 font-bold">{loanTerm} {t('mortgage.years') || 'Years'}</span>
                        </div>
                        <input 
                            type="range" min="5" max="30" step="5" 
                            value={loanTerm} onChange={(e) => setLoanTerm(Number(e.target.value))}
                            className="w-full accent-brand-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer transition-colors"
                        />
                    </div>
                </div>

                {/* Visual Data Output */}
                <div className="flex flex-col justify-center">
                    <div className="bg-slate-50 border border-gray-200 rounded-3xl p-8 text-center relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-600"></div>
                        
                        <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-3">{t('mortgage.monthlyPayment') || 'Estimated Monthly Payment'}</p>
                        <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 drop-shadow-sm">
                            {formatPrice(monthlyPaymentUsd)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-6 text-left">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t('mortgage.principal') || 'Principal Loan'}</p>
                                <p className="text-sm text-slate-900 font-bold">{formatPrice(principalAmountUsd)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t('mortgage.currency') || 'Target Currency'}</p>
                                <p className="text-sm text-slate-900 font-bold uppercase">{preferredCurrency}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
