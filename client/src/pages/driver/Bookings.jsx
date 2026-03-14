import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi.js';
import RatingStars from '../../components/RatingStars.jsx';
import { BookOpen, MapPin, ArrowRight, Truck, IndianRupee, CheckCircle, Clock, Package, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverBookings() {
  const api = useApi();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => { loadBookings(); }, []);

  async function loadBookings() {
    try {
      const res = await api.get('/drivers/bookings');
      setBookings(res.bookings || []);
    } catch (err) {}
    setLoading(false);
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      loadBookings();
    } catch (err) { toast.error(err.message); }
  }

  async function submitRating() {
    try {
      await api.post(`/bookings/${ratingModal}/rate`, { score: ratingScore, comment: ratingComment });
      toast.success('Rating submitted!');
      setRatingModal(null);
      setRatingScore(0);
      setRatingComment('');
    } catch (err) { toast.error(err.message); }
  }

  const statusFlow = { confirmed: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered' };
  const statusLabels = { confirmed: 'Mark Picked Up', picked_up: 'Mark In Transit', in_transit: 'Mark Delivered' };

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <h1 className="section-title flex items-center gap-2 mb-1"><BookOpen className="text-blue-400" /> My Bookings</h1>
        <p className="section-subtitle mb-8">Track and manage your accepted loads</p>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-32" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No bookings yet. Accept loads from the Load Finder!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={16} className="text-blue-400" />
                      <span className="font-semibold text-white">{b.cargo_type}</span>
                      <span className="text-gray-500 text-xs">#{b.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">{b.pickup_city}</span>
                      <ArrowRight size={12} className="text-gray-600" />
                      <span className="text-red-400">{b.delivery_city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge-${b.status === 'confirmed' ? 'booked' : b.status === 'delivered' ? 'delivered' : 'transit'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                    <p className="text-amber-400 font-bold mt-1">₹{Number(b.agreed_price).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>Weight: {b.weight_tons}t</span>
                  <span>Shipper: {b.shipper_name}</span>
                  {b.shipper_rating > 0 && <span>⭐ {b.shipper_rating}</span>}
                </div>

                <div className="flex items-center gap-2">
                  {statusFlow[b.status] && (
                    <button onClick={() => updateStatus(b.id, statusFlow[b.status])}
                      className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
                      <CheckCircle size={14} /> {statusLabels[b.status]}
                    </button>
                  )}
                  {b.status === 'delivered' && (
                    <button onClick={() => setRatingModal(b.id)}
                      className="btn-amber !py-2 !px-4 text-sm flex items-center gap-1">
                      <Star size={14} /> Rate Shipper
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRatingModal(null)}>
            <div className="glass rounded-2xl p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Rate Shipper</h3>
              <div className="mb-4"><RatingStars rating={ratingScore} interactive onChange={setRatingScore} size={28} /></div>
              <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                className="input-field mb-4" rows={3} placeholder="Optional comment..." />
              <button onClick={submitRating} disabled={ratingScore === 0}
                className="btn-primary w-full">Submit Rating</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
