import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Truck, Hash, MapPin, Weight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TRUCK_TYPES = ['Tata Prima', 'Ashok Leyland', 'Eicher Pro', 'BharatBenz', 'Mahindra Blazo', 'Tata Signa', 'Other'];
const HOME_STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'Punjab', 'Haryana', 'West Bengal', 'Kerala', 'Rajasthan'];

export default function RegisterTruck() {
  const api = useApi();
  const { fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    truck_type: '', capacity_tons: '', permit_number: '', home_state: '', registration_number: '',
  });

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/drivers/truck', { ...form, capacity_tons: parseFloat(form.capacity_tons) });
      await fetchUser();
      toast.success('Truck registered successfully!');
      navigate('/driver');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to register truck');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center mx-auto mb-4">
            <Truck size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-navy-900">Register Your Truck</h1>
          <p className="text-slate-500 text-sm mt-2">Register a truck before accepting loads</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                <Truck size={13} /> Truck Type
              </label>
              <select required value={form.truck_type} onChange={e => update('truck_type', e.target.value)} className="input-field">
                <option value="">Select Type</option>
                {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                <Weight size={13} /> Capacity (Tons)
              </label>
              <input type="number" step="0.5" min="1" required value={form.capacity_tons}
                onChange={e => update('capacity_tons', e.target.value)}
                className="input-field" placeholder="e.g. 15.5" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
              <Hash size={13} /> Registration Number
            </label>
            <input type="text" required value={form.registration_number}
              onChange={e => update('registration_number', e.target.value.toUpperCase())}
              className="input-field uppercase" placeholder="e.g. MH04-AB-1234" />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                <MapPin size={13} /> Home State
              </label>
              <select required value={form.home_state} onChange={e => update('home_state', e.target.value)} className="input-field">
                <option value="">Select State</option>
                {HOME_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-2">
                <CheckCircle size={13} /> National Permit Number
              </label>
              <input type="text" value={form.permit_number}
                onChange={e => update('permit_number', e.target.value.toUpperCase())}
                className="input-field uppercase" placeholder="e.g. NP-MH-2024-001" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 mt-2">
            {loading ? 'Registering…' : 'Register Truck'}
          </button>
        </form>
      </div>
    </div>
  );
}
