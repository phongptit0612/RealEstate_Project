import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2, X } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function ClickHandler({ onMapClick }) {
    useMapEvents({ click: (e) => onMapClick(e.latlng) });
    return null;
}

function FlyTo({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 16, { animate: true, duration: 1 });
    }, [position, map]);
    return null;
}


export default function LocationPicker({ initialLat, initialLng, onSelect }) {
    const defaultCenter = [10.7769, 106.7009]; // HCMC
    const [position, setPosition] = useState(
        initialLat && initialLng ? [parseFloat(initialLat), parseFloat(initialLng)] : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [reverseLoading, setReverseLoading] = useState(false);

    // Reverse geocode — get address from lat/lng (Nominatim)
    const reverseGeocode = useCallback(async (lat, lng) => {
        setReverseLoading(true);
        try {
            const r = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await r.json();
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onSelect({ lat, lng, address });
        } catch {
            onSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        } finally {
            setReverseLoading(false);
        }
    }, [onSelect]);

    // Map click
    const handleMapClick = useCallback(({ lat, lng }) => {
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
        setSearchResults([]);
    }, [reverseGeocode]);

    // Search by name
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        setSearchResults([]);
        try {
            const r = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=vn`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await r.json();
            setSearchResults(data);
        } catch { /* silent */ }
        finally { setSearching(false); }
    };

    const pickResult = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition([lat, lng]);
        onSelect({ lat, lng, address: result.display_name });
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',')[0]);
    };

    return (
        <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search location (e.g. District 1, Ho Chi Minh City)..."
                        className="w-full bg-[#020813] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-all"
                    />
                    {searchQuery && (
                        <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <button type="submit" disabled={searching}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
            </form>

            {searchResults.length > 0 && (
                <div className="bg-[#051124] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {searchResults.map((r, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => pickResult(r)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-start gap-2"
                        >
                            <MapPin className="w-3.5 h-3.5 text-[#4d88ff] flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{r.display_name}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500">
                {reverseLoading ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Getting address...</>
                ) : position ? (
                    <><MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Pin set: </span>
                        {position[0].toFixed(6)}, {position[1].toFixed(6)}</>
                ) : (
                    <><MapPin className="w-3 h-3" /> Click on the map or search to set the property location</>
                )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl" style={{ height: '340px' }}>
                <MapContainer
                    center={position || defaultCenter}
                    zoom={position ? 15 : 12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <ClickHandler onMapClick={handleMapClick} />
                    {position && (
                        <>
                            <Marker position={position} icon={redIcon} />
                            <FlyTo position={position} />
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
