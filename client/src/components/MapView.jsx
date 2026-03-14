import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const pickupIcon = new L.DivIcon({
  html: '<div style="background:#10b981;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(16,185,129,0.5)"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const deliveryIcon = new L.DivIcon({
  html: '<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(239,68,68,0.5)"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const truckIcon = new L.DivIcon({
  html: '<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(59,130,246,0.6)"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function MapView({
  markers = [],        // [{ lat, lng, type: 'pickup'|'delivery'|'truck', label }]
  routes = [],         // [{ from: [lat,lng], to: [lat,lng], color }]
  center = [20.5937, 78.9629],  // India center
  zoom = 5,
  className = '',
  style = {},
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers
    const bounds = [];
    markers.forEach(m => {
      const icon = m.type === 'pickup' ? pickupIcon : m.type === 'delivery' ? deliveryIcon : truckIcon;
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      if (m.label) marker.bindPopup(`<b>${m.label}</b>`);
      bounds.push([m.lat, m.lng]);
    });

    // Draw route lines
    routes.forEach(r => {
      L.polyline([r.from, r.to], {
        color: r.color || '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: r.dashed ? '10, 10' : null,
      }).addTo(map);
      bounds.push(r.from, r.to);
    });

    // Fit bounds
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 10);
    }

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [markers, routes, center, zoom]);

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-2xl border border-white/10 ${className}`}
      style={{ height: '400px', ...style }}
    />
  );
}
