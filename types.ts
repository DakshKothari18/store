export interface VariantSize {
  size: string;
  stock: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Crimson Red", "Suede Grey"
  images: string[]; // Variant-specific images
  sizes: VariantSize[]; // Sizes available for THIS variant
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[]; // Fallback/Main images
  sizes: string[]; // Legacy/Global sizes (optional now)
  stock: number; // Aggregated stock
  seoTitle?: string;
  seoKeywords?: string[];
  isNewDrop?: boolean;
  brand?: string;
  color?: string; // Main color
  variants?: ProductVariant[];
  ratings?: number[];
}

export interface CartItem extends Product {
  selectedSize: string;
  quantity: number;
  selectedVariantId?: string;
  selectedVariantName?: string;
}

export interface Coupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  joinedDate: string;
  wishlist?: string[];
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  date: string;
  qualityCheck?: boolean;
}

export enum ViewMode {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'];
export const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Beige', 'Grey', 'Multi'];
