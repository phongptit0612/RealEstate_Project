import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, UploadCloud, Building, MapPin, DollarSign, ListPlus } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';

export default function CreateListing() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [propertyId, setPropertyId] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '', description: '', property_type: 'villa',
        price_usd: '', area_sqm: '', bedrooms: '', bathrooms: '',
        address: '', city: '', zipcode: '', video_url: '',
        latitude: null, longitude: null,
    });

    const [images, setImages] = useState([]);

    const handleNext = async () => {
        if (step === 3) {
            setLoading(true);
            try {
                const res = await axios.post('http://localhost:5000/api/properties', formData, { withCredentials: true });
                setPropertyId(res.data.property_id);
                setStep(4);
            } catch (error) {
                alert(error.response?.data?.error || 'Failed to create property');
            }
            setLoading(false);
        } else {
            setStep(step + 1);
        }
    };

    const handleUploadMedia = async () => {
        if (images.length === 0) return navigate('/dashboard/properties');
        
        setLoading(true);
        const imgData = new FormData();
        imgData.append('property_id', propertyId);
        Array.from(images).forEach(file => {
            imgData.append('images', file);
        });

        try {
            await axios.post('http://localhost:5000/api/media/upload', imgData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            navigate('/dashboard/properties');
        } catch (error) {
            console.error('Upload Error:', error.response?.data || error);
            alert(`Upload Failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-3xl font-bold text-white mb-2">Create New Listing</h1>
            <p className="text-gray-400 mb-8">Propagate your asset directly to the global luxury marketplace.</p>

            {/* Stepper */}
            <div className="flex gap-4 mb-10">
                {[{id: 1, icon: ListPlus, label: 'Basics'}, {id: 2, icon: DollarSign, label: 'Metrics'}, {id: 3, icon: MapPin, label: 'Location'}, {id: 4, icon: UploadCloud, label: 'Media'}].map(s => (
                    <div key={s.id} className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border ${step >= s.id ? 'bg-brand-600 bg-none border-[#002273] text-white font-bold' : 'bg-black/40 border-white/5 text-gray-500'}`}>
                        <s.icon className={`w-6 h-6 ${step >= s.id ? 'text-ocean-200' : ''}`} />
                        <span className="text-xs font-bold uppercase tracking-widest">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="bg-[#051124] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Accent Blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-ocean-500/10 blur-[100px]"></div>

                {step === 1 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/5 pb-4">Architectural Overview</h2>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Catchy Title <span className="text-ocean-500">*</span></label>
                            <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-5 text-white focus:ring-2 focus:ring-ocean-500 outline-none text-lg font-light shadow-inner transition-all hover:border-white/20" placeholder="e.g. Modern Oceanfront Villa" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Detailed Description</label>
                            <textarea rows="5" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-5 text-white focus:ring-2 focus:ring-ocean-500 outline-none font-light shadow-inner transition-all hover:border-white/20" placeholder="Describe the elegant features..."></textarea>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Asset Class <span className="text-ocean-500">*</span></label>
                            <select value={formData.property_type} onChange={e=>setFormData({...formData, property_type: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-5 text-white focus:ring-2 focus:ring-ocean-500 outline-none shadow-inner cursor-pointer font-medium hover:bg-black/80 transition-colors">
                                <option value="villa">Villa</option>
                                <option value="apartment">Luxury Apartment</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="land">Development Land</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/5 pb-4">Valuation & Metrics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Base Request Price (USD) <span className="text-ocean-500">*</span></label>
                                <input type="number" required value={formData.price_usd} onChange={e=>setFormData({...formData, price_usd: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-5 text-ocean-200 font-bold focus:ring-2 focus:ring-ocean-500 outline-none text-xl shadow-inner" placeholder="$0.00" />
                                <p className="text-xs text-gray-500 mt-2">Prices will dynamically convert to EUR/VND for edge buyers automatically.</p>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Total Area <span className="text-ocean-500">*</span></label>
                                <input type="number" value={formData.area_sqm} onChange={e=>setFormData({...formData, area_sqm: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-5 text-white font-bold focus:ring-2 focus:ring-ocean-500 outline-none shadow-inner" placeholder="m²" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Bedrooms</label>
                                <input type="number" value={formData.bedrooms} onChange={e=>setFormData({...formData, bedrooms: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-5 text-white font-bold focus:ring-2 focus:ring-ocean-500 outline-none shadow-inner" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Bathrooms</label>
                                <input type="number" value={formData.bathrooms} onChange={e=>setFormData({...formData, bathrooms: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-5 text-white font-bold focus:ring-2 focus:ring-ocean-500 outline-none shadow-inner" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/5 pb-4">Geographic Positioning</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">City <span className="text-[#4d88ff]">*</span></label>
                                <input value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-brand-600 outline-none" placeholder="Ho Chi Minh City" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Zipcode</label>
                                <input value={formData.zipcode} onChange={e=>setFormData({...formData, zipcode: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-brand-600 outline-none tracking-widest" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">YouTube Video Walkthrough URL</label>
                            <input value={formData.video_url} onChange={e=>setFormData({...formData, video_url: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-[#4d88ff] focus:ring-2 focus:ring-brand-600 outline-none" placeholder="https://youtu.be/..." />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">
                                <MapPin className="inline w-4 h-4 mr-1 text-[#4d88ff]" />
                                Pin Property Location on Map
                            </label>
                            <LocationPicker
                                initialLat={formData.latitude}
                                initialLng={formData.longitude}
                                onSelect={({ lat, lng, address }) => {
                                    setFormData(f => ({
                                        ...f,
                                        latitude: lat,
                                        longitude: lng,
                                        address: address || f.address,
                                    }));
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Street Address</label>
                            <input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-brand-600 outline-none" placeholder="Auto-filled from map, or type manually" />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Record Initialized Securely!</h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">Your database entry is safely parked in the cloud. Now, upload high-resolution imagery via Multer pipeline to complete the listing.</p>
                        </div>
                        
                        <div className="border-2 border-dashed border-ocean-500/30 hover:border-ocean-400 rounded-3xl p-12 text-center transition-all bg-black/30 hover:bg-ocean-900/10 group">
                            <input type="file" multiple id="imageUpload" className="hidden" onChange={(e) => setImages(e.target.files)} accept="image/*" />
                            <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-20 h-20 bg-ocean-500/10 text-ocean-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-10 h-10" />
                                </div>
                                <span className="text-white font-bold text-xl mb-2">Click to select files</span>
                                <span className="text-gray-500">Upload up to 10 photos (JPG, PNG)</span>
                                
                                {images.length > 0 && (
                                    <div className="mt-8 px-6 py-3 bg-ocean-500 text-white rounded-xl font-bold uppercase tracking-wider animate-bounce shadow-[0_0_20px_rgba(73,136,196,0.5)]">
                                        {images.length} files attached and ready
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                )}

                <div className="mt-10 flex justify-between pt-8 border-t border-white/5 relative z-10">
                    <button 
                        onClick={() => setStep(step - 1)} 
                        disabled={step === 1 || step === 4}
                        className="px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-0"
                    >
                        Go Back
                    </button>
                    
                    {step < 4 ? (
                        <button 
                            disabled={loading || (step === 2 && !formData.price_usd) || (step === 3 && !formData.city) || (step === 1 && !formData.title)}
                            onClick={handleNext}
                            className="bg-ocean-500 text-white font-bold uppercase tracking-wider py-3.5 px-10 rounded-xl hover:bg-ocean-400 transition-all shadow-lg hover:shadow-ocean-500/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Transmitting Data...' : step === 3 ? 'Initialize Smart Record' : 'Continue Forward'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleUploadMedia}
                            disabled={loading}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-10 rounded-xl uppercase tracking-wider disabled:opacity-50 outline-none border-none shadow-none filter-none"
                        >
                            {loading ? 'Uploading Multi-Part Streams...' : images.length > 0 ? `Upload ${images.length} Photos & Save` : 'Skip Media & Save List'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
