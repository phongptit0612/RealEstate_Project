import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, Globe, ChevronDown } from 'lucide-react';
import useCurrencyStore from '../store/currencyStore';
import useUserStore from '../store/userStore';
import useLanguageStore from '../store/languageStore';

export default function Navbar() {
  const { preferredCurrency, setCurrency, currencies, currencyLabels } = useCurrencyStore();
  const { isAuthenticated, user, logout } = useUserStore();
  const { language, setLanguage, t } = useLanguageStore();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languagesList = [
    { code: 'en', label: '🇺🇸 English' },
    { code: 'vi', label: '🇻🇳 Tiếng Việt' }
  ];

  const currentLangObj = languagesList.find(l => l.code === language) || languagesList[0];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-white/95 backdrop-blur-md shadow-md py-3.5 border-b border-gray-100' : 'bg-white border-b border-gray-200 py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <div className="group-hover:scale-110 transition-transform duration-300">
            <img src="/logo.png" alt="LuxEstates" className="w-10 h-10 object-contain filter invert" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">LuxEstates</span>
        </Link>

        {/* Navigation Links (Center) */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
          <Link to="/properties" className="hover:text-brand-600 transition-colors">{t('nav.properties')}</Link>
          <Link to="/agencies" className="hover:text-brand-600 transition-colors">{t('nav.agencies')}</Link>
          <a href="#" className="hover:text-brand-600 transition-colors">{t('nav.aboutUs')}</a>
          <Link to="/pricing" className="hover:text-brand-600 transition-colors">{t('nav.vipPlans')}</Link>
        </div>

        {/* Action Controls & Selectors (Right) */}
        <div className="flex items-center gap-4 text-slate-700">
          {/* Currency Dropdown Selector */}
          <div className="relative">
            <select
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all cursor-pointer font-bold text-xs hover:bg-slate-100 text-slate-700"
              value={preferredCurrency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map(c => (
                <option key={c} value={c}>{currencyLabels[c] || c}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
          </div>

          {/* Dedicated Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(prev => !prev)}
              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all cursor-pointer font-bold text-xs hover:bg-slate-100 text-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentLangObj.label.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {langOpen && (
              <>
                {/* Backdrop overlay to close the dropdown when clicking outside */}
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  {languagesList.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 hover:bg-slate-50 ${language === lang.code ? 'text-brand-600 bg-brand-50/40' : 'text-slate-700'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Saved List Icon */}
          <Link to="/dashboard/favorites" className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block relative group">
            <Heart className="w-5 h-5 text-slate-700" />
          </Link>

          {/* Authentication State Controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-full transition-all shadow-md hover:shadow-brand-600/25"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  {t('nav.adminPanel')}
                </Link>
              ) : (
                <Link to="/dashboard/properties" className="text-xs font-bold text-brand-600 hover:text-white transition-all hover:bg-brand-600 px-4 py-2 rounded-full border border-brand-600">
                  {t('nav.dashboard')}
                </Link>
              )}
              <span className="font-semibold text-xs text-slate-600 hidden lg:inline">{t('nav.hi')}, {user?.name?.split(' ')[0]}</span>
              <button onClick={logout} className="flex items-center gap-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full font-bold text-xs transition-all border border-red-100 shadow-sm hover:shadow-red-500/10">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-50 px-4 py-2 rounded-full font-bold text-xs transition-all border border-slate-200 hover:border-slate-300 hover:shadow-sm">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('nav.login')}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
