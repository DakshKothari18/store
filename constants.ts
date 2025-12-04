import { Product, Coupon } from './types';

export const INITIAL_CATEGORIES = ['T-Shirts', 'Hoodies', 'Pants', 'Shoes', 'Accessories', 'Limited Drop'];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cyberpunk Oversized Tee',
    description: 'Heavyweight cotton tee with distressed cyber prints. Perfect for the urban explorer.',
    price: 1999,
    originalPrice: 2499,
    category: 'T-Shirts',
    images: ['https://picsum.photos/id/1060/800/1000', 'https://picsum.photos/id/1062/800/1000', 'https://picsum.photos/id/1069/800/1000'],
    sizes: ['M', 'L', 'XL'],
    stock: 50,
    isNewDrop: true,
    seoTitle: 'Cyberpunk Oversized Tee - Limited Edition Streetwear',
    seoKeywords: ['cyberpunk', 'streetwear', 'oversized tee', 'black t-shirt'],
    brand: 'DRIP ORIGINALS',
    color: 'Black',
    variants: [
        { id: 'v1', name: 'Standard Fit', stock: 20 },
        { id: 'v2', name: 'Boxy Fit', stock: 30 }
    ],
    ratings: [5, 5, 4, 5]
  },
  {
    id: '2',
    name: 'Neon Glitch Hoodie',
    description: 'French terry hoodie featuring neon glitch aesthetics and dropped shoulders.',
    price: 3499,
    category: 'Hoodies',
    images: ['https://picsum.photos/id/1067/800/1000', 'https://picsum.photos/id/1011/800/1000'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 20,
    seoTitle: 'Neon Glitch Hoodie - Premium Cotton',
    seoKeywords: ['hoodie', 'neon', 'streetwear', 'winter wear'],
    brand: 'NEON WAVE',
    color: 'Blue',
    ratings: [4, 3, 5]
  },
  {
    id: '3',
    name: 'Cargo Tech Pants',
    description: 'Utility focused cargo pants with multiple pockets and adjustable ankle straps.',
    price: 2899,
    originalPrice: 3500,
    category: 'Pants',
    images: ['https://picsum.photos/id/103/800/1000'],
    sizes: ['30', '32', '34', '36'],
    stock: 35,
    isNewDrop: false,
    brand: 'TACTICAL OPS',
    color: 'Green',
    ratings: [5, 5]
  },
  {
    id: '4',
    name: 'Obsidian Chain',
    description: 'Stainless steel industrial chain with obsidian finish.',
    price: 999,
    category: 'Accessories',
    images: ['https://picsum.photos/id/114/800/1000'],
    sizes: ['One Size'],
    stock: 100,
    isNewDrop: true,
    brand: 'DRIP ORIGINALS',
    color: 'Silver',
    ratings: [4]
  },
  {
    id: '5',
    name: 'Velocity Runner V1',
    description: 'High-performance chunky sneakers with reflective detailing and air-cushion sole.',
    price: 6999,
    originalPrice: 8999,
    category: 'Shoes',
    images: [
        'https://picsum.photos/id/103/800/1000',
        'https://picsum.photos/id/21/800/1000',
        'https://picsum.photos/id/75/800/1000'
    ], 
    sizes: ['US 8', 'US 9', 'US 10', 'US 11'],
    stock: 15,
    isNewDrop: true,
    brand: 'SPEED INC',
    color: 'White',
    ratings: [5, 5, 5, 5, 5]
  },
  {
    id: '6',
    name: 'Urban Trekker Boots',
    description: 'Rugged combat boots designed for the concrete jungle. Waterproof leather.',
    price: 5499,
    category: 'Shoes',
    images: ['https://picsum.photos/id/1070/800/1000'],
    sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
    stock: 25,
    isNewDrop: false,
    brand: 'DRIP ORIGINALS',
    color: 'Black',
    ratings: [3, 4]
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'DRIP10', type: 'PERCENTAGE', value: 10 },
  { code: 'WELCOME20', type: 'PERCENTAGE', value: 20 },
  { code: 'FLAT500', type: 'FIXED', value: 500 }
];

export const WHATSAPP_NUMBER = "1234567890"; // Replace with real number