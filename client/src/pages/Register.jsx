import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { Truck, Package, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const { settings } = useSettings();
  const navigate     = useNavigate();

  const primary  = settings.primary_color || '#0f172a';
  const accent   = settings.accent_color  || '#f59e0b';
  const siteName = settings.site_name     || 'ReturnLoad';

  const [step, setStep]        = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [form, setForm]        = useState({ name: '', email: '', phone: '', password: '', role: 'driver' });

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register(form);
      toast.success(`Welcome, ${data.user.name}! Account created.`);
      navigate(data.user.role === 'driver' ? '/driver' : '/shipper');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[30%] flex-col justify-center p-10 relative overflow-hidden"
        style={{ backgroundColor: primary }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 20% 80%, ${accent}25 0%, transparent 55%)` }}
        />

        {/* Message */}
        <div className="relative">
          <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
            Join India's<br />
            <span style={{ color: accent }}>Freight Network.</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.52)' }}>
            Over 10 million truck operators drive empty on return trips.
            Register in under 2 minutes.
          </p>
          <div className="space-y-3">
            {['Free to join — no subscription fees', 'Set your route, get matched instantly', 'Verified profiles build long-term trust'].map((p, i) => (
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

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(n => (
              <div
                key={n}
                className="h-1.5 rounded-full flex-1 transition-all duration-300"
                style={{ backgroundColor: step >= n ? accent : '#e2e8f0' }}
              />
            ))}
          </div>

          {/* Step 1 — Role selection */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-black text-navy-900 mb-1">Create your account</h1>
              <p className="text-slate-500 text-sm mb-8">Join thousands of drivers and shippers already on {siteName}. Who are you?</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { role: 'driver',  icon: Truck,    label: 'Truck Driver', sub: 'Find return loads' },
                  { role: 'shipper', icon: Package,  label: 'Shipper',      sub: 'Send goods' },
                ].map(({ role, icon: Icon, label, sub }) => {
                  const active = form.role === role;
                  return (
                    <button
                      key={role} type="button"
                      onClick={() => { update('role', role); setStep(2); }}
                      className="p-5 rounded-2xl border-2 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        borderColor: active ? accent : '#e2e8f0',
                        backgroundColor: active ? `${accent}0d` : '#fff',
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: primary }}
                      >
                        <Icon size={22} style={{ color: accent }} />
                      </div>
                      <p className="font-bold text-sm text-navy-900">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </button>
                  );
                })}
              </div>

              {/* Trust bar */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { value: '10M+', label: 'Truck operators' },
                  { value: 'Free', label: 'No hidden fees' },
                  { value: '2 min', label: 'To register' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center p-3 rounded-xl" style={{ backgroundColor: `${accent}0d`, border: `1px solid ${accent}25` }}>
                    <p className="text-base font-black" style={{ color: accent }}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: accent }}>Sign in</Link>
              </p>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button
                type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5"
              >
                <ArrowLeft size={13} /> Back
              </button>

              <h1 className="text-2xl font-black text-navy-900 mb-1">Your details</h1>
              <div className="flex items-center gap-2 mb-6">
                {form.role === 'driver'
                  ? <Truck size={14} style={{ color: accent }} />
                  : <Package size={14} style={{ color: accent }} />}
                <span className="text-sm text-slate-500">
                  Registering as{' '}
                  <span className="font-bold" style={{ color: primary }}>
                    {form.role === 'driver' ? 'Truck Driver' : 'Shipper'}
                  </span>
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                        className="input-field !pl-10"
                        placeholder={form.role === 'driver' ? 'Rajesh Kumar' : 'Your name'} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                        className="input-field !pl-10" placeholder="98765 43210" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
                      className="input-field !pl-10" placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type={showPass ? 'text' : 'password'} required minLength={6}
                      value={form.password} onChange={e => update('password', e.target.value)}
                      className="input-field !pl-10 !pr-10" placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-150 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent, color: primary }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  {loading ? 'Creating Account…' : <><span>Create Account</span><ArrowRight size={17} /></>}
                </button>
              </form>

              <p className="text-center text-xs text-slate-400 mt-4">
                Already have an account?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: accent }}>Sign in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
