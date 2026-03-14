import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import RatingStars from '../../components/RatingStars.jsx';
import { ArrowLeft, Truck, MapPin, ArrowRight, Star, Weight } from 'lucide-react';

export default function LoadMatches() {
  const { id } = useParams();
  const api = useApi();
  const [drivers, setDrivers] = useState([]);
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMatches(); }, [id]);

  async function fetchMatches() {
    try {
      const res = await api.get(`/loads/${id}/matches`);
      setDrivers(res.drivers || []);
      setLoad(res.load);
    } catch (err) {}
    setLoading(false);
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <Link to="/shipper/my-loads" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={14} /> Back to My Loads
        </Link>

        {load && (
          <div className="card mb-6">
            <h1 className="text-lg font-bold text-white mb-2">Matching Drivers for: {load.cargo_type}</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">{load.pickup_city}</span>
              <ArrowRight size={12} className="text-gray-600" />
              <span className="text-red-400">{load.delivery_city}</span>
              <span className="text-gray-500">· {load.weight_tons}t · ₹{Number(load.offered_price).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-24" />)}</div>
        ) : drivers.length > 0 ? (
          <div className="space-y-4">
            {drivers.map(d => (
              <div key={d.id} className="card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Truck size={22} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{d.driver_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <RatingStars rating={d.avg_rating || 0} size={12} />
                        <span>{d.total_ratings || 0} ratings</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {d.truck_type && <p className="text-gray-300">{d.truck_type}</p>}
                    {d.capacity_tons && <p className="text-gray-500">{d.capacity_tons}t capacity</p>}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-xs text-gray-500">
                  <span><MapPin size={12} className="inline" /> {d.current_city} → {d.destination_city}</span>
                  {d.registration_number && <span>🚛 {d.registration_number}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Truck size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No matching drivers found yet. Drivers will appear as they broadcast availability on nearby routes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
