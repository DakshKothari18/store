import React, { useState, useEffect } from 'react';
import { Product, CartItem, SIZES, COLORS, User, Order } from '../types';
import { getProducts, getCoupons, getCurrentUser, loginUser, logoutUser, saveUser, getUsers, saveOrder, getOrders, getCategories, addProductRating, updateUser } from '../services/storageService';
import { ShoppingBag, X, Plus, Minus, Tag, ExternalLink, Flame, Search, Filter, ChevronDown, SlidersHorizontal, User as UserIcon, LogOut, Package, History, Star, Loader2, List, Heart, Moon, Sun } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';

const ITEMS_PER_PAGE = 8;
const FILTERS_STORAGE_KEY = 'thatstore_filters';
const THEME_STORAGE_KEY = 'thatstore_theme';

export const StoreFront: React.FC = () => {
  // --- Data States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]); // Infinite Scroll State
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- Filter State Initialization ---
  // Load initial filters from localStorage or use defaults
  const getInitialFilters = () => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse saved filters", e);
    }
    return {
      category: 'All',
      size: 'All',
      color: 'All',
      brand: 'All',
      maxPrice: 20000,
      itemsPerPage: 20
    };
  };

  const initialFilters = getInitialFilters();

  const [itemsPerPage, setItemsPerPage] = useState(initialFilters.itemsPerPage);
  const [visibleCount, setVisibleCount] = useState(initialFilters.itemsPerPage);
  
  const [activeCategory, setActiveCategory] = useState(initialFilters.category);
  const [activeSize, setActiveSize] = useState(initialFilters.size);
  const [activeColor, setActiveColor] = useState(initialFilters.color);
  const [activeBrand, setActiveBrand] = useState(initialFilters.brand);
  const [maxPrice, setMaxPrice] = useState<number>(initialFilters.maxPrice); 
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // --- User & Auth States ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', phone: '' });
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'ORDERS' | 'WISHLIST'>('ORDERS');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  
  // --- Cart State ---
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartBump, setCartBump] = useState(false); // Animation state
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // --- Interaction States ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalSelectedSize, setModalSelectedSize] = useState<string>('');
  const [quickAddProductId, setQuickAddProductId] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // --- Rating State (for modal) ---
  const [hoverRating, setHoverRating] = useState(0);

  // --- Initialization ---
  useEffect(() => {
    // Theme Initialization
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Simulate initial loading
    const timer = setTimeout(() => {
      const loadedProducts = getProducts();
      setProducts(loadedProducts);
      setFilteredProducts(loadedProducts);
      setDisplayedProducts(loadedProducts.slice(0, itemsPerPage));
      setCategories(getCategories());
      
      const brands = Array.from(new Set(loadedProducts.map(p => p.brand).filter(Boolean))) as string[];
      setAvailableBrands(['All', ...brands]);

      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
        setModalSelectedSize('');
    }
  }, [selectedProduct]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      setIsDarkMode(true);
    }
  };

  // --- Persistence Logic ---
  useEffect(() => {
    const filtersToSave = {
      category: activeCategory,
      size: activeSize,
      color: activeColor,
      brand: activeBrand,
      maxPrice: maxPrice,
      itemsPerPage: itemsPerPage
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [activeCategory, activeSize, activeColor, activeBrand, maxPrice, itemsPerPage]);

  // --- Infinite Scroll Logic ---
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        visibleCount < filteredProducts.length
      ) {
        setVisibleCount(prev => prev + itemsPerPage);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredProducts.length, itemsPerPage]);

  useEffect(() => {
    // Update displayed products whenever visibleCount or filtered list changes
    setDisplayedProducts(filteredProducts.slice(0, visibleCount));
  }, [visibleCount, filteredProducts]);

  // --- User Logic ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginUser(authForm.email, authForm.password);
    if (user) {
      setCurrentUser(user);
      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '', phone: '' });
    } else {
      alert("Invalid credentials");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.name || !authForm.email || !authForm.password) return;
    
    const existingUsers = getUsers();
    if (existingUsers.some(u => u.email === authForm.email)) {
      alert("Email already exists");
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: authForm.name,
      email: authForm.email,
      password: authForm.password,
      phone: authForm.phone,
      joinedDate: new Date().toISOString(),
      wishlist: []
    };

    saveUser(newUser);
    loginUser(newUser.email, newUser.password);
    setCurrentUser(newUser);
    setShowAuthModal(false);
    setAuthForm({ name: '', email: '', password: '', phone: '' });
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowProfileModal(false);
  };

  const openProfile = () => {
    if (currentUser) {
      const orders = getOrders(currentUser.id);
      setUserOrders(orders);
      
      const wishlist = products.filter(p => currentUser.wishlist?.includes(p.id));
      setWishlistProducts(wishlist);
      
      setShowProfileModal(true);
    }
  };

  const toggleWishlist = (e: React.MouseEvent, product: Product) => {
      e.stopPropagation();
      if (!currentUser) {
          setShowAuthModal(true);
          return;
      }
      
      const currentWishlist = currentUser.wishlist || [];
      let newWishlist;
      if (currentWishlist.includes(product.id)) {
          newWishlist = currentWishlist.filter(id => id !== product.id);
      } else {
          newWishlist = [...currentWishlist, product.id];
      }

      const updatedUser = { ...currentUser, wishlist: newWishlist };
      updateUser(updatedUser);
      setCurrentUser(updatedUser);
      
      // Update local wishlist state if modal is open
      if (showProfileModal) {
         setWishlistProducts(products.filter(p => newWishlist.includes(p.id)));
      }
  };

  const isInWishlist = (productId: string) => {
      return currentUser?.wishlist?.includes(productId) || false;
  };

  // --- Filter Logic ---
  useEffect(() => {
    let result = products;
    
    if (activeCategory === 'Deals') {
        result = result.filter(p => p.originalPrice && p.originalPrice > p.price);
    } else if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }
    
    if (activeSize !== 'All') {
        result = result.filter(p => p.sizes.includes(activeSize));
    }
    
    if (activeColor !== 'All') {
        result = result.filter(p => p.color === activeColor);
    }

    if (activeBrand !== 'All') {
        result = result.filter(p => p.brand === activeBrand);
    }

    result = result.filter(p => p.price <= maxPrice);

    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    setFilteredProducts(result);
    // Reset scroll when filters change, respecting current items per page setting
    setVisibleCount(itemsPerPage); 
  }, [activeCategory, activeSize, activeColor, activeBrand, maxPrice, searchQuery, products, itemsPerPage]);

  // --- Cart & Checkout Logic ---
  const addToCart = (product: Product, size: string) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id && p.selectedSize === size);
      if (existing) {
        return prev.map(p => p.id === product.id && p.selectedSize === size ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, selectedSize: size, quantity: 1 }];
    });
    
    // Trigger Animation
    setCartBump(true);
    setTimeout(() => setCartBump(false), 300);

    // Don't auto open cart, just notify via animation
    // setCartOpen(true); 
    setSelectedProduct(null);
    setQuickAddProductId(null);
  };

  const removeFromCart = (id: string, size: string) => {
    setCart(prev => prev.filter(p => !(p.id === id && p.selectedSize === size)));
  };

  const updateQuantity = (id: string, size: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.id === id && p.selectedSize === size) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }).filter(p => p.quantity > 0));
  };

  const handleQuickAdd = (product: Product, size: string) => {
    addToCart(product, size);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = () => {
    const coupons = getCoupons();
    const valid = coupons.find(c => c.code === couponCode);
    if (valid) {
      if (valid.type === 'PERCENTAGE') {
        setDiscount(subtotal * (valid.value / 100));
      } else {
        setDiscount(valid.value);
      }
    } else {
      alert('Invalid coupon code');
      setDiscount(0);
    }
  };

  const processCheckout = () => {
    if (currentUser) {
        const newOrder: Order = {
            id: `ORD-${Date.now()}`,
            userId: currentUser.id,
            items: cart,
            totalAmount: subtotal,
            discountAmount: discount,
            finalAmount: total,
            status: 'PENDING',
            date: new Date().toISOString()
        };
        saveOrder(newOrder);
    }

    let msg = `*New Order from Thatstore*\n`;
    if (currentUser) {
        msg += `Customer: ${currentUser.name}\n`;
        msg += `Email: ${currentUser.email}\n`;
    }
    msg += `--------------------------\n`;
    cart.forEach(item => {
        msg += `• ${item.name} (${item.selectedSize}) x${item.quantity} - ₹${item.price * item.quantity}\n`;
    });
    msg += `--------------------------\n`;
    msg += `*Total: ₹${total.toLocaleString('en-IN')}*`;
    if (discount > 0) msg += ` (Discount applied: -₹${discount.toLocaleString('en-IN')})`;
    
    setCart([]);
    setCartOpen(false);
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCheckoutClick = () => {
    if (!currentUser) {
        if (window.confirm("Do you want to login to save your order history? Click Cancel to continue as Guest.")) {
            setCartOpen(false);
            setAuthMode('LOGIN');
            setShowAuthModal(true);
            return;
        }
    }
    processCheckout();
  };

  const getAverageRating = (ratings?: number[]) => {
      if (!ratings || ratings.length === 0) return null;
      const sum = ratings.reduce((a, b) => a + b, 0);
      return (sum / ratings.length).toFixed(1);
  };

  const handleRateProduct = (rating: number) => {
      if (selectedProduct) {
          const updatedList = addProductRating(selectedProduct.id, rating);
          setProducts(updatedList);
          const updatedProduct = updatedList.find(p => p.id === selectedProduct.id);
          if (updatedProduct) {
              setSelectedProduct(updatedProduct);
          }
      }
  };

  const displayCategories = ['All', 'Deals', ...categories];
  const clearFilters = () => {
      setActiveCategory('All'); 
      setActiveSize('All'); 
      setActiveColor('All');
      setActiveBrand('All');
      setMaxPrice(20000);
      setItemsPerPage(20);
      setSearchQuery('');
      localStorage.removeItem(FILTERS_STORAGE_KEY); // Clear saved filters
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 font-sans pb-20 selection:bg-lime-400 selection:text-black transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-40 border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white italic flex-shrink-0 cursor-pointer" onClick={() => {clearFilters(); window.scrollTo({top: 0, behavior: 'smooth'});}}>
            THAT<span className="text-lime-500 dark:text-lime-400">STORE</span>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
             <input 
                type="text"
                placeholder="Search drops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-800 dark:text-zinc-300 focus:text-black dark:focus:text-white focus:border-lime-400 outline-none transition placeholder:text-zinc-500 dark:placeholder:text-zinc-600"
             />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {/* User Icon */}
            <button 
                onClick={() => currentUser ? openProfile() : setShowAuthModal(true)}
                className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition group"
            >
                {currentUser ? (
                    <div className="w-8 h-8 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-xs border border-zinc-200 dark:border-zinc-800">
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <UserIcon className="text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition" size={24} />
                )}
            </button>

            {/* Cart Icon */}
            <button 
                onClick={() => setCartOpen(true)} 
                className={`relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all duration-200 group ${cartBump ? 'scale-125 text-lime-500 dark:text-lime-400' : ''}`}
            >
              <ShoppingBag className={`transition-colors ${cartBump ? 'text-lime-500 dark:text-lime-400' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white'}`} size={24} />
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 bg-lime-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 transition-transform animate-in zoom-in">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3 border-t border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
             <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
                <input 
                    type="text"
                    placeholder="Search drops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-800 dark:text-zinc-300 focus:text-black dark:focus:text-white focus:border-lime-400 outline-none transition placeholder:text-zinc-500 dark:placeholder:text-zinc-600"
                />
             </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-36 pb-16 px-4 text-center relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-lime-300/10 dark:bg-lime-400/5 blur-[120px] rounded-full -z-10" />
        <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase leading-[0.9] text-zinc-900 dark:text-white">
          Redefine <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-emerald-500 dark:from-lime-400 dark:to-emerald-400">Your Reality</span>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
          Premium streetwear for the modern avant-garde. <br/> Limited drops. Worldwide shipping.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <a href="#shop" className="bg-lime-400 text-black font-bold px-10 py-4 rounded-full hover:bg-lime-300 transition hover:scale-105 active:scale-95 shadow-lg shadow-lime-400/20">
                Start Shopping
            </a>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500 px-6 py-3 bg-white dark:bg-zinc-900/50 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Tag size={16} className="text-lime-500 dark:text-lime-400" /> Use code <span className="text-zinc-900 dark:text-white font-mono font-bold tracking-widest">THAT10</span>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div id="shop" className="sticky top-16 md:top-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur z-30 py-4 border-b border-zinc-200 dark:border-zinc-900 mb-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {displayCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 border ${
                      activeCategory === cat 
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white' 
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border-transparent dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                    }`}
                  >
                    {cat === 'Deals' && <Flame size={14} className={activeCategory === 'Deals' ? 'text-red-500' : 'text-zinc-500'} />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition ${showFilters ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-black dark:text-white' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
            >
                <SlidersHorizontal size={14} /> Filters
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showFilters ? 'max-h-[1200px] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800/50 md:overflow-visible overflow-y-auto max-h-[60vh] md:max-h-none">
                  <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          <Filter size={12}/> Size
                      </div>
                      <select 
                        value={activeSize}
                        onChange={(e) => setActiveSize(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-800 dark:text-zinc-300 focus:border-lime-400 outline-none"
                      >
                          {['All', ...SIZES].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>

                  <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          <Filter size={12}/> Color
                      </div>
                      <select 
                        value={activeColor}
                        onChange={(e) => setActiveColor(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-800 dark:text-zinc-300 focus:border-lime-400 outline-none"
                      >
                          {['All', ...COLORS].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>

                  <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          <Filter size={12}/> Brand
                      </div>
                      <select 
                        value={activeBrand}
                        onChange={(e) => setActiveBrand(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-800 dark:text-zinc-300 focus:border-lime-400 outline-none"
                      >
                          {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                  </div>

                  <div className="space-y-2">
                      <div className="flex items-center justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-2"><Filter size={12}/> Max Price</div>
                          <span className="text-lime-500 dark:text-lime-400">₹{maxPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="30000" 
                        step="500" 
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-lime-400 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>

                  <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          <List size={12}/> Items per Load
                      </div>
                      <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-800 dark:text-zinc-300 focus:border-lime-400 outline-none"
                      >
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                      </select>
                  </div>
              </div>
          </div>
          
          <button 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden w-full py-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center justify-center gap-2 relative z-10"
          >
              <SlidersHorizontal size={14} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse">
                    <div className="bg-zinc-200 dark:bg-zinc-900 rounded-xl aspect-[3/4] mb-4"></div>
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-900 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-900 rounded w-1/2"></div>
                </div>
            ))}
        </div>
      ) : (
      /* Product Grid */
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {displayedProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                return (
                <div key={product.id} className="group cursor-pointer" onClick={() => { setSelectedProduct(product); setActiveImageIndex(0); }}>
                    <div className="aspect-[3/4] overflow-hidden bg-zinc-200 dark:bg-zinc-900 relative rounded-xl mb-4 group border border-transparent dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                        
                        {/* Status Badges */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                            {isOutOfStock ? (
                                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
                                    Sold Out
                                </div>
                            ) : (
                                product.isNewDrop && (
                                    <div className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
                                        New
                                    </div>
                                )
                            )}
                        </div>

                        {/* Wishlist Button */}
                        <button 
                            onClick={(e) => toggleWishlist(e, product)}
                            className="absolute top-3 right-3 z-20 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white hover:text-red-500 transition text-white"
                        >
                            <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-red-500" : ""} />
                        </button>
                        
                        {product.originalPrice && product.originalPrice > product.price && !isOutOfStock && (
                            <div className="absolute top-3 right-12 bg-lime-400 text-black text-[10px] font-bold px-2 py-1 rounded-sm z-10 shadow-lg">
                                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                            </div>
                        )}
                        
                        {/* Product Image */}
                        <div className={isOutOfStock ? "opacity-60 grayscale" : ""}>
                            <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className={`w-full h-full object-cover transition duration-700 ease-out ${product.images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-110'}`}
                            />
                            
                            {product.images[1] && (
                                <img 
                                    src={product.images[1]}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-700 ease-out scale-105"
                                />
                            )}
                        </div>
                        
                        {/* Quick Add Overlay - Hide if Out of Stock */}
                        {!isOutOfStock && (
                            <div className={`absolute inset-0 bg-black/40 transition duration-300 flex items-end p-4 ${quickAddProductId === product.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {quickAddProductId === product.id ? (
                                    <div 
                                        className="w-full bg-white dark:bg-zinc-950/95 backdrop-blur-md p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-4 shadow-2xl" 
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Select Size</span>
                                            <button onClick={() => setQuickAddProductId(null)} className="text-zinc-500 hover:text-black dark:hover:text-white"><X size={14}/></button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {product.sizes.map(size => (
                                                <button 
                                                    key={size}
                                                    onClick={() => handleQuickAdd(product, size)}
                                                    className="aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-lime-400 dark:hover:bg-lime-400 hover:text-black border border-zinc-200 dark:border-zinc-700 hover:border-lime-400 dark:hover:border-lime-400 text-[10px] md:text-xs font-bold transition flex items-center justify-center p-1 text-zinc-900 dark:text-zinc-200"
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setQuickAddProductId(product.id); }}
                                        className="w-full bg-white hover:bg-lime-400 text-black font-bold py-3 rounded-xl transform translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag size={16} /> Add to Cart
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div>
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{product.brand || 'DripStore'}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-600">{product.color}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1 text-zinc-900 dark:text-white group-hover:text-lime-500 dark:group-hover:text-lime-400 transition">{product.name}</h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">{product.category}</p>
                            {getAverageRating(product.ratings) && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                                    <Star size={10} fill="currentColor" /> {getAverageRating(product.ratings)}
                                </div>
                            )}
                        </div>
                        <div className="font-mono flex gap-2 items-center">
                            {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-zinc-400 line-through text-xs">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                            )}
                            <span className="text-zinc-900 dark:text-zinc-100">₹{product.price.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    </div>
                </div>
            )})}
        </div>
        
        {/* Loading Indicator for Infinite Scroll */}
        {displayedProducts.length < filteredProducts.length && (
            <div className="py-12 flex justify-center w-full">
                <Loader2 className="animate-spin text-lime-500 dark:text-lime-400" size={32} />
            </div>
        )}
      </div>
      )}

      {/* --- MODALS --- */}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 relative flex flex-col md:flex-row h-full md:h-[90vh] max-h-[90vh]">
            <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/50 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-full text-zinc-900 dark:text-white z-10 transition"
            >
                <X size={20} />
            </button>
            
            {/* Image Gallery Section */}
            <div className="w-full md:w-1/2 bg-zinc-100 dark:bg-zinc-900 flex flex-col h-1/2 md:h-full">
                <div className="flex-1 relative bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <img src={selectedProduct.images[activeImageIndex]} alt={selectedProduct.name} className="w-full h-full object-cover transition-all duration-300" />
                    {selectedProduct.stock <= 0 && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                             <span className="text-white text-3xl font-black uppercase tracking-widest border-4 border-white px-6 py-2 rotate-[-12deg]">
                                 Sold Out
                             </span>
                         </div>
                    )}
                </div>
                {selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 no-scrollbar">
                        {selectedProduct.images.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                                className={`w-16 h-20 flex-shrink-0 rounded border-2 transition overflow-hidden ${activeImageIndex === idx ? 'border-lime-500 dark:border-lime-400 opacity-100' : 'border-zinc-200 dark:border-zinc-800 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto h-1/2 md:h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                <div className="mb-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lime-600 dark:text-lime-400 text-xs font-bold uppercase tracking-widest block">Thatstore Exclusive</span>
                        <div className="flex items-center gap-3">
                             <button onClick={(e) => toggleWishlist(e, selectedProduct)} className="text-zinc-500 hover:text-red-500 transition">
                                 <Heart size={20} fill={isInWishlist(selectedProduct.id) ? "currentColor" : "none"} className={isInWishlist(selectedProduct.id) ? "text-red-500" : ""} />
                             </button>
                             <span className="text-zinc-500 text-xs font-bold uppercase">{selectedProduct.brand}</span>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase leading-[0.9]">{selectedProduct.name}</h2>
                    
                    {/* Rating Section in Modal */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => handleRateProduct(star)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star 
                                        size={20} 
                                        className={star <= (hoverRating || getAverageRating(selectedProduct.ratings) || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300 dark:text-zinc-700'} 
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-zinc-500 font-bold uppercase">
                            {selectedProduct.ratings?.length || 0} Reviews
                        </span>
                    </div>

                    <div className="flex gap-4 items-center mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-900">
                        <span className="text-3xl font-mono text-zinc-900 dark:text-white">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                            <span className="text-zinc-400 line-through text-lg">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                        {selectedProduct.stock <= 0 ? (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">OUT OF STOCK</span>
                        ) : (
                             selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                                <span className="bg-lime-400 text-black text-[10px] font-bold px-2 py-1 rounded">SAVE {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}%</span>
                             )
                        )}
                    </div>
                    
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase mb-2">Description</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed font-light">{selectedProduct.description}</p>
                    </div>
                    
                    <div className="space-y-8">
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                            <div>
                                <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-3 font-bold">Available Styles</span>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedProduct.variants.map(v => (
                                        <div key={v.id} className="text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 px-4 py-2 rounded text-zinc-700 dark:text-zinc-300 cursor-default transition">
                                            {v.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Select Size</span>
                                <span className="text-xs text-lime-500 dark:text-lime-400 underline cursor-pointer">Size Guide</span>
                            </div>
                            <div className="flex gap-3 flex-wrap mb-4">
                                {selectedProduct.sizes.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => selectedProduct.stock > 0 && setModalSelectedSize(size)}
                                        disabled={selectedProduct.stock <= 0}
                                        className={`min-w-[56px] h-14 px-2 rounded border transition flex items-center justify-center font-mono text-sm font-bold ${
                                            selectedProduct.stock <= 0 
                                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800 cursor-not-allowed opacity-50'
                                            : modalSelectedSize === size
                                              ? 'bg-lime-400 text-black border-lime-400'
                                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-lime-500 dark:hover:border-lime-400 hover:bg-lime-50 dark:hover:bg-lime-400/10 hover:text-lime-600 dark:hover:text-lime-400 text-zinc-900 dark:text-zinc-100'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    if (modalSelectedSize) {
                                        addToCart(selectedProduct, modalSelectedSize);
                                    }
                                }}
                                disabled={!modalSelectedSize || selectedProduct.stock <= 0}
                                className="w-full bg-lime-400 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-black font-black py-4 rounded hover:bg-lime-500 transition uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
                            >
                                <ShoppingBag size={20} />
                                {selectedProduct.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-950 w-full max-w-md h-full flex flex-col shadow-2xl border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300 text-zinc-900 dark:text-zinc-100">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-zinc-950 z-10">
              <h2 className="text-xl font-black tracking-tight">YOUR CART ({totalCartItems})</h2>
              <button onClick={() => setCartOpen(false)} className="hover:text-lime-500 dark:hover:text-lime-400 transition"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center text-zinc-500 mt-20 flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4"><ShoppingBag size={24} className="opacity-50" /></div>
                  <p>Your bag is empty.</p>
                  <button onClick={() => setCartOpen(false)} className="mt-4 text-lime-500 dark:text-lime-400 text-sm font-bold hover:underline">Start Shopping</button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <img src={item.images[0]} alt="" className="w-20 h-24 object-cover rounded bg-zinc-100 dark:bg-zinc-900" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm leading-tight pr-4">{item.name}</h3>
                        <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="text-zinc-400 hover:text-red-500"><X size={16} /></button>
                      </div>
                      <p className="text-zinc-500 text-xs mt-1 font-mono">Size: {item.selectedSize}</p>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 rounded px-2 py-1 border border-zinc-200 dark:border-zinc-800">
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, -1)} className="hover:text-black dark:hover:text-white text-zinc-500 active:scale-90 transition-transform"><Minus size={14} /></button>
                          <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, 1)} className="hover:text-black dark:hover:text-white text-zinc-500 active:scale-90 transition-transform"><Plus size={14} /></button>
                        </div>
                        <span className="font-mono text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="COUPON CODE" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-3 text-sm outline-none focus:border-lime-500 dark:focus:border-lime-400 font-mono tracking-wider uppercase placeholder:text-zinc-500 dark:placeholder:text-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
                <button onClick={applyCoupon} className="bg-zinc-200 dark:bg-zinc-800 px-6 py-2 rounded text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Apply</button>
              </div>
              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400"><span>Subtotal</span><span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span></div>
                {discount > 0 && <div className="flex justify-between text-lime-600 dark:text-lime-400"><span>Discount</span><span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between font-bold text-lg pt-4 border-t border-zinc-200 dark:border-zinc-900"><span>Total</span><span className="font-mono">₹{total.toLocaleString('en-IN')}</span></div>
              </div>
              <button 
                onClick={handleCheckoutClick}
                disabled={cart.length === 0}
                className="w-full bg-lime-400 text-black font-black py-4 rounded hover:bg-lime-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                Checkout on WhatsApp <ExternalLink size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 relative shadow-2xl text-zinc-900 dark:text-zinc-100">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-black dark:hover:text-white"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-6 text-center">{authMode === 'LOGIN' ? 'WELCOME BACK' : 'JOIN THE CLUB'}</h2>
            
            <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
               {authMode === 'REGISTER' && (
                 <>
                   <input type="text" placeholder="Full Name" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none text-zinc-900 dark:text-zinc-100" />
                   <input type="text" placeholder="Phone Number" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none text-zinc-900 dark:text-zinc-100" />
                 </>
               )}
               <input type="email" placeholder="Email Address" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none text-zinc-900 dark:text-zinc-100" />
               <input type="password" placeholder="Password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none text-zinc-900 dark:text-zinc-100" />
               
               <button type="submit" className="w-full bg-lime-400 text-black font-bold py-3 rounded hover:bg-lime-500 transition uppercase tracking-wide">
                 {authMode === 'LOGIN' ? 'Log In' : 'Create Account'}
               </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-500">
               {authMode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
               <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="text-lime-500 dark:text-lime-400 font-bold hover:underline">
                 {authMode === 'LOGIN' ? 'Sign Up' : 'Log In'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (Order History & Wishlist) */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[80vh] shadow-2xl text-zinc-900 dark:text-zinc-100">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-lg border border-zinc-200 dark:border-zinc-800">
                        {currentUser.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                         <h2 className="font-bold text-lg">{currentUser.name}</h2>
                         <p className="text-xs text-zinc-500">{currentUser.email}</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-500"><LogOut size={20}/></button>
                     <button onClick={() => setShowProfileModal(false)} className="p-2 text-zinc-500 hover:text-black dark:hover:text-white"><X size={20}/></button>
                 </div>
              </div>
              
              {/* Profile Tabs */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                  <button 
                    onClick={() => setProfileTab('ORDERS')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition ${profileTab === 'ORDERS' ? 'text-lime-500 dark:text-lime-400 border-b-2 border-lime-500 dark:border-lime-400' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                  >
                      Orders
                  </button>
                  <button 
                    onClick={() => setProfileTab('WISHLIST')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition ${profileTab === 'WISHLIST' ? 'text-lime-500 dark:text-lime-400 border-b-2 border-lime-500 dark:border-lime-400' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                  >
                      Wishlist ({wishlistProducts.length})
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                 {profileTab === 'ORDERS' ? (
                     <>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <History size={16}/> Order History
                        </h3>
                        
                        {userOrders.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800 border-dashed">
                                No orders yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {userOrders.map(order => (
                                    <div key={order.id} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-900">
                                            <div>
                                                <span className="text-lime-600 dark:text-lime-400 font-mono text-sm block mb-1">{order.id}</span>
                                                <span className="text-xs text-zinc-500">{new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-bold text-zinc-900 dark:text-white">₹{order.finalAmount.toLocaleString('en-IN')}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                                    order.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                                    order.status === 'IN_TRANSIT' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                                                    order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                                                    'bg-red-500/20 text-red-600 dark:text-red-400'
                                                }`}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                                                    <span>{item.name} <span className="text-zinc-500 dark:text-zinc-600 text-xs">({item.selectedSize}) x{item.quantity}</span></span>
                                                    <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                     </>
                 ) : (
                     <>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Heart size={16}/> Your Wishlist
                        </h3>
                        {wishlistProducts.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800 border-dashed">
                                Your wishlist is empty.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {wishlistProducts.map(product => (
                                    <div key={product.id} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden group">
                                        <div className="relative aspect-square">
                                            <img src={product.images[0]} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={(e) => toggleWishlist(e, product)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="p-3">
                                            <div className="font-bold text-sm truncate">{product.name}</div>
                                            <div className="text-xs text-zinc-500 mb-2">₹{product.price.toLocaleString('en-IN')}</div>
                                            <button 
                                                onClick={() => {
                                                    setShowProfileModal(false);
                                                    setSelectedProduct(product);
                                                }}
                                                className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-[10px] font-bold py-2 rounded uppercase tracking-wide hover:opacity-90"
                                            >
                                                View Product
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                     </>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg z-40 hover:scale-110 transition duration-300 hover:shadow-[#25d366]/40">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c.93.509 1.846.771 2.805.771 3.181 0 5.767-2.587 5.768-5.766.001-3.18-2.585-5.767-5.767-5.767zm6.265 8.633l-.029.046c-1.385 2.185-3.805 3.515-6.388 3.507-1.125 0-2.22-.295-3.203-.852l-3.664.962.981-3.571c-.606-1.047-.925-2.234-.924-3.468.004-3.791 3.089-6.877 6.88-6.873 1.838.002 3.565.718 4.863 2.016 1.299 1.297 2.015 3.024 2.016 4.86.001 1.229-.318 2.42-1.025 3.473h-.507v-.1z"/>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.991c-.002 5.45-4.437 9.886-9.885 9.887m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 py-12 px-4 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-zinc-500 dark:text-zinc-600 text-sm">
                © 2024 THATSTORE. Est. MMXXIV.
            </div>
            <div className="flex gap-6 text-zinc-500 text-sm font-bold tracking-widest uppercase">
                <a href="#" className="hover:text-lime-500 dark:hover:text-lime-400 transition">Instagram</a>
                <a href="#" className="hover:text-lime-500 dark:hover:text-lime-400 transition">Twitter</a>
                <a href="#" className="hover:text-lime-500 dark:hover:text-lime-400 transition">TikTok</a>
            </div>
        </div>
      </footer>
    </div>
  );
};