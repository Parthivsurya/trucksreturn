import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { Truck, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login }    = useAuth();
  const { settings } = useSettings();
  const navigate     = useNavigate();

  const primary  = settings.primary_color || '#0f172a';
  const accent   = settings.accent_color  || '#f59e0b';
  const siteName = settings.site_name     || 'ReturnLoad';

  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [passwordError, setPasswordError] = useState('');

  function handleChange(field, value) {
    if (field === 'password') setPasswordError('');
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPasswordError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'driver' ? '/driver' : '/shipper');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      if (err.response?.status === 401) {
        setPasswordError('Wrong password. Please try again.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const perks = [
    'Find loads on your exact return route',
    'Verified shippers — no payment disputes',
    'Real-time GPS tracking on every shipment',
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[30%] flex-col justify-center p-10 relative overflow-hidden"
        style={{ backgroundColor: primary }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 80% 15%, ${accent}28 0%, transparent 55%)` }}
        />
        <div className="relative">
          <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
            Every Return<br />
            <span style={{ color: accent }}>Trip Pays.</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.52)' }}>
            India's smartest freight return platform.
            Connect loads to your route. Earn on every trip.
          </p>
          <div className="space-y-3">
            {perks.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle size={15} style={{ color: accent, marginTop: 1, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="absolute bottom-6 left-10 text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>© 2026 {siteName}</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 bg-white">
        <div className="w-full max-w-lg">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary }}>
              <Truck size={17} className="text-white" />
            </div>
            <span className="font-bold text-navy-900">{siteName}</span>
          </div>

          <h1 className="text-2xl font-black text-navy-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">
            Sign in to your account ·{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: accent }}>Create one free</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto lg:max-w-none">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="input-field !pl-10" placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-600">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: accent }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  className={`input-field !pl-10 !pr-10 ${passwordError ? 'border-red-400 focus:border-red-400' : ''}`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <span className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  {passwordError}{' '}
                  <Link to="/forgot-password" className="font-semibold underline" style={{ color: accent }}>
                    Reset it
                  </Link>
                </span>
              )}
            </div>

            {/* Demo hint */}
            <div className="p-3.5 rounded-xl text-xs"
              style={{ backgroundColor: `${accent}0f`, border: `1px solid ${accent}30` }}>
              <p className="font-bold mb-1" style={{ color: primary }}>Demo Credentials</p>
              <p className="text-slate-600">Driver: <span className="font-semibold">rajesh@demo.com</span></p>
              <p className="text-slate-600">Shipper: <span className="font-semibold">textiles@demo.com</span></p>
              <p className="text-slate-500 mt-0.5">Password: <span className="font-semibold">demo1234</span></p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-150 active:scale-95 disabled:opacity-60 mt-1"
              style={{ backgroundColor: primary, color: '#fff' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto lg:max-w-none">
            {[
              { value: '10M+',   label: 'Truck operators' },
              { value: '₹40K Cr', label: 'Freight market' },
              { value: '100%',   label: 'Free to join' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-3 rounded-xl" style={{ backgroundColor: `${accent}0d`, border: `1px solid ${accent}25` }}>
                <p className="text-sm font-black" style={{ color: accent }}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              New here?{' '}
              <Link to="/register" className="font-bold hover:underline" style={{ color: accent }}>
                Create a free account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
