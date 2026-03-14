import { MapPin, ArrowRight, Package, Weight, IndianRupee, Clock } from 'lucide-react';

export default function LoadCard({ load, onClick, showDistance = false }) {
  const statusConfig = {
    open: { class: 'badge-open', label: 'Open' },
    booked: { class: 'badge-booked', label: 'Booked' },
    in_transit: { class: 'badge-transit', label: 'In Transit' },
    delivered: { class: 'badge-delivered', label: 'Delivered' },
    cancelled: { class: 'badge-cancelled', label: 'Cancelled' },
  };
  const status = statusConfig[load.status] || statusConfig.open;

  return (
    <div
      onClick={onClick}
      className="card-hover group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-blue-400" />
          <span className="font-semibold text-white">{load.cargo_type}</span>
        </div>
        <span className={status.class}>{status.label}</span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <div className="flex items-center gap-1 text-green-400">
          <MapPin size={14} />
          <span>{load.pickup_city}</span>
        </div>
        <ArrowRight size={14} className="text-gray-600" />
        <div className="flex items-center gap-1 text-red-400">
          <MapPin size={14} />
          <span>{load.delivery_city}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Weight size={14} />
          <span>{load.weight_tons} tons</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <IndianRupee size={14} />
          <span>₹{Number(load.offered_price).toLocaleString('en-IN')}</span>
        </div>
        {load.timeline && (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={14} />
            <span>{load.timeline}</span>
          </div>
        )}
      </div>

      {/* Match info for drivers */}
      {showDistance && load.pickup_distance_km !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-xs">
          <span className="text-cyan-400">📍 {load.pickup_distance_km} km away</span>
          <span className="text-amber-400">🔄 {load.detour_percent}% detour</span>
          {load.shipper_name && <span className="text-gray-500">by {load.shipper_name}</span>}
        </div>
      )}

      {/* Shipper info */}
      {!showDistance && load.shipper_name && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>Posted by {load.shipper_name}</span>
          {load.shipper_rating > 0 && <span>⭐ {load.shipper_rating}</span>}
        </div>
      )}
    </div>
  );
}
