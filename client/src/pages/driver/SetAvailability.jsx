import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import CityCombobox from '../../components/CityCombobox.jsx';
import { CITIES } from '../../lib/cities.js';
import { Navigation, ArrowRight, Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';

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
      // If they entered the full capacity, it's not partial — treat as full truck
      if (truck && val >= truck.capacity_tons) {
        toast('Full truck capacity entered — marking as Full Truck.', { icon: 'ℹ️' });
        available_capacity_tons = null; // null = full truck on backend
      } else {
        available_capacity_tons = val;
      }
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
              <CityCombobox
                value={form.currentCity}
                onChange={c => setForm({ ...form, currentCity: c?.name || '' })}
                placeholder="Search your current city or state…"
                required
                disabledCity={form.destinationCity || null}
                iconColor="text-green-600"
              />
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
              <CityCombobox
                value={form.destinationCity}
                onChange={c => setForm({ ...form, destinationCity: c?.name || '' })}
                placeholder="Search your destination city or state…"
                required
                disabledCity={form.currentCity || null}
                iconColor="text-red-500"
              />
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
                  {maxCap && partialTons && !isNaN(parseFloat(partialTons)) && (() => {
                    const val = parseFloat(partialTons);
                    const isFull = val >= maxCap;
                    return (
                      <div className="space-y-1.5">
                        <div className="text-xs flex items-center gap-2" style={{ color: isFull ? '#b45309' : '#92400e' }}>
                          <div className="flex-1 bg-amber-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (val / maxCap) * 100)}%`,
                                backgroundColor: isFull ? '#f59e0b' : '#d97706',
                              }}
                            />
                          </div>
                          <span>{val.toFixed(1)} / {maxCap} tons</span>
                        </div>
                        {isFull && (
                          <p className="text-xs text-amber-700 font-medium">
                            ⚠️ This equals your full capacity — will be treated as a full empty truck, not partial.
                          </p>
                        )}
                      </div>
                    );
                  })()}
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
