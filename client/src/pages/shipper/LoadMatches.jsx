import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import RatingStars from '../../components/RatingStars.jsx';
import { ArrowLeft, Truck, MapPin, ArrowRight } from 'lucide-react';

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
              <div key={d.id} className="card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-navy-50 border border-navy-200 flex items-center justify-center">
                      <Truck size={20} className="text-navy-900" />
                    </div>
                    <div>
                      <p className="text-navy-900 font-semibold">{d.driver_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <RatingStars rating={d.avg_rating || 0} size={11} />
                        <span>{d.total_ratings || 0} ratings</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {d.truck_type     && <p className="text-slate-600">{d.truck_type}</p>}
                    {d.capacity_tons  && <p className="text-slate-400 text-xs">{d.capacity_tons}t capacity</p>}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {d.current_city} → {d.destination_city}</span>
                  {d.registration_number && <span>🚛 {d.registration_number}</span>}
                </div>
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
    </div>
  );
}
