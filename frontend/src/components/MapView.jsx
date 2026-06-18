import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import useCurrencyStore from '../store/currencyStore';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const brandIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function FlyToCenter({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1 });
    }, [center, zoom, map]);
    return null;
}


export default function MapView({ properties = [], center, zoom = 12, height = '500px', singlePin = false }) {
    const { formatPrice } = useCurrencyStore();

    const mapped = properties.filter(p => p.latitude && p.longitude);

    const defaultCenter = [10.7769, 106.7009];
    const mapCenter = center || (mapped.length > 0
        ? [parseFloat(mapped[0].latitude), parseFloat(mapped[0].longitude)]
        : defaultCenter
    );

    if (mapped.length === 0 && !center) {
        return (
            <div
                className="flex flex-col items-center justify-center bg-[#051124] border border-white/10 rounded-2xl text-slate-500"
                style={{ height }}
            >
                <svg className="w-10 h-10 mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">No location data available.</p>
                <p className="text-xs mt-1 text-slate-600">Set coordinates when creating/editing a listing.</p>
            </div>
        );
    }

    return (
        <div style={{ height }} className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {center && <FlyToCenter center={center} zoom={zoom} />}

                {mapped.map(prop => (
                    <Marker
                        key={prop.property_id}
                        position={[parseFloat(prop.latitude), parseFloat(prop.longitude)]}
                        icon={brandIcon}
                    >
                        <Popup maxWidth={240} className="property-popup">
                            <div className="text-slate-900 min-w-[200px]">
                                {prop.primary_image && (
                                    <img
                                        src={prop.primary_image.startsWith('http') ? prop.primary_image : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${prop.primary_image}`}
                                        alt={prop.title}
                                        className="w-full h-28 object-cover rounded-t-lg -mt-3 -mx-3 mb-2"
                                        style={{ width: 'calc(100% + 24px)' }}
                                    />
                                )}
                                <p className="font-bold text-sm leading-tight mb-1">{prop.title}</p>
                                <p className="text-blue-600 font-bold text-base mb-2">{formatPrice(prop.price_usd)}</p>
                                {!singlePin && (
                                    <Link
                                        to={prop.slug ? `/properties/${prop.slug}` : `/properties/${prop.property_id}`}
                                        className="block text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        View Listing →
                                    </Link>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
