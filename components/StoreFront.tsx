
import React, { useState, useEffect } from 'react';
import { Product, CartItem, COLORS, User, Order, ProductVariant, Coupon } from '../types';
import { getProducts, getCurrentUser, loginUser, logoutUser, saveUser, saveOrder, getOrders, getCategories, updateUser, getGlobalSizes, getCoupons } from '../services/storageService';
import { ShoppingBag, X, Plus, Minus, ExternalLink, Search, SlidersHorizontal, User as UserIcon, Moon, Sun, Layers, Tag } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';

const ITEMS_PER_PAGE = 12;

export const StoreFront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]); 
  const [categories, setCategories] = useState<string[]>([]);
  const [globalSizes, setGlobalSizes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync dark mode with document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Filters
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSize, setActiveSize] = useState('All');
  const [activeColor, setActiveColor] = useState('All');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000); 
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // User & Cart
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartBump, setCartBump] = useState(false); 

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Interaction
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalSelectedVariant, setModalSelectedVariant] = useState<ProductVariant | null>(null);
  const [modalSelectedSize, setModalSelectedSize] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const loadedProducts = getProducts();
    setProducts(loadedProducts);
    setCategories(getCategories());
    setGlobalSizes(getGlobalSizes());
    const user = getCurrentUser();
    if (user) setCurrentUser(user);
    setIsLoading(false);
  }, []);

  // Filtering Logic
  useEffect(() => {
    let result = products;
    if (activeCategory !== 'All' && activeCategory !== 'Deals') {
      result = result.filter(p => p.category === activeCategory);
    } else if (activeCategory === 'Deals') {
      result = result.filter(p => p.originalPrice && p.originalPrice > p.price);
    }

    if (activeSize !== 'All') {
      result = result.filter(p => {
        const hasSize = p.variants?.some(v => v.sizes.some(s => s.size === activeSize && s.stock > 0));
        const hasLegacySize = p.sizes?.includes(activeSize);
        return hasSize || hasLegacySize;
      });
    }

    if (activeColor !== 'All') {
      result = result.filter(p => p.color === activeColor);
    }
    
    result = result.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(result);
    setVisibleCount(ITEMS_PER_PAGE);
  }, [products, activeCategory, activeSize, activeColor, minPrice, maxPrice, searchQuery]);

  useEffect(() => {
    setDisplayedProducts(filteredProducts.slice(0, visibleCount));
  }, [filteredProducts, visibleCount]);

  useEffect(() => {
    if (selectedProduct) {
      setActiveImageIndex(0);
      setModalSelectedSize('');
      if (selectedProduct.variants?.length) {
        setModalSelectedVariant(selectedProduct.variants[0]);
      } else {
        setModalSelectedVariant(null);
      }
    }
  }, [selectedProduct]);

  const handleApplyCoupon = () => {
    const coupons = getCoupons();
    const found = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (found) {
      setActiveCoupon(found);
      setCouponError('');
    } else {
      setCouponError('Invalid code');
      setActiveCoupon(null);
    }
  };

  const currentModalImages = (modalSelectedVariant?.images && modalSelectedVariant.images.length > 0) 
    ? modalSelectedVariant.images 
    : (selectedProduct?.images || []);

  const currentAvailableSizes = modalSelectedVariant 
    ? modalSelectedVariant.sizes.filter(s => s.stock > 0).map(s => s.size)
    : (selectedProduct?.sizes || []);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let discount = 0;
  if (activeCoupon) {
    if (activeCoupon.type === 'PERCENTAGE') {
      discount = (subtotal * activeCoupon.value) / 100;
    } else {
      discount = activeCoupon.value;
    }
  }
  const total = Math.max(0, subtotal - discount);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors duration-300 pb-20">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-40 border-b border-zinc-200 dark:border-zinc-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-24 flex justify-between items-center">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => { setActiveCategory('All'); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
            <div className="flex flex-col items-start select-none leading-[0.7]">
                <span className="font-black text-[3.8rem] tracking-tighter text-black dark:text-white lowercase">that</span>
                <span className="font-light text-[1.4rem] tracking-tight text-black dark:text-white ml-12 lowercase">store.</span>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-sm relative mx-8">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
             <input type="text" placeholder="Search brands or drops..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 ring-lime-400" />
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">{isDarkMode ? <Sun size={24} /> : <Moon size={24} />}</button>
            <button onClick={() => currentUser ? setShowProfileModal(true) : setShowAuthModal(true)} className="p-2 text-zinc-600 dark:text-zinc-400"><UserIcon size={24} /></button>
            <button onClick={() => setCartOpen(true)} className={`relative p-2 transition-transform ${cartBump ? 'scale-125 text-lime-500' : ''}`}>
              <ShoppingBag size={24} />
              {totalCartItems > 0 && <span className="absolute top-0 right-0 bg-lime-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950">{totalCartItems}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-48 pb-20 px-4 text-center">
        <h1 className="text-6xl md:text-9xl font-black mb-6 tracking-tighter uppercase leading-[0.8] text-zinc-900 dark:text-white">
          WEAR <br/> THE EDGE.
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xl md:text-2xl font-light italic mb-10 uppercase tracking-widest">
          Curated Without Limits
        </p>
        <a href="#shop" className="inline-block bg-lime-400 text-black font-black px-12 py-4 rounded-full hover:bg-lime-300 transition-all uppercase tracking-widest shadow-xl shadow-lime-400/20">
            Shop The Drop
        </a>
      </div>

      {/* Shop Section */}
      <div id="shop" className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-12">
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            {['All', 'Deals', ...categories].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition whitespace-nowrap ${activeCategory === cat ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200'}`}>{cat}</button>
            ))}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-6 py-2 border border-zinc-200 dark:border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest">
            <SlidersHorizontal size={14} /> {showFilters ? 'Hide Filters' : 'Filter & Sort'}
          </button>
        </div>

        {showFilters && (
          <div className="mb-12 p-8 bg-zinc-100 dark:bg-zinc-900 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-8 animate-in fade-in slide-in-from-top-4">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Min Price (₹)</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} className="w-full bg-white dark:bg-zinc-950 p-3 rounded-lg border-none text-xs outline-none focus:ring-1 ring-lime-400" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Price (₹)</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full bg-white dark:bg-zinc-950 p-3 rounded-lg border-none text-xs outline-none focus:ring-1 ring-lime-400" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Colorway</label>
              <select value={activeColor} onChange={(e) => setActiveColor(e.target.value)} className="w-full bg-white dark:bg-zinc-950 p-3 rounded-lg border-none text-xs outline-none focus:ring-1 ring-lime-400">
                {['All', ...COLORS].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Size</label>
              <select value={activeSize} onChange={(e) => setActiveSize(e.target.value)} className="w-full bg-white dark:bg-zinc-950 p-3 rounded-lg border-none text-xs outline-none focus:ring-1 ring-lime-400">
                {['All', ...globalSizes].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {displayedProducts.map(product => (
            <div key={product.id} className="group cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="aspect-[3/4] overflow-hidden bg-zinc-200 dark:bg-zinc-900 rounded-xl relative mb-4">
                <img src={product.images[0]} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                {product.isNewDrop && <div className="absolute top-3 left-3 bg-white text-black text-[8px] font-black px-2 py-1 uppercase tracking-widest">New Drop</div>}
              </div>
              <div className="flex justify-between items-start px-1">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-tight">{product.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{product.brand}</p>
                </div>
                <div className="text-right">
                    {product.originalPrice && <p className="text-[10px] text-zinc-400 line-through">₹{product.originalPrice}</p>}
                    <p className="font-mono font-bold text-sm text-lime-600 dark:text-lime-400">₹{product.price.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] relative border border-zinc-200 dark:border-zinc-800">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white hover:text-black rounded-full text-white z-10 transition"><X size={20} /></button>
            <div className="w-full md:w-3/5 bg-zinc-100 dark:bg-zinc-900 flex flex-col h-1/2 md:h-full">
              <div className="flex-1 relative overflow-hidden">
                <img src={currentModalImages[activeImageIndex]} className="w-full h-full object-cover" />
              </div>
              {currentModalImages.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                  {currentModalImages.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-20 h-24 flex-shrink-0 rounded-lg border-2 transition ${activeImageIndex === idx ? 'border-lime-500' : 'border-transparent opacity-50'}`}>
                      <img src={img} className="w-full h-full object-cover rounded-md" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-2/5 p-8 overflow-y-auto flex flex-col h-1/2 md:h-full">
              <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter leading-none">{selectedProduct.name}</h2>
              <div className="text-3xl font-mono font-bold mb-8">₹{selectedProduct.price.toLocaleString()}</div>
              <div className="mb-8">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">The Narrative</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{selectedProduct.description}</p>
              </div>

              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3"><Layers size={10} className="inline mr-1"/> Style Variant</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.variants.map(variant => (
                      <button key={variant.id} onClick={() => setModalSelectedVariant(variant)} className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition ${modalSelectedVariant?.id === variant.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>{variant.name}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Available Sizes</h3>
                <div className="flex flex-wrap gap-2">
                  {currentAvailableSizes.map(size => (
                    <button key={size} onClick={() => setModalSelectedSize(size)} className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono text-xs font-bold border transition ${modalSelectedSize === size ? 'bg-lime-400 text-black border-lime-400 shadow-lg' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>{size}</button>
                  ))}
                </div>
              </div>

              <button
                disabled={!modalSelectedSize || (selectedProduct.variants?.length ? !modalSelectedVariant : false)}
                onClick={() => {
                   setCart(prev => [...prev, { ...selectedProduct, selectedSize: modalSelectedSize, selectedVariantId: modalSelectedVariant?.id, selectedVariantName: modalSelectedVariant?.name, quantity: 1 }]);
                   setCartBump(true);
                   setTimeout(() => setCartBump(false), 300);
                   setSelectedProduct(null);
                }}
                className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-lime-500 transition-all mt-auto"
              >
                <ShoppingBag size={20} /> Add To Bag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-950 w-full max-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Your Bag ({totalCartItems})</h2>
              <button onClick={() => setCartOpen(false)}><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${item.selectedSize}-${idx}`} className="flex gap-6">
                  <div className="w-20 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden">
                    <img src={item.images[0]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-xs uppercase leading-none mb-1">{item.name}</h3>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{item.selectedSize} {item.selectedVariantName ? `• ${item.selectedVariantName}` : ''}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-sm">₹{item.price.toLocaleString()}</span>
                      <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 text-[10px] font-bold uppercase">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-zinc-500 italic mt-20 uppercase text-[10px] tracking-widest font-bold">Bag Empty</p>}
            </div>
            
            <div className="p-8 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="mb-6">
                <div className="flex gap-2">
                  <input type="text" placeholder="Promo code..." value={couponCode} onChange={e => setCouponCode(e.target.value)} className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 ring-lime-400" />
                  <button onClick={handleApplyCoupon} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Apply</button>
                </div>
                {couponError && <p className="text-red-500 text-[8px] font-bold uppercase mt-1 ml-1">{couponError}</p>}
                {activeCoupon && <p className="text-lime-600 dark:text-lime-400 text-[8px] font-bold uppercase mt-1 ml-1 flex items-center gap-1"><Tag size={8}/> {activeCoupon.code} Applied!</p>}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs text-zinc-500 uppercase font-bold tracking-widest"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                {discount > 0 && <div className="flex justify-between text-xs text-lime-600 uppercase font-bold tracking-widest"><span>Discount</span><span>-₹{discount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-black text-2xl uppercase tracking-tighter pt-2 border-t border-zinc-200 dark:border-zinc-800"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
              </div>
              
              <button onClick={() => {
                let msg = `*New Order from that store.*\n`;
                cart.forEach(i => msg += `• ${i.name} (${i.selectedSize}${i.selectedVariantName ? ', ' + i.selectedVariantName : ''}) x1 - ₹${i.price}\n`);
                if (activeCoupon) msg += `*Coupon:* ${activeCoupon.code}\n`;
                msg += `*Total: ₹${total}*`;
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
              }} disabled={cart.length === 0} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl">Checkout via WhatsApp <ExternalLink size={20} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
