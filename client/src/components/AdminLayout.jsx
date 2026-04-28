import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { LayoutDashboard, Users, Package, BookOpen, LogOut, ShieldCheck, Settings, Menu, X, BadgeCheck } from 'lucide-react';

const navLinks = [
  { to: '/admin',                label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { to: '/admin/users',          label: 'Users',        icon: Users },
  { to: '/admin/loads',          label: 'Loads',        icon: Package },
  { to: '/admin/bookings',       label: 'Bookings',     icon: BookOpen },
  { to: '/admin/verification',   label: 'Verification', icon: BadgeCheck },
  { to: '/admin/settings',       label: 'Settings',     icon: Settings },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdmin();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate  = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primary = settings.primary_color || '#0f172a';
  const accent  = settings.accent_color  || '#f59e0b';

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  function isActive(link) {
    return link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);
  }

  const NavLinks = ({ onNavigate }) => (
    <>
      {navLinks.map(link => {
        const active = isActive(link);
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={active
              ? { backgroundColor: accent, color: '#fff' }
              : { color: 'rgba(255,255,255,0.65)' }
            }
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.backgroundColor = 'transparent'; }}}
          >
            <link.icon size={17} />
            {link.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">

      {/* ── Mobile top bar ── */}
      <header
        className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
        style={{ backgroundColor: primary }}
      >
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent }}>
            <ShieldCheck size={15} style={{ color: primary }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">{settings.site_name || 'ReturnLoad'}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin</p>
          </div>
        </Link>
        <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <Menu size={22} />
        </button>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{ backgroundColor: primary }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent }}>
                  <ShieldCheck size={15} style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{settings.site_name || 'ReturnLoad'}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin Panel</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ color: 'rgba(255,255,255,0.6)' }}>
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
            </nav>

            <div className="px-3 py-4 border-t border-white/10">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                  <ShieldCheck size={14} className="text-white" />
                </div>
                <p className="text-white text-xs font-medium truncate">{admin?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col min-h-screen" style={{ backgroundColor: primary }}>
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent, boxShadow: `0 0 0 2px ${accent}35` }}>
              <ShieldCheck size={17} style={{ color: primary }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{settings.site_name || 'ReturnLoad'}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks onNavigate={() => {}} />
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <ShieldCheck size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{admin?.email}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
