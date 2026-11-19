export interface LatLon { lat: number; lon: number }

const EARTH_RADIUS_METERS = 6371000;
function toRadians(degrees: number): number { return (degrees * Math.PI) / 180; }

export function haversineDistanceMeters(a: LatLon, b: LatLon): number {
  const dLat = toRadians(b.lat - a.lat), dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat), lat2 = toRadians(b.lat);
  const sinLat = Math.sin(dLat / 2), sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}
