import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAdminApi } from '../../hooks/useAdminApi.js';
import { BookOpen, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const badgeClass = {
  confirmed:  'badge-booked',
  picked_up:  'badge-transit',
  in_transit: 'badge-transit',
  delivered:  'badge-delivered',
  cancelled:  'badge-cancelled',
  disputed:   'badge-cancelled',
};

export default function AdminBookings() {
  const api = useAdminApi();
  const [bookings, setBookings] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState('');
  const [page, setPage]         = useState(1);
  const LIMIT = 15;

  useEffect(() => { loadBookings(); }, [page, status]);

  async function loadBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (status) params.set('status', status);
      const res = await api.get(`/bookings?${params}`);
      setBookings(res.bookings);
      setTotal(res.total);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  }

  const totalPages = Math.ceil(total / LIMIT);

  const STATUSES = ['confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed'];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2"><BookOpen size={24} /> Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total bookings</p>
        </div>

        {/* Filter */}
        <div className="card mb-6 flex gap-3">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="input-field !py-2.5 text-sm w-48">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Shipment</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Driver</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Shipper</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">Price</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                  <th className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden lg:table-cell">Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                  ))
                ) : bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy-900">{b.cargo_type} <span className="text-slate-400 font-normal text-xs">#{b.id}</span></p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        {b.pickup_city} <ArrowRight size={9} /> {b.delivery_city} · {b.weight_tons}t
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-slate-700">{b.driver_name}</p>
                      {b.truck_type && <p className="text-xs text-slate-400">{b.truck_type}</p>}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-slate-700">{b.shipper_name}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell font-semibold text-navy-900">
                      ₹{Number(b.agreed_price).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={badgeClass[b.status] || 'badge'}>{b.status.replace('_',' ')}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">
                      {new Date(b.booked_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
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
