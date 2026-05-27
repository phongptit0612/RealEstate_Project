import React, { useState, useEffect } from 'react';
import { Search, Heart, MapPin, Building, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useCurrencyStore from '../store/currencyStore';
import useLanguageStore from '../store/languageStore';
import PropertyCard from '../components/PropertyCard';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function Home() {
  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  
  // Search State
  const [activeTab, setActiveTab] = useState('buy');
  const [searchLocation, setSearchLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'quick') return;
    const params = new URLSearchParams();
    if (searchLocation) params.append('query', searchLocation);
    if (propertyType) params.append('type', propertyType);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (activeTab === 'rent') params.append('listingType', 'rent');
    else params.append('listingType', 'sale');
    
    navigate(`/properties?${params.toString()}`);
  };

  const handleQuickSearch = (tagQuery) => {
    navigate(`/properties?query=${encodeURIComponent(tagQuery)}`);
  };

  useEffect(() => {
    // Fetch live featured properties (limit=6 for homepage)
    axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/search?limit=6`)
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.properties || []);
        setFeaturedProperties(list.slice(0, 6));
      })
      .catch(err => console.error("Failed to fetch featured", err));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-600 selection:text-white">
      {/* Reusable Premium Navbar */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-slate-100 z-0 select-none pointer-events-none"></div>
        <div className="absolute inset-0 z-0">
          <img
            src="https://res.cloudinary.com/dtljonz0f/image/upload/c_fill,w_1920,g_auto/f_auto/q_auto:eco/v1/gc-v1/paris/paris_non-ed_shutterstock_2614817413_mncfps?_a=BAVAZGDY0"
            alt="Luxury Villa"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/40"></div>
          {/* Smooth Fade to Next Section */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-surface to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium mb-6 uppercase tracking-wider backdrop-blur-md shadow-lg">
            {t('hero.subtitle')}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl text-white">
            {t('hero.tagline')}
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-10 max-w-2xl mx-auto font-medium drop-shadow-md">
            {t('hero.subtitle')}
          </p>

          {/* Multi-Tab Search Card */}
          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-3xl shadow-2xl border border-white/20">
            {/* Tabs */}
            <div className="flex gap-2 p-2 w-max mb-1">
              <button 
                onClick={() => setActiveTab('buy')}
                className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all text-sm ${activeTab === 'buy' ? 'bg-white text-brand-600' : 'text-white hover:bg-white/20'}`}>
                {t('hero.buyTab')}
              </button>
              <button 
                onClick={() => setActiveTab('rent')}
                className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all text-sm ${activeTab === 'rent' ? 'bg-white text-brand-600' : 'text-white hover:bg-white/20'}`}>
                {t('hero.rentTab')}
              </button>
              <button 
                onClick={() => setActiveTab('quick')}
                className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all text-sm ${activeTab === 'quick' ? 'bg-white text-brand-600' : 'text-white hover:bg-white/20'}`}>
                {t('hero.quickSearchTab')}
              </button>
            </div>
            
            {/* Search Inputs */}
            {activeTab === 'quick' ? (
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl flex flex-wrap items-center gap-3 transition-all shadow-lg justify-center">
                {['Da Nang Villas', 'Luxury Penthouses', 'Beachfront', 'City Center', 'Under $2000'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => handleQuickSearch(tag)}
                    className="bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 hover:text-brand-700 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSearch} className="bg-white p-3 rounded-2xl flex flex-col md:flex-row items-center gap-2 transition-all shadow-lg group">
                <div className="flex-1 flex flex-col px-4 py-2 w-full md:border-r border-gray-100 transition-colors hover:bg-slate-50 rounded-xl md:rounded-r-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left mb-1">{t('hero.location')}</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder={t('hero.searchPlaceholder') || t('hero.whereTo')}
                      className="bg-transparent border-none outline-none text-slate-900 w-full placeholder:text-gray-400 font-bold min-w-0 text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col px-4 py-2 w-full md:border-r border-gray-100 transition-colors hover:bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left mb-1">{t('hero.propertyType')}</span>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <select 
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="bg-transparent border-none outline-none text-slate-900 w-full cursor-pointer font-bold min-w-0 text-sm"
                    >
                      <option value="">{t('search.allTypes') || 'All Types'}</option>
                      <option value="villa">Villa</option>
                      <option value="apartment">Apartment</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="house">House</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 flex flex-col px-4 py-2 w-full transition-colors hover:bg-slate-50 rounded-xl md:rounded-l-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left mb-1">{t('hero.maxPrice')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">$</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder={t('hero.anyPrice') || 'Any Price'}
                      className="bg-transparent border-none outline-none text-slate-900 w-full placeholder:text-gray-400 font-bold min-w-0 text-sm"
                    />
                  </div>
                </div>
                
                <button type="submit" className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 text-white px-8 h-14 rounded-xl font-bold flex items-center justify-center gap-2 outline-none border-none shadow-lg hover:shadow-brand-500/30 transition-all ml-1 text-base">
                  <Search className="w-5 h-5" />
                  {t('hero.search')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Featured Properties Demo Section */}
      <div className="bg-surface py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">{t('common.featuredProperties')}</h2>
              <p className="text-slate-600 max-w-xl font-medium">{t('hero.subtitle')}</p>
            </div>
            <Link to="/properties" className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold transition-colors mt-4 md:mt-0 group">
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.length > 0 ? (
              featuredProperties.map(prop => (
                <PropertyCard key={prop.property_id} property={prop} />
              ))
            ) : (
              <div className="col-span-3 text-center text-slate-500 py-12">
                No featured properties available at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
