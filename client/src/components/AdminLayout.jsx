import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { LayoutDashboard, Users, Package, BookOpen, LogOut, ShieldCheck, Settings } from 'lucide-react';

const navLinks = [
  { to: '/admin',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users',    label: 'Users',     icon: Users },
  { to: '/admin/loads',    label: 'Loads',     icon: Package },
  { to: '/admin/bookings', label: 'Bookings',  icon: BookOpen },
  { to: '/admin/settings', label: 'Settings',  icon: Settings },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdmin();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate  = useNavigate();

  const primary = settings.primary_color || '#0f172a';
  const accent  = settings.accent_color  || '#f59e0b';

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  function isActive(link) {
    return link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col min-h-screen" style={{ backgroundColor: primary }}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: accent, boxShadow: `0 0 0 2px ${accent}35` }}
            >
              <ShieldCheck size={17} style={{ color: primary }} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{settings.site_name || 'ReturnLoad'}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(link => {
            const active = isActive(link);
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={active
                  ? { backgroundColor: accent, color: '#fff' }
                  : { color: 'rgba(255,255,255,0.6)' }
                }
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.backgroundColor = 'transparent'; }}}
              >
                <link.icon size={17} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
