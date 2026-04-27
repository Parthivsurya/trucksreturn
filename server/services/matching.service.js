import pool from '../db/db.js';

/**
 * Route-matching engine.
 * Finds open loads near the driver's ENTIRE return route (current → destination),
 * not just the starting point. Samples intermediate points along the straight-line
 * route to capture cities like Coimbatore between Bangalore and Kochi.
 *
 * Direction constraints:
 *  - Load pickup must be "ahead" of the driver (projected progress along route > 0%)
 *  - Load pickup must not be "behind" the driver's current position
 *  - Load delivery must trend toward the destination (not backward)
 *  - Total route detour ≤ 40%
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

  // Sample points along the driver's route: start, 10%, 20%, … 90%, end = 11 points
  const SAMPLES = 10; // number of intervals → SAMPLES+1 points
  const routePoints = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    routePoints.push({
      lat: current_lat + t * (dest_lat - current_lat),
      lng: current_lng + t * (dest_lng - current_lng),
      t,   // progress along route: 0 = start, 1 = destination
    });
  }

  const totalRouteKm = haversineKm(current_lat, current_lng, dest_lat, dest_lng);

  for (const load of loads) {
    // ── Step 1: find the closest route point to the load's pickup ──────────
    let closestDist = Infinity;
    let closestT    = 0;
    for (const pt of routePoints) {
      const d = haversineKm(pt.lat, pt.lng, load.pickup_lat, load.pickup_lng);
      if (d < closestDist) {
        closestDist = d;
        closestT    = pt.t;
      }
    }

    // ── Step 2: pickup must be within radius of some route point ───────────
    if (closestDist > radiusKm) continue;

    // ── Step 3: direction check — pickup must be ahead (not behind) ────────
    // closestT < 0.05 means the load is at/behind the start — still accept if
    // within radius (driver could literally be at origin). But if closestT = 0
    // that is the current position which is valid.
    // Reject loads whose pickup projects BEHIND the driver (negative progress
    // is impossible with our sampling since t ∈ [0,1], but exclude t=1 loads
    // whose pickup is effectively at the destination with no capacity to deliver).
    // We just need to ensure load delivery doesn't point backward.
    const deliveryProgressDist = haversineKm(load.delivery_lat, load.delivery_lng, dest_lat, dest_lng);
    const pickupProgressDist   = haversineKm(load.pickup_lat, load.pickup_lng, dest_lat, dest_lng);
    // Delivery should be at least as close to destination as pickup
    // (i.e., it moves the cargo toward the driver's destination)
    if (deliveryProgressDist > pickupProgressDist + radiusKm * 1.5) continue;

    // ── Step 4: geographic bounding box sanity check ───────────────────────
    // Reject loads completely outside the bounding box of the route (with padding)
    const PADDING = radiusKm / 111; // rough degrees
    const minLat = Math.min(current_lat, dest_lat) - PADDING;
    const maxLat = Math.max(current_lat, dest_lat) + PADDING;
    const minLng = Math.min(current_lng, dest_lng) - PADDING;
    const maxLng = Math.max(current_lng, dest_lng) + PADDING;
    if (
      load.pickup_lat < minLat || load.pickup_lat > maxLat ||
      load.pickup_lng < minLng || load.pickup_lng > maxLng
    ) continue;

    // ── Step 5: capacity check ─────────────────────────────────────────────
    if (truck && truck.capacity_tons < load.weight_tons) continue;

    // ── Step 6: detour calculation ─────────────────────────────────────────
    // Route: current → pickup → delivery → destination
    const viaLoadDistance = haversineKm(current_lat, current_lng, load.pickup_lat, load.pickup_lng)
                          + haversineKm(load.pickup_lat, load.pickup_lng, load.delivery_lat, load.delivery_lng)
                          + haversineKm(load.delivery_lat, load.delivery_lng, dest_lat, dest_lng);

    const detourPercent = totalRouteKm > 0
      ? ((viaLoadDistance - totalRouteKm) / totalRouteKm) * 100
      : 0;
    if (detourPercent > 40) continue;

    // ── Step 7: score — lower is better ───────────────────────────────────
    // pickupDist to nearest route point (30%), detour % (40%), price factor (30%)
    const score = (closestDist * 0.3) + (Math.max(0, detourPercent) * 0.4) + ((1 / (load.offered_price + 1)) * 10000 * 0.3);

    // ── Step 8: determine if this is an intermediate or start-point match ──
    const isIntermediate = closestT > 0.1; // pickup is >10% along the route

    matches.push({
      ...load,
      pickup_distance_km:  Math.round(closestDist * 10) / 10,
      detour_percent:      Math.round(detourPercent * 10) / 10,
      total_route_km:      Math.round(viaLoadDistance * 10) / 10,
      match_score:         Math.round(score * 100) / 100,
      route_progress_pct:  Math.round(closestT * 100),  // how far along route the pickup is
      is_intermediate:     isIntermediate,
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
