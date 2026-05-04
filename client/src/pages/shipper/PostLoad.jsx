import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import CityCombobox from '../../components/CityCombobox.jsx';
import { CITIES } from '../../lib/cities.js';
import { Package, MapPin, Weight, IndianRupee, Clock, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const CARGO_TYPES = ['Textiles', 'Agricultural Produce', 'Steel', 'Auto Parts', 'Spices', 'Electronics', 'Furniture', 'Chemicals', 'Construction Materials', 'FMCG', 'Machinery', 'Other'];

export default function PostLoad() {
  const api = useApi();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pickupCity: '', deliveryCity: '', cargo_type: '', weight_tons: '',
    description: '', handling_instructions: '', offered_price: '', timeline: '',
    pickup_address: '', delivery_address: '',
  });

  function update(f, v) { setForm(prev => ({ ...prev, [f]: v })); }

  // Only recompute markers/routes when the city selection actually changes,
  // not on every other form field keystroke.
  const { markers, routes } = useMemo(() => {
    const pickup   = CITIES.find(c => c.name === form.pickupCity);
    const delivery = CITIES.find(c => c.name === form.deliveryCity);
    const m = [];
    const r = [];
    if (pickup)             m.push({ lat: pickup.lat,   lng: pickup.lng,   type: 'pickup',   label: `Pickup: ${pickup.name}` });
    if (delivery)           m.push({ lat: delivery.lat, lng: delivery.lng, type: 'delivery', label: `Delivery: ${delivery.name}` });
    if (pickup && delivery) r.push({ from: [pickup.lat, pickup.lng], to: [delivery.lat, delivery.lng], color: '#16a34a' });
    return { markers: m, routes: r };
  }, [form.pickupCity, form.deliveryCity]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickup   = CITIES.find(c => c.name === form.pickupCity);
  const delivery = CITIES.find(c => c.name === form.deliveryCity);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pickup || !delivery) { toast.error('Select both cities'); return; }
    setLoading(true);
    try {
      await api.post('/loads', {
        pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        delivery_lat: delivery.lat, delivery_lng: delivery.lng,
        pickup_city: pickup.name, delivery_city: delivery.name,
        cargo_type: form.cargo_type, weight_tons: parseFloat(form.weight_tons),
        description: form.description, handling_instructions: form.handling_instructions,
        offered_price: parseFloat(form.offered_price), timeline: form.timeline,
        pickup_address: form.pickup_address, delivery_address: form.delivery_address,
      });
      toast.success('Load posted! Drivers will be matched.');
      navigate('/shipper/my-loads');
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  }

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <h1 className="section-title mb-1">Post a Load</h1>
        <p className="section-subtitle mb-8">Describe your shipment and we'll find matching trucks.</p>

        <div className="grid lg:grid-cols-5 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-3 card space-y-5">

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <MapPin size={13} className="text-green-600" /> Pickup City
                </label>
                <CityCombobox
                  value={form.pickupCity}
                  onChange={c => update('pickupCity', c?.name || '')}
                  placeholder="Search pickup city or state…"
                  required
                  disabledCity={form.deliveryCity || null}
                  iconColor="text-green-600"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <MapPin size={13} className="text-red-500" /> Delivery City
                </label>
                <CityCombobox
                  value={form.deliveryCity}
                  onChange={c => update('deliveryCity', c?.name || '')}
                  placeholder="Search delivery city or state…"
                  required
                  disabledCity={form.pickupCity || null}
                  iconColor="text-red-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <MapPin size={13} className="text-green-600" /> Pickup Address
                </label>
                <input type="text" required value={form.pickup_address} onChange={e => update('pickup_address', e.target.value)}
                  className="input-field" placeholder="e.g. Warehouse No. 4, MIDC, Andheri East" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <MapPin size={13} className="text-red-500" /> Delivery Address
                </label>
                <input type="text" value={form.delivery_address} onChange={e => update('delivery_address', e.target.value)}
                  className="input-field" placeholder="e.g. Plot 12, Industrial Area, Sector 5" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <Package size={13} /> Cargo Type
                </label>
                <select value={form.cargo_type} onChange={e => update('cargo_type', e.target.value)} className="input-field" required>
                  <option value="">Select type</option>
                  {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <Weight size={13} /> Weight (tons)
                </label>
                <input type="number" step="0.5" min="0.5" required value={form.weight_tons}
                  onChange={e => update('weight_tons', e.target.value)} className="input-field" placeholder="e.g. 5" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <IndianRupee size={13} /> Offered Price (₹)
                </label>
                <input type="number" min="500" required value={form.offered_price}
                  onChange={e => update('offered_price', e.target.value)} className="input-field" placeholder="e.g. 25000" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                  <Clock size={13} /> Timeline
                </label>
                <input type="text" value={form.timeline} onChange={e => update('timeline', e.target.value)}
                  className="input-field" placeholder="e.g. 2 days" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                <FileText size={13} /> Description
              </label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                className="input-field" rows={2} placeholder="Describe your cargo…" />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
                <AlertTriangle size={13} /> Handling Instructions
              </label>
              <textarea value={form.handling_instructions} onChange={e => update('handling_instructions', e.target.value)}
                className="input-field" rows={2} placeholder="Special handling needs…" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? 'Posting…' : 'Post Load'}
            </button>
          </form>

          <div className="lg:col-span-2">
            <div className="h-[220px] lg:h-[500px] lg:sticky lg:top-24">
              <MapView markers={markers} routes={routes} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
