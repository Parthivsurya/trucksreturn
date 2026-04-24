import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import RatingStars from '../../components/RatingStars.jsx';
import { BookOpen, Package, ArrowRight, Star, ChevronRight, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmed',  cls: 'badge-booked'    },
  picked_up:  { label: 'Picked Up',  cls: 'badge-transit'   },
  in_transit: { label: 'In Transit', cls: 'badge-transit'   },
  delivered:  { label: 'Delivered',  cls: 'badge-delivered' },
  cancelled:  { label: 'Cancelled',  cls: 'badge-cancelled' },
};

export default function DriverBookings() {
  const api = useApi();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [ratingModal, setRatingModal]   = useState(null);
  const [ratingScore, setRatingScore]   = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => { loadBookings(); }, []);

  async function loadBookings() {
    try {
      const res = await api.get('/drivers/bookings');
      setBookings(res.bookings || []);
    } catch {}
    setLoading(false);
  }

  async function submitRating() {
    try {
      await api.post(`/bookings/${ratingModal}/rate`, { score: ratingScore, comment: ratingComment });
      toast.success('Rating submitted!');
      setRatingModal(null); setRatingScore(0); setRatingComment('');
      loadBookings(); // refreshes has_rated flag
    } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        <h1 className="section-title flex items-center gap-2 mb-1">
          <BookOpen size={24} className="text-navy-900" /> My Bookings
        </h1>
        <p className="section-subtitle mb-6">Tap a load to view details and take action</p>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-24" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">No bookings yet. Accept loads from the Load Finder!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => {
              const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.confirmed;
              return (
                <div key={b.id} className="relative">
                  <Link
                    to={`/driver/bookings/${b.uuid}`}
                    className="card-hover flex items-center gap-3 !p-4 group"
                  >
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center shrink-0">
                      <Package size={20} className="text-navy-900" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-navy-900">{b.cargo_type}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm flex-wrap">
                        <span className="text-green-700 truncate max-w-[90px]">{b.pickup_city}</span>
                        <ArrowRight size={11} className="text-slate-400 shrink-0" />
                        <span className="text-red-600 truncate max-w-[90px]">{b.delivery_city}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={st.cls}>{st.label}</span>
                        <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                          <IndianRupee size={11} />₹{Number(b.agreed_price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                  </Link>

                  {/* Rate Shipper button — sits below the card link */}
                  {b.status === 'delivered' && (
                    b.has_rated
                      ? <p className="mt-1.5 w-full py-2 text-sm text-center text-slate-400 border border-slate-100 rounded-xl bg-slate-50">Rating submitted ✓</p>
                      : <button
                          onClick={() => { setRatingModal(b.uuid); setRatingScore(0); setRatingComment(''); }}
                          className="mt-1.5 w-full !py-2 text-sm flex items-center justify-center gap-1.5 rounded-xl font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors active:scale-[0.97]"
                        >
                          <Star size={13} /> Rate Shipper
                        </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRatingModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-navy-900 mb-4">Rate Shipper</h3>
            <div className="mb-4">
              <RatingStars rating={ratingScore} interactive onChange={setRatingScore} size={28} />
            </div>
            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
              className="input-field mb-4" rows={3} placeholder="Optional comment…" />
            <button onClick={submitRating} disabled={ratingScore === 0} className="btn-primary w-full">
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
