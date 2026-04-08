import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { Truck, LogOut, Menu, X, LayoutDashboard, MapPin, Search, BookOpen, PlusCircle, List } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const driverLinks = [
    { to: '/driver',              label: 'Dashboard', icon: LayoutDashboard },
    { to: '/driver/availability', label: 'Set Route', icon: MapPin },
    { to: '/driver/find-loads',   label: 'Find Loads', icon: Search },
    { to: '/driver/bookings',     label: 'Bookings',  icon: BookOpen },
  ];

  const shipperLinks = [
    { to: '/shipper',             label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shipper/post-load',   label: 'Post Load', icon: PlusCircle },
    { to: '/shipper/my-loads',    label: 'My Loads',  icon: List },
  ];

  const links = user?.role === 'driver' ? driverLinks : user?.role === 'shipper' ? shipperLinks : [];
  const siteName = settings.site_name || 'ReturnLoad';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={siteName} className="h-9 w-auto object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center">
                <Truck size={18} className="text-white" />
              </div>
            )}
            <span className="text-lg font-bold text-navy-900 tracking-tight">{siteName}</span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${location.pathname === to
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-navy-50'
                    }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                  <div className={`w-2 h-2 rounded-full ${user.role === 'driver' ? 'bg-green-500' : 'bg-navy-400'}`} />
                  <span className="text-sm text-navy-900 font-medium">{user.name}</span>
                  <span className="text-xs text-slate-400 capitalize">· {user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-sm"
                >
                  <LogOut size={15} />
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
              <button
                className="md:hidden text-slate-600 hover:text-navy-900"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && user && (
        <div className="md:hidden bg-white border-t border-slate-200 animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === to
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-navy-50'
                  }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
