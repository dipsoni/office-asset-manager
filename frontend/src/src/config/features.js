// Feature flags for configurable modules
// Price and Warranty are hidden by default per user preference
export const FEATURES = {
  SHOW_PRICE: false,
  SHOW_WARRANTY: false
};

export function isPriceEnabled(settings) {
  if (settings && settings.show_price !== undefined) {
    return settings.show_price === 'true';
  }
  return FEATURES.SHOW_PRICE;
}

export function isWarrantyEnabled(settings) {
  if (settings && settings.show_warranty !== undefined) {
    return settings.show_warranty === 'true';
  }
  return FEATURES.SHOW_WARRANTY;
}
