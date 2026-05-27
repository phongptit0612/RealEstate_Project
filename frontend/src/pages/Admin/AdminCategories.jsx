import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, MapPin, Building, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

function Section({ title, icon: Icon, children }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-brand-600" />
                    <h2 className="font-bold text-slate-900">{title}</h2>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && <div className="px-6 pb-6">{children}</div>}
        </div>
    );
}

export default function AdminCategories() {
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [types, setTypes] = useState([]);
    const [features, setFeatures] = useState([]);

    const [newCity, setNewCity] = useState('');
    const [newDistrict, setNewDistrict] = useState({ city_id: '', name: '', zipcode: '' });
    const [newType, setNewType] = useState({ name: '', parent_id: '' });
    const [newFeature, setNewFeature] = useState({ name: '', icon_name: '' });

    const load = async () => {
        const [c, d, t, f] = await Promise.all([
            axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/cities`, { withCredentials: true }),
            axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/districts`, { withCredentials: true }),
            axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/property-types`, { withCredentials: true }),
            axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/features`, { withCredentials: true }),
        ]);
        setCities(c.data);
        setDistricts(d.data);
        setTypes(t.data);
        setFeatures(f.data);
    };

    useEffect(() => { load(); }, []);

    const addCity = async (e) => {
        e.preventDefault();
        if (!newCity.trim()) return;
        await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/cities`, { name: newCity }, { withCredentials: true });
        setNewCity(''); load();
    };
    const deleteCity = async (id) => {
        if (!window.confirm('Delete this city? This will also delete all its districts.')) return;
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/cities/${id}`, { withCredentials: true });
        load();
    };

    const addDistrict = async (e) => {
        e.preventDefault();
        if (!newDistrict.city_id || !newDistrict.name.trim()) return;
        await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/districts`, newDistrict, { withCredentials: true });
        setNewDistrict({ city_id: '', name: '', zipcode: '' }); load();
    };
    const deleteDistrict = async (id) => {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/districts/${id}`, { withCredentials: true });
        load();
    };

    const addType = async (e) => {
        e.preventDefault();
        if (!newType.name.trim()) return;
        await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/property-types`, { name: newType.name, parent_id: newType.parent_id || null }, { withCredentials: true });
        setNewType({ name: '', parent_id: '' }); load();
    };
    const deleteType = async (id) => {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/property-types/${id}`, { withCredentials: true });
        load();
    };

    const addFeature = async (e) => {
        e.preventDefault();
        if (!newFeature.name.trim()) return;
        await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/features`, {
            name: newFeature.name,
            icon_name: newFeature.icon_name || null,
        }, { withCredentials: true });
        setNewFeature({ name: '', icon_name: '' }); load();
    };
    const deleteFeature = async (id) => {
        if (!window.confirm('Delete this amenity? It will be removed from all listings.')) return;
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/features/${id}`, { withCredentials: true });
        load();
    };

    const inputCls = "border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
                <p className="text-slate-500 mt-1">Manage cities, districts, and property types</p>
            </div>

            {/* Cities */}
            <Section title={`Cities (${cities.length})`} icon={MapPin}>
                <form onSubmit={addCity} className="flex gap-3 mb-4">
                    <input value={newCity} onChange={e => setNewCity(e.target.value)}
                        placeholder="City name" className={`flex-1 ${inputCls}`} />
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cities.map(c => (
                        <div key={c.city_id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-xl">
                            <span className="text-sm font-medium text-slate-800">{c.name}</span>
                            <button onClick={() => deleteCity(c.city_id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Districts */}
            <Section title={`Districts (${districts.length})`} icon={MapPin}>
                <form onSubmit={addDistrict} className="flex gap-3 mb-4 flex-wrap">
                    <select value={newDistrict.city_id} onChange={e => setNewDistrict(d => ({ ...d, city_id: e.target.value }))}
                        className={inputCls}>
                        <option value="">Select city</option>
                        {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.name}</option>)}
                    </select>
                    <input value={newDistrict.name} onChange={e => setNewDistrict(d => ({ ...d, name: e.target.value }))}
                        placeholder="District name" className={`flex-1 min-w-[140px] ${inputCls}`} />
                    <input value={newDistrict.zipcode} onChange={e => setNewDistrict(d => ({ ...d, zipcode: e.target.value }))}
                        placeholder="Zipcode (optional)" className={`w-28 ${inputCls}`} />
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {districts.map(d => (
                        <div key={d.district_id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-xl">
                            <div>
                                <span className="text-sm font-medium text-slate-800">{d.name}</span>
                                <span className="ml-2 text-xs text-slate-400">— {d.city_name} {d.zipcode ? `(${d.zipcode})` : ''}</span>
                            </div>
                            <button onClick={() => deleteDistrict(d.district_id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Property Types */}
            <Section title={`Property Types (${types.length})`} icon={Building}>
                <form onSubmit={addType} className="flex gap-3 mb-4 flex-wrap">
                    <input value={newType.name} onChange={e => setNewType(t => ({ ...t, name: e.target.value }))}
                        placeholder="Type name (e.g. Penthouse)" className={`flex-1 min-w-[160px] ${inputCls}`} />
                    <select value={newType.parent_id} onChange={e => setNewType(t => ({ ...t, parent_id: e.target.value }))}
                        className={inputCls}>
                        <option value="">No parent</option>
                        {types.filter(t => !t.parent_id).map(t => <option key={t.type_id} value={t.type_id}>{t.name}</option>)}
                    </select>
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {types.map(t => (
                        <div key={t.type_id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-xl">
                            <div>
                                <span className="text-sm font-medium text-slate-800">{t.name}</span>
                                {t.parent_name && <span className="ml-2 text-xs text-slate-400">under {t.parent_name}</span>}
                            </div>
                            <button onClick={() => deleteType(t.type_id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Features / Amenities */}
            <Section title={`Amenities / Features (${features.length})`} icon={Sparkles}>
                <p className="text-xs text-slate-400 mb-3">These appear as checkboxes when creating/editing a listing (e.g. Swimming Pool, Parking, Gym).</p>
                <form onSubmit={addFeature} className="flex gap-3 mb-4 flex-wrap">
                    <input
                        value={newFeature.name}
                        onChange={e => setNewFeature(f => ({ ...f, name: e.target.value }))}
                        placeholder="Amenity name (e.g. Swimming Pool)"
                        className={`flex-1 min-w-[160px] ${inputCls}`}
                    />
                    <input
                        value={newFeature.icon_name}
                        onChange={e => setNewFeature(f => ({ ...f, icon_name: e.target.value }))}
                        placeholder="Icon name (optional, e.g. waves)"
                        className={`w-44 ${inputCls}`}
                    />
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {features.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">No amenities yet. Add one above.</p>
                    ) : features.map(f => (
                        <div key={f.feature_id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-xl">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-800">{f.name}</span>
                                {f.icon_name && <span className="text-xs text-slate-400 ml-1">({f.icon_name})</span>}
                            </div>
                            <button onClick={() => deleteFeature(f.feature_id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}
