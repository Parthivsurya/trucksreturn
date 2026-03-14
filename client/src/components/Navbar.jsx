import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Truck, Package, LogOut, Menu, X, LayoutDashboard, MapPin, Search, BookOpen, PlusCircle, List, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const driverLinks = [
    { to: '/driver', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/driver/availability', label: 'Set Route', icon: MapPin },
    { to: '/driver/find-loads', label: 'Find Loads', icon: Search },
    { to: '/driver/bookings', label: 'Bookings', icon: BookOpen },
  ];

  const shipperLinks = [
    { to: '/shipper', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shipper/post-load', label: 'Post Load', icon: PlusCircle },
    { to: '/shipper/my-loads', label: 'My Loads', icon: List },
  ];

  const links = user?.role === 'driver' ? driverLinks : user?.role === 'shipper' ? shipperLinks : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Return</span>
              <span className="text-white">Load</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${location.pathname === to
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <div className={`w-2 h-2 rounded-full ${user.role === 'driver' ? 'bg-green-400' : 'bg-amber-400'}`} />
                  <span className="text-sm text-gray-300">{user.name}</span>
                  <span className="text-xs text-gray-500 capitalize">({user.role})</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary !py-2 !px-4 text-sm">Login</Link>
                <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            {user && (
              <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && user && (
        <div className="md:hidden glass border-t border-white/5 animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${location.pathname === to
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
