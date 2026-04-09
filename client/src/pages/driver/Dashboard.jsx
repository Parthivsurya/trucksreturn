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

  useEffect(() => { loadData(); }, []);

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
            <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="section-subtitle">Your return load dashboard overview</p>
          </div>
          <div className="flex gap-3">
            <Link to="/driver/availability" className="btn-primary flex items-center gap-2">
              <Navigation size={17} /> Set Route
            </Link>
            <Link to="/driver/find-loads" className="btn-secondary flex items-center gap-2">
              <Search size={17} /> Find Loads
            </Link>
          </div>
        </div>

        {/* Truck Registration Warning */}
        {!user?.truck && (
          <div className="card mb-8 border-amber-200 bg-amber-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Truck size={22} className="text-amber-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-900">Truck Registration Required</h2>
                  <p className="text-sm text-amber-700 mt-0.5">Register your truck before accepting loads or broadcasting your route.</p>
                </div>
              </div>
              <Link to="/driver/truck" className="btn-primary whitespace-nowrap shrink-0">
                Register Truck
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Truck}        label="Completed Trips"  value={stats.totalTrips}    color="blue" />
            <StatCard icon={IndianRupee}  label="Total Earnings"   value={stats.totalEarnings} color="green" prefix="₹" />
            <StatCard icon={BookOpen}     label="Active Bookings"  value={stats.activeBookings} color="amber" />
            <StatCard icon={Star}         label="Rating"           value={stats.avgRating || 'New'} color="purple" />
          </div>
        )}

        {/* Current Route */}
        {availability ? (
          <div className="card mb-8" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Navigation size={17} style={{ color: 'var(--accent)' }} /> Active Route
              </h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}>Active</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-green-700">
                <MapPin size={13} /> {availability.current_city}
              </div>
              <ArrowRight size={13} className="text-slate-400" />
              <div className="flex items-center gap-1 text-red-600">
                <MapPin size={13} /> {availability.destination_city}
              </div>
            </div>
          </div>
        ) : (
          <div className="card mb-8 text-center py-10">
            <Navigation size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No active route set. Set your return route to start finding loads.</p>
            <Link to="/driver/availability" className="btn-primary inline-flex items-center gap-2">
              <MapPin size={15} /> Set Return Route
            </Link>
          </div>
        )}

        {/* Matched Loads */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-navy-900">
              {matches.length > 0 ? `${matches.length} Matching Loads` : 'Available Loads'}
            </h2>
            {matches.length > 0 && (
              <Link to="/driver/find-loads" className="text-sm hover:underline flex items-center gap-1 font-medium" style={{ color: 'var(--accent)' }}>
                View all <ArrowRight size={13} />
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
            <div className="card text-center py-12">
              <Search size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {availability ? 'No matching loads found yet. Check back soon!' : 'Set your return route to see matching loads.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
