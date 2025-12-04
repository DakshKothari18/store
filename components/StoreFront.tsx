import React, { useState, useEffect } from 'react';
import { Product, CartItem, SIZES, COLORS, User, Order } from '../types';
import { getProducts, getCoupons, getCurrentUser, loginUser, logoutUser, saveUser, getUsers, saveOrder, getOrders, getCategories } from '../services/storageService';
import { ShoppingBag, X, Plus, Minus, Tag, ExternalLink, Flame, Search, Filter, ChevronDown, SlidersHorizontal, User as UserIcon, LogOut, Package, History } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';

export const StoreFront: React.FC = () => {
  // --- Data States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // --- User & Auth States ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // --- Filter States ---
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSize, setActiveSize] = useState('All');
  const [activeColor, setActiveColor] = useState('All');
  const [activeBrand, setActiveBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number>(20000); 
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // --- Cart State ---
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // --- Interaction States ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickAddProductId, setQuickAddProductId] = useState<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const loadedProducts = getProducts();
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
    setCategories(getCategories());
    
    // Extract unique brands
    const brands = Array.from(new Set(loadedProducts.map(p => p.brand).filter(Boolean))) as string[];
    setAvailableBrands(['All', ...brands]);

    // Check for logged in user
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

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
      joinedDate: new Date().toISOString()
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
      setShowProfileModal(true);
    }
  };

  // --- Filter Logic ---
  useEffect(() => {
    let result = products;
    
    // Category Filter
    if (activeCategory === 'Deals') {
        result = result.filter(p => p.originalPrice && p.originalPrice > p.price);
    } else if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }
    
    // Size Filter
    if (activeSize !== 'All') {
        result = result.filter(p => p.sizes.includes(activeSize));
    }
    
    // Color Filter
    if (activeColor !== 'All') {
        result = result.filter(p => p.color === activeColor);
    }

    // Brand Filter
    if (activeBrand !== 'All') {
        result = result.filter(p => p.brand === activeBrand);
    }

    // Price Filter
    result = result.filter(p => p.price <= maxPrice);

    // Search Filter
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredProducts(result);
  }, [activeCategory, activeSize, activeColor, activeBrand, maxPrice, searchQuery, products]);

  // --- Cart & Checkout Logic ---
  const addToCart = (product: Product, size: string) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id && p.selectedSize === size);
      if (existing) {
        return prev.map(p => p.id === product.id && p.selectedSize === size ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, selectedSize: size, quantity: 1 }];
    });
    setCartOpen(true);
    setSelectedProduct(null); // Close modal if open
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
    setQuickAddProductId(null);
  };

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
    // 1. Save Order if logged in
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

    // 2. Generate WhatsApp Message
    let msg = `*New Order from DripStore*\n`;
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
    
    // 3. Clear Cart & Redirect
    setCart([]);
    setCartOpen(false);
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCheckoutClick = () => {
    if (!currentUser) {
        // Prompt user to login or continue as guest
        if (window.confirm("Do you want to login to save your order history? Click Cancel to continue as Guest.")) {
            setCartOpen(false);
            setAuthMode('LOGIN');
            setShowAuthModal(true);
            return;
        }
    }
    processCheckout();
  };

  const displayCategories = ['All', 'Deals', ...categories];
  const clearFilters = () => {
      setActiveCategory('All'); 
      setActiveSize('All'); 
      setActiveColor('All');
      setActiveBrand('All');
      setMaxPrice(20000);
      setSearchQuery('');
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 font-sans pb-20 selection:bg-lime-400 selection:text-black">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-md z-40 border-b border-zinc-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="text-2xl font-black tracking-tighter text-white italic flex-shrink-0 cursor-pointer" onClick={() => {clearFilters(); window.scrollTo({top: 0, behavior: 'smooth'});}}>
            DRIP<span className="text-lime-400">STORE</span>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
             <input 
                type="text"
                placeholder="Search drops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-300 focus:text-white focus:border-lime-400 outline-none transition placeholder:text-zinc-600"
             />
          </div>

          <div className="flex items-center gap-4">
            {/* User Icon */}
            <button 
                onClick={() => currentUser ? openProfile() : setShowAuthModal(true)}
                className="relative p-2 hover:bg-zinc-800 rounded-full transition group"
            >
                {currentUser ? (
                    <div className="w-8 h-8 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-xs border border-zinc-800">
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <UserIcon className="text-zinc-400 group-hover:text-white transition" size={24} />
                )}
            </button>

            {/* Cart Icon */}
            <button 
                onClick={() => setCartOpen(true)} 
                className="relative p-2 hover:bg-zinc-800 rounded-full transition group"
            >
              <ShoppingBag className="text-zinc-400 group-hover:text-white transition" size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-lime-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3 border-t border-zinc-900 bg-zinc-950/95 backdrop-blur-md">
             <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                    type="text"
                    placeholder="Search drops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-300 focus:text-white focus:border-lime-400 outline-none transition placeholder:text-zinc-600"
                />
             </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-36 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-lime-400/5 blur-[120px] rounded-full -z-10" />
        <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase leading-[0.9]">
          Redefine <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">Your Reality</span>
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
          Premium streetwear for the modern avant-garde. <br/> Limited drops. Worldwide shipping.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <a href="#shop" className="bg-lime-400 text-black font-bold px-10 py-4 rounded-full hover:bg-lime-300 transition hover:scale-105 active:scale-95">
                Start Shopping
            </a>
            <div className="flex items-center gap-2 text-zinc-500 px-6 py-3 bg-zinc-900/50 rounded-full border border-zinc-800">
                <Tag size={16} className="text-lime-400" /> Use code <span className="text-white font-mono font-bold tracking-widest">WELCOME20</span>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div id="shop" className="sticky top-16 md:top-16 bg-zinc-950/95 backdrop-blur z-30 py-4 border-b border-zinc-900 mb-8 transition-all">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {displayCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${
                      activeCategory === cat 
                        ? 'bg-white text-black' 
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
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
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition ${showFilters ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
            >
                <SlidersHorizontal size={14} /> Filters
            </button>
          </div>

          <div className={`md:overflow-hidden transition-all duration-300 ${showFilters ? 'md:max-h-60 opacity-100' : 'md:max-h-0 md:opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                  <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          <Filter size={12}/> Size
                      </div>
                      <select 
                        value={activeSize}
                        onChange={(e) => setActiveSize(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:border-lime-400 outline-none"
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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:border-lime-400 outline-none"
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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:border-lime-400 outline-none"
                      >
                          {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                  </div>

                  <div className="space-y-2">
                      <div className="flex items-center justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-2"><Filter size={12}/> Max Price</div>
                          <span className="text-lime-400">₹{maxPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="30000" 
                        step="500" 
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-lime-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
              </div>
          </div>
          
          <button 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden w-full py-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest border border-zinc-800 rounded-lg hover:bg-zinc-900 transition"
          >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {filteredProducts.map(product => (
          <div key={product.id} className="group cursor-pointer" onClick={() => setSelectedProduct(product)}>
            <div className="aspect-[3/4] overflow-hidden bg-zinc-900 relative rounded-xl mb-4">
                {product.isNewDrop && (
                    <div className="absolute top-3 left-3 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-sm z-10 uppercase tracking-widest shadow-lg">
                        New
                    </div>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-3 right-3 bg-lime-400 text-black text-[10px] font-bold px-2 py-1 rounded-sm z-10 shadow-lg">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </div>
                )}
                
                <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
                />
                
                <div className={`absolute inset-0 bg-black/40 transition duration-300 flex items-end p-4 ${quickAddProductId === product.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {quickAddProductId === product.id ? (
                        <div 
                            className="w-full bg-zinc-950/95 backdrop-blur-md p-4 rounded-xl border border-zinc-800 animate-in slide-in-from-bottom-4 shadow-2xl" 
                            onClick={e => e.stopPropagation()}
                        >
                             <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Size</span>
                                <button onClick={() => setQuickAddProductId(null)} className="text-zinc-500 hover:text-white"><X size={14}/></button>
                             </div>
                             <div className="grid grid-cols-4 gap-2">
                                {product.sizes.map(size => (
                                    <button 
                                        key={size}
                                        onClick={() => handleQuickAdd(product, size)}
                                        className="aspect-square rounded-lg bg-zinc-800 hover:bg-lime-400 hover:text-black border border-zinc-700 hover:border-lime-400 text-[10px] md:text-xs font-bold transition flex items-center justify-center p-1"
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
            </div>
            
            <div>
              <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{product.brand || 'DripStore'}</span>
                  <span className="text-[10px] text-zinc-600">{product.color}</span>
              </div>
              <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-lime-400 transition">{product.name}</h3>
              <div className="flex justify-between items-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wide">{product.category}</p>
                  <div className="font-mono flex gap-2 items-center">
                     {product.originalPrice && product.originalPrice > product.price && (
                         <span className="text-zinc-600 line-through text-xs">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                     )}
                     <span>₹{product.price.toLocaleString('en-IN')}</span>
                  </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
          <div className="text-center py-20 px-4">
              <p className="text-zinc-500 text-lg">No items found matching your filters.</p>
              <button onClick={clearFilters} className="mt-6 text-lime-400 underline font-bold">Clear All Filters</button>
          </div>
      )}

      {/* --- MODALS --- */}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative flex flex-col md:flex-row h-full md:h-auto max-h-[90vh]">
            <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white hover:text-black rounded-full text-white z-10 transition"
            >
                <X size={20} />
            </button>
            <div className="w-full md:w-1/2 bg-zinc-900 h-1/2 md:h-auto">
                <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
                <div className="mb-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lime-400 text-xs font-bold uppercase tracking-widest block">DripStore Exclusive</span>
                        <span className="text-zinc-500 text-xs font-bold uppercase">{selectedProduct.brand}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase leading-none">{selectedProduct.name}</h2>
                    <div className="flex gap-4 items-center mb-6">
                        <span className="text-2xl font-mono text-white">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                            <span className="text-zinc-500 line-through text-lg">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                             <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">SAVE {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}%</span>
                        )}
                    </div>
                    <p className="text-zinc-400 text-sm md:text-base mb-8 leading-relaxed font-light border-l-2 border-lime-400 pl-4">{selectedProduct.description}</p>
                    
                    <div className="space-y-6">
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                            <div className="mb-4">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-2 font-bold">Available Variants</span>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedProduct.variants.map(v => (
                                        <div key={v.id} className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-zinc-300">
                                            {v.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-3 font-bold">Select Size</span>
                            <div className="flex gap-3 flex-wrap">
                                {selectedProduct.sizes.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => addToCart(selectedProduct, size)}
                                        className="min-w-[48px] h-12 px-2 rounded bg-zinc-900 border border-zinc-800 hover:border-lime-400 hover:text-lime-400 transition flex items-center justify-center font-mono text-sm font-bold"
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
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
          <div className="relative bg-zinc-950 w-full max-w-md h-full flex flex-col shadow-2xl border-l border-zinc-800 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950 z-10">
              <h2 className="text-xl font-black tracking-tight">YOUR CART ({cart.length})</h2>
              <button onClick={() => setCartOpen(false)} className="hover:text-lime-400 transition"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center text-zinc-500 mt-20 flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4"><ShoppingBag size={24} className="opacity-50" /></div>
                  <p>Your bag is empty.</p>
                  <button onClick={() => setCartOpen(false)} className="mt-4 text-lime-400 text-sm font-bold hover:underline">Start Shopping</button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <img src={item.images[0]} alt="" className="w-20 h-24 object-cover rounded bg-zinc-900" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm leading-tight pr-4">{item.name}</h3>
                        <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="text-zinc-600 hover:text-red-400"><X size={16} /></button>
                      </div>
                      <p className="text-zinc-500 text-xs mt-1 font-mono">Size: {item.selectedSize}</p>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-3 bg-zinc-900 rounded px-2 py-1 border border-zinc-800">
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, -1)} className="hover:text-white text-zinc-500"><Minus size={14} /></button>
                          <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.selectedSize, 1)} className="hover:text-white text-zinc-500"><Plus size={14} /></button>
                        </div>
                        <span className="font-mono text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-zinc-950 border-t border-zinc-900 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="COUPON CODE" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-3 text-sm outline-none focus:border-lime-400 font-mono tracking-wider uppercase placeholder:text-zinc-700"
                />
                <button onClick={applyCoupon} className="bg-zinc-800 px-6 py-2 rounded text-xs font-bold hover:bg-zinc-700 uppercase tracking-wide">Apply</button>
              </div>
              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span></div>
                {discount > 0 && <div className="flex justify-between text-lime-400"><span>Discount</span><span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between font-bold text-lg pt-4 border-t border-zinc-900"><span>Total</span><span className="font-mono">₹{total.toLocaleString('en-IN')}</span></div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-800 p-8 relative shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-6 text-center">{authMode === 'LOGIN' ? 'WELCOME BACK' : 'JOIN THE CLUB'}</h2>
            
            <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
               {authMode === 'REGISTER' && (
                 <>
                   <input type="text" placeholder="Full Name" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none" />
                   <input type="text" placeholder="Phone Number" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none" />
                 </>
               )}
               <input type="email" placeholder="Email Address" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none" />
               <input type="password" placeholder="Password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-lime-400 outline-none" />
               
               <button type="submit" className="w-full bg-lime-400 text-black font-bold py-3 rounded hover:bg-lime-500 transition uppercase tracking-wide">
                 {authMode === 'LOGIN' ? 'Log In' : 'Create Account'}
               </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-500">
               {authMode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
               <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="text-lime-400 font-bold hover:underline">
                 {authMode === 'LOGIN' ? 'Sign Up' : 'Log In'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (Order History) */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-800 flex flex-col max-h-[80vh] shadow-2xl">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-lg">
                        {currentUser.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                         <h2 className="font-bold text-white text-lg">{currentUser.name}</h2>
                         <p className="text-xs text-zinc-500">{currentUser.email}</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-400"><LogOut size={20}/></button>
                     <button onClick={() => setShowProfileModal(false)} className="p-2 text-zinc-500 hover:text-white"><X size={20}/></button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                 <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <History size={16}/> Order History
                 </h3>
                 
                 {userOrders.length === 0 ? (
                     <div className="text-center py-10 text-zinc-500 bg-zinc-950/50 rounded-lg border border-zinc-800 border-dashed">
                         No orders yet.
                     </div>
                 ) : (
                     <div className="space-y-4">
                         {userOrders.map(order => (
                             <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                                 <div className="flex justify-between items-start mb-4 pb-4 border-b border-zinc-900">
                                     <div>
                                         <span className="text-lime-400 font-mono text-sm block mb-1">{order.id}</span>
                                         <span className="text-xs text-zinc-500">{new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}</span>
                                     </div>
                                     <div className="text-right">
                                         <span className="block font-bold text-white">₹{order.finalAmount.toLocaleString('en-IN')}</span>
                                         <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase">{order.status}</span>
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     {order.items.map((item, i) => (
                                         <div key={i} className="flex justify-between text-sm text-zinc-400">
                                             <span>{item.name} <span className="text-zinc-600 text-xs">({item.selectedSize}) x{item.quantity}</span></span>
                                             <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         ))}
                     </div>
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
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-zinc-600 text-sm">
                © 2024 DRIPSTORE. Est. MMXXIV.
            </div>
            <div className="flex gap-6 text-zinc-500 text-sm font-bold tracking-widest uppercase">
                <a href="#" className="hover:text-lime-400 transition">Instagram</a>
                <a href="#" className="hover:text-lime-400 transition">Twitter</a>
                <a href="#" className="hover:text-lime-400 transition">TikTok</a>
            </div>
        </div>
      </footer>
    </div>
  );
};