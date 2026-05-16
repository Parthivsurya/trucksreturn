import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { Truck, LogOut, LayoutDashboard, MapPin, Search, BookOpen, PlusCircle, List, Bell, Package, CheckCheck, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout }  = useAuth();
  const { settings }      = useSettings();
  const navigate          = useNavigate();
  const location          = useLocation();

  const api = useApi();
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const notifRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/'); };

  // Fetch notifications (drivers only)
  async function fetchNotifications() {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch { /* silent */ }
  }

  // Load on mount + poll every 30s
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function openNotifications() {
    setNotifOpen(v => !v);
    if (!notifOpen && unreadCount > 0) {
      try {
        await api.put('/notifications/read-all');
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch { /* silent */ }
    }
  }

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
  const siteName = settings.site_name     || 'TrucksReturn';
  const primary  = settings.primary_color || '#0f4c5c';
  const accent   = settings.accent_color  || '#06b6d4';

  return (
    <>
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
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={openNotifications}
                    className="relative p-2 rounded-lg transition-all duration-150"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent, #06b6d4)', color: primary }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-navy-900">Notifications</p>
                        <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={15} />
                        </button>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell size={28} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              className="px-4 py-3 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50"
                              style={{ backgroundColor: n.is_read ? '#fff' : 'rgba(245,158,11,0.05)' }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ backgroundColor: n.is_read ? '#f1f5f9' : 'rgba(245,158,11,0.15)' }}>
                                  <Package size={14} style={{ color: n.is_read ? '#94a3b8' : 'var(--accent, #06b6d4)' }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-navy-900 leading-tight">{n.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {n.load_uuid && (
                                      <Link
                                        to={user?.role === 'shipper'
                                          ? `/shipper/loads/${n.load_uuid}/matches`
                                          : `/driver/loads/${n.load_uuid}`}
                                        onClick={() => setNotifOpen(false)}
                                        className="text-[10px] font-bold hover:underline"
                                        style={{ color: 'var(--accent, #06b6d4)' }}
                                      >
                                        View Load →
                                      </Link>
                                    )}
                                  </div>
                                </div>
                                {!n.is_read && (
                                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--accent, #06b6d4)' }} />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                          <button
                            onClick={async () => {
                              try { await api.put('/notifications/read-all'); } catch {}
                              setUnreadCount(0);
                              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            }}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-navy-900 transition-colors"
                          >
                            <CheckCheck size={12} /> Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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

          </div>
        </div>
      </div>
    </nav>

      {/* Bottom Nav — mobile only */}
      {user && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            backgroundColor: primary,
            borderTop: `2px solid ${accent}`,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="flex items-stretch">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || (to !== '/driver' && to !== '/shipper' && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all"
                  style={{ color: active ? accent : 'rgba(255,255,255,0.5)' }}
                >
                  <Icon size={21} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
