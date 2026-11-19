import { CafeKind, CafeStop } from '../domain/cafes';
import { haversineDistanceMeters, LatLon } from '../domain/geo';

// Overpass API is a free, keyless read interface onto OpenStreetMap data.
// https://wiki.openstreetmap.org/wiki/Overpass_API
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

interface OverpassElement { id: number; lat: number; lon: number; tags?: Record<string, string> }
interface OverpassResponse { elements: OverpassElement[] }

function buildQuery(center: LatLon, radiusMeters: number): string {
  const { lat, lon } = center;
  const around = `(around:${radiusMeters},${lat},${lon})`;
  return `[out:json][timeout:25];(node["amenity"="cafe"]${around};node["shop"="coffee"]${around};node["cuisine"="coffee_shop"]${around};node["vending"="coffee"]${around};);out body;`;
}
function classifyKind(tags: Record<string, string> = {}): CafeKind {
  if (tags.vending === 'coffee') return 'coffee_cart_or_vending';
  if (tags.shop === 'coffee' || tags.cuisine === 'coffee_shop') return 'coffee_shop';
  return 'cafe';
}
export async function fetchCafesNear(center: LatLon, radiusMeters: number): Promise<CafeStop[]> {
  const response = await fetch(OVERPASS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: buildQuery(center, radiusMeters) });
  if (!response.ok) throw new Error(`Overpass request failed: ${response.status}`);
  const data: OverpassResponse = await response.json();
  return data.elements
    .filter(el => typeof el.lat === 'number' && typeof el.lon === 'number')
    .map(el => ({
      id: String(el.id), name: el.tags?.name?.trim() || 'Unnamed café/cart',
      lat: el.lat, lon: el.lon, distanceMeters: Math.round(haversineDistanceMeters(center, { lat: el.lat, lon: el.lon })),
      kind: classifyKind(el.tags),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
