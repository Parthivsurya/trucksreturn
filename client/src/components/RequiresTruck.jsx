import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RequiresTruck({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (user?.role === 'driver' && !user?.truck) {
    if (location.pathname === '/driver/truck' || location.pathname === '/driver') {
      return children; // Allow access to dashboard and registration page
    }
    
    return (
      <div className="page-container flex items-center justify-center">
        <div className="card max-w-md w-full text-center py-12 border border-amber-500/30 bg-amber-500/5 block">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Truck size={32} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Truck Registration Required</h2>
          <p className="text-gray-400 mb-6">
            You must register your truck details before you can set routes, find matches, or accept return loads.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/driver/truck" className="btn-amber">
              Register Truck Now
            </Link>
            <Link to="/driver" className="text-gray-400 hover:text-white text-sm">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
