import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { Truck, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { settings } = useSettings();
  const api          = useApi();
  const navigate     = useNavigate();

  const primary  = settings.primary_color || '#0f4c5c';
  const accent   = settings.accent_color  || '#06b6d4';
  const siteName = settings.site_name     || 'TrucksReturn';

  const [step, setStep]       = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const otpRefs = useRef([]);

  // ── Step 1: send OTP ──────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      if (data.dev_otp) {
        setOtp(data.dev_otp.split(''));
        toast.success(`Testing mode — OTP auto-filled: ${data.dev_otp}`);
      } else {
        toast.success(`OTP sent to ${email}`);
      }
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: OTP input helpers ─────────────────────────────────
  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function handleOtpNext(e) {
    e.preventDefault();
    if (otp.join('').length < 6) { toast.error('Enter all 6 digits'); return; }
    setStep(3);
  }

  // ── Step 3: reset password ────────────────────────────────────
  async function handleReset(e) {
    e.preventDefault();
    setPassError('');
    if (password.length < 6) { setPassError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setPassError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otp.join(''), password });
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.message || 'Reset failed';
      // OTP errors → send user back to OTP step
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired')) {
        toast.error(msg);
        setStep(2);
        setOtp(['', '', '', '', '', '']);
      } else {
        setPassError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[30%] flex-col justify-center p-10 relative overflow-hidden"
        style={{ backgroundColor: primary }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 20% 80%, ${accent}25 0%, transparent 55%)` }}
        />
        <div className="relative">
          <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
            Forgot your<br />
            <span style={{ color: accent }}>Password?</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.52)' }}>
            No worries. Enter your email, verify with an OTP, and set a new password in under a minute.
          </p>
          <div className="space-y-3">
            {['Enter your registered email', 'Check your inbox for the OTP', 'Set a new secure password'].map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: accent, color: primary }}
                >{i + 1}</div>
                <span className="text-sm" style={{ color: step > i ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}>{p}</span>
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
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="h-1.5 rounded-full flex-1 transition-all duration-300"
                style={{ backgroundColor: step >= n ? accent : '#e2e8f0' }}
              />
            ))}
          </div>

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-black text-navy-900 mb-1">Reset your password</h1>
              <p className="text-slate-500 text-sm mb-8">
                Enter your registered email and we'll send you a verification code.
              </p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field !pl-10" placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-150 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent, color: primary }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  {loading ? 'Sending OTP…' : <><span>Send OTP</span><ArrowRight size={17} /></>}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Remember your password?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: accent }}>Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button
                type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5"
              >
                <ArrowLeft size={13} /> Back
              </button>

              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
                  <ShieldCheck size={20} style={{ color: accent }} />
                </div>
                <h1 className="text-2xl font-black text-navy-900">Verify your email</h1>
              </div>
              <p className="text-slate-500 text-sm mb-8">
                We sent a 6-digit code to <span className="font-semibold text-navy-900">{email}</span>. Enter it below.
              </p>

              <form onSubmit={handleOtpNext} className="space-y-6">
                <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black rounded-xl border-2 outline-none transition-all"
                      style={{
                        borderColor: digit ? accent : '#e2e8f0',
                        backgroundColor: digit ? `${accent}0d` : '#f8fafc',
                        color: primary,
                      }}
                      onFocus={e => e.target.style.borderColor = accent}
                      onBlur={e => e.target.style.borderColor = digit ? accent : '#e2e8f0'}
                    />
                  ))}
                </div>

                <button type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent, color: primary }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  <span>Continue</span><ArrowRight size={17} />
                </button>
              </form>

              <p className="text-center text-xs text-slate-400 mt-5">
                Didn't receive it?{' '}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.post('/auth/forgot-password', { email });
                      toast.success('New OTP sent!');
                      setOtp(['', '', '', '', '', '']);
                    } catch (err) {
                      toast.error(err.message || 'Failed to resend');
                    }
                  }}
                  className="font-bold hover:underline"
                  style={{ color: accent }}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          )}

          {/* ── Step 3: New password ── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <button
                type="button" onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5"
              >
                <ArrowLeft size={13} /> Back
              </button>

              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
                  <CheckCircle size={20} style={{ color: accent }} />
                </div>
                <h1 className="text-2xl font-black text-navy-900">Set new password</h1>
              </div>
              <p className="text-slate-500 text-sm mb-8">
                Choose a strong password with at least 6 characters.
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'} required minLength={6}
                      value={password} onChange={e => { setPassword(e.target.value); setPassError(''); }}
                      className={`input-field !pl-10 !pr-10 ${passError ? 'border-red-400' : ''}`}
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'} required minLength={6}
                      value={confirm} onChange={e => { setConfirm(e.target.value); setPassError(''); }}
                      className={`input-field !pl-10 !pr-10 ${passError ? 'border-red-400' : ''}`}
                      placeholder="Re-enter password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passError && (
                    <span className="text-xs text-red-500 mt-1 block">{passError}</span>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-150 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent, color: primary }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  {loading ? 'Resetting…' : <><span>Reset Password</span><ArrowRight size={17} /></>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
