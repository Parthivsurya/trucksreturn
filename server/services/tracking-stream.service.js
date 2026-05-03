// In-memory SSE pub/sub keyed by booking id.
// Multiple subscribers per booking are supported (e.g. shipper open in two tabs).
const subscribers = new Map(); // bookingId -> Set<res>

export function subscribe(bookingId, res) {
  if (!subscribers.has(bookingId)) subscribers.set(bookingId, new Set());
  subscribers.get(bookingId).add(res);
}

export function unsubscribe(bookingId, res) {
  const set = subscribers.get(bookingId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) subscribers.delete(bookingId);
}

export function broadcast(bookingId, event, payload) {
  const set = subscribers.get(bookingId);
  if (!set || set.size === 0) return;
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try { res.write(data); } catch {}
  }
}
