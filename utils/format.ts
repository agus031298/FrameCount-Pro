import { PricingRule } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculatePrice = (frames: number, tiers: PricingRule[]): number => {
  if (frames < 0) return 0;
  
  // Find the tier that matches the frame count
  const tier = tiers.find(t => frames >= t.min && frames <= t.max);
  
  // Default to the highest tier if for some reason logic misses (though Infinity covers it)
  return tier ? tier.price : 0;
};

export const normalizeShotName = (name: string): string => {
  if (!name) return '';
  
  // Remove surrounding whitespace and convert to uppercase
  let clean = name.trim().toUpperCase();

  // Regex pattern to find SQ, SC, SH followed by numbers, ignoring separators like space, underscore, or dash
  // Matches: SQ21_SC01_SH02, sq21 sc1 sh2, SQ21SC01SH02, etc.
  const regex = /SQ(\d+)[^0-9A-Z]*SC(\d+)[^0-9A-Z]*SH(\d+)/i;
  const match = clean.match(regex);

  if (match) {
    // Extract numbers
    const sq = match[1];
    const sc = match[2];
    const sh = match[3];

    // Pad with '0' if length is 1 (e.g. 1 -> 01, 21 -> 21)
    // Adjust logic: If user inputs 01, keep it. If 1, make it 01.
    const pad = (num: string) => num.length < 2 ? '0' + num : num;

    return `SQ${pad(sq)}_SC${pad(sc)}_SH${pad(sh)}`;
  }

  // Fallback for non-standard names: just replace spaces/dashes with underscore for consistency
  return clean.replace(/[\s-]+/g, '_');
};