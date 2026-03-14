import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import LoadCard from '../../components/LoadCard.jsx';
import MapView from '../../components/MapView.jsx';
import { Search, MapPin, ArrowRight, Navigation, SlidersHorizontal, X } from 'lucide-react';

export default function LoadFinder() {
  const api = useApi();
  const [matches, setMatches] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState(50);
  const [cargoFilter, setCargoFilter] = useState('');

  useEffect(() => {
    loadMatches();
  }, [radius]);

  async function loadMatches() {
    setLoading(true);
    try {
      const res = await api.get(`/drivers/matches?radius=${radius}`);
      setMatches(res.matches || []);
      setAvailability(res.availability || null);
    } catch (err) { /* ignore */ }
    setLoading(false);
  }

  const filtered = cargoFilter ? matches.filter(m => m.cargo_type.toLowerCase().includes(cargoFilter.toLowerCase())) : matches;

  const markers = [];
  const routes = [];

  if (availability) {
    markers.push({ lat: availability.current_lat, lng: availability.current_lng, type: 'truck', label: `🚛 You: ${availability.current_city}` });
    markers.push({ lat: availability.dest_lat, lng: availability.dest_lng, type: 'delivery', label: `🏠 Home: ${availability.destination_city}` });
    routes.push({
      from: [availability.current_lat, availability.current_lng],
      to: [availability.dest_lat, availability.dest_lng],
      color: '#3b82f6',
      dashed: true,
    });
  }

  filtered.forEach(load => {
    markers.push({ lat: load.pickup_lat, lng: load.pickup_lng, type: 'pickup', label: `📦 ${load.cargo_type} (${load.pickup_city})` });
  });

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="section-title flex items-center gap-2">
              <Search size={28} className="text-blue-400" /> Return Load Finder
            </h1>
            {availability && (
              <p className="section-subtitle flex items-center gap-2 mt-1">
                <span className="text-green-400">{availability.current_city}</span>
                <ArrowRight size={14} className="text-gray-600" />
                <span className="text-red-400">{availability.destination_city}</span>
                <span className="text-gray-600">·</span>
                <span>{filtered.length} loads found</span>
              </p>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="card mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Search Radius (km)</label>
                <input type="range" min="10" max="200" value={radius} onChange={e => setRadius(e.target.value)}
                  className="w-full accent-blue-500" />
                <span className="text-xs text-blue-400">{radius} km</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cargo Type</label>
                <input type="text" placeholder="e.g. Textiles, Steel..."
                  value={cargoFilter} onChange={e => setCargoFilter(e.target.value)}
                  className="input-field !py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        {!availability && (
          <div className="card text-center py-12 mb-6">
            <Navigation size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">Set your return route first to see matching loads.</p>
            <Link to="/driver/availability" className="btn-primary inline-flex items-center gap-2">
              <MapPin size={16} /> Set Return Route
            </Link>
          </div>
        )}

        {availability && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <MapView markers={markers} routes={routes} className="lg:sticky lg:top-24" style={{ height: '600px' }} />
            </div>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="card animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-white/5 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="space-y-4">
                  {filtered.map(load => (
                    <Link to={`/driver/loads/${load.id}`} key={load.id}>
                      <LoadCard load={load} showDistance />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Search size={40} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400">No matching loads found. Try increasing the search radius or check back later.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
