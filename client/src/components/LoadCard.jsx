import { MapPin, ArrowRight, Package, Weight, IndianRupee, Clock } from 'lucide-react';

export default function LoadCard({ load, onClick, showDistance = false }) {
  const statusConfig = {
    open:       { class: 'badge-open',      label: 'Open' },
    booked:     { class: 'badge-booked',    label: 'Booked' },
    in_transit: { class: 'badge-transit',   label: 'In Transit' },
    delivered:  { class: 'badge-delivered', label: 'Delivered' },
    cancelled:  { class: 'badge-cancelled', label: 'Cancelled' },
  };
  const status = statusConfig[load.status] || statusConfig.open;

  return (
    <div onClick={onClick} className="card-hover group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package size={17} className="text-navy-900" />
          <span className="font-semibold text-navy-900">{load.cargo_type}</span>
        </div>
        <span className={status.class}>{status.label}</span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <div className="flex items-center gap-1 text-green-700">
          <MapPin size={13} />
          <span>{load.pickup_city}</span>
        </div>
        <ArrowRight size={13} className="text-slate-400" />
        <div className="flex items-center gap-1 text-red-600">
          <MapPin size={13} />
          <span>{load.delivery_city}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Weight size={13} />
          <span>{load.weight_tons} tons</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--accent)' }}>
          <IndianRupee size={13} />
          <span>₹{Number(load.offered_price).toLocaleString('en-IN')}</span>
        </div>
        {load.timeline && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock size={13} />
            <span>{load.timeline}</span>
          </div>
        )}
      </div>

      {/* Match info for drivers */}
      {showDistance && load.pickup_distance_km !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-navy-600 font-medium">📍 {load.pickup_distance_km} km from route</span>
            <span className="text-amber-600">🔄 {load.detour_percent}% detour</span>
            {load.shipper_name && <span className="text-slate-400">by {load.shipper_name}</span>}
          </div>
          {load.is_intermediate && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
              🛣️ Intermediate stop · {load.route_progress_pct}% along your route
            </div>
          )}
        </div>
      )}

      {/* Shipper info */}
      {!showDistance && load.shipper_name && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Posted by {load.shipper_name}</span>
          {load.shipper_rating > 0 && <span>⭐ {load.shipper_rating}</span>}
        </div>
      )}
    </div>
  );
}
