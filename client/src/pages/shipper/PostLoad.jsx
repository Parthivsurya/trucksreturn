import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import MapView from '../../components/MapView.jsx';
import { Package, MapPin, ArrowRight, Weight, IndianRupee, Clock, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES = [
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 }, { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 }, { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 }, { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 }, { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 }, { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 }, { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739 }, { name: 'Agra', lat: 27.1767, lng: 78.0081 },
  { name: 'Patna', lat: 25.6093, lng: 85.1376 }, { name: 'Trivandrum', lat: 8.5241, lng: 76.9366 },
  { name: 'Gurugram', lat: 28.4595, lng: 77.0266 }, { name: 'Tirupur', lat: 11.1085, lng: 77.3411 },
];

const CARGO_TYPES = ['Textiles', 'Agricultural Produce', 'Steel', 'Auto Parts', 'Spices', 'Electronics', 'Furniture', 'Chemicals', 'Construction Materials', 'FMCG', 'Machinery', 'Other'];

export default function PostLoad() {
  const api = useApi();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pickupCity: '', deliveryCity: '', cargo_type: '', weight_tons: '',
    description: '', handling_instructions: '', offered_price: '', timeline: '',
  });

  function update(f, v) { setForm(prev => ({ ...prev, [f]: v })); }
  const pickup = CITIES.find(c => c.name === form.pickupCity);
  const delivery = CITIES.find(c => c.name === form.deliveryCity);

  const markers = [];
  const routes = [];
  if (pickup) markers.push({ lat: pickup.lat, lng: pickup.lng, type: 'pickup', label: `Pickup: ${pickup.name}` });
  if (delivery) markers.push({ lat: delivery.lat, lng: delivery.lng, type: 'delivery', label: `Delivery: ${delivery.name}` });
  if (pickup && delivery) routes.push({ from: [pickup.lat, pickup.lng], to: [delivery.lat, delivery.lng], color: '#10b981' });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pickup || !delivery) { toast.error('Select both cities'); return; }
    setLoading(true);
    try {
      await api.post('/loads', {
        pickup_lat: pickup.lat, pickup_lng: pickup.lng, delivery_lat: delivery.lat, delivery_lng: delivery.lng,
        pickup_city: pickup.name, delivery_city: delivery.name,
        cargo_type: form.cargo_type, weight_tons: parseFloat(form.weight_tons),
        description: form.description, handling_instructions: form.handling_instructions,
        offered_price: parseFloat(form.offered_price), timeline: form.timeline,
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
          <form onSubmit={handleSubmit} className="lg:col-span-3 glass rounded-2xl p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><MapPin size={14} className="text-green-400" /> Pickup City</label>
                <select value={form.pickupCity} onChange={e => update('pickupCity', e.target.value)} className="input-field" required>
                  <option value="">Select pickup</option>
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><MapPin size={14} className="text-red-400" /> Delivery City</label>
                <select value={form.deliveryCity} onChange={e => update('deliveryCity', e.target.value)} className="input-field" required>
                  <option value="">Select delivery</option>
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><Package size={14} /> Cargo Type</label>
                <select value={form.cargo_type} onChange={e => update('cargo_type', e.target.value)} className="input-field" required>
                  <option value="">Select type</option>
                  {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><Weight size={14} /> Weight (tons)</label>
                <input type="number" step="0.5" min="0.5" required value={form.weight_tons} onChange={e => update('weight_tons', e.target.value)} className="input-field" placeholder="e.g. 5" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><IndianRupee size={14} /> Offered Price (₹)</label>
                <input type="number" min="500" required value={form.offered_price} onChange={e => update('offered_price', e.target.value)} className="input-field" placeholder="e.g. 25000" />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><Clock size={14} /> Timeline</label>
                <input type="text" value={form.timeline} onChange={e => update('timeline', e.target.value)} className="input-field" placeholder="e.g. 2 days" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><FileText size={14} /> Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} className="input-field" rows={2} placeholder="Describe your cargo..." />
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm text-gray-400 mb-1.5"><AlertTriangle size={14} /> Handling Instructions</label>
              <textarea value={form.handling_instructions} onChange={e => update('handling_instructions', e.target.value)} className="input-field" rows={2} placeholder="Special handling needs..." />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? 'Posting...' : 'Post Load'}
            </button>
          </form>

          <div className="lg:col-span-2">
            <MapView markers={markers} routes={routes} className="lg:sticky lg:top-24" style={{ height: '500px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
