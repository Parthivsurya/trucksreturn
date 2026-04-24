import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RequiresTruck from './components/RequiresTruck.jsx';
import AdminRoute from './components/AdminRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

import DriverDashboard from './pages/driver/Dashboard.jsx';
import SetAvailability from './pages/driver/SetAvailability.jsx';
import LoadFinder from './pages/driver/LoadFinder.jsx';
import LoadDetails from './pages/driver/LoadDetails.jsx';
import DriverBookings from './pages/driver/Bookings.jsx';
import BookingDetail from './pages/driver/BookingDetail.jsx';
import RegisterTruck from './pages/driver/RegisterTruck.jsx';

import ShipperDashboard from './pages/shipper/Dashboard.jsx';
import PostLoad from './pages/shipper/PostLoad.jsx';
import MyLoads from './pages/shipper/MyLoads.jsx';
import LoadMatches from './pages/shipper/LoadMatches.jsx';
import Tracking from './pages/shipper/Tracking.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminLoads from './pages/admin/AdminLoads.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

const toastStyle = {
  style: {
    background: '#ffffff',
    color: '#0B2545',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
  },
};

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/shipper'} /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/shipper'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/shipper'} /> : <Register />} />
        <Route path="/forgot-password" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/shipper'} /> : <ForgotPassword />} />

        {/* Driver Routes */}
        <Route path="/driver" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
        <Route path="/driver/truck" element={<ProtectedRoute role="driver"><RegisterTruck /></ProtectedRoute>} />
        <Route path="/driver/availability" element={<ProtectedRoute role="driver"><RequiresTruck><SetAvailability /></RequiresTruck></ProtectedRoute>} />
        <Route path="/driver/find-loads" element={<ProtectedRoute role="driver"><RequiresTruck><LoadFinder /></RequiresTruck></ProtectedRoute>} />
        <Route path="/driver/loads/:uuid" element={<ProtectedRoute role="driver"><RequiresTruck><LoadDetails /></RequiresTruck></ProtectedRoute>} />
        <Route path="/driver/bookings" element={<ProtectedRoute role="driver"><RequiresTruck><DriverBookings /></RequiresTruck></ProtectedRoute>} />
        <Route path="/driver/bookings/:uuid" element={<ProtectedRoute role="driver"><RequiresTruck><BookingDetail /></RequiresTruck></ProtectedRoute>} />

        {/* Shipper Routes */}
        <Route path="/shipper" element={<ProtectedRoute role="shipper"><ShipperDashboard /></ProtectedRoute>} />
        <Route path="/shipper/post-load" element={<ProtectedRoute role="shipper"><PostLoad /></ProtectedRoute>} />
        <Route path="/shipper/my-loads" element={<ProtectedRoute role="shipper"><MyLoads /></ProtectedRoute>} />
        <Route path="/shipper/loads/:uuid/matches" element={<ProtectedRoute role="shipper"><LoadMatches /></ProtectedRoute>} />
        <Route path="/shipper/tracking/:uuid" element={<ProtectedRoute role="shipper"><Tracking /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={toastStyle} />
      <Routes>
        {/* Admin routes — own context, own layout, no main Navbar */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/loads" element={<AdminRoute><AdminLoads /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

        {/* Everything else */}
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </>
  );
}
