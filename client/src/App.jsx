import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RequiresTruck from './components/RequiresTruck.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DriverDashboard from './pages/driver/Dashboard.jsx';
import SetAvailability from './pages/driver/SetAvailability.jsx';
import LoadFinder from './pages/driver/LoadFinder.jsx';
import LoadDetails from './pages/driver/LoadDetails.jsx';
import DriverBookings from './pages/driver/Bookings.jsx';
import RegisterTruck from './pages/driver/RegisterTruck.jsx';
import ShipperDashboard from './pages/shipper/Dashboard.jsx';
import PostLoad from './pages/shipper/PostLoad.jsx';
import MyLoads from './pages/shipper/MyLoads.jsx';
import LoadMatches from './pages/shipper/LoadMatches.jsx';
import Tracking from './pages/shipper/Tracking.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-glow" />
          <p className="text-gray-400 text-sm">Loading ReturnLoad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/shipper'} /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/shipper'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/shipper'} /> : <Register />} />

        {/* Driver Routes */}
        <Route path="/driver" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/truck" element={<ProtectedRoute role="driver"><RegisterTruck /></ProtectedRoute>} />
        <Route path="/driver/availability" element={<ProtectedRoute role="driver"><RequiresTruck><SetAvailability /></RequiresTruck></ProtectedRoute>} />
        <Route path="/driver/find-loads" element={<ProtectedRoute role="driver"><RequiresTruck><LoadFinder /></RequiresTruck></ProtectedRoute>} />
        <Route path="/driver/loads/:id" element={<ProtectedRoute role="driver"><RequiresTruck><LoadDetails /></RequiresTruck></ProtectedRoute>} />
        <Route path="/driver/bookings" element={<ProtectedRoute role="driver"><RequiresTruck><DriverBookings /></RequiresTruck></ProtectedRoute>} />

        {/* Shipper Routes */}
        <Route path="/shipper" element={<ProtectedRoute role="shipper"><ShipperDashboard /></ProtectedRoute>} />
        <Route path="/shipper/post-load" element={<ProtectedRoute role="shipper"><PostLoad /></ProtectedRoute>} />
        <Route path="/shipper/my-loads" element={<ProtectedRoute role="shipper"><MyLoads /></ProtectedRoute>} />
        <Route path="/shipper/loads/:id/matches" element={<ProtectedRoute role="shipper"><LoadMatches /></ProtectedRoute>} />
        <Route path="/shipper/tracking/:id" element={<ProtectedRoute role="shipper"><Tracking /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
