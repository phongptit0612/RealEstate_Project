import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Building, DollarSign, Compass, FilterX, ChevronLeft, Map, LayoutGrid, Heart, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCurrencyStore from '../store/currencyStore';
import useUserStore from '../store/userStore';
import PropertyCard from '../components/PropertyCard';
import MapView from '../components/MapView';
import Footer from '../components/Footer';

export default function Properties() {
    const { preferredCurrency, setCurrency } = useCurrencyStore();
    const { isAuthenticated, user, logout } = useUserStore();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState({ cities: [], districts: [], types: [] });
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

    // Filter States
    const [keyword, setKeyword] = useState('');
    const [filters, setFilters] = useState({
        city_id: '',
        district_id: '',
        type_id: '',
        minPrice: '',
        maxPrice: '',
        direction: '',
        bedrooms: '',
        bathrooms: ''
    });

    const [activeDistricts, setActiveDistricts] = useState([]);

    // Fetch Metadata (Cities, Districts, Types)
    useEffect(() => {
        axios.get('http://localhost:5000/api/properties/metadata').then(res => {
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

    // Fetch Properties
    const fetchProperties = async () => {
        setLoading(true);
        try {
            // Build Query Params string
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (preferredCurrency) params.append('currency', preferredCurrency);
            
            Object.entries(filters).forEach(([key, val]) => {
                if (val) params.append(key, val);
            });

            const res = await axios.get(`http://localhost:5000/api/properties/search?${params.toString()}`);
            setProperties(res.data);
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load & re-trigger on currency change for accurate translation bounds
    useEffect(() => {
        fetchProperties();
    // eslint-disable-next-line
    }, [preferredCurrency]);

    const handleClear = () => {
        setKeyword('');
        setFilters({ city_id: '', district_id: '', type_id: '', minPrice: '', maxPrice: '', direction: '', bedrooms: '', bathrooms: '' });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Solid Navbar wrapper */}
            <nav className="fixed w-full z-50 bg-white border-b border-gray-200 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                        <div className="group-hover:scale-110 transition-transform">
                            <img src="/logo.png" alt="LuxEstates" className="w-10 h-10 object-contain filter invert" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">LuxEstates</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700">
                        <Link to="/properties" className="text-[#0033ab] transition-colors cursor-default">Properties</Link>
                        <Link to="/pricing" className="hover:text-[#0033ab] transition-colors flex items-center gap-1.5 font-semibold">
                            <span className="text-amber-500">👑</span> VIP Plans
                        </Link>
                        <a href="#" className="hover:text-[#0033ab] transition-colors">About Us</a>
                        <div className="relative">
                            <select
                                className="appearance-none bg-gray-100 border border-gray-200 rounded-lg pl-4 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0033ab] transition-all cursor-pointer font-medium hover:bg-gray-200 text-slate-700"
                                value={preferredCurrency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="VND">VND (đ)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-700">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                            <Heart className="w-5 h-5 text-slate-700" />
                        </button>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <Link to="/dashboard/properties" className="text-sm font-bold text-[#0033ab] hover:text-white transition-all bg-white hover:bg-[#0033ab] px-4 py-2 rounded-full border border-[#0033ab]">
                                    Dashboard
                                </Link>
                                <button onClick={logout} className="flex items-center gap-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full font-medium transition-all border border-red-100">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center gap-2 bg-white text-slate-800 hover:bg-gray-50 px-4 py-2 rounded-full font-medium transition-all border border-gray-200 shadow-sm">
                                <User className="w-4 h-4" />
                                <span>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-20 flex flex-col md:flex-row gap-8">
                
                {/* Advanced Search Sidebar */}
                <div className="w-full md:w-80 flex-shrink-0 animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 sticky top-28 shadow-xl relative overflow-hidden">
                        
                        <div className="flex flex-col gap-4 mb-6 border-b border-gray-100 pb-4">
                            <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#0033ab] transition-colors w-fit">
                                <ChevronLeft className="w-4 h-4" />
                                Return to Main
                            </Link>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <FilterX className="w-5 h-5 text-[#0033ab]" />
                                    Filters
                                </h2>
                                <button onClick={handleClear} className="text-xs text-slate-500 hover:text-[#0033ab] uppercase tracking-widest font-bold transition-colors">Clear</button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* FullText Search */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 block">Keyword Search</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Search className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={keyword}
                                        onChange={e => setKeyword(e.target.value)}
                                        placeholder="Penthouse, pool..." 
                                        className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 text-sm focus:ring-2 focus:ring-[#0033ab] outline-none placeholder:text-gray-400 transition-colors hover:border-gray-300 shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Cascading Location */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 block flex items-center gap-1"><MapPin className="w-3 h-3 text-[#0033ab]"/> City / Region</label>
                                <select 
                                    value={filters.city_id} 
                                    onChange={e => setFilters({...filters, city_id: e.target.value})}
                                    className="w-full bg-slate-50 border border-gray-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0033ab] hover:border-gray-300 cursor-pointer shadow-sm appearance-none mb-3"
                                >
                                    <option value="">All Cities</option>
                                    {metadata.cities.map(c => <option key={c.city_id} value={c.city_id}>{c.name}</option>)}
                                </select>

                                <label className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 block flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400"/> District / Zone</label>
                                <select 
                                    value={filters.district_id} 
                                    onChange={e => setFilters({...filters, district_id: e.target.value})}
                                    disabled={!filters.city_id}
                                    className="w-full bg-slate-50 border border-gray-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0033ab] hover:border-gray-300 cursor-pointer shadow-sm disabled:opacity-50 appearance-none"
                                >
                                    <option value="">All Districts</option>
                                    {activeDistricts.map(d => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
                                </select>
                            </div>

                            {/* Property Type */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 block flex items-center gap-1"><Building className="w-3 h-3 text-[#0033ab]"/> Asset Class</label>
                                <select 
                                    value={filters.type_id} 
                                    onChange={e => setFilters({...filters, type_id: e.target.value})}
                                    className="w-full bg-slate-50 border border-gray-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0033ab] hover:border-gray-300 cursor-pointer shadow-sm appearance-none"
                                >
                                    <option value="">All Types</option>
                                    {metadata.types.map(t => <option key={t.type_id} value={t.type_id}>{t.name}</option>)}
                                </select>
                            </div>

                            {/* Multi-Currency Price Scaler */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3 text-[#0033ab]"/> Target Range ({preferredCurrency})</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" placeholder="Min" 
                                        value={filters.minPrice}
                                        onChange={e => setFilters({...filters, minPrice: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-[#0033ab] hover:border-gray-300 outline-none placeholder:text-gray-400 shadow-sm"
                                    />
                                    <input 
                                        type="number" placeholder="Max" 
                                        value={filters.maxPrice}
                                        onChange={e => setFilters({...filters, maxPrice: e.target.value})}
                                        className="w-full bg-slate-50 border border-gray-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-[#0033ab] hover:border-gray-300 outline-none placeholder:text-gray-400 shadow-sm"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase">Values automatically scale during DB execution</p>
                            </div>

                            {/* Geographic Direction */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 block flex items-center gap-1"><Compass className="w-3 h-3 text-[#0033ab]"/> Feng-Shui Direction</label>
                                <select 
                                    value={filters.direction} 
                                    onChange={e => setFilters({...filters, direction: e.target.value})}
                                    className="w-full bg-slate-50 border border-gray-200 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0033ab] hover:border-gray-300 cursor-pointer shadow-sm appearance-none"
                                >
                                    <option value="">Any Direction</option>
                                    <option value="north">North</option>
                                    <option value="south">South</option>
                                    <option value="east">East</option>
                                    <option value="west">West</option>
                                    <option value="northeast">North-East</option>
                                    <option value="northwest">North-West</option>
                                    <option value="southeast">South-East</option>
                                    <option value="southwest">South-West</option>
                                </select>
                            </div>

                            <button 
                                onClick={fetchProperties}
                                className="w-full mt-6 bg-[#0033ab] hover:bg-[#002273] text-white font-bold uppercase tracking-widest py-4 rounded-xl outline-none border-none shadow-none filter-none"
                            >
                                Execute Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Results */}
                <div className="flex-1">
                    {/* Header + Toggle */}
                    <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">The Collection</h1>
                            <p className="text-slate-500 text-lg">Curated global assets, converted locally.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-[#0033ab] font-bold bg-[#0033ab]/10 px-4 py-2 rounded-xl border border-[#0033ab]/20">
                                {properties.length} Results
                            </div>
                            {/* View mode toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                                <button
                                    onClick={() => setViewMode('list')}
                                    title="List view"
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#0033ab]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    title="Map view"
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-[#0033ab]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Map className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Map View */}
                    {viewMode === 'map' && (
                        <MapView
                            properties={properties}
                            height="600px"
                            zoom={12}
                        />
                    )}

                    {/* List View */}
                    {viewMode === 'list' && (
                        loading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="bg-white border border-gray-200 rounded-3xl h-96 animate-pulse p-6 flex flex-col justify-end shadow-sm">
                                        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                                        <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : properties.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                                {properties.map(prop => (
                                    <PropertyCard key={prop.property_id} property={prop} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-white border border-gray-200 rounded-3xl shadow-sm">
                                <Search className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Match Found</h3>
                                <p className="text-slate-500">Your specific criteria yielded zero assets. Broaden your search metrics.</p>
                                <button onClick={handleClear} className="mt-8 text-[#0033ab] font-bold uppercase tracking-widest hover:text-[#002273] transition-colors">Reset Architecture Filters</button>
                            </div>
                        )
                    )}
                </div>

            </div>
            <Footer />
        </div>
    );
}
