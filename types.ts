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
}

export interface CartItem extends Product {
  selectedSize: string;
  quantity: number;
}

export interface Coupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export enum ViewMode {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export const CATEGORIES = ['All', 'T-Shirts', 'Hoodies', 'Pants', 'Accessories', 'Limited Drop'];
export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];