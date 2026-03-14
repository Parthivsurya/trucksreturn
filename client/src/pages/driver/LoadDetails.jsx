import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import RatingStars from '../../components/RatingStars.jsx';
import { Package, MapPin, ArrowRight, Weight, IndianRupee, Clock, Truck, User, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoadDetails() {
  const { id } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const res = await api.get(`/loads/${id}`);
      setLoad(res.load);
    } catch (err) { toast.error('Failed to load details'); }
    setLoading(false);
  }

  async function handleAccept() {
    setBooking(true);
    try {
      await api.post('/bookings', { load_id: parseInt(id), agreed_price: load.offered_price });
      toast.success('Booking confirmed! Load accepted.');
      navigate('/driver/bookings');
    } catch (err) {
      toast.error(err.message || 'Failed to accept');
    }
    setBooking(false);
  }

  if (loading) return <div className="page-container"><div className="text-center text-gray-400 py-20">Loading...</div></div>;
  if (!load) return <div className="page-container"><div className="text-center text-gray-400 py-20">Load not found</div></div>;

  const markers = [
    { lat: load.pickup_lat, lng: load.pickup_lng, type: 'pickup', label: `📦 Pickup: ${load.pickup_city}` },
    { lat: load.delivery_lat, lng: load.delivery_lng, type: 'delivery', label: `📍 Delivery: ${load.delivery_city}` },
  ];
  const routes = [{ from: [load.pickup_lat, load.pickup_lng], to: [load.delivery_lat, load.delivery_lng], color: '#10b981' }];

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <Link to="/driver/find-loads" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={14} /> Back to Load Finder
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Package size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{load.cargo_type}</h1>
                    <span className={`badge-${load.status === 'open' ? 'open' : load.status}`}>{load.status}</span>
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-400">₹{Number(load.offered_price).toLocaleString('en-IN')}</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl mb-4">
                <div className="flex items-center gap-1 text-green-400"><MapPin size={16} />{load.pickup_city}</div>
                <ArrowRight size={16} className="text-gray-600" />
                <div className="flex items-center gap-1 text-red-400"><MapPin size={16} />{load.delivery_city}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-300"><Weight size={16} className="text-gray-500" /> {load.weight_tons} tons</div>
                {load.timeline && <div className="flex items-center gap-2 text-gray-300"><Clock size={16} className="text-gray-500" /> {load.timeline}</div>}
              </div>

              {load.description && <div className="mb-3"><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-gray-300 text-sm">{load.description}</p></div>}
              {load.handling_instructions && <div><p className="text-xs text-gray-500 mb-1">Handling</p><p className="text-amber-300 text-sm">{load.handling_instructions}</p></div>}
            </div>

            {/* Map */}
            <MapView markers={markers} routes={routes} style={{ height: '350px' }} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shipper Info */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Posted by</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <User size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">{load.shipper_name}</p>
                  <RatingStars rating={load.shipper_rating || 0} size={12} />
                </div>
              </div>
            </div>

            {/* Accept */}
            {load.status === 'open' && (
              <div className="card text-center">
                <p className="text-gray-400 text-sm mb-4">Accept this load at the offered price</p>
                <button onClick={handleAccept} disabled={booking} className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> {booking ? 'Booking...' : 'Accept Load'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
