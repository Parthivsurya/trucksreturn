import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Truck, Clock, XCircle } from 'lucide-react';

export default function RequiresTruck({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (user?.role === 'driver' && !user?.truck) {
    if (location.pathname === '/driver/truck' || location.pathname === '/driver') {
      return children;
    }
    return (
      <div className="page-container flex items-center justify-center">
        <div className="card max-w-md w-full text-center py-12 border border-amber-500/30 bg-amber-500/5 block">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Truck size={32} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">Truck Registration Required</h2>
          <p className="text-slate-500 mb-6">
            Register your truck and upload your documents before you can set routes, find matches, or accept return loads.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/driver/truck" className="btn-primary">Register Truck Now</Link>
            <Link to="/driver" className="text-slate-400 hover:text-navy-900 text-sm">Return to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // Truck registered but not yet verified
  if (user?.role === 'driver' && user?.truck && user.truck.is_verified !== 1) {
    const isRejected = user.truck.is_verified === 2;

    // Allow access to truck page so they can re-upload docs after rejection
    if (location.pathname === '/driver/truck' || location.pathname === '/driver') {
      return children;
    }

    return (
      <div className="page-container flex items-center justify-center">
        <div className={`card max-w-md w-full text-center py-12 ${isRejected ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isRejected ? 'bg-red-100' : 'bg-amber-100'}`}>
            {isRejected
              ? <XCircle size={32} className="text-red-500" />
              : <Clock size={32} className="text-amber-500" />
            }
          </div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">
            {isRejected ? 'Verification Rejected' : 'Awaiting Admin Verification'}
          </h2>
          <p className="text-slate-600 mb-2">
            {isRejected
              ? 'Your documents were not approved. Please re-upload the correct documents.'
              : 'Your truck documents are being reviewed. You will be able to accept loads once an admin verifies them.'
            }
          </p>
          {isRejected && user.truck.verification_note && (
            <div className="mt-3 mb-4 p-3 rounded-xl bg-red-100 border border-red-200 text-sm text-red-700 text-left">
              <p className="font-semibold mb-0.5">Reason:</p>
              <p>{user.truck.verification_note}</p>
            </div>
          )}
          <div className="flex flex-col gap-3 mt-4">
            {isRejected && (
              <Link to="/driver/truck" className="btn-primary">Re-upload Documents</Link>
            )}
            <Link to="/driver" className="text-slate-400 hover:text-navy-900 text-sm">Return to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
