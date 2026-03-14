import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import RatingStars from '../../components/RatingStars.jsx';
import { ArrowLeft, Truck, MapPin, Package, CheckCircle, Clock, NavigationIcon, Star, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Tracking() {
  const { id } = useParams();
  const api = useApi();
  const [booking, setBooking] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => { fetchBooking(); }, [id]);

  async function fetchBooking() {
    try {
      // Find booking by load id
      const shipperBookings = await api.get('/bookings/shipper');
      const found = shipperBookings.bookings?.find(b => b.load_id === parseInt(id)) || shipperBookings.bookings?.[0];
      if (found) {
        const res = await api.get(`/bookings/${found.id}`);
        setBooking(res.booking);
        setTracking(res.tracking || []);
      }
    } catch (err) {}
    setLoading(false);
  }

  async function submitRating() {
    try {
      await api.post(`/bookings/${booking.id}/rate`, { score: ratingScore, comment: ratingComment });
      toast.success('Rating submitted!');
      setRatingModal(false);
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return <div className="page-container"><p className="text-center text-gray-400 py-20">Loading...</p></div>;
  if (!booking) return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto card text-center py-16">
        <Truck size={48} className="text-gray-700 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">No active booking found for this load.</p>
        <Link to="/shipper/my-loads" className="btn-secondary inline-block">Back to My Loads</Link>
      </div>
    </div>
  );

  const statusSteps = ['confirmed', 'picked_up', 'in_transit', 'delivered'];
  const currentIdx = statusSteps.indexOf(booking.status);

  const markers = [
    { lat: booking.pickup_lat, lng: booking.pickup_lng, type: 'pickup', label: `Pickup: ${booking.pickup_city}` },
    { lat: booking.delivery_lat, lng: booking.delivery_lng, type: 'delivery', label: `Delivery: ${booking.delivery_city}` },
  ];
  if (tracking.length > 0) {
    markers.push({ lat: tracking[0].lat, lng: tracking[0].lng, type: 'truck', label: '🚛 Last Known Position' });
  }
  const routes = [{ from: [booking.pickup_lat, booking.pickup_lng], to: [booking.delivery_lat, booking.delivery_lng], color: '#10b981' }];

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <Link to="/shipper/my-loads" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={14} /> Back to My Loads
        </Link>

        <h1 className="section-title mb-6">Shipment Tracking</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <MapView markers={markers} routes={routes} style={{ height: '400px' }} />

            {/* Timeline */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Delivery Progress</h3>
              <div className="flex items-center gap-2">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2
                      ${i <= currentIdx ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                      {i <= currentIdx ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <p className={`text-xs text-center ${i <= currentIdx ? 'text-green-400' : 'text-gray-600'}`}>
                      {step.replace('_', ' ')}
                    </p>
                    {i < statusSteps.length - 1 && (
                      <div className={`absolute h-0.5 w-full ${i < currentIdx ? 'bg-green-500' : 'bg-white/10'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-sm text-gray-400 mb-3">Shipment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Cargo</span><span className="text-white">{booking.cargo_type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="text-white">{booking.weight_tons}t</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="text-amber-400 font-bold">₹{Number(booking.agreed_price).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Route</span><span className="text-white">{booking.pickup_city} → {booking.delivery_city}</span></div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm text-gray-400 mb-3">Driver</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"><Truck size={18} className="text-blue-400" /></div>
                <div>
                  <p className="text-white font-semibold">{booking.driver_name}</p>
                  <RatingStars rating={booking.driver_rating || 0} size={12} />
                </div>
              </div>
              {booking.truck_type && <p className="text-xs text-gray-500 mt-2">{booking.truck_type} · {booking.registration_number}</p>}
            </div>

            {booking.status === 'delivered' && (
              <button onClick={() => setRatingModal(true)} className="btn-amber w-full flex items-center justify-center gap-2">
                <Star size={16} /> Rate Driver
              </button>
            )}
          </div>
        </div>

        {/* Rating Modal */}
        {ratingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRatingModal(false)}>
            <div className="glass rounded-2xl p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Rate Driver</h3>
              <div className="mb-4"><RatingStars rating={ratingScore} interactive onChange={setRatingScore} size={28} /></div>
              <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} className="input-field mb-4" rows={3} placeholder="Comment..." />
              <button onClick={submitRating} disabled={ratingScore === 0} className="btn-primary w-full">Submit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
