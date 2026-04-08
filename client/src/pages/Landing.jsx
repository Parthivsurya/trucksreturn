import { Link } from 'react-router-dom';
import { Truck, Package, MapPin, Shield, BarChart3, Clock, ArrowRight, Star, IndianRupee, Zap, Globe, Users } from 'lucide-react';

export default function Landing() {
  const stats = [
    { value: '₹40,000 Cr', label: 'Wasted annually on empty returns',  color: 'text-red-600' },
    { value: '35%',         label: 'Truck-km driven empty in India',    color: 'text-amber-600' },
    { value: '10M+',        label: 'Truck operators in India',          color: 'text-navy-900' },
    { value: '65%',         label: 'Freight moved by road',             color: 'text-green-700' },
  ];

  const features = [
    { icon: MapPin,       title: 'Route-Based Matching',    desc: 'Smart algorithm finds loads along your return path. Never go significantly off-route.' },
    { icon: Shield,       title: 'Verified Profiles',       desc: 'Document vault with RC, permit, insurance verification. Trust built before booking.' },
    { icon: Globe,        title: 'Real-Time GPS Tracking',  desc: 'Live shipment tracking from pickup to delivery with dynamic ETA updates.' },
    { icon: IndianRupee,  title: 'Fair, Transparent Pricing', desc: 'No middleman markups. Direct negotiation between driver and shipper.' },
    { icon: Star,         title: 'Trust & Ratings',         desc: 'Two-way ratings after every trip. Build reputation, get better loads.' },
    { icon: Zap,          title: 'Instant Notifications',   desc: 'Get notified the moment a matching load appears on your route.' },
  ];

  const howItWorks = [
    { step: '01', title: 'Register & Verify',  desc: 'Sign up as driver or shipper. Upload documents for trust verification.',       icon: Users },
    { step: '02', title: 'Post or Broadcast',  desc: 'Shippers post loads. Drivers broadcast their return route availability.',       icon: Package },
    { step: '03', title: 'Smart Matching',     desc: 'Our engine finds perfect route-aligned matches within minutes.',                 icon: MapPin },
    { step: '04', title: 'Book & Track',       desc: 'Agree on price, confirm booking, and track delivery in real-time.',             icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-50 border border-navy-200 text-navy-900 text-sm font-medium mb-8">
            <Truck size={15} />
            India's Smart Freight Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-navy-900 leading-tight mb-6">
            Every Empty Truck is<br />
            <span className="text-navy-600">Lost Revenue</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with shippers along your return route. Turn dead miles into profit.
            The smart way to eliminate empty backhauls in Indian road logistics.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register" className="btn-primary text-base !px-8 !py-4 !rounded-2xl inline-flex items-center gap-2 justify-center">
              <Truck size={18} />
              I'm a Truck Driver
            </Link>
            <Link to="/register" className="btn-secondary text-base !px-8 !py-4 !rounded-2xl inline-flex items-center gap-2 justify-center">
              <Package size={18} />
              I Need to Ship
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="card text-center animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-navy-900 mb-4">The Empty Backhaul Problem</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              After delivering goods, trucks return empty — burning ₹19,000–₹28,500 per trip in pure cost.
              This happens on 25–40% of all truck-kilometres in India.
            </p>
          </div>

          <div className="card max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-lg font-bold text-navy-900 mb-4">Cost of a Single Empty Return</h3>
                <div className="space-y-3">
                  {[
                    { item: 'Diesel fuel',                   cost: '₹12,000 – ₹16,000', icon: '⛽' },
                    { item: 'Driver wages (non-productive)', cost: '₹2,500 – ₹4,000',   icon: '👤' },
                    { item: 'National Highway tolls',        cost: '₹3,000 – ₹6,000',   icon: '🛣️' },
                    { item: 'Tyre & mechanical wear',        cost: '₹1,500 – ₹2,500',   icon: '🔧' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span>{r.icon}</span> {r.item}
                      </span>
                      <span className="text-red-600 font-semibold text-sm">{r.cost}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3 mt-2 bg-red-50 rounded-xl px-4 border border-red-100">
                    <span className="text-navy-900 font-bold">Total per empty return</span>
                    <span className="text-red-600 font-black text-lg">₹19,000 – ₹28,500</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-block p-8 rounded-2xl bg-navy-50 border border-navy-200">
                  <p className="text-5xl font-black text-navy-900 mb-2">₹40,000 Cr</p>
                  <p className="text-slate-500 text-sm">Wasted annually by the Indian trucking industry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-navy-900 mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From registration to delivery — a seamless four-step process.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="card group text-center relative">
                <span className="text-5xl font-black text-slate-100 absolute top-4 right-4 select-none">{item.step}</span>
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
                  <item.icon size={22} className="text-white" />
                </div>
                <h3 className="text-navy-900 font-bold mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
                {i < 3 && (
                  <ArrowRight size={18} className="text-slate-300 absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-navy-900 mb-4">Platform Features</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Built specifically for the Indian return-load use case.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-hover group">
                <div className="w-11 h-11 rounded-xl bg-navy-900 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="text-navy-900 font-bold text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-navy-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Every kilometre driven empty is<br />
            <span className="text-navy-300">a kilometre of lost potential</span>
          </h2>
          <p className="text-navy-300 mb-8 max-w-lg mx-auto">
            Join India's smartest freight marketplace. Turn your return trips into revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-navy-900 font-semibold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-colors inline-flex items-center justify-center gap-2">
              Get Started Free
            </Link>
            <Link to="/login" className="border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2">
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-navy-900 flex items-center justify-center">
              <Truck size={13} className="text-white" />
            </div>
            <span className="text-sm text-slate-500">ReturnLoad © 2026 · Smart Return Load Platform</span>
          </div>
          <p className="text-xs text-slate-400">Turning empty trucks into opportunity · Made in India 🇮🇳</p>
        </div>
      </footer>
    </div>
  );
}
