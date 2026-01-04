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
    images: ['https://picsum.photos/id/1060/800/1000'],
    sizes: ['M', 'L', 'XL'],
    stock: 50,
    isNewDrop: true,
    brand: 'THAT ORIGINALS',
    color: 'Black',
    variants: [
        { 
          id: 'v1', 
          name: 'Classic Black', 
          images: ['https://picsum.photos/id/1060/800/1000', 'https://picsum.photos/id/1062/800/1000'],
          sizes: [
            { size: 'M', stock: 10 },
            { size: 'L', stock: 15 }
          ]
        },
        { 
          id: 'v2', 
          name: 'Glitch White', 
          images: ['https://picsum.photos/id/1069/800/1000'],
          sizes: [
            { size: 'L', stock: 20 },
            { size: 'XL', stock: 5 }
          ]
        }
    ],
    ratings: [5, 5, 4, 5]
  },
  {
    id: '2',
    name: 'Neon Glitch Hoodie',
    description: 'French terry hoodie featuring neon glitch aesthetics and dropped shoulders.',
    price: 3499,
    category: 'Hoodies',
    images: ['https://picsum.photos/id/1067/800/1000'],
    sizes: ['S', 'M', 'L'],
    stock: 20,
    brand: 'NEON WAVE',
    color: 'Blue',
    ratings: [4, 3, 5]
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'THAT10', type: 'PERCENTAGE', value: 10 },
  { code: 'WELCOME20', type: 'PERCENTAGE', value: 20 }
];

export const WHATSAPP_NUMBER = "919823849693";
