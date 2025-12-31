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