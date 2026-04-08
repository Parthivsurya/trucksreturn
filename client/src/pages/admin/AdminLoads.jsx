import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAdminApi } from '../../hooks/useAdminApi.js';
import { Package, Search, ArrowRight, PlusCircle, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['open', 'booked', 'in_transit', 'delivered', 'cancelled'];

const badgeClass = {
  open:       'badge-open',
  booked:     'badge-booked',
  in_transit: 'badge-transit',
  delivered:  'badge-delivered',
  cancelled:  'badge-cancelled',
};

const CARGO_TYPES = ['Textiles', 'Agricultural Produce', 'Steel', 'Auto Parts', 'Spices', 'Electronics', 'Chemicals', 'FMCG', 'Construction Material', 'Other'];

function AddLoadModal({ onClose, onCreated }) {
  const api = useAdminApi();
  const [shippers, setShippers] = useState([]);
  const [form, setForm] = useState({
    shipper_id: '', pickup_city: '', pickup_lat: '', pickup_lng: '',
    delivery_city: '', delivery_lat: '', delivery_lng: '',
    cargo_type: 'Textiles', weight_tons: '', description: '',
    offered_price: '', timeline: '2 days',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/shippers').then(setShippers).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/loads', form);
      toast.success('Load created.');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-navy-900 text-lg">Add New Load</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Shipper *</label>
            <select required value={form.shipper_id} onChange={e => set('shipper_id', e.target.value)} className="input-field">
              <option value="">Select shipper…</option>
              {shippers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo Type *</label>
              <select required value={form.cargo_type} onChange={e => set('cargo_type', e.target.value)} className="input-field">
                {CARGO_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Weight (tons) *</label>
              <input type="number" required min="0.1" step="0.1" value={form.weight_tons}
                onChange={e => set('weight_tons', e.target.value)} className="input-field" placeholder="5" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pickup</p>
            <input type="text" required value={form.pickup_city}
              onChange={e => set('pickup_city', e.target.value)} className="input-field" placeholder="City name *" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" value={form.pickup_lat}
                onChange={e => set('pickup_lat', e.target.value)} className="input-field !py-2 text-sm" placeholder="Latitude" />
              <input type="number" step="any" value={form.pickup_lng}
                onChange={e => set('pickup_lng', e.target.value)} className="input-field !py-2 text-sm" placeholder="Longitude" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery</p>
            <input type="text" required value={form.delivery_city}
              onChange={e => set('delivery_city', e.target.value)} className="input-field" placeholder="City name *" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" value={form.delivery_lat}
                onChange={e => set('delivery_lat', e.target.value)} className="input-field !py-2 text-sm" placeholder="Latitude" />
              <input type="number" step="any" value={form.delivery_lng}
                onChange={e => set('delivery_lng', e.target.value)} className="input-field !py-2 text-sm" placeholder="Longitude" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Offered Price (₹) *</label>
              <input type="number" required min="0" value={form.offered_price}
                onChange={e => set('offered_price', e.target.value)} className="input-field" placeholder="25000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Timeline</label>
              <input type="text" value={form.timeline}
                onChange={e => set('timeline', e.target.value)} className="input-field" placeholder="2 days" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={2} value={form.description}
              onChange={e => set('description', e.target.value)}
              className="input-field resize-none" placeholder="Details about the cargo…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating…' : 'Create Load'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoads() {
  const api = useAdminApi();
  const [loads, setLoads]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const LIMIT = 15;

  useEffect(() => { loadLoads(); }, [page, status]);

  async function loadLoads() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await api.get(`/loads?${params}`);
      setLoads(res.loads);
      setTotal(res.total);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  }

  async function changeStatus(id, newStatus) {
    try {
      await api.put(`/loads/${id}/status`, { status: newStatus });
      toast.success(`Load status updated to ${newStatus}.`);
      setEditingId(null);
      loadLoads();
    } catch (err) { toast.error(err.message); }
  }

  async function deleteLoad(load) {
    try {
      await api.del(`/loads/${load.id}`);
      toast.success('Load deleted.');
      setConfirmDelete(null);
      loadLoads();
    } catch (err) { toast.error(err.message); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      {showAdd && <AddLoadModal onClose={() => setShowAdd(false)} onCreated={loadLoads} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="font-bold text-navy-900 mb-1">Delete Load?</h3>
            <p className="text-slate-500 text-sm mb-5">
              <strong>{confirmDelete.cargo_type}</strong> ({confirmDelete.pickup_city} → {confirmDelete.delivery_city}) will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteLoad(confirmDelete)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2"><Package size={24} /> Loads</h1>
            <p className="text-slate-500 text-sm mt-1">{total} loads on the platform</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 self-start">
            <PlusCircle size={16} /> Add Load
          </button>
        </div>

        <div className="card mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search cargo, city…" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setPage(1), loadLoads())}
              className="input-field !pl-9 !py-2.5 text-sm" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="input-field !py-2.5 text-sm sm:w-44">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button onClick={() => { setPage(1); loadLoads(); }} className="btn-primary !py-2.5 text-sm">Search</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Cargo / Route</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Shipper</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">Price</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                  <th className="text-right px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td></tr>
                  ))
                ) : loads.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy-900">{l.cargo_type} <span className="text-slate-400 font-normal text-xs">#{l.id}</span></p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        {l.pickup_city} <ArrowRight size={9} /> {l.delivery_city} · {l.weight_tons}t
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-slate-600">{l.shipper_name}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell font-medium text-navy-900">
                      ₹{Number(l.offered_price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={badgeClass[l.status] || 'badge'}>{l.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        {editingId === l.id ? (
                          <div className="flex items-center gap-1">
                            <select defaultValue={l.status}
                              onChange={e => changeStatus(l.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-navy-900 bg-white focus:outline-none">
                              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                            </select>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-700 p-1">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingId(l.id)}
                            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors">
                            Status
                          </button>
                        )}
                        <button onClick={() => setConfirmDelete(l)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40">Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="btn-secondary !py-1.5 !px-3 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
