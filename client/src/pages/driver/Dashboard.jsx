import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../../components/StatCard.jsx';
import LoadCard from '../../components/LoadCard.jsx';
import { Truck, IndianRupee, Star, BookOpen, MapPin, Search, ArrowRight, Navigation } from 'lucide-react';

export default function DriverDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, matchRes] = await Promise.all([
        api.get('/drivers/stats'),
        api.get('/drivers/matches'),
      ]);
      setStats(statsRes.stats);
      setMatches(matchRes.matches || []);
      setAvailability(matchRes.availability || null);
    } catch (err) { /* ignore */ }
  }

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="section-subtitle">Here's your return load dashboard overview</p>
          </div>
          <div className="flex gap-3">
            <Link to="/driver/availability" className="btn-primary flex items-center gap-2">
              <Navigation size={18} /> Set Route
            </Link>
            <Link to="/driver/find-loads" className="btn-secondary flex items-center gap-2">
              <Search size={18} /> Find Loads
            </Link>
          </div>
        </div>

        {/* Truck Registration Warning */}
        {!user?.truck && (
          <div className="card mb-8 border border-amber-500/30 bg-amber-500/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Truck size={24} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Truck Registration Required</h2>
                  <p className="text-sm text-amber-200">You must register your truck details before you can accept loads or actively broadcast your return route.</p>
                </div>
              </div>
              <Link to="/driver/truck" className="btn-amber whitespace-nowrap">
                Register Truck
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Truck} label="Completed Trips" value={stats.totalTrips} color="blue" />
            <StatCard icon={IndianRupee} label="Total Earnings" value={stats.totalEarnings} color="green" prefix="₹" />
            <StatCard icon={BookOpen} label="Active Bookings" value={stats.activeBookings} color="amber" />
            <StatCard icon={Star} label="Rating" value={stats.avgRating || 'New'} color="purple" />
          </div>
        )}

        {/* Current Route */}
        {availability ? (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Navigation size={18} className="text-green-400" /> Active Route
              </h2>
              <span className="badge-open">Active</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-green-400">
                <MapPin size={14} /> {availability.current_city}
              </div>
              <ArrowRight size={14} className="text-gray-600" />
              <div className="flex items-center gap-1 text-red-400">
                <MapPin size={14} /> {availability.destination_city}
              </div>
            </div>
          </div>
        ) : (
          <div className="card mb-8 text-center py-8">
            <Navigation size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-3">No active route set. Set your return route to start finding loads.</p>
            <Link to="/driver/availability" className="btn-primary inline-flex items-center gap-2">
              <MapPin size={16} /> Set Return Route
            </Link>
          </div>
        )}

        {/* Matched Loads */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {matches.length > 0 ? `${matches.length} Matching Loads` : 'Available Loads'}
            </h2>
            {matches.length > 0 && (
              <Link to="/driver/find-loads" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {matches.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.slice(0, 6).map(load => (
                <Link to={`/driver/loads/${load.id}`} key={load.id}>
                  <LoadCard load={load} showDistance />
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-10">
              <Search size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">
                {availability ? 'No matching loads found yet. Check back soon!' : 'Set your return route to see matching loads.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
