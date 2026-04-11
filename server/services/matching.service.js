import pool from '../db/db.js';

/**
 * Route-matching engine.
 * Finds open loads near the driver's return route within a given radius.
 * Uses Haversine distance calculation in JavaScript.
 */
export async function findMatchingLoads(availability, truck, radiusKm = 50) {
  const { current_lat, current_lng, dest_lat, dest_lng } = availability;

  const { rows: loads } = await pool.query(`
    SELECT l.*, u.name as shipper_name, u.avg_rating as shipper_rating
    FROM loads l
    JOIN users u ON l.user_id = u.id
    WHERE l.status = 'open'
  `);

  const matches = [];

  for (const load of loads) {
    const pickupDist = haversineKm(current_lat, current_lng, load.pickup_lat, load.pickup_lng);
    if (pickupDist > radiusKm) continue;

    const directDistance  = haversineKm(current_lat, current_lng, dest_lat, dest_lng);
    const viaLoadDistance = haversineKm(current_lat, current_lng, load.pickup_lat, load.pickup_lng)
                          + haversineKm(load.pickup_lat, load.pickup_lng, load.delivery_lat, load.delivery_lng)
                          + haversineKm(load.delivery_lat, load.delivery_lng, dest_lat, dest_lng);

    const detourPercent = ((viaLoadDistance - directDistance) / directDistance) * 100;
    if (detourPercent > 40) continue;

    if (truck && truck.capacity_tons < load.weight_tons) continue;

    const score = (pickupDist * 0.3) + (detourPercent * 0.4) + ((1 / (load.offered_price + 1)) * 10000 * 0.3);

    matches.push({
      ...load,
      pickup_distance_km: Math.round(pickupDist * 10) / 10,
      detour_percent:     Math.round(detourPercent * 10) / 10,
      total_route_km:     Math.round(viaLoadDistance * 10) / 10,
      match_score:        Math.round(score * 100) / 100,
    });
  }

  matches.sort((a, b) => a.match_score - b.match_score);
  return matches;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
          * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }
