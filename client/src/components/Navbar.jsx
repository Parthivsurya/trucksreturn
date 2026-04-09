import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { Truck, LogOut, Menu, X, LayoutDashboard, MapPin, Search, BookOpen, PlusCircle, List } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout }  = useAuth();
  const { settings }      = useSettings();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const driverLinks = [
    { to: '/driver',              label: 'Dashboard', icon: LayoutDashboard },
    { to: '/driver/availability', label: 'Set Route',  icon: MapPin },
    { to: '/driver/find-loads',   label: 'Find Loads', icon: Search },
    { to: '/driver/bookings',     label: 'Bookings',   icon: BookOpen },
  ];
  const shipperLinks = [
    { to: '/shipper',           label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shipper/post-load', label: 'Post Load',  icon: PlusCircle },
    { to: '/shipper/my-loads',  label: 'My Loads',   icon: List },
  ];

  const links    = user?.role === 'driver' ? driverLinks : user?.role === 'shipper' ? shipperLinks : [];
  const siteName = settings.site_name     || 'ReturnLoad';
  const primary  = settings.primary_color || '#0f172a';
  const accent   = settings.accent_color  || '#f59e0b';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: primary,
        borderBottom: `2px solid ${accent}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: accent, boxShadow: `0 0 0 2px ${accent}40` }}
            >
              {settings.logo_url
                ? <img src={settings.logo_url} alt={siteName} className="h-7 w-7 object-contain rounded-lg" />
                : <Truck size={19} style={{ color: primary }} />
              }
            </div>
            <span className="text-base font-bold tracking-wide text-white">{siteName}</span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-0.5">
              {links.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                    style={active
                      ? { color: accent, backgroundColor: 'rgba(255,255,255,0.08)' }
                      : { color: 'rgba(255,255,255,0.65)' }
                    }
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.backgroundColor = 'transparent'; }}}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* User pill */}
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.role === 'driver' ? '#4ade80' : accent }}
                  />
                  <span className="text-sm font-medium text-white">{user.name}</span>
                  <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>· {user.role}</span>
                </div>
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.22)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold rounded-xl transition-all duration-150"
                  style={{ backgroundColor: accent, color: primary }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            {user && (
              <button
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && user && (
        <div
          className="md:hidden animate-slide-up"
          style={{ backgroundColor: primary, borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-4 py-3 space-y-0.5">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={active
                    ? { backgroundColor: accent, color: primary, fontWeight: 700 }
                    : { color: 'rgba(255,255,255,0.65)' }
                  }
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
