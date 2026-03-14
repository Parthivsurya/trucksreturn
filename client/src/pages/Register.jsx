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
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'driver',
  });

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
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-navy-900">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Create Account</h1>
          <p className="text-gray-400 text-sm mt-2">Join India's smartest freight marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-sm text-gray-400 font-medium mb-4">I am a...</p>
              <div className="grid grid-cols-2 gap-4">
                <button type="button"
                  onClick={() => { update('role', 'driver'); setStep(2); }}
                  className={`p-6 rounded-2xl border-2 transition-all text-center hover:scale-[1.02]
                    ${form.role === 'driver' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
                    <Truck size={24} className="text-white" />
                  </div>
                  <p className="text-white font-bold">Truck Driver</p>
                  <p className="text-gray-500 text-xs mt-1">Find return loads</p>
                </button>
                <button type="button"
                  onClick={() => { update('role', 'shipper'); setStep(2); }}
                  className={`p-6 rounded-2xl border-2 transition-all text-center hover:scale-[1.02]
                    ${form.role === 'shipper' ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3">
                    <Package size={24} className="text-white" />
                  </div>
                  <p className="text-white font-bold">Shipper</p>
                  <p className="text-gray-500 text-xs mt-1">Send goods</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-2">
                <ArrowLeft size={14} /> Change role
              </button>

              <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-white/5">
                {form.role === 'driver' ? <Truck size={16} className="text-blue-400" /> : <Package size={16} className="text-amber-400" />}
                <span className="text-sm text-gray-400">Registering as <span className="text-white font-semibold capitalize">{form.role}</span></span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                    className="input-field !pl-11" placeholder={form.role === 'driver' ? 'Rajesh Kumar' : 'Company Name'} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
                    className="input-field !pl-11" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                    className="input-field !pl-11" placeholder="98765 43210" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showPass ? 'text' : 'password'} required minLength={6}
                    value={form.password} onChange={e => update('password', e.target.value)}
                    className="input-field !pl-11 !pr-11" placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 text-base mt-2 flex items-center justify-center gap-2">
                {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={18} /></>}
              </button>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
