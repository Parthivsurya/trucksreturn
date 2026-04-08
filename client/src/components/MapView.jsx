import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const pickupIcon = new L.DivIcon({
  html: '<div style="background:#16a34a;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(22,163,74,0.4)"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const deliveryIcon = new L.DivIcon({
  html: '<div style="background:#dc2626;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(220,38,38,0.4)"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const truckIcon = new L.DivIcon({
  html: '<div style="background:#0B2545;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(11,37,69,0.4)"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function MapView({
  markers = [],
  routes = [],
  center = [20.5937, 78.9629],
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

    const bounds = [];
    markers.forEach(m => {
      const icon = m.type === 'pickup' ? pickupIcon : m.type === 'delivery' ? deliveryIcon : truckIcon;
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      if (m.label) marker.bindPopup(`<b>${m.label}</b>`);
      bounds.push([m.lat, m.lng]);
    });

    routes.forEach(r => {
      L.polyline([r.from, r.to], {
        color: r.color || '#0B2545',
        weight: 3,
        opacity: 0.6,
        dashArray: r.dashed ? '8, 8' : null,
      }).addTo(map);
      bounds.push(r.from, r.to);
    });

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
      className={`w-full rounded-2xl border border-slate-200 shadow-sm ${className}`}
      style={{ height: '400px', ...style }}
    />
  );
}
