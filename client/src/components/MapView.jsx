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
  className: '', iconSize: [12, 12], iconAnchor: [6, 6],
});
const deliveryIcon = new L.DivIcon({
  html: '<div style="background:#dc2626;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(220,38,38,0.4)"></div>',
  className: '', iconSize: [12, 12], iconAnchor: [6, 6],
});
const truckIcon = new L.DivIcon({
  html: '<div style="background:#0B2545;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(11,37,69,0.4)"></div>',
  className: '', iconSize: [14, 14], iconAnchor: [7, 7],
});

async function fetchRoadPath(from, to) {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch { /* timeout or network error — fall back to straight line */ }
  return null;
}

export default function MapView({
  markers = [],
  routes  = [],
  center  = [20.5937, 78.9629],
  zoom    = 5,
  className = '',
  style   = {},
}) {
  const mapRef      = useRef(null);  // DOM node
  const mapInstance = useRef(null);  // L.Map
  const layerGroup  = useRef(null);  // L.LayerGroup for markers + polylines

  // ── Create the map exactly once ────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center, zoom, zoomControl: true, attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    layerGroup.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      layerGroup.current  = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update layers whenever markers / routes change ─────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    const lg  = layerGroup.current;
    if (!map || !lg) return;

    // Track whether this effect run was superseded
    let cancelled = false;

    async function redraw() {
      // 1. Draw straight lines immediately so the map isn't empty while fetching
      lg.clearLayers();

      const bounds = [];

      markers.forEach(m => {
        const icon   = m.type === 'pickup' ? pickupIcon : m.type === 'delivery' ? deliveryIcon : truckIcon;
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(lg);
        if (m.label) marker.bindPopup(`<b>${m.label}</b>`);
        bounds.push([m.lat, m.lng]);
      });

      routes.forEach(r => {
        L.polyline([r.from, r.to], {
          color: r.color || '#0B2545', weight: 4, opacity: 0.5,
          dashArray: r.dashed ? '10, 8' : null,
        }).addTo(lg);
        bounds.push(r.from, r.to);
      });

      fitBounds(map, bounds);

      // 2. Fetch road paths and replace straight lines with real paths
      if (routes.length === 0) return;

      const paths = await Promise.all(routes.map(r => fetchRoadPath(r.from, r.to)));
      if (cancelled) return;

      // Redraw with road paths
      lg.clearLayers();
      const bounds2 = [];

      markers.forEach(m => {
        const icon   = m.type === 'pickup' ? pickupIcon : m.type === 'delivery' ? deliveryIcon : truckIcon;
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(lg);
        if (m.label) marker.bindPopup(`<b>${m.label}</b>`);
        bounds2.push([m.lat, m.lng]);
      });

      routes.forEach((r, i) => {
        const coords = paths[i] ?? [r.from, r.to];
        L.polyline(coords, {
          color:     r.color || '#0B2545',
          weight:    4,
          opacity:   0.75,
          dashArray: r.dashed ? '10, 8' : null,
          lineJoin:  'round',
          lineCap:   'round',
        }).addTo(lg);
        bounds2.push(r.from, r.to);
      });

      fitBounds(map, bounds2);
    }

    redraw();
    return () => { cancelled = true; };
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    JSON.stringify(markers.map(m => [m.lat, m.lng, m.type, m.label])),
    JSON.stringify(routes.map(r => [r.from, r.to, r.color, r.dashed])),
  ]);

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-2xl border border-slate-200 shadow-sm ${className}`}
      style={{ height: '400px', overflow: 'hidden', isolation: 'isolate', ...style }}
    />
  );
}

function fitBounds(map, bounds) {
  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [40, 40] });
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 10);
  }
}
