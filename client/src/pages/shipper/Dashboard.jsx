import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadCard from '../../components/LoadCard.jsx';
import { Package, Truck, PlusCircle, List, ArrowRight } from 'lucide-react';

export default function ShipperDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [recentLoads, setRecentLoads] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [statsRes, loadsRes] = await Promise.all([
        api.get('/loads/shipper-stats'),
        api.get('/loads/mine'),
      ]);
      setStats(statsRes.stats);
      setRecentLoads((loadsRes.loads || []).slice(0, 6));
    } catch (err) {}
  }

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="section-title">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="section-subtitle">Manage your shipments and find trucks</p>
          </div>
          <div className="flex gap-3">
            <Link to="/shipper/post-load" className="btn-primary flex items-center gap-2">
              <PlusCircle size={17} /> Post New Load
            </Link>
            <Link to="/shipper/my-loads" className="btn-secondary flex items-center gap-2">
              <List size={17} /> My Loads
            </Link>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 mb-8 border-y border-slate-200 divide-x divide-slate-200">
            {[
              { label: 'Total Loads',  value: stats.totalLoads },
              { label: 'Active Loads', value: stats.activeLoads },
              { label: 'Bookings',     value: stats.totalBookings },
              { label: 'Total Spent',  value: `₹${Number(stats.totalSpent).toLocaleString('en-IN')}` },
            ].map((s, i) => (
              <div key={i} className="py-5 px-4 sm:px-6">
                <p className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-navy-900">Recent Loads</h2>
          <Link to="/shipper/my-loads" className="text-sm hover:underline flex items-center gap-1 font-medium" style={{ color: 'var(--accent)' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {recentLoads.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLoads.map(load => <LoadCard key={load.id} load={load} />)}
          </div>
        ) : (
          <div className="card text-center py-14">
            <Package size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No loads posted yet.</p>
            <Link to="/shipper/post-load" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle size={15} /> Post Your First Load
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
