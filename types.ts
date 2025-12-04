export interface ProductVariant {
  id: string;
  name: string; // e.g. "Red", "Canvas", "V2"
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  sizes: string[];
  stock: number;
  seoTitle?: string;
  seoKeywords?: string[];
  isNewDrop?: boolean;
  brand?: string;
  color?: string;
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  selectedSize: string;
  quantity: number;
  selectedVariant?: string;
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
  password: string; // Stored in plaintext for this demo (Not for production)
  phone?: string;
  joinedDate: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  date: string;
}

export enum ViewMode {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'];
export const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Beige', 'Grey', 'Multi'];