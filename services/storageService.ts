import { Product, Coupon, User, Order } from '../types';
import { INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_CATEGORIES } from '../constants';

const PRODUCTS_KEY = 'dripstore_products';
const COUPONS_KEY = 'dripstore_coupons';
const USERS_KEY = 'dripstore_users';
const ORDERS_KEY = 'dripstore_orders';
const CURRENT_USER_KEY = 'dripstore_current_user';
const CATEGORIES_KEY = 'dripstore_categories';

// --- Products ---
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

export const addProductRating = (productId: string, rating: number) => {
    const products = getProducts();
    const updatedProducts = products.map(p => {
        if (p.id === productId) {
            const currentRatings = p.ratings || [];
            return { ...p, ratings: [...currentRatings, rating] };
        }
        return p;
    });
    saveProducts(updatedProducts);
    return updatedProducts;
};

// --- Categories ---
export const getCategories = (): string[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (!stored) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  return JSON.parse(stored);
};

export const saveCategories = (categories: string[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

// --- Coupons ---
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

// --- Users & Auth ---
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const updateUser = (user: User) => {
    const users = getUsers();
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    // Also update current user if it matches
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const loginUser = (email: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// --- Orders ---
export const getOrders = (userId?: string): Order[] => {
  const stored = localStorage.getItem(ORDERS_KEY);
  const allOrders: Order[] = stored ? JSON.parse(stored) : [];
  if (userId) {
    return allOrders.filter(o => o.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return allOrders;
};

export const saveOrder = (order: Order) => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};