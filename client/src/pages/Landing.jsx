import { Link } from 'react-router-dom';
import { Truck, Package, MapPin, Shield, BarChart3, Clock, ArrowRight, Star, IndianRupee, Zap, Globe, Users } from 'lucide-react';

export default function Landing() {
  const stats = [
    { value: '₹40,000 Cr', label: 'Wasted annually on empty returns', color: 'text-red-400' },
    { value: '35%', label: 'Truck-km driven empty in India', color: 'text-amber-400' },
    { value: '10M+', label: 'Truck operators in India', color: 'text-blue-400' },
    { value: '65%', label: 'Freight moved by road', color: 'text-green-400' },
  ];

  const features = [
    { icon: MapPin, title: 'Route-Based Matching', desc: 'Smart algorithm finds loads along your return path. Never go significantly off-route.', color: 'from-blue-500 to-cyan-500' },
    { icon: Shield, title: 'Verified Profiles', desc: 'Document vault with RC, permit, insurance verification. Trust built before booking.', color: 'from-green-500 to-emerald-500' },
    { icon: Globe, title: 'Real-Time GPS Tracking', desc: 'Live shipment tracking from pickup to delivery with dynamic ETA updates.', color: 'from-purple-500 to-violet-500' },
    { icon: IndianRupee, title: 'Fair, Transparent Pricing', desc: 'No middleman markups. Direct negotiation between driver and shipper.', color: 'from-amber-500 to-orange-500' },
    { icon: Star, title: 'Trust & Ratings', desc: 'Two-way ratings after every trip. Build reputation, get better loads.', color: 'from-pink-500 to-rose-500' },
    { icon: Zap, title: 'Instant Notifications', desc: 'Get notified the moment a matching load appears on your route.', color: 'from-cyan-500 to-blue-500' },
  ];

  const howItWorks = [
    { step: '01', title: 'Register & Verify', desc: 'Sign up as driver or shipper. Upload documents for trust verification.', icon: Users },
    { step: '02', title: 'Post or Broadcast', desc: 'Shippers post loads. Drivers broadcast their return route availability.', icon: Package },
    { step: '03', title: 'Smart Matching', desc: 'Our engine finds perfect route-aligned matches within minutes.', icon: MapPin },
    { step: '04', title: 'Book & Track', desc: 'Agree on price, confirm booking, and track delivery in real-time.', icon: Truck },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-navy-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <Truck size={16} />
              India's Smart Freight Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6">
              Every Empty Truck is
              <br />
              <span className="gradient-text">Lost Revenue</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect with shippers along your return route. Turn dead miles into profit.
              The smart way to eliminate empty backhauls in Indian road logistics.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/register" className="btn-primary text-lg !px-8 !py-4 !rounded-2xl inline-flex items-center gap-2 justify-center">
                <Truck size={20} />
                I'm a Truck Driver
              </Link>
              <Link to="/register" className="btn-amber text-lg !px-8 !py-4 !rounded-2xl inline-flex items-center gap-2 justify-center">
                <Package size={20} />
                I Need to Ship
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((s, i) => (
                <div key={i} className="glass rounded-2xl p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 rounded-full bg-white/40 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">The Empty Backhaul Problem</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              After delivering goods, trucks return empty — burning ₹19,000–₹28,500 per trip in pure cost.
              This happens on 25–40% of all truck-kilometres in India.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 sm:p-10 mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Cost of a Single Empty Return</h3>
                <div className="space-y-3">
                  {[
                    { item: 'Diesel fuel', cost: '₹12,000 – ₹16,000', icon: '⛽' },
                    { item: 'Driver wages (non-productive)', cost: '₹2,500 – ₹4,000', icon: '👤' },
                    { item: 'National Highway tolls', cost: '₹3,000 – ₹6,000', icon: '🛣️' },
                    { item: 'Tyre & mechanical wear', cost: '₹1,500 – ₹2,500', icon: '🔧' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="flex items-center gap-2 text-gray-300">
                        <span>{r.icon}</span> {r.item}
                      </span>
                      <span className="text-red-400 font-semibold">{r.cost}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3 mt-2 bg-red-500/10 rounded-xl px-4">
                    <span className="text-white font-bold">Total per empty return</span>
                    <span className="text-red-400 font-black text-lg">₹19,000 – ₹28,500</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/20">
                  <p className="text-6xl font-black gradient-text-amber mb-2">₹40,000 Cr</p>
                  <p className="text-gray-400 text-sm">Wasted annually by the Indian trucking industry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 bg-navy-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">From registration to delivery — a seamless four-step process.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="card group text-center relative">
                <div className="text-5xl font-black text-white/5 absolute top-4 right-4">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <item.icon size={24} className="text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
                {i < 3 && (
                  <ArrowRight size={20} className="text-gray-700 absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Platform Features</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Built specifically for the Indian return-load use case.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-hover group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 sm:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Every kilometre driven empty is<br />
              <span className="gradient-text">a kilometre of lost potential</span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join India's smartest freight marketplace. Turn your return trips into revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg !px-8 !py-4 !rounded-2xl">
                Get Started Free
              </Link>
              <Link to="/login" className="btn-secondary text-lg !px-8 !py-4 !rounded-2xl">
                Login to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-sm text-gray-500">ReturnLoad © 2026 · Smart Return Load Platform</span>
          </div>
          <p className="text-xs text-gray-600">Turning empty trucks into opportunity · Made in India 🇮🇳</p>
        </div>
      </footer>
    </div>
  );
}
