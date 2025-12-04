import { Product, Coupon } from '../types';
import { INITIAL_PRODUCTS, INITIAL_COUPONS } from '../constants';

const PRODUCTS_KEY = 'dripstore_products';
const COUPONS_KEY = 'dripstore_coupons';

export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (!stored) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const getCoupons = (): Coupon[] => {
  const stored = localStorage.getItem(COUPONS_KEY);
  if (!stored) {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(INITIAL_COUPONS));
    return INITIAL_COUPONS;
  }
  return JSON.parse(stored);
};

export const saveCoupons = (coupons: Coupon[]) => {
  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
};
