import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import { Truck, LayoutDashboard, Users, Package, BookOpen, LogOut, ShieldCheck, Settings } from 'lucide-react';

const navLinks = [
  { to: '/admin',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users',    label: 'Users',     icon: Users },
  { to: '/admin/loads',    label: 'Loads',     icon: Package },
  { to: '/admin/bookings', label: 'Bookings',  icon: BookOpen },
  { to: '/admin/settings', label: 'Settings',  icon: Settings },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdmin();
  const location = useLocation();
  const navigate  = useNavigate();

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
      <aside className="w-60 shrink-0 bg-navy-900 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ShieldCheck size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">ReturnLoad</p>
              <p className="text-white/40 text-xs">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive(link)
                  ? 'bg-white text-navy-900'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
            >
              <link.icon size={17} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{admin?.email}</p>
              <p className="text-white/40 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
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
