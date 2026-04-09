import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAdminApi } from '../../hooks/useAdminApi.js';
import { Users, Search, Truck, ShieldOff, ShieldCheck, UserPlus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

function AddUserModal({ onClose, onCreated }) {
  const api = useAdminApi();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'driver' });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success(`User "${form.name}" created.`);
      onCreated();
      onClose();
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-navy-900 text-lg">Add New User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
            <input type="text" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input-field" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input-field" placeholder="9876543210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
            <input type="password" required minLength={6} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="input-field" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
              <option value="driver">Driver</option>
              <option value="shipper">Shipper</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDelete({ count, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="font-bold text-navy-900 mb-1">Delete {count} user{count !== 1 ? 's' : ''}?</h3>
        <p className="text-slate-500 text-sm mb-5">
          This will permanently remove the selected user{count !== 1 ? 's' : ''} and all their associated data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const api = useAdminApi();
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage]       = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const headerCheckRef = useRef(null);
  const LIMIT = 15;

  useEffect(() => { loadUsers(); }, [page, roleFilter]);
  useEffect(() => { setSelected(new Set()); }, [page, roleFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (roleFilter) params.set('role', roleFilter);
      if (search)     params.set('search', search);
      const res = await api.get(`/users?${params}`);
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  }

  // Update indeterminate state on header checkbox
  useEffect(() => {
    if (!headerCheckRef.current) return;
    const allIds = users.map(u => u.id);
    const selCount = allIds.filter(id => selected.has(id)).length;
    headerCheckRef.current.indeterminate = selCount > 0 && selCount < allIds.length;
    headerCheckRef.current.checked = allIds.length > 0 && selCount === allIds.length;
  }, [selected, users]);

  function toggleAll() {
    const allIds = users.map(u => u.id);
    const allSelected = allIds.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function toggleStatus(user) {
    const newStatus = user.is_active === 0 ? 1 : 0;
    try {
      await api.put(`/users/${user.id}/status`, { is_active: newStatus });
      toast.success(newStatus ? `${user.name} activated.` : `${user.name} suspended.`);
      loadUsers();
    } catch (err) { toast.error(err.message); }
  }

  async function handleBatchDelete() {
    try {
      await api.del('/users/batch', { ids: [...selected] });
      toast.success(`${selected.size} user${selected.size !== 1 ? 's' : ''} deleted.`);
      setSelected(new Set());
      setShowConfirm(false);
      loadUsers();
    } catch (err) { toast.error(err.message); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onCreated={loadUsers} />}
      {showConfirm && (
        <ConfirmDelete
          count={selected.size}
          onConfirm={handleBatchDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2">
              <Users size={24} /> Users
            </h1>
            <p className="text-slate-500 text-sm mt-1">{total} registered users (excluding admin)</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 self-start">
            <UserPlus size={16} /> Add User
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search name or email…" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setPage(1), loadUsers())}
              className="input-field !pl-9 !py-2.5 text-sm" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field !py-2.5 text-sm sm:w-40">
            <option value="">All Roles</option>
            <option value="driver">Drivers</option>
            <option value="shipper">Shippers</option>
          </select>
          <button onClick={() => { setPage(1); loadUsers(); }} className="btn-primary !py-2.5 text-sm">Search</button>
        </div>

        {/* Batch action bar */}
        {selected.size > 0 && (
          <div className="mb-4 px-4 py-3 bg-navy-900 text-white rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium">{selected.size} user{selected.size !== 1 ? 's' : ''} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(new Set())}
                className="text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                Clear
              </button>
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                <Trash2 size={13} /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" ref={headerCheckRef} onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 text-navy-900 cursor-pointer accent-navy-900" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">User</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Role</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden md:table-cell">Truck</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold hidden sm:table-cell">Rating</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td></tr>
                  ))
                ) : users.map(u => (
                  <tr key={u.id}
                    onClick={() => toggleOne(u.id)}
                    className={`transition-colors cursor-pointer ${selected.has(u.id) ? 'bg-navy-50' : 'hover:bg-slate-50'} ${u.is_active === 0 ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-navy-900" />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-navy-900">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={u.role === 'driver' ? 'badge-open' : 'badge-booked'}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {u.truck_type
                        ? <span className="flex items-center gap-1 text-slate-600"><Truck size={13} /> {u.truck_type} · {u.capacity_tons}t</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-navy-900 font-medium">{u.avg_rating > 0 ? `⭐ ${u.avg_rating}` : '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={u.is_active ? 'badge-open' : 'badge-cancelled'}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => toggleStatus(u)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors
                            ${u.is_active
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}>
                          {u.is_active ? <><ShieldOff size={11} /> Suspend</> : <><ShieldCheck size={11} /> Activate</>}
                        </button>
                        <button
                          onClick={() => { setSelected(new Set([u.id])); setShowConfirm(true); }}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
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
