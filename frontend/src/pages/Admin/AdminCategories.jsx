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
        if (!window.confirm('Xóa tỉnh/thành này? Tất cả các quận/huyện trực thuộc cũng sẽ bị xóa.')) return;
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
        if (!window.confirm('Xóa tiện ích này? Tiện ích sẽ bị gỡ bỏ khỏi tất cả các tin đăng.')) return;
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/admin/features/${id}`, { withCredentials: true });
        load();
    };

    const inputCls = "border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-surface";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Danh mục</h1>
                <p className="text-slate-500 mt-1">Quản lý tỉnh/thành phố, quận/huyện và loại bất động sản</p>
            </div>

            {/* Cities */}
            <Section title={`Tỉnh / Thành phố (${cities.length})`} icon={MapPin}>
                <form onSubmit={addCity} className="flex gap-3 mb-4">
                    <input value={newCity} onChange={e => setNewCity(e.target.value)}
                        placeholder="Tên Tỉnh / Thành phố" className={`flex-1 ${inputCls}`} />
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Thêm
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
            <Section title={`Quận / Huyện (${districts.length})`} icon={MapPin}>
                <form onSubmit={addDistrict} className="flex gap-3 mb-4 flex-wrap">
                    <select value={newDistrict.city_id} onChange={e => setNewDistrict(d => ({ ...d, city_id: e.target.value }))}
                        className={inputCls}>
                        <option value="">Chọn tỉnh/thành</option>
                        {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.name}</option>)}
                    </select>
                    <input value={newDistrict.name} onChange={e => setNewDistrict(d => ({ ...d, name: e.target.value }))}
                        placeholder="Tên Quận / Huyện" className={`flex-1 min-w-[140px] ${inputCls}`} />
                    <input value={newDistrict.zipcode} onChange={e => setNewDistrict(d => ({ ...d, zipcode: e.target.value }))}
                        placeholder="Mã bưu chính (tùy chọn)" className={`w-36 ${inputCls}`} />
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Thêm
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
            <Section title={`Loại bất động sản (${types.length})`} icon={Building}>
                <form onSubmit={addType} className="flex gap-3 mb-4 flex-wrap">
                    <input value={newType.name} onChange={e => setNewType(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Tên loại (VD: Biệt thự)" className={`flex-1 min-w-[160px] ${inputCls}`} />
                    <select value={newType.parent_id} onChange={e => setNewType(prev => ({ ...prev, parent_id: e.target.value }))}
                        className={inputCls}>
                        <option value="">Không có danh mục cha</option>
                        {types.filter(typ => !typ.parent_id).map(typ => <option key={typ.type_id} value={typ.type_id}>{typ.name}</option>)}
                    </select>
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Thêm
                    </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {types.map(typ => (
                        <div key={typ.type_id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-xl">
                            <div>
                                <span className="text-sm font-medium text-slate-800">{typ.name}</span>
                                {typ.parent_name && <span className="ml-2 text-xs text-slate-400">thuộc {typ.parent_name}</span>}
                            </div>
                            <button onClick={() => deleteType(typ.type_id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Features / Amenities */}
            <Section title={`Tiện ích / Tính năng (${features.length})`} icon={Sparkles}>
                <p className="text-xs text-slate-400 mb-3">Các mục này sẽ hiển thị dưới dạng hộp chọn khi tạo/sửa tin đăng (VD: Hồ bơi, Chỗ đậu xe, Phòng gym).</p>
                <form onSubmit={addFeature} className="flex gap-3 mb-4 flex-wrap">
                    <input
                        value={newFeature.name}
                        onChange={e => setNewFeature(f => ({ ...f, name: e.target.value }))}
                        placeholder="Tên tiện ích (VD: Hồ bơi)"
                        className={`flex-1 min-w-[160px] ${inputCls}`}
                    />
                    <input
                        value={newFeature.icon_name}
                        onChange={e => setNewFeature(f => ({ ...f, icon_name: e.target.value }))}
                        placeholder="Tên biểu tượng (tùy chọn, VD: waves)"
                        className={`w-48 ${inputCls}`}
                    />
                    <button type="submit" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> Thêm
                    </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {features.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">Chưa có tiện ích nào. Hãy thêm ở trên.</p>
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
