import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Search, Heart, User, MapPin, Building, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useCurrencyStore from '../store/currencyStore';
import useUserStore from '../store/userStore';
import PropertyCard from '../components/PropertyCard';
import Footer from '../components/Footer';

export default function Home() {
  const { preferredCurrency, setCurrency, formatPrice } = useCurrencyStore();
  const { isAuthenticated, user, logout } = useUserStore();
  const [scrollY, setScrollY] = useState(0);
  const [featuredProperties, setFeaturedProperties] = useState([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Fetch live featured properties (limit=6 for homepage)
    axios.get('http://localhost:5000/api/properties/search?limit=6')
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.properties || []);
        setFeaturedProperties(list.slice(0, 6));
      })
      .catch(err => console.error("Failed to fetch featured", err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#0033ab] selection:text-white">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-white shadow-md py-4' : 'bg-white border-b border-gray-200 py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="group-hover:scale-110 transition-transform">
              <img src="/logo.png" alt="LuxEstates" className="w-10 h-10 object-contain filter invert" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">LuxEstates</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700">
            <Link to="/properties" className="hover:text-[#0033ab] transition-colors">Properties</Link>
            <Link to="/agencies" className="hover:text-[#0033ab] transition-colors">Agencies</Link>
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
              <div className="flex items-center gap-3">
                {user?.role === 'admin' ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-sm font-bold bg-[#0033ab] text-white hover:bg-[#002273] px-4 py-2 rounded-full transition-all shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Admin Panel
                  </Link>
                ) : (
                  <Link to="/dashboard/properties" className="text-sm font-bold text-[#0033ab] hover:text-white transition-all hover:bg-[#0033ab] px-4 py-2 rounded-full border border-[#0033ab]">
                    Dashboard
                  </Link>
                )}
                <span className="font-medium text-sm text-slate-600">Hi, {user?.name?.split(' ')[0]}</span>
                <button onClick={logout} className="flex items-center gap-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full font-medium transition-all border border-red-100">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-white text-slate-800 hover:bg-gray-50 px-4 py-2 rounded-full font-medium transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm">
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

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
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 border border-white/30 text-white text-sm font-medium mb-6 uppercase tracking-wider backdrop-blur-md shadow-lg">
            Discover Your Dream Home
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl text-white">
            Find the Perfect Place to <span className="text-[#ffffff]">Call Your Own</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-10 max-w-2xl mx-auto font-medium drop-shadow-md">
            Explore our curated selection of premium real estate properties across the globe. Seamlessly switch currencies below to fit your needs.
          </p>

          {/* Search Bar - Zillow Style */}
          <div className="bg-white p-2 md:p-3 rounded-full flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto transition-all shadow-2xl group">
            <div className="flex-1 flex items-center gap-3 px-4 w-full md:w-auto h-12 md:border-r border-gray-200 transition-colors">
              <MapPin className="w-5 h-5 text-[#0033ab]" />
              <input
                type="text"
                placeholder="City, Neighborhood, or Address"
                className="bg-transparent border-none outline-none text-slate-900 w-full placeholder:text-gray-500 font-medium"
              />
            </div>
            <div className="flex-1 flex items-center gap-3 px-4 w-full md:w-auto h-12">
              <Building className="w-5 h-5 text-[#0033ab]" />
              <select className="bg-transparent border-none outline-none text-slate-900 w-full cursor-pointer appearance-none font-medium">
                <option value="">Property Type</option>
                <option value="villa">Villa</option>
                <option value="apartment">Luxury Apartment</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <button className="w-full md:w-auto bg-[#0033ab] hover:bg-[#009dff] text-white px-8 h-12 rounded-full font-bold flex items-center justify-center gap-2 outline-none border-none shadow-none">
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Featured Properties Demo Section */}
      <div className="bg-slate-50 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Featured <span className="font-light text-slate-500">Listings</span></h2>
              <p className="text-slate-600 max-w-xl font-medium">Curated estates selected for their exceptional quality, design, and location.</p>
            </div>
            <Link to="/properties" className="flex items-center gap-2 text-[#0033ab] hover:text-[#002273] font-bold transition-colors mt-4 md:mt-0 group">
              View all listings
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
