import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Building, DollarSign, Compass, FilterX, Map, LayoutGrid, Heart, User, ArrowUpDown, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useCurrencyStore from '../store/currencyStore';
import useUserStore from '../store/userStore';
import useLanguageStore from '../store/languageStore';
import PropertyCard from '../components/PropertyCard';
import MapView from '../components/MapView';
import Footer from '../components/Footer';

export default function Properties() {
    const { preferredCurrency, setCurrency, currencies, currencyLabels } = useCurrencyStore();
    const { isAuthenticated, user, logout } = useUserStore();
    const { t } = useLanguageStore();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [metadata, setMetadata] = useState({ cities: [], districts: [], types: [] });
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [sort, setSort] = useState('newest');

    // Filter States
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const [keyword, setKeyword] = useState(queryParams.get('keyword') || '');
    const [filters, setFilters] = useState({
        city_id: queryParams.get('city_id') || '',
        district_id: queryParams.get('district_id') || '',
        type_id: queryParams.get('type_id') || '',
        listing_type: queryParams.get('listing_type') || '',
        minPrice: queryParams.get('minPrice') || '',
        maxPrice: queryParams.get('maxPrice') || '',
        direction: queryParams.get('direction') || '',
        bedrooms: queryParams.get('bedrooms') || '',
        bathrooms: queryParams.get('bathrooms') || '',
        features: queryParams.get('features') || ''
    });

    const [activeDistricts, setActiveDistricts] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Fetch Metadata (Cities, Districts, Types)
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/metadata`).then(res => {
            setMetadata(res.data);
        }).catch(err => console.error("Metadata fetch error:", err));
    }, []);

    // Cascade Districts when City changes
    useEffect(() => {
        if (filters.city_id) {
            setActiveDistricts(metadata.districts.filter(d => d.city_id === parseInt(filters.city_id)));
            // Reset district when city changes if district doesn't belong
            setFilters(prev => ({ ...prev, district_id: '' }));
        } else {
            setActiveDistricts([]);
        }
    }, [filters.city_id, metadata.districts]);

    // Fetch Properties (page 1 = fresh search)
    const fetchProperties = async (currentPage = 1, append = false) => {
        append ? setLoadingMore(true) : setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (preferredCurrency) params.append('currency', preferredCurrency);
            params.append('page', currentPage);
            params.append('limit', 12);
            params.append('sort', sort);

            Object.entries(filters).forEach(([key, val]) => {
                if (val) params.append(key, val);
            });

            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/properties/search?${params.toString()}`);
            const data = res.data;

            // Support both old array response and new paginated response
            if (Array.isArray(data)) {
                setProperties(data);
                setTotalResults(data.length);
                setTotalPages(1);
            } else {
                setProperties(prev => append ? [...prev, ...data.properties] : data.properties);
                setTotalResults(data.total);
                setTotalPages(data.totalPages);
                setPage(currentPage);
            }
        } catch (error) {
            console.error('Search Error:', error);
        } finally {
            append ? setLoadingMore(false) : setLoading(false);
        }
    };

    const handleLoadMore = () => {
        fetchProperties(page + 1, true);
    };

    // Initial Load & re-trigger on currency/filter change
    useEffect(() => {
        setPage(1);
        fetchProperties(1, false);
    // eslint-disable-next-line
    }, [preferredCurrency, sort]);

    const handleClear = () => {
        setKeyword('');
        setFilters({ city_id: '', district_id: '', type_id: '', listing_type: '', minPrice: '', maxPrice: '', direction: '', bedrooms: '', bathrooms: '', features: '' });
        setSort('newest');
        setPage(1);
        setTimeout(() => fetchProperties(1, false), 0);
    };

    const applyFilters = () => {
        setPage(1);
        fetchProperties(1, false);
    };

    return (
        <div className="min-h-screen bg-surface font-sans flex flex-col">
            {/* Navbar */}
            <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                        <div className="group-hover:scale-110 transition-transform">
                            <img src="/logo.png" alt="LuxEstates" className="w-10 h-10 object-contain filter invert" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-brand-900 hidden sm:block">LuxEstates</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
                        <Link to="/properties" className="text-brand-600 transition-colors cursor-default">{t('nav.properties')}</Link>
                        <Link to="/agencies" className="hover:text-brand-600 transition-colors">{t('nav.agencies')}</Link>
                        <Link to="/pricing" className="hover:text-brand-600 transition-colors">
                            {t('nav.vipPlans')}
                        </Link>
                        
                        <div className="relative">
                            <select
                                className="appearance-none bg-surface-2 border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer hover:bg-gray-100 text-slate-700 font-medium"
                                value={preferredCurrency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                {currencies.map(c => (
                                    <option key={c} value={c}>{currencyLabels[c] || c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-700">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <Link to="/dashboard/properties" className="text-sm font-bold text-brand-600 hover:text-white transition-all bg-brand-50 hover:bg-brand-600 px-4 py-2 rounded-full border border-brand-200 hover:border-brand-600">
                                    {t('nav.dashboard')}
                                </Link>
                                <button onClick={logout} className="hidden sm:flex items-center gap-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full text-sm font-bold transition-all border border-red-100">
                                    {t('nav.logout')}
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center gap-2 bg-white text-slate-800 hover:bg-gray-50 px-5 py-2 rounded-full text-sm font-bold transition-all border border-gray-200 shadow-sm hover:shadow">
                                <User className="w-4 h-4" />
                                <span>{t('nav.login')}</span>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Horizontal Filter Bar (Zillow-style) */}
            <div className="bg-white border-b border-gray-200 sticky top-[61px] z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        
                        {/* Search Input */}
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                placeholder={t('search.placeholder')} 
                                className="w-full bg-surface-2 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-gray-400 transition-colors hover:border-gray-300 min-w-0"
                            />
                        </div>

                        {/* Core Filters */}
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">

                            {/* Sale / Rent toggle */}
                            <div className="flex bg-surface-2 border border-gray-200 rounded-xl p-1 flex-shrink-0">
                                {[['', t('search.all')], ['sale', t('search.sale')], ['rent', t('search.rent')]].map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={() => setFilters(f => ({ ...f, listing_type: val }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            filters.listing_type === val
                                                ? val === 'rent' ? 'bg-blue-500 text-white shadow' : 'bg-brand-600 text-white shadow'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <select 
                                value={filters.type_id} 
                                onChange={e => { setFilters({...filters, type_id: e.target.value}); }}
                                className="bg-surface-2 border border-gray-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer flex-shrink-0"
                            >
                                <option value="">{t('search.allTypes')}</option>
                                {metadata.types.map(t => <option key={t.type_id} value={t.type_id}>{t.name}</option>)}
                            </select>

                            <select 
                                value={filters.city_id} 
                                onChange={e => { setFilters({...filters, city_id: e.target.value}); }}
                                className="bg-surface-2 border border-gray-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer flex-shrink-0"
                            >
                                <option value="">{t('search.anyCity')}</option>
                                {metadata.cities.map(c => <option key={c.city_id} value={c.city_id}>{c.name}</option>)}
                            </select>

                            <button 
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors flex-shrink-0
                                    ${showAdvanced ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-surface-2 border-gray-200 text-slate-700 hover:bg-gray-100'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4" /> {showAdvanced ? t('search.hideFilters') : t('search.filters')}
                            </button>

                            <button 
                                onClick={applyFilters}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex-shrink-0"
                            >
                                {t('search.button')}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters Expandable Panel */}
                    {showAdvanced && (
                        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Price Range</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice: e.target.value})} className="w-full bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 min-w-0" />
                                    <span className="text-gray-400">-</span>
                                    <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} className="w-full bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 min-w-0" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Bed & Bath</label>
                                <div className="flex items-center gap-2">
                                    <select value={filters.bedrooms} onChange={e => setFilters({...filters, bedrooms: e.target.value})} className="w-full bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-0">
                                        <option value="">{t('search.minBedrooms')}</option>
                                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+ Beds</option>)}
                                    </select>
                                    <select value={filters.bathrooms} onChange={e => setFilters({...filters, bathrooms: e.target.value})} className="w-full bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-0">
                                        <option value="">{t('search.minBathrooms')}</option>
                                        {[1,2,3,4].map(n => <option key={n} value={n}>{n}+ Baths</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">District</label>
                                <select value={filters.district_id} onChange={e => setFilters({...filters, district_id: e.target.value})} disabled={!filters.city_id} className="w-full bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 cursor-pointer min-w-0">
                                    <option value="">{t('search.anyDistrict')}</option>
                                    {activeDistricts.map(d => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block flex justify-between">
                                    <span>{t('search.direction')}</span>
                                    <button onClick={handleClear} className="text-brand-600 hover:text-brand-800 text-[10px] lowercase font-bold">clear all</button>
                                </label>
                                <select value={filters.direction} onChange={e => setFilters({...filters, direction: e.target.value})} className="w-full bg-surface-2 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-0">
                                    <option value="">{t('search.anyDirection')}</option>
                                    <option value="north">North</option><option value="south">South</option><option value="east">East</option><option value="west">West</option>
                                    <option value="northeast">North-East</option><option value="northwest">North-West</option><option value="southeast">South-East</option><option value="southwest">South-West</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
                
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('nav.properties')}</h1>
                        <p className="text-sm text-slate-500 mt-1">{loading ? t('common.loading') : `${totalResults} ${t('search.results')}`}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('search.sortBy')}:</span>
                            <select
                                value={sort}
                                onChange={e => { setSort(e.target.value); }}
                                className="bg-transparent border-none text-brand-600 font-semibold text-sm outline-none cursor-pointer focus:ring-0 p-0 pr-4"
                            >
                                <option value="newest">{t('search.newest')}</option>
                                <option value="oldest">{t('search.oldest')}</option>
                                <option value="price_asc">{t('search.priceLow')}</option>
                                <option value="price_desc">{t('search.priceHigh')}</option>
                                <option value="area_asc">{t('search.areaLow')}</option>
                                <option value="area_desc">{t('search.areaHigh')}</option>
                            </select>
                        </div>
                        
                        <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>

                        <div className="flex bg-surface-2 p-1 rounded-lg border border-gray-200 flex-shrink-0">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">{t('search.listView')}</span>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Map className="w-4 h-4" /> <span className="hidden sm:inline">{t('search.mapView')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* View Content */}
                {viewMode === 'map' ? (
                    <div className="flex-1 min-h-[600px] rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-8">
                        <MapView properties={properties} height="100%" zoom={12} />
                    </div>
                ) : (
                    <>
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6,7,8].map(i => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                                        <div className="h-56 bg-slate-200"></div>
                                        <div className="p-4 space-y-3">
                                            <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
                                            <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : properties.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 page-enter">
                                {properties.map(prop => (
                                    <PropertyCard key={prop.property_id} property={prop} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                                    <FilterX className="w-10 h-10 text-brand-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t('search.noResults')}</h3>
                                <p className="text-slate-500 max-w-md text-center mb-6">{t('search.noResultsHint')}</p>
                                <button onClick={handleClear} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm">
                                    {t('search.clearFilters')}
                                </button>
                            </div>
                        )}

                        {/* Pagination / Load More */}
                        {!loading && properties.length > 0 && page < totalPages && (
                            <div className="flex justify-center mt-12 mb-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loadingMore ? 'Loading...' : 'Show More Properties'}
                                </button>
                            </div>
                        )}
                        {!loading && properties.length > 0 && page >= totalPages && (
                            <div className="text-center mt-12 mb-8 text-slate-400 text-sm font-medium">
                                You've viewed all {totalResults} properties
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
