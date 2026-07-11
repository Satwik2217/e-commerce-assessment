export const SITE_NAME = 'ShopMyUniform';
export const SITE_DESCRIPTION = 'Your one-stop fashion & apparel marketplace';

export const ITEMS_PER_PAGE = 12;

export const ORDER_STATUSES = [
  'PLACED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: 'Placed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const DEFAULT_COLORS = ['Black', 'White', 'Navy', 'Grey', 'Red', 'Blue', 'Green', 'Beige'];

export const MAX_CART_QUANTITY = 10;
