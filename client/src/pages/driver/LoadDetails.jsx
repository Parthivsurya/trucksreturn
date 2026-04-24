import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import RatingStars from '../../components/RatingStars.jsx';
import { Package, MapPin, ArrowRight, Weight, IndianRupee, Clock, User, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoadDetails() {
  const { uuid } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => { loadData(); }, [uuid]);

  async function loadData() {
    try {
      const res = await api.get(`/loads/${uuid}`);
      setLoad(res.load);
    } catch (err) { toast.error('Failed to load details'); }
    setLoading(false);
  }

  async function handleAccept() {
    setBooking(true);
    try {
      await api.post('/bookings', { load_id: load.id, agreed_price: load.offered_price });
      toast.success('Booking confirmed! Load accepted.');
      navigate('/driver/bookings');
    } catch (err) {
      toast.error(err.message || 'Failed to accept');
    }
    setBooking(false);
  }

  if (loading) return <div className="page-container"><p className="text-center text-slate-500 py-20">Loading…</p></div>;
  if (!load)   return <div className="page-container"><p className="text-center text-slate-500 py-20">Load not found</p></div>;

  const markers = [
    { lat: load.pickup_lat,   lng: load.pickup_lng,   type: 'pickup',   label: `Pickup: ${load.pickup_city}` },
    { lat: load.delivery_lat, lng: load.delivery_lng, type: 'delivery', label: `Delivery: ${load.delivery_city}` },
  ];
  const routes = [{ from: [load.pickup_lat, load.pickup_lng], to: [load.delivery_lat, load.delivery_lng], color: '#16a34a' }];

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <Link to="/driver/find-loads" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-6">
          <ArrowLeft size={13} /> Back to Load Finder
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-navy-50 border border-navy-200 flex items-center justify-center">
                    <Package size={22} className="text-navy-900" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-navy-900">{load.cargo_type}</h1>
                    <span className={`badge-${load.status === 'open' ? 'open' : load.status}`}>{load.status}</span>
                  </div>
                </div>
                <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>₹{Number(load.offered_price).toLocaleString('en-IN')}</p>
              </div>

              <div className="rounded-xl mb-4 border border-slate-100 overflow-hidden">
                <div className="flex items-start gap-3 p-3.5 bg-green-50 border-b border-slate-100">
                  <MapPin size={15} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-0.5">Pickup</p>
                    <p className="text-sm font-bold text-navy-900">{load.pickup_city}</p>
                    {load.pickup_address && (
                      <p className="text-sm text-green-800 mt-0.5">{load.pickup_address}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 bg-red-50">
                  <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-0.5">Delivery</p>
                    <p className="text-sm font-bold text-navy-900">{load.delivery_city}</p>
                    {load.delivery_address && (
                      <p className="text-sm text-red-700 mt-0.5">{load.delivery_address}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Weight size={15} className="text-slate-400" /> {load.weight_tons} tons</div>
                {load.timeline && <div className="flex items-center gap-2 text-slate-600"><Clock size={15} className="text-slate-400" /> {load.timeline}</div>}
              </div>

              {load.description && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-slate-700 text-sm">{load.description}</p>
                </div>
              )}
              {load.handling_instructions && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Handling Instructions</p>
                  <p className="text-amber-700 text-sm">{load.handling_instructions}</p>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="h-[220px] lg:h-[350px]">
              <MapView markers={markers} routes={routes} style={{ height: '100%' }} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shipper Info */}
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Posted by</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <User size={17} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-navy-900 font-semibold">{load.shipper_name}</p>
                  <RatingStars rating={load.shipper_rating || 0} size={12} />
                </div>
              </div>
            </div>

            {/* Accept — desktop sidebar */}
            {load.status === 'open' && (
              <div className="hidden lg:block card text-center" style={{ border: '1.5px solid var(--accent)', background: 'var(--accent-subtle)' }}>
                <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--accent)' }}>Offered Price</p>
                <p className="text-3xl font-black mb-1" style={{ color: 'var(--accent)' }}>
                  ₹{Number(load.offered_price).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-500 mb-4">Accept to confirm this load</p>
                <button onClick={handleAccept} disabled={booking}
                  className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text, #0f172a)' }}
                  onMouseEnter={e => !booking && (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  <CheckCircle size={17} /> {booking ? 'Booking…' : 'Accept Load'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky accept bar */}
      {load.status === 'open' && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-white border-t border-slate-200 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Pickup · {load.pickup_city}</p>
              {load.pickup_address
                ? <p className="text-xs font-semibold text-navy-900 truncate">{load.pickup_address}</p>
                : <p className="text-lg font-black" style={{ color: 'var(--accent)' }}>₹{Number(load.offered_price).toLocaleString('en-IN')}</p>
              }
            </div>
            <button onClick={handleAccept} disabled={booking}
              className="flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text, #0f172a)' }}
            >
              <CheckCircle size={17} /> {booking ? 'Booking…' : 'Accept Load'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
