export interface Shot {
  id: string;
  name: string;
  frames: number;
  price: number;
  imagePreviewUrl: string | null;
  imageData: File | null; // Keep the original file for potential future use
}

export interface PricingRule {
  min: number;
  max: number;
  price: number;
  label: string;
}

export interface PdfConfig {
  title: string;
  artistName: string;
  reportId: string;
  notes: string;
}

export const PRICING_TIERS: PricingRule[] = [
  { min: 0, max: 100, price: 125000, label: 'Kategori 1' },
  { min: 101, max: 200, price: 150000, label: 'Kategori 2' },
  { min: 201, max: 999, price: 225000, label: 'Kategori 3' },
];