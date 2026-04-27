import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import { Navigation, MapPin, ArrowRight, Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES = [
  { name: 'Delhi',      lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai',     lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore',  lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai',    lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata',    lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad',  lat: 17.3850, lng: 78.4867 },
  { name: 'Pune',       lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad',  lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur',     lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow',    lat: 26.8467, lng: 80.9462 },
  { name: 'Kochi',      lat: 9.9312,  lng: 76.2673 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Varanasi',   lat: 25.3176, lng: 82.9739 },
  { name: 'Agra',       lat: 27.1767, lng: 78.0081 },
  { name: 'Patna',      lat: 25.6093, lng: 85.1376 },
  { name: 'Trivandrum', lat: 8.5241,  lng: 76.9366 },
  { name: 'Palakkad',   lat: 10.8505, lng: 76.2711 },
  { name: 'Gurugram',   lat: 28.4595, lng: 77.0266 },
  { name: 'Tirupur',    lat: 11.1085, lng: 77.3411 },
];

export default function SetAvailability() {
  const api = useApi();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [truck, setTruck] = useState(null);
  const [form, setForm] = useState({ currentCity: '', destinationCity: '' });
  const [spaceMode, setSpaceMode] = useState('full'); // 'full' | 'partial'
  const [partialTons, setPartialTons] = useState('');

  useEffect(() => {
    api.get('/drivers/truck').then(res => setTruck(res.truck)).catch(() => {});
  }, []);

  const currentCityData = CITIES.find(c => c.name === form.currentCity);
  const destCityData    = CITIES.find(c => c.name === form.destinationCity);

  const markers = [];
  const routes  = [];
  if (currentCityData) markers.push({ lat: currentCityData.lat, lng: currentCityData.lng, type: 'truck',    label: `Current: ${currentCityData.name}` });
  if (destCityData)    markers.push({ lat: destCityData.lat,    lng: destCityData.lng,    type: 'delivery', label: `Destination: ${destCityData.name}` });
  if (currentCityData && destCityData) {
    routes.push({ from: [currentCityData.lat, currentCityData.lng], to: [destCityData.lat, destCityData.lng], color: '#0f172a', dashed: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentCityData || !destCityData) { toast.error('Select both cities'); return; }
    if (form.currentCity === form.destinationCity) { toast.error('Current and destination cannot be the same'); return; }

    let available_capacity_tons = null;
    if (spaceMode === 'partial') {
      const val = parseFloat(partialTons);
      if (!partialTons || isNaN(val) || val <= 0) { toast.error('Enter a valid available capacity'); return; }
      if (truck && val > truck.capacity_tons) { toast.error(`Cannot exceed your truck's ${truck.capacity_tons} ton capacity`); return; }
      available_capacity_tons = val;
    }

    setLoading(true);
    try {
      await api.post('/drivers/availability', {
        current_lat:      currentCityData.lat,
        current_lng:      currentCityData.lng,
        dest_lat:         destCityData.lat,
        dest_lng:         destCityData.lng,
        current_city:     currentCityData.name,
        destination_city: destCityData.name,
        available_capacity_tons,
      });
      toast.success('Return route set! Finding matching loads…');
      navigate('/driver/find-loads');
    } catch (err) {
      toast.error(err.message || 'Failed to set route');
    } finally {
      setLoading(false);
    }
  }

  const maxCap = truck?.capacity_tons;

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <h1 className="section-title mb-1">Set Return Route</h1>
        <p className="section-subtitle mb-8">Tell us where you are and where you're heading — we'll find loads along the way.</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="card space-y-6 h-fit">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600" /> Current Location
              </label>
              <select value={form.currentCity} onChange={e => setForm({ ...form, currentCity: e.target.value })}
                className="input-field" required>
                <option value="">Select your current city</option>
                {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <ArrowRight size={16} className="text-slate-400 rotate-90" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Return Destination
              </label>
              <select value={form.destinationCity} onChange={e => setForm({ ...form, destinationCity: e.target.value })}
                className="input-field" required>
                <option value="">Select your destination city</option>
                {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* Truck space selector */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-3 block">Available Truck Space</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSpaceMode('full')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    spaceMode === 'full'
                      ? 'border-navy-900 bg-navy-50 text-navy-900'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Truck size={22} />
                  <span className="text-sm font-semibold">Full Truck</span>
                  {maxCap && <span className="text-xs opacity-70">{maxCap} tons free</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSpaceMode('partial')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    spaceMode === 'partial'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Package size={22} />
                  <span className="text-sm font-semibold">Partial Space</span>
                  <span className="text-xs opacity-70">Truck is partly loaded</span>
                </button>
              </div>

              {spaceMode === 'partial' && (
                <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <p className="text-xs text-amber-700 font-medium">
                    How many tons of free space do you have?
                    {maxCap && <span className="ml-1 opacity-70">(max {maxCap} tons)</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0.5"
                      max={maxCap || 100}
                      step="0.5"
                      value={partialTons}
                      onChange={e => setPartialTons(e.target.value)}
                      placeholder={`e.g. 5`}
                      className="input-field !py-2 w-32 text-center text-lg font-bold"
                      required={spaceMode === 'partial'}
                    />
                    <span className="text-sm text-amber-700 font-medium">tons available</span>
                  </div>
                  {maxCap && partialTons && !isNaN(parseFloat(partialTons)) && (
                    <div className="text-xs text-amber-700 flex items-center gap-2">
                      <div className="flex-1 bg-amber-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (parseFloat(partialTons) / maxCap) * 100)}%` }}
                        />
                      </div>
                      <span>{parseFloat(partialTons).toFixed(1)} / {maxCap} tons</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {currentCityData && destCityData && (
              <div className="p-4 rounded-xl bg-navy-50 border border-navy-200">
                <p className="text-sm text-navy-900 font-medium">
                  Route: {form.currentCity} → {form.destinationCity}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {spaceMode === 'full'
                    ? `Full truck — loads up to ${maxCap ?? '?'} tons will be shown`
                    : `Partial space — loads up to ${partialTons || '?'} tons will be shown`
                  }
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2">
              <Navigation size={17} />
              {loading ? 'Setting Route…' : 'Set Route & Find Loads'}
            </button>
          </form>

          {/* Map */}
          <div className="h-[240px] lg:h-[500px]">
            <MapView markers={markers} routes={routes} style={{ height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
