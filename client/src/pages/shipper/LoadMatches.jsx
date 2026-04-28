import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import RatingStars from '../../components/RatingStars.jsx';
import { ArrowLeft, Truck, MapPin, ArrowRight, Send, X, Camera } from 'lucide-react';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

const PHOTO_LABEL = { vehicle_front: 'Front', vehicle_left: 'Left', vehicle_right: 'Right' };
import toast from 'react-hot-toast';

export default function LoadMatches() {
  const { uuid } = useParams();
  const api = useApi();
  const { settings } = useSettings();
  const primary = settings.primary_color || '#0f172a';
  const accent  = settings.accent_color  || '#f59e0b';

  const [drivers, setDrivers]     = useState([]);
  const [load, setLoad]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [confirm, setConfirm]     = useState(null);   // driver object to confirm
  const [sending, setSending]     = useState(false);

  useEffect(() => { fetchMatches(); }, [uuid]);

  async function fetchMatches() {
    try {
      const res = await api.get(`/loads/${uuid}/matches`);
      setDrivers(res.drivers || []);
      setLoad(res.load);
    } catch (err) {}
    setLoading(false);
  }

  async function handleConnect() {
    if (!confirm) return;
    setSending(true);
    try {
      const res = await api.post(`/loads/${uuid}/connect-driver`, { driver_id: confirm.user_id });
      toast.success(`Request sent! ${confirm.driver_name} will see a notification in the app.`);
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    }
    setSending(false);
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <Link to="/shipper/my-loads" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-6">
          <ArrowLeft size={13} /> Back to My Loads
        </Link>

        {load && (
          <div className="card mb-6">
            <h1 className="text-lg font-bold text-navy-900 mb-2">Matching Drivers for: {load.cargo_type}</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-700 font-medium">{load.pickup_city}</span>
              <ArrowRight size={12} className="text-slate-400" />
              <span className="text-red-600 font-medium">{load.delivery_city}</span>
              <span className="text-slate-400">· {load.weight_tons}t · ₹{Number(load.offered_price).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-24" />)}</div>
        ) : drivers.length > 0 ? (
          <div className="space-y-4">
            {drivers.map(d => (
              <div key={d.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary }}>
                      <Truck size={20} style={{ color: accent }} />
                    </div>
                    <div>
                      <p className="text-navy-900 font-semibold">{d.driver_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <RatingStars rating={d.avg_rating || 0} size={11} />
                        <span>{d.total_ratings || 0} ratings</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      {d.truck_type    && <p className="text-slate-600">{d.truck_type}</p>}
                      {d.capacity_tons && <p className="text-slate-400 text-xs">{d.capacity_tons}t capacity</p>}
                    </div>
                    <button
                      onClick={() => setConfirm(d)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: accent, color: primary }}
                      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                      onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                    >
                      <Send size={13} /> Connect
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {d.current_city} → {d.destination_city}</span>
                  {d.registration_number && <span>🚛 {d.registration_number}</span>}
                </div>

                {/* Vehicle photos */}
                {d.vehicle_photos && d.vehicle_photos.length > 0 ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {d.vehicle_photos.map(p => (
                      <a
                        key={p.doc_type}
                        href={`${BACKEND}${p.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative shrink-0 w-28 h-20 rounded-xl overflow-hidden border border-slate-200 group"
                      >
                        <img
                          src={`${BACKEND}${p.file_url}`}
                          alt={PHOTO_LABEL[p.doc_type]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-0.5 text-center">
                          {PHOTO_LABEL[p.doc_type]}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <Camera size={12} /> No vehicle photos uploaded
                  </div>
                )}
              </div>
            ))}
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
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
                <Send size={18} style={{ color: accent }} />
              </div>
              <button onClick={() => setConfirm(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <h3 className="text-lg font-black text-navy-900 mb-1">Send Load Request?</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will email <span className="font-semibold text-navy-900">{confirm.driver_name}</span> with
              your load details and ask them to accept it.
            </p>

            <div className="p-3.5 rounded-xl mb-5 text-sm space-y-1" style={{ backgroundColor: `${accent}0d`, border: `1px solid ${accent}25` }}>
              <p className="text-slate-600"><span className="font-medium" style={{ color: primary }}>Load:</span> {load?.cargo_type}</p>
              <p className="text-slate-600"><span className="font-medium" style={{ color: primary }}>Route:</span> {load?.pickup_city} → {load?.delivery_city}</p>
              <p className="text-slate-600"><span className="font-medium" style={{ color: primary }}>Price:</span> ₹{Number(load?.offered_price).toLocaleString('en-IN')}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
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
