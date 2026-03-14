import db from '../db/db.js';

/**
 * Route-matching engine.
 * Finds open loads near the driver's return route within a given radius.
 * Uses Haversine distance approximation for SQLite (no PostGIS).
 */
export function findMatchingLoads(availability, truck, radiusKm = 50) {
  const { current_lat, current_lng, dest_lat, dest_lng } = availability;

  // Get all open loads
  const loads = db.prepare(`
    SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating
    FROM loads l
    JOIN users u ON l.user_id = u.id
    WHERE l.status = 'open'
  `).all();

  const matches = [];

  for (const load of loads) {
    // Calculate distance from driver's current location to load pickup
    const pickupDist = haversineKm(current_lat, current_lng, load.pickup_lat, load.pickup_lng);

    if (pickupDist > radiusKm) continue;

    // Calculate if delivery destination is roughly on the driver's route
    // (i.e., the delivery doesn't add too much detour)
    const directDistance = haversineKm(current_lat, current_lng, dest_lat, dest_lng);
    const viaLoadDistance = haversineKm(current_lat, current_lng, load.pickup_lat, load.pickup_lng)
                          + haversineKm(load.pickup_lat, load.pickup_lng, load.delivery_lat, load.delivery_lng)
                          + haversineKm(load.delivery_lat, load.delivery_lng, dest_lat, dest_lng);

    const detourPercent = ((viaLoadDistance - directDistance) / directDistance) * 100;

    // Accept if detour is < 40%
    if (detourPercent > 40) continue;

    // Check truck capacity
    if (truck && truck.capacity_tons < load.weight_tons) continue;

    // Score: lower is better (weighted combination of distance and detour)
    const score = (pickupDist * 0.3) + (detourPercent * 0.4) + ((1 / (load.offered_price + 1)) * 10000 * 0.3);

    matches.push({
      ...load,
      pickup_distance_km: Math.round(pickupDist * 10) / 10,
      detour_percent: Math.round(detourPercent * 10) / 10,
      total_route_km: Math.round(viaLoadDistance * 10) / 10,
      match_score: Math.round(score * 100) / 100,
    });
  }

  // Sort by score (lower = better match)
  matches.sort((a, b) => a.match_score - b.match_score);

  return matches;
}

/**
 * Haversine formula - calculates distance between two lat/lng points in kilometres.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
          * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
