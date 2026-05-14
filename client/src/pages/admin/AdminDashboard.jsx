import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import { useAdminApi } from '../../hooks/useAdminApi.js';
import { Users, Package, BookOpen, IndianRupee, Truck, TrendingUp, ArrowRight } from 'lucide-react';

function StatTile({ label, value, sub, icon: Icon, color = 'navy' }) {
  const colors = {
    navy:   'bg-navy-50 text-navy-900 border-navy-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    red:    'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-black text-navy-900">{value}</p>
      <p className="text-sm font-medium text-navy-900 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const api = useAdminApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(setData).catch(() => {});
  }, []);

  if (!data) return (
    <AdminLayout>
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const statusBadge = {
    confirmed:  'badge-booked',
    picked_up:  'badge-transit',
    in_transit: 'badge-transit',
    delivered:  'badge-delivered',
    cancelled:  'badge-cancelled',
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-navy-900">Platform Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Live metrics across the TrucksReturn network</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatTile icon={Users}       label="Total Users"     value={data.users.total}
            sub={`${data.users.drivers} drivers · ${data.users.shippers} shippers`} color="navy" />
          <StatTile icon={Package}     label="Total Loads"     value={data.loads.total}
            sub={`${data.loads.open} open · ${data.loads.inTransit} in transit`} color="green" />
          <StatTile icon={BookOpen}    label="Bookings"        value={data.bookings.total}
            sub={`${data.bookings.active} active`} color="amber" />
          <StatTile icon={IndianRupee} label="Platform Revenue" value={`₹${Number(data.platformRevenue).toLocaleString('en-IN')}`}
            sub="From delivered loads" color="green" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Signups */}
          <div className="card">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Users size={17} className="text-navy-900" /> Recent Registrations
            </h2>
            <div className="divide-y divide-slate-100">
              {data.recentUsers.map(u => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`badge ${u.role === 'driver' ? 'badge-open' : 'badge-booked'}`}>{u.role}</span>
                    {u.is_active === 0 && <span className="badge badge-cancelled">Suspended</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="card">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <BookOpen size={17} className="text-navy-900" /> Recent Bookings
            </h2>
            <div className="divide-y divide-slate-100">
              {data.recentBookings.map(b => (
                <div key={b.id} className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-navy-900">{b.cargo_type}</span>
                    <span className={statusBadge[b.status] || 'badge'}>{b.status.replace('_',' ')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <span>{b.pickup_city}</span>
                    <ArrowRight size={10} />
                    <span>{b.delivery_city}</span>
                    <span className="ml-2 text-navy-900 font-medium">₹{Number(b.agreed_price).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{b.driver_name} → {b.shipper_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick load breakdown */}
        <div className="card mt-6">
          <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
            <TrendingUp size={17} /> Load Status Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Open',        value: data.loads.open,       cls: 'badge-open' },
              { label: 'In Transit',  value: data.loads.inTransit,  cls: 'badge-transit' },
              { label: 'Delivered',   value: data.loads.delivered,  cls: 'badge-delivered' },
              { label: 'Suspended Users', value: data.users.suspended, cls: 'badge-cancelled' },
            ].map(item => (
              <div key={item.label} className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                <p className="text-2xl font-black text-navy-900">{item.value}</p>
                <span className={`mt-1 inline-block ${item.cls}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
