export type CafeKind = 'cafe' | 'coffee_shop' | 'coffee_cart_or_vending';
export interface CafeStop { id: string; name: string; lat: number; lon: number; distanceMeters: number; kind: CafeKind }
export const cafeKindLabels: Record<CafeKind, string> = {
  cafe: 'Café', coffee_shop: 'Coffee shop', coffee_cart_or_vending: 'Coffee cart / machine',
};
