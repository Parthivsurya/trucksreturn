import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../../components/StatCard.jsx';
import LoadCard from '../../components/LoadCard.jsx';
import { Package, IndianRupee, BookOpen, Truck, PlusCircle, List, ArrowRight } from 'lucide-react';

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
            <h1 className="section-title">Welcome, {user?.name?.split(' ')[0]} 📦</h1>
            <p className="section-subtitle">Manage your shipments and find trucks</p>
          </div>
          <div className="flex gap-3">
            <Link to="/shipper/post-load" className="btn-primary flex items-center gap-2">
              <PlusCircle size={18} /> Post New Load
            </Link>
            <Link to="/shipper/my-loads" className="btn-secondary flex items-center gap-2">
              <List size={18} /> My Loads
            </Link>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Package} label="Total Loads" value={stats.totalLoads} color="blue" />
            <StatCard icon={Truck} label="Active Loads" value={stats.activeLoads} color="green" />
            <StatCard icon={BookOpen} label="Bookings" value={stats.totalBookings} color="amber" />
            <StatCard icon={IndianRupee} label="Total Spent" value={stats.totalSpent} color="purple" prefix="₹" />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Loads</h2>
          <Link to="/shipper/my-loads" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentLoads.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLoads.map(load => (
              <LoadCard key={load.id} load={load} onClick={() => {}} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Package size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No loads posted yet.</p>
            <Link to="/shipper/post-load" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle size={16} /> Post Your First Load
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
