import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import RatingStars from '../../components/RatingStars.jsx';
import { ArrowLeft, Truck, MapPin, ArrowRight, Send, X, Camera, Hash, Weight, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

const PHOTO_ORDER = ['vehicle_front', 'vehicle_left', 'vehicle_right'];
const PHOTO_LABEL = { vehicle_front: 'Front View', vehicle_left: 'Left Side', vehicle_right: 'Right Side' };

// Auto-scrolling photo strip with manual prev/next arrows
function PhotoStrip({ photos }) {
  const trackRef = useRef(null);
  const [current, setCurrent] = useState(0);

  // Auto-advance every 3s
  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => {
      setCurrent(c => (c + 1) % photos.length);
    }, 3000);
    return () => clearInterval(t);
  }, [photos.length]);

  // Scroll to current slide
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const slide = el.children[current];
    if (slide) slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [current]);

  function prev() { setCurrent(c => (c - 1 + photos.length) % photos.length); }
  function next() { setCurrent(c => (c + 1) % photos.length); }

  if (photos.length === 0) {
    return (
      <div className="h-44 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Camera size={28} />
        <p className="text-xs">No vehicle photos uploaded</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: '180px' }}>
      {/* Slides */}
      <div ref={trackRef} className="flex h-full overflow-x-hidden">
        {photos.map((p, i) => (
          <a
            key={p.doc_type}
            href={`${BACKEND}${p.file_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-full h-full relative"
          >
            <img
              src={`${BACKEND}${p.file_url}`}
              alt={PHOTO_LABEL[p.doc_type]}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <p className="text-white text-xs font-medium">{PHOTO_LABEL[p.doc_type]}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={e => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </>
      )}

      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.preventDefault(); setCurrent(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LoadMatches() {
  const { uuid } = useParams();
  const api = useApi();
  const { settings } = useSettings();
  const primary = settings.primary_color || '#0f172a';
  const accent  = settings.accent_color  || '#f59e0b';

  const [drivers, setDrivers] = useState([]);
  const [load, setLoad]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchMatches(); }, [uuid]);

  async function fetchMatches() {
    try {
      const res = await api.get(`/loads/${uuid}/matches`);
      setDrivers(res.drivers || []);
      setLoad(res.load);
    } catch {}
    setLoading(false);
  }

  async function handleConnect() {
    if (!confirm) return;
    setSending(true);
    try {
      await api.post(`/loads/${uuid}/connect-driver`, { driver_id: confirm.user_id });
      toast.success(`Request sent! ${confirm.driver_name} will see a notification in the app.`);
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    }
    setSending(false);
  }

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <Link to="/shipper/my-loads" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-6">
          <ArrowLeft size={13} /> Back to My Loads
        </Link>

        {load && (
          <div className="card mb-6">
            <h1 className="text-lg font-bold text-navy-900 mb-2">Matching Drivers for: {load.cargo_type}</h1>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-green-700 font-medium">{load.pickup_city}</span>
              <ArrowRight size={12} className="text-slate-400" />
              <span className="text-red-600 font-medium">{load.delivery_city}</span>
              <span className="text-slate-400">· {load.weight_tons}t · ₹{Number(load.offered_price).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-72" />)}
          </div>
        ) : drivers.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {drivers.map(d => {
              // Sort photos in fixed order
              const photos = PHOTO_ORDER
                .map(key => (d.vehicle_photos || []).find(p => p.doc_type === key))
                .filter(Boolean);

              return (
                <div key={d.id} className="card !p-0 overflow-hidden flex flex-col">

                  {/* Photo carousel */}
                  <div className="p-3 pb-0">
                    <PhotoStrip photos={photos} />
                  </div>

                  {/* Driver & truck details */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: primary }}>
                          <Truck size={18} style={{ color: accent }} />
                        </div>
                        <div>
                          <p className="font-bold text-navy-900 text-sm">{d.driver_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <RatingStars rating={d.avg_rating || 0} size={11} />
                            <span className="text-xs text-slate-400">{d.total_ratings || 0} ratings</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirm(d)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
                        style={{ backgroundColor: accent, color: primary }}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                        onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                      >
                        <Send size={12} /> Connect
                      </button>
                    </div>

                    {/* Truck details grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {d.truck_type && (
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                          <Truck size={11} className="text-slate-400 shrink-0" />
                          <span className="text-slate-600 truncate">{d.truck_type}</span>
                        </div>
                      )}
                      {d.capacity_tons && (
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                          <Weight size={11} className="text-slate-400 shrink-0" />
                          <span className="text-slate-600">{d.capacity_tons} tons</span>
                        </div>
                      )}
                      {d.registration_number && (
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                          <Hash size={11} className="text-slate-400 shrink-0" />
                          <span className="text-slate-600 truncate font-mono">{d.registration_number}</span>
                        </div>
                      )}
                      {d.home_state && (
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                          <Home size={11} className="text-slate-400 shrink-0" />
                          <span className="text-slate-600 truncate">{d.home_state}</span>
                        </div>
                      )}
                    </div>

                    {/* Route */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-green-700">{d.current_city}</span>
                      <ArrowRight size={10} className="text-slate-300 shrink-0" />
                      <span className="font-medium text-red-600">{d.destination_city}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-14">
            <Truck size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No matching drivers found yet. Drivers will appear as they broadcast availability on nearby routes.</p>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
                <Send size={18} style={{ color: accent }} />
              </div>
              <button onClick={() => setConfirm(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <h3 className="text-lg font-black text-navy-900 mb-1">Send Load Request?</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will notify <span className="font-semibold text-navy-900">{confirm.driver_name}</span> with your load details.
            </p>

            <div className="p-3.5 rounded-xl mb-5 text-sm space-y-1" style={{ backgroundColor: `${accent}0d`, border: `1px solid ${accent}25` }}>
              <p className="text-slate-600"><span className="font-medium" style={{ color: primary }}>Load:</span> {load?.cargo_type}</p>
              <p className="text-slate-600"><span className="font-medium" style={{ color: primary }}>Route:</span> {load?.pickup_city} → {load?.delivery_city}</p>
              <p className="text-slate-600"><span className="font-medium" style={{ color: primary }}>Price:</span> ₹{Number(load?.offered_price).toLocaleString('en-IN')}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={sending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: accent, color: primary }}
              >
                <Send size={14} /> {sending ? 'Sending…' : 'Yes, Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
