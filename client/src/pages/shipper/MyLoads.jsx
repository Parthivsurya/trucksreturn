import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import LoadCard from '../../components/LoadCard.jsx';
import { List, PlusCircle, Filter } from 'lucide-react';

export default function MyLoads() {
  const api = useApi();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchLoads(); }, []);

  async function fetchLoads() {
    try {
      const res = await api.get('/loads/mine');
      setLoads(res.loads || []);
    } catch (err) {}
    setLoading(false);
  }

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'booked', label: 'Booked' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="section-title flex items-center gap-2"><List className="text-blue-400" /> My Loads</h1>
            <p className="section-subtitle">{loads.length} loads posted</p>
          </div>
          <Link to="/shipper/post-load" className="btn-primary flex items-center gap-2">
            <PlusCircle size={18} /> Post New Load
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${filter === t.key ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-28" />)}</div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(load => (
              <div key={load.id}>
                <LoadCard load={load} />
                {load.status === 'open' && (
                  <Link to={`/shipper/loads/${load.id}/matches`}
                    className="mt-2 block text-center text-sm text-blue-400 hover:text-blue-300 py-2 glass rounded-xl">
                    View Matching Drivers →
                  </Link>
                )}
                {['booked', 'in_transit', 'picked_up'].includes(load.status) && (
                  <Link to={`/shipper/tracking/${load.booking_count > 0 ? load.id : ''}`}
                    className="mt-2 block text-center text-sm text-amber-400 hover:text-amber-300 py-2 glass rounded-xl">
                    Track Shipment →
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <List size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">{filter === 'all' ? 'No loads posted yet.' : `No ${filter} loads.`}</p>
          </div>
        )}
      </div>
    </div>
  );
}
