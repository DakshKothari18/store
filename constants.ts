import { Product, Coupon } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cyberpunk Oversized Tee',
    description: 'Heavyweight cotton tee with distressed cyber prints. Perfect for the urban explorer.',
    price: 45,
    originalPrice: 60,
    category: 'T-Shirts',
    images: ['https://picsum.photos/id/1060/800/1000'],
    sizes: ['M', 'L', 'XL'],
    stock: 50,
    isNewDrop: true,
    seoTitle: 'Cyberpunk Oversized Tee - Limited Edition Streetwear',
    seoKeywords: ['cyberpunk', 'streetwear', 'oversized tee', 'black t-shirt']
  },
  {
    id: '2',
    name: 'Neon Glitch Hoodie',
    description: 'French terry hoodie featuring neon glitch aesthetics and dropped shoulders.',
    price: 85,
    category: 'Hoodies',
    images: ['https://picsum.photos/id/1067/800/1000'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 20,
    seoTitle: 'Neon Glitch Hoodie - Premium Cotton',
    seoKeywords: ['hoodie', 'neon', 'streetwear', 'winter wear']
  },
  {
    id: '3',
    name: 'Cargo Tech Pants',
    description: 'Utility focused cargo pants with multiple pockets and adjustable ankle straps.',
    price: 70,
    originalPrice: 90,
    category: 'Pants',
    images: ['https://picsum.photos/id/103/800/1000'],
    sizes: ['30', '32', '34', '36'],
    stock: 35,
    isNewDrop: false
  },
  {
    id: '4',
    name: 'Obsidian Chain',
    description: 'Stainless steel industrial chain with obsidian finish.',
    price: 35,
    category: 'Accessories',
    images: ['https://picsum.photos/id/114/800/1000'],
    sizes: ['One Size'],
    stock: 100,
    isNewDrop: true
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'DRIP10', type: 'PERCENTAGE', value: 10 },
  { code: 'WELCOME20', type: 'PERCENTAGE', value: 20 },
  { code: 'FLAT50', type: 'FIXED', value: 50 }
];

export const WHATSAPP_NUMBER = "1234567890"; // Replace with real number
