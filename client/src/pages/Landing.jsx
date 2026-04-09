import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { Truck, Package, MapPin, Shield, ArrowRight, Star, IndianRupee, Zap, Globe, Users, CheckCircle } from 'lucide-react';

export default function Landing() {
  const { settings } = useSettings();
  const primary = settings.primary_color || '#0f172a';
  const accent  = settings.accent_color  || '#f59e0b';
  const siteName = settings.site_name    || 'ReturnLoad';

  const features = [
    { icon: MapPin,       title: 'Route-Based Matching',      desc: 'Smart algorithm finds loads along your return path — no major detours, maximum profit.' },
    { icon: Shield,       title: 'Verified Profiles',         desc: 'RC, permit, insurance verification built in. Every driver and shipper is trusted.' },
    { icon: Globe,        title: 'Live GPS Tracking',         desc: 'Real-time shipment tracking from pickup to delivery with live ETA updates.' },
    { icon: IndianRupee,  title: 'Transparent Pricing',       desc: 'No middlemen. Agree directly on price. What you see is what you earn.' },
    { icon: Star,         title: 'Two-Way Ratings',           desc: 'Build your reputation with every trip. Better ratings unlock better loads.' },
    { icon: Zap,          title: 'Instant Match Alerts',      desc: 'Get notified the moment a load appears on your route. Never miss a haul.' },
  ];

  const steps = [
    { n: '01', title: 'Register & Verify',  desc: 'Create your profile and upload your documents in under 5 minutes.',         icon: Users },
    { n: '02', title: 'Post or Broadcast',  desc: 'Shippers post loads. Drivers broadcast their return route and availability.', icon: Package },
    { n: '03', title: 'Get Matched',        desc: 'The platform instantly finds the best load–truck pairs on the route.',        icon: MapPin },
    { n: '04', title: 'Book & Deliver',     desc: 'Confirm the booking, pick up, track, and get paid. Simple.',                  icon: Truck },
  ];

  const stats = [
    { value: '₹40,000 Cr', sub: 'Wasted on empty returns yearly',  badge: 'Problem' },
    { value: '35%',         sub: 'Of truck-km driven empty in India', badge: 'Opportunity' },
    { value: '10M+',        sub: 'Truck operators across India',     badge: 'Market' },
    { value: '₹28,500',    sub: 'Avg cost of a single empty run',   badge: 'Your Loss' },
  ];

  const benefits = [
    'Earn on every return trip — not just outbound',
    'Real-time load alerts on your route',
    'Verified shippers, no payment disputes',
    'Track all your trips from one dashboard',
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>

      {/* ━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden"
        style={{ backgroundColor: primary }}
      >
        {/* Subtle amber glow in background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 85% 20%, ${accent}22 0%, transparent 50%),
                         radial-gradient(ellipse at 10% 80%, ${accent}12 0%, transparent 40%)`,
          }}
        />

        <div className="relative max-w-6xl mx-auto text-center pt-20 pb-10 z-10">

          {/* Eyebrow badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-10"
            style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}40`, color: accent }}
          >
            <Truck size={12} />
            India's Freight Return Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.08] mb-6 tracking-tight">
            Stop Driving<br />
            <span style={{ color: accent }}>Empty Trucks.</span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
            Find loads on your return route. Turn dead kilometres into real income.
            Built for Indian truck operators — <strong style={{ color: 'rgba(255,255,255,0.85)' }}>simple, fast, trusted.</strong>
          </p>

          {/* Benefit checklist */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {benefits.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <CheckCircle size={14} style={{ color: accent }} />
                {b}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-150 active:scale-95"
              style={{ backgroundColor: accent, color: primary, boxShadow: `0 4px 20px ${accent}50` }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <Truck size={18} />
              I'm a Truck Driver
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-150 text-white active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            >
              <Package size={18} />
              I Need to Ship
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 sm:p-5 text-center animate-slide-up"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                <div
                  className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {s.badge}
                </div>
                <p className="text-xl sm:text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #f8fafc)' }}
        />
      </section>

      {/* ━━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="pt-12 pb-20 px-4 sm:px-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-navy-900 mb-4">Four Steps. Zero Complexity.</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From sign-up to your first booking — it takes minutes, not days.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl p-6 border border-slate-200 group"
                style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}
              >
                {/* Step number + Icon row */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primary }}
                  >
                    <s.icon size={21} style={{ color: accent }} />
                  </div>
                  <span
                    className="text-3xl font-black leading-none"
                    style={{ color: accent }}
                  >
                    {s.n}
                  </span>
                </div>
                <h3 className="font-bold text-navy-900 mb-1.5">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>

                {/* Connector arrow */}
                {i < 3 && (
                  <ArrowRight
                    size={16}
                    className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10"
                    style={{ color: accent }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━ PROBLEM / COST SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="py-20 px-4 sm:px-6"
        style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-black text-navy-900 mb-4">Every Empty Return Trip Bleeds Money</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              25–40% of all truck-kilometres in India are driven empty. That's not a statistic — it's your income disappearing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Cost breakdown */}
            <div
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: '#fafafa', borderColor: '#e2e8f0' }}
            >
              <h3 className="font-bold text-navy-900 mb-4 text-base">Cost of One Empty Return Trip</h3>
              <div className="space-y-0">
                {[
                  { item: 'Diesel fuel',                   cost: '₹12,000 – ₹16,000', icon: '⛽' },
                  { item: 'Driver wages (non-productive)', cost: '₹2,500 – ₹4,000',   icon: '👤' },
                  { item: 'National Highway tolls',        cost: '₹3,000 – ₹6,000',   icon: '🛣️' },
                  { item: 'Tyre & mechanical wear',        cost: '₹1,500 – ₹2,500',   icon: '🔧' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="flex items-center gap-2.5 text-sm text-slate-600">
                      <span className="text-base">{r.icon}</span>{r.item}
                    </span>
                    <span className="text-red-600 font-semibold text-sm">{r.cost}</span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between pt-4 pb-1"
                >
                  <span className="font-bold text-navy-900">Total per empty run</span>
                  <span className="font-black text-lg text-red-600">₹19,000 – ₹28,500</span>
                </div>
              </div>
            </div>

            {/* Highlight box */}
            <div className="space-y-4">
              <div
                className="rounded-2xl p-7 text-center"
                style={{ backgroundColor: primary, boxShadow: `0 8px 32px ${primary}30` }}
              >
                <p className="text-sm mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Wasted every year by Indian trucking
                </p>
                <p className="text-5xl font-black mb-1" style={{ color: accent }}>₹40,000 Cr</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  This is money that should be in your pocket
                </p>
              </div>

              <div
                className="rounded-2xl p-5 border"
                style={{ backgroundColor: `${accent}0d`, borderColor: `${accent}30` }}
              >
                <p className="font-bold mb-2" style={{ color: primary }}>With {siteName}</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Find a load going your way before you even finish unloading.
                  Turn every return trip into a revenue trip.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━ FEATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 px-4 sm:px-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-black text-navy-900 mb-4">Everything You Need, Nothing You Don't</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Built specifically for Indian road freight. No bloat, no jargon.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200 transition-all duration-200 group cursor-default"
                style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(15,23,42,0.10), 0 0 0 1px ${accent}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,23,42,0.04)'; }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primary}`, boxShadow: `2px 2px 0 ${accent}` }}
                >
                  <f.icon size={19} style={{ color: accent }} />
                </div>
                <h3 className="font-bold text-navy-900 text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━ CTA BANNER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="py-20 px-4 sm:px-6 relative overflow-hidden"
        style={{ backgroundColor: primary }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 25% 60%, ${accent}20 0%, transparent 55%)` }}
        />
        <div className="relative max-w-3xl mx-auto text-center z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>Ready?</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Your next load is already<br />
            <span style={{ color: accent }}>waiting on your route.</span>
          </h2>
          <p className="mb-8 max-w-lg mx-auto text-base" style={{ color: 'rgba(255,255,255,0.58)' }}>
            Join thousands of drivers who turned empty backhauls into extra income.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-150 active:scale-95"
              style={{ backgroundColor: accent, color: primary, boxShadow: `0 4px 20px ${accent}40` }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              Get Started Free
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-150 text-white active:scale-95"
              style={{ border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            >
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer
        style={{ backgroundColor: '#1e293b', borderTop: `2px solid ${accent}` }}
        className="py-8 px-4 sm:px-6"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: accent }}
            >
              <Truck size={15} style={{ color: primary }} />
            </div>
            <div>
              <span className="text-sm font-bold text-white">{siteName}</span>
              <span className="text-xs text-slate-500 ml-2">© 2026</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">Smart return load platform · Made for Indian road freight 🇮🇳</p>
        </div>
      </footer>
    </div>
  );
}
