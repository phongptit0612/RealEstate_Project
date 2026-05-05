import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-gray-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <img src="/logo.png" alt="LuxEstates" className="w-8 h-8 object-contain filter invert" />
                        <span className="text-xl font-bold text-slate-900 tracking-tight">LuxEstates</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Redefining luxury real estate worldwide. Discover exclusive properties and experience unparalleled service.
                    </p>
                </div>
                
                <div>
                    <h4 className="text-slate-900 font-bold mb-4 uppercase tracking-widest text-sm">Quick Links</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><Link to="/" className="hover:text-[#0033ab] transition-colors">Home</Link></li>
                        <li><Link to="/properties" className="hover:text-[#0033ab] transition-colors">Properties</Link></li>
                        <li><a href="#" className="hover:text-[#0033ab] transition-colors">Agencies</a></li>
                        <li><a href="#" className="hover:text-[#0033ab] transition-colors">About Us</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-slate-900 font-bold mb-4 uppercase tracking-widest text-sm">Contact Us</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-[#0033ab] mt-0.5" />
                            <span>123 Luxury Ave, Beverly Hills, CA 90210</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#0033ab]" />
                            <span>+1 (800) 123-4567</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#0033ab]" />
                            <span>contact@luxestates.com</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-slate-900 font-bold mb-4 uppercase tracking-widest text-sm">Follow Us</h4>
                    <div className="flex gap-4 font-bold text-sm">
                        <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#0033ab] hover:border-[#0033ab] hover:text-white transition-all shadow-sm">Fb</a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#0033ab] hover:border-[#0033ab] hover:text-white transition-all shadow-sm">X</a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#0033ab] hover:border-[#0033ab] hover:text-white transition-all shadow-sm">Ig</a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#0033ab] hover:border-[#0033ab] hover:text-white transition-all shadow-sm">In</a>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500 flex-shrink-0">
                    &copy; {new Date().getFullYear()} LuxEstates. All rights reserved.
                </p>
                <div className="flex gap-6 text-xs text-slate-500">
                    <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
