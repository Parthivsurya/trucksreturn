import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Truck, Package, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'driver' });

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
            <Truck size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-navy-900">Create Account</h1>
          <p className="text-slate-500 text-sm mt-2">Join India's smartest freight marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {/* Step 1 — Role */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-sm text-slate-500 font-medium mb-4">I am a…</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { update('role', 'driver'); setStep(2); }}
                  className={`p-5 rounded-2xl border-2 transition-all text-center hover:scale-[1.02]
                    ${form.role === 'driver' ? 'border-navy-900 bg-navy-50' : 'border-slate-200 hover:border-navy-200'}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-navy-900 flex items-center justify-center mx-auto mb-3">
                    <Truck size={22} className="text-white" />
                  </div>
                  <p className="text-navy-900 font-bold text-sm">Truck Driver</p>
                  <p className="text-slate-400 text-xs mt-1">Find return loads</p>
                </button>
                <button
                  type="button"
                  onClick={() => { update('role', 'shipper'); setStep(2); }}
                  className={`p-5 rounded-2xl border-2 transition-all text-center hover:scale-[1.02]
                    ${form.role === 'shipper' ? 'border-navy-900 bg-navy-50' : 'border-slate-200 hover:border-navy-200'}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-navy-700 flex items-center justify-center mx-auto mb-3">
                    <Package size={22} className="text-white" />
                  </div>
                  <p className="text-navy-900 font-bold text-sm">Shipper</p>
                  <p className="text-slate-400 text-xs mt-1">Send goods</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <button
                type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900 mb-2"
              >
                <ArrowLeft size={13} /> Change role
              </button>

              <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                {form.role === 'driver'
                  ? <Truck size={15} className="text-navy-900" />
                  : <Package size={15} className="text-navy-700" />}
                <span className="text-sm text-slate-500">
                  Registering as <span className="text-navy-900 font-semibold capitalize">{form.role}</span>
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                    className="input-field !pl-11"
                    placeholder={form.role === 'driver' ? 'Rajesh Kumar' : 'Company Name'} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
                    className="input-field !pl-11" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                    className="input-field !pl-11" placeholder="98765 43210" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPass ? 'text' : 'password'} required minLength={6}
                    value={form.password} onChange={e => update('password', e.target.value)}
                    className="input-field !pl-11 !pr-11" placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full !py-3.5 text-base mt-2 flex items-center justify-center gap-2">
                {loading ? 'Creating Account…' : <><span>Create Account</span><ArrowRight size={17} /></>}
              </button>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-navy-900 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
