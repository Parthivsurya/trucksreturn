import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import {
  ArrowLeft, Package, MapPin, ArrowRight, Phone, CheckCircle,
  XCircle, AlertTriangle, Navigation, Weight, IndianRupee, Clock,
  User, Truck, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STATUS_LABELS = {
  confirmed:  { label: 'Confirmed',   color: 'badge-booked'    },
  picked_up:  { label: 'Picked Up',   color: 'badge-transit'   },
  in_transit: { label: 'In Transit',  color: 'badge-transit'   },
  delivered:  { label: 'Delivered',   color: 'badge-delivered' },
  cancelled:  { label: 'Cancelled',   color: 'badge-cancelled' },
};

const STATUS_FLOW   = { confirmed: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered' };
const STATUS_ACTION = { confirmed: 'Mark Picked Up', picked_up: 'Mark In Transit', in_transit: 'Mark Delivered' };
const CANCELLABLE   = ['confirmed'];

export default function BookingDetail() {
  const { uuid } = useParams();
  const api = useApi();
  const navigate = useNavigate();

  const [booking, setBooking]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [currentPos, setCurrentPos] = useState(null); // {lat, lng}

  useEffect(() => { fetchBooking(); }, [uuid]);

  // Get driver's current GPS location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silent if denied
    );
  }, []);

  async function fetchBooking() {
    try {
      const res = await api.get(`/bookings/${uuid}`);
      setBooking(res.booking);
    } catch {
      toast.error('Failed to load booking');
    }
    setLoading(false);
  }

  async function updateStatus(status) {
    setUpdating(true);
    try {
      await api.put(`/bookings/${uuid}/status`, { status });
      if (status === 'cancelled') {
        toast.success('Load dropped. It is now available for other drivers.');
        navigate('/driver/bookings');
      } else {
        toast.success(`Marked as ${STATUS_ACTION[booking.status]?.replace('Mark ', '') || status.replace('_', ' ')}`);
        fetchBooking();
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
    setUpdating(false);
  }

  if (loading) return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-28" />)}
      </div>
    </div>
  );

  if (!booking) return (
    <div className="page-container text-center py-20">
      <p className="text-slate-500">Booking not found.</p>
    </div>
  );

  const badge = STATUS_LABELS[booking.status] || STATUS_LABELS.confirmed;

  // Build map markers
  const markers = [];
  const routes  = [];

  if (currentPos) {
    markers.push({ lat: currentPos.lat, lng: currentPos.lng, type: 'truck', label: 'Your Location' });
  }
  markers.push({ lat: booking.pickup_lat,   lng: booking.pickup_lng,   type: 'pickup',   label: `Pickup: ${booking.pickup_city}` });
  markers.push({ lat: booking.delivery_lat, lng: booking.delivery_lng, type: 'delivery', label: `Delivery: ${booking.delivery_city}` });

  if (currentPos) {
    routes.push({ from: [currentPos.lat, currentPos.lng], to: [booking.pickup_lat, booking.pickup_lng], color: '#0f172a', dashed: true });
  }
  routes.push({ from: [booking.pickup_lat, booking.pickup_lng], to: [booking.delivery_lat, booking.delivery_lng], color: '#16a34a' });

  // Distances
  const distToPickup   = currentPos ? haversineKm(currentPos.lat, currentPos.lng, booking.pickup_lat, booking.pickup_lng) : null;
  const routeDistance  = haversineKm(booking.pickup_lat, booking.pickup_lng, booking.delivery_lat, booking.delivery_lng);

  return (
    <div className="page-container">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <Link to="/driver/bookings" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-5">
          <ArrowLeft size={13} /> Back to Bookings
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-navy-50 border border-navy-200 flex items-center justify-center shrink-0">
              <Package size={22} className="text-navy-900" />
            </div>
            <div>
              <h1 className="text-xl font-black text-navy-900">{booking.cargo_type}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{booking.pickup_city} → {booking.delivery_city}</p>
            </div>
          </div>
          <span className={badge.color}>{badge.label}</span>
        </div>

        {/* Distance summary bar */}
        <div className="card mb-5 !p-4">
          <div className="flex items-center gap-3 flex-wrap text-sm">
            {distToPickup !== null && (
              <>
                <div className="flex items-center gap-1.5 text-navy-900">
                  <Navigation size={14} className="text-blue-500" />
                  <span className="font-semibold">{distToPickup < 1 ? `${Math.round(distToPickup * 1000)} m` : `${distToPickup.toFixed(1)} km`}</span>
                  <span className="text-slate-400">to pickup</span>
                </div>
                <span className="text-slate-300">·</span>
              </>
            )}
            <div className="flex items-center gap-1.5 text-navy-900">
              <MapPin size={14} className="text-green-600" />
              <span className="font-semibold">{routeDistance.toFixed(1)} km</span>
              <span className="text-slate-400">pickup → delivery</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--accent)' }}>
              <IndianRupee size={13} />
              ₹{Number(booking.agreed_price).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="h-[280px] sm:h-[340px] mb-5">
          <MapView markers={markers} routes={routes} style={{ height: '100%' }} />
        </div>

        {/* Pickup & Delivery addresses */}
        <div className="card mb-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={14} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-0.5">Pickup</p>
              <p className="font-semibold text-navy-900">{booking.pickup_city}</p>
              {booking.pickup_address && (
                <p className="text-sm text-slate-600 mt-0.5">{booking.pickup_address}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={14} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-0.5">Delivery</p>
              <p className="font-semibold text-navy-900">{booking.delivery_city}</p>
              {booking.delivery_address && (
                <p className="text-sm text-slate-600 mt-0.5">{booking.delivery_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Load details */}
        <div className="card mb-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Load Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Weight size={14} className="text-slate-400" /> {booking.weight_tons} tons
            </div>
            {booking.timeline && (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={14} className="text-slate-400" /> {booking.timeline}
              </div>
            )}
          </div>
          {booking.description && (
            <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">{booking.description}</p>
          )}
          {booking.handling_instructions && (
            <p className="text-sm text-amber-700 mt-2 flex items-start gap-1.5">
              <FileText size={13} className="shrink-0 mt-0.5" /> {booking.handling_instructions}
            </p>
          )}
        </div>

        {/* Shipper info */}
        <div className="card mb-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Shipper</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <User size={17} className="text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-navy-900">{booking.shipper_name}</p>
                {booking.shipper_phone && (
                  <p className="text-xs text-slate-400 mt-0.5">{booking.shipper_phone}</p>
                )}
              </div>
            </div>
            {booking.shipper_phone && (
              <a href={`tel:${booking.shipper_phone}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors active:scale-[0.97]">
                <Phone size={14} /> Call
              </a>
            )}
          </div>
        </div>

        {/* Action buttons — show for all active (non-terminal) statuses */}
        {STATUS_FLOW[booking.status] && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => updateStatus(STATUS_FLOW[booking.status])}
              disabled={updating}
              className="btn-primary flex-1 !py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CheckCircle size={16} /> {STATUS_ACTION[booking.status]}
            </button>

            {/* Drop Load — only allowed before pickup */}
            {CANCELLABLE.includes(booking.status) && (
              <button
                onClick={() => setCancelModal(true)}
                disabled={updating}
                className="flex-1 !py-3.5 flex items-center justify-center gap-2 rounded-xl font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors active:scale-[0.97] disabled:opacity-60"
              >
                <XCircle size={16} /> Drop Load
              </button>
            )}
          </div>
        )}

      </div>

      {/* Cancel confirmation */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setCancelModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">Drop this load?</h3>
                <p className="text-xs text-slate-500 mt-0.5">It will be released back to other drivers.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Only drop a load if you genuinely cannot complete it. This will affect your reliability record.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(false)} className="btn-secondary flex-1 !py-2.5 text-sm">Keep Load</button>
              <button
                onClick={() => { setCancelModal(false); updateStatus('cancelled'); }}
                className="flex-1 !py-2.5 text-sm rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors active:scale-[0.97]"
              >
                Yes, Drop Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
