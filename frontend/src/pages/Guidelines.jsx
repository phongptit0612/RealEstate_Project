import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, AlertTriangle, Image as ImageIcon, FileText, Ban } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function Guidelines() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-surface font-sans flex flex-col">
            {/* Reusable Premium Navbar */}
            <Navbar />

            <div className="flex-grow pt-24 pb-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Listing Guidelines</h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            To ensure a premium, trustworthy, and safe experience for all our users, LuxEstates enforces a strict set of quality standards. Please review our guidelines before submitting your property.
                        </p>
                    </div>

                    {/* Content Grid */}
                    <div className="space-y-8">
                        
                        {/* Section 1 */}
                        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-emerald-100 text-emerald-600 p-2.5 rounded-xl flex-shrink-0">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-3">1. Accuracy of Information</h2>
                                    <p className="text-slate-600 leading-relaxed mb-4">
                                        All property details, including price, square footage, amenities, and location, must be 100% accurate. Misrepresenting a property's size or hiding crucial defects violates our trust policy.
                                    </p>
                                    <ul className="space-y-2 text-sm text-slate-500">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/> Ensure the address mapped is exactly where the property is located.</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/> State the exact number of legal bedrooms and bathrooms.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-ocean-500/5 blur-[50px] pointer-events-none group-hover:bg-ocean-500/10 transition-colors" />
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-ocean-100 text-ocean-600 p-2.5 rounded-xl flex-shrink-0">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-3">2. High-Quality Media</h2>
                                    <p className="text-slate-600 leading-relaxed mb-4">
                                        As a luxury platform, we require high-resolution images that clearly depict the property. Listings with blurry, heavily watermarked, or misleading photos will be rejected.
                                    </p>
                                    <ul className="space-y-2 text-sm text-slate-500">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/> Minimum resolution of 1920x1080 is highly recommended.</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/> Do not upload photos with heavy text overlays or personal contact info.</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/> Avoid using extreme wide-angle lenses that distort room sizes.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-amber-100 text-amber-600 p-2.5 rounded-xl flex-shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-3">3. Professional Descriptions</h2>
                                    <p className="text-slate-600 leading-relaxed">
                                        Your description should read professionally. Use proper grammar, capitalization, and formatting. Do not write the entire description in ALL CAPS. Avoid excessive exclamation marks or spammy sales phrases. Focus on the unique selling points, lifestyle benefits, and neighborhood highlights.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4 */}
                        <div className="bg-white rounded-3xl p-8 md:p-10 border border-red-50 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] pointer-events-none group-hover:bg-red-500/10 transition-colors" />
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-red-100 text-red-600 p-2.5 rounded-xl flex-shrink-0">
                                    <Ban className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-3">4. Prohibited Content</h2>
                                    <p className="text-slate-600 leading-relaxed mb-4">
                                        The following items are strictly prohibited on LuxEstates and will result in immediate listing deletion and potential account suspension:
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600 font-medium">
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-400"/> Fake or duplicate listings</div>
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-400"/> Bait-and-switch pricing</div>
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-400"/> Discriminatory language</div>
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-400"/> Listings not related to Real Estate</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-slate-500 mb-6">Ready to list your property and reach luxury buyers?</p>
                        <Link to="/dashboard/create" className="inline-flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-1">
                            Create Your Listing Now
                        </Link>
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    );
}
