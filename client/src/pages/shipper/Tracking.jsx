import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import RatingStars from '../../components/RatingStars.jsx';
import { ArrowLeft, Truck, CheckCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Tracking() {
  const { uuid } = useParams();
  const api = useApi();
  const [booking, setBooking] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null); // Date of last fetch
  const [secondsAgo, setSecondsAgo] = useState(0);

  const ACTIVE_STATUSES = ['confirmed', 'picked_up', 'in_transit'];

  useEffect(() => { fetchBooking(); }, [uuid]);

  // Live updates: prefer SSE; fall back to 15s polling if the stream fails.
  useEffect(() => {
    if (!booking) return;
    if (!ACTIVE_STATUSES.includes(booking.status)) return;

    const token = localStorage.getItem('token');
    if (!token || typeof EventSource === 'undefined') {
      const interval = setInterval(fetchBooking, 15000);
      return () => clearInterval(interval);
    }

    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const es = new EventSource(`${apiBase}/bookings/${uuid}/track/stream?access_token=${encodeURIComponent(token)}`);
    let pollInterval = null;

    es.addEventListener('tracking', (e) => {
      const update = JSON.parse(e.data);
      setTracking((prev) => [update, ...prev]);
      setLastUpdated(Date.now());
    });

    es.addEventListener('status', () => {
      fetchBooking();
    });

    es.onerror = () => {
      // Stream broke — close it and fall back to polling
      es.close();
      if (!pollInterval) {
        pollInterval = setInterval(fetchBooking, 15000);
      }
    };

    return () => {
      es.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [booking?.status, uuid]);

  // Seconds-ago counter — ticks every second
  useEffect(() => {
    if (!lastUpdated) return;
    setSecondsAgo(0);
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  async function fetchBooking() {
    try {
      const res = await api.get(`/bookings/${uuid}`);
      setBooking(res.booking);
      setTracking(res.tracking || []);
      setLastUpdated(Date.now());
    } catch (err) {}
    setLoading(false);
  }

  async function submitRating() {
    try {
      await api.post(`/bookings/${uuid}/rate`, { score: ratingScore, comment: ratingComment });
      toast.success('Rating submitted!');
      setRatingModal(false);
      fetchBooking(); // refreshes has_rated flag
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return <div className="page-container"><p className="text-center text-slate-500 py-20">Loading…</p></div>;
  if (!booking) return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto card text-center py-16">
        <Truck size={40} className="text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 mb-4">No active booking found for this load.</p>
        <Link to="/shipper/my-loads" className="btn-secondary inline-block">Back to My Loads</Link>
      </div>
    </div>
  );

  const statusSteps = ['confirmed', 'picked_up', 'in_transit', 'delivered'];
  const currentIdx  = statusSteps.indexOf(booking.status);

  const markers = [
    { lat: booking.pickup_lat,   lng: booking.pickup_lng,   type: 'pickup',   label: `Pickup: ${booking.pickup_city}` },
    { lat: booking.delivery_lat, lng: booking.delivery_lng, type: 'delivery', label: `Delivery: ${booking.delivery_city}` },
  ];
  if (tracking.length > 0) {
    markers.push({ lat: tracking[0].lat, lng: tracking[0].lng, type: 'truck', label: 'Last Known Position' });
  }
  const routes = [{ from: [booking.pickup_lat, booking.pickup_lng], to: [booking.delivery_lat, booking.delivery_lng], color: '#16a34a' }];

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <Link to="/shipper/my-loads" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-6">
          <ArrowLeft size={13} /> Back to My Loads
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="section-title !mb-0">Shipment Tracking</h1>
          {ACTIVE_STATUSES.includes(booking.status) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              Live · updated {secondsAgo}s ago
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <MapView markers={markers} routes={routes} style={{ height: '400px' }} />

            {/* Timeline */}
            <div className="card">
              <h3 className="font-semibold text-navy-900 mb-5">Delivery Progress</h3>
              <div className="flex items-start gap-0">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center relative">
                    {/* Connector line */}
                    {i < statusSteps.length - 1 && (
                      <div
                        className="absolute left-1/2 top-4 w-full h-0.5 -translate-y-1/2 transition-colors"
                        style={{ backgroundColor: i < currentIdx ? 'var(--accent)' : '#e2e8f0' }}
                      />
                    )}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 relative z-10"
                      style={i <= currentIdx
                        ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text, #0f172a)' }
                        : { backgroundColor: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0' }
                      }
                    >
                      {i <= currentIdx ? <CheckCircle size={15} /> : i + 1}
                    </div>
                    <p className={`text-xs text-center capitalize ${i <= currentIdx ? 'font-medium' : 'text-slate-400'}`}
                      style={i <= currentIdx ? { color: 'var(--accent)' } : {}}>
                      {step.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Shipment Details</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cargo</span>
                  <span className="text-navy-900 font-medium">{booking.cargo_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weight</span>
                  <span className="text-navy-900 font-medium">{booking.weight_tons}t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Price</span>
                  <span className="text-navy-900 font-bold">₹{Number(booking.agreed_price).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Route</span>
                  <span className="text-navy-900 font-medium text-right">{booking.pickup_city} → {booking.delivery_city}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Driver</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-200 flex items-center justify-center">
                  <Truck size={17} className="text-navy-900" />
                </div>
                <div>
                  <p className="text-navy-900 font-semibold">{booking.driver_name}</p>
                  <RatingStars rating={booking.driver_rating || 0} size={12} />
                </div>
              </div>
              {booking.truck_type && (
                <p className="text-xs text-slate-400 mt-2">{booking.truck_type} · {booking.registration_number}</p>
              )}
            </div>

            {booking.status === 'delivered' && (
              booking.has_rated
                ? <p className="w-full py-3 text-sm text-center text-slate-400 border border-slate-100 rounded-xl bg-slate-50">Rating submitted ✓</p>
                : <button onClick={() => setRatingModal(true)}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    <Star size={15} /> Rate Driver
                  </button>
            )}
          </div>
        </div>

        {/* Rating Modal */}
        {ratingModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRatingModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-navy-900 mb-4">Rate Driver</h3>
              <div className="mb-4">
                <RatingStars rating={ratingScore} interactive onChange={setRatingScore} size={28} />
              </div>
              <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                className="input-field mb-4" rows={3} placeholder="Comment…" />
              <button onClick={submitRating} disabled={ratingScore === 0} className="btn-primary w-full">
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
