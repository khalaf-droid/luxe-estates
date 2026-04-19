// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Property Model
// Source of truth: Template/index.html — mockProperties array (lines 1887–1894)
// ─────────────────────────────────────────────────────────────────────────────

export interface Property {
  _id: string;
  title: string;
  location: string;       // city display name  e.g. "Dubai", "London"
  city: string;           // filter key          e.g. "Dubai", "New York"
  price: number;
  currency: string;       // e.g. 'USD'
  type: 'apartment' | 'villa' | 'penthouse' | 'estate';
  status: 'for-sale' | 'for-rent';
  bedrooms: number;
  bathrooms: number;
  area: number;           // m²
  images: string[];
  description: string;
  features: string[];     // e.g. ['Pool', 'Gym', 'Concierge']
  featured: boolean;
  badge: string;          // e.g. 'For Sale', 'For Rent', 'New', 'Featured'
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter shape — matches Template filter tabs:
// ALL | FOR SALE | FOR RENT | APARTMENTS | VILLAS | PENTHOUSES
// ─────────────────────────────────────────────────────────────────────────────
export interface PropertyFilters {
  status?: 'for-sale' | 'for-rent';
  type?: 'apartment' | 'villa' | 'penthouse' | 'estate';
  city?: string;
  maxPrice?: number;
  minPrice?: number;
}
