import React, { useState, useEffect } from 'react';
import { Product, CATEGORIES, CartItem, SIZES } from '../types';
import { getProducts, getCoupons } from '../services/storageService';
import { ShoppingBag, X, Plus, Minus, Tag, ExternalLink, Flame, Search, Filter } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';

export const StoreFront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Filter States
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSize, setActiveSize] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Quick View / Size Selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loaded = getProducts();
    setProducts(loaded);
    setFilteredProducts(loaded);
  }, []);

  // Filter Logic
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

    // Search Filter
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredProducts(result);
  }, [activeCategory, activeSize, searchQuery, products]);

  // SEO & Meta Tags
  useEffect(() => {
      const baseTitle = "DripStore | Premium Streetwear";
      const title = activeCategory === 'All' ? baseTitle : `${activeCategory} - DripStore`;
      
      // Update Title
      document.title = title;

      // Update Meta Description
      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', `Shop the latest ${activeCategory.toLowerCase()} at DripStore. Exclusive drops, limited editions, and premium quality streetwear.`);

      // Update Keywords
      let metaKw = document.querySelector("meta[name='keywords']");
      if (!metaKw) {
          metaKw = document.createElement('meta');
          metaKw.setAttribute('name', 'keywords');
          document.head.appendChild(metaKw);
      }
      metaKw.setAttribute('content', `streetwear, fashion, ${activeCategory}, clothing, drops, limited edition, drip`);

  }, [activeCategory]);

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

  const handleCheckout = () => {
      let msg = `*New Order from DripStore*\n\n`;
      cart.forEach(item => {
          msg += `• ${item.name} (${item.selectedSize}) x${item.quantity} - $${item.price * item.quantity}\n`;
      });
      msg += `\n*Total: $${total.toFixed(2)}*`;
      if (discount > 0) msg += ` (Discount applied: -$${discount.toFixed(2)})`;
      
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
  };

  const displayCategories = ['All', 'Deals', ...CATEGORIES.filter(c => c !== 'All')];

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 font-sans pb-20 selection:bg-lime-400 selection:text-black">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-md z-40 border-b border-zinc-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="text-2xl font-black tracking-tighter text-white italic flex-shrink-0 cursor-pointer" onClick={() => {setActiveCategory('All'); setSearchQuery(''); window.scrollTo({top: 0, behavior: 'smooth'});}}>
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

          <div className="flex items-center gap-6">
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

        {/* Mobile Search - Visible only on mobile */}
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
      <div id="shop" className="sticky top-16 md:top-16 bg-zinc-950/95 backdrop-blur z-30 py-4 border-b border-zinc-900 mb-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
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

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar border-t md:border-t-0 border-zinc-900 pt-3 md:pt-0">
             <div className="flex items-center gap-1.5 px-2">
                <Filter size={14} className="text-zinc-500"/>
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Size:</span>
             </div>
             <div className="flex gap-2 pr-4">
                {['All', ...SIZES].map(size => (
                    <button
                        key={size}
                        onClick={() => setActiveSize(size)}
                        className={`px-3 py-1 rounded text-xs font-bold border transition whitespace-nowrap ${
                            activeSize === size 
                            ? 'bg-zinc-100 text-black border-zinc-100' 
                            : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {filteredProducts.map(product => (
          <div key={product.id} className="group cursor-pointer" onClick={() => setSelectedProduct(product)}>
            <div className="aspect-[3/4] overflow-hidden bg-zinc-900 relative rounded-xl mb-4">
                {product.isNewDrop && (
                    <div className="absolute top-3 left-3 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-sm z-10 uppercase tracking-widest">
                        New
                    </div>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-3 right-3 bg-lime-400 text-black text-[10px] font-bold px-2 py-1 rounded-sm z-10">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </div>
                )}
                
                <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
                />
                
                {/* Quick Add Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                     <button className="w-full bg-white text-black font-bold py-3 rounded-lg transform translate-y-4 group-hover:translate-y-0 transition duration-300">
                        View Details
                     </button>
                </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-lime-400 transition">{product.name}</h3>
              <div className="flex justify-between items-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wide">{product.category}</p>
                  <div className="font-mono flex gap-2 items-center">
                     {product.originalPrice && product.originalPrice > product.price && (
                         <span className="text-zinc-600 line-through text-xs">${product.originalPrice}</span>
                     )}
                     <span>${product.price}</span>
                  </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
          <div className="text-center py-20 px-4">
              <p className="text-zinc-500 text-lg">No items found matching your filters.</p>
              <div className="flex gap-2 justify-center mt-4">
                  {activeCategory !== 'All' && <span className="bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full text-xs">Category: {activeCategory}</span>}
                  {activeSize !== 'All' && <span className="bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full text-xs">Size: {activeSize}</span>}
                  {searchQuery && <span className="bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full text-xs">Search: {searchQuery}</span>}
              </div>
              <button 
                  onClick={() => {setActiveCategory('All'); setActiveSize('All'); setSearchQuery('');}} 
                  className="mt-6 text-lime-400 underline font-bold"
              >
                  Clear All Filters
              </button>
          </div>
      )}

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
            
            {/* Image Side */}
            <div className="w-full md:w-1/2 bg-zinc-900 h-1/2 md:h-auto">
                <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
            </div>
            
            {/* Content Side */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
                <div className="mb-auto">
                    <span className="text-lime-400 text-xs font-bold uppercase tracking-widest mb-2 block">DripStore Exclusive</span>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase leading-none">{selectedProduct.name}</h2>
                    <div className="flex gap-4 items-center mb-6">
                        <span className="text-2xl font-mono text-white">${selectedProduct.price}</span>
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                            <span className="text-zinc-500 line-through text-lg">${selectedProduct.originalPrice}</span>
                        )}
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                             <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                 SAVE {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}%
                             </span>
                        )}
                    </div>
                    <p className="text-zinc-400 text-sm md:text-base mb-8 leading-relaxed font-light border-l-2 border-lime-400 pl-4">
                        {selectedProduct.description}
                    </p>
                    
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-3 font-bold">Select Size</span>
                            <div className="flex gap-3 flex-wrap">
                                {selectedProduct.sizes.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => addToCart(selectedProduct, size)}
                                        className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 hover:border-lime-400 hover:text-lime-400 transition flex items-center justify-center font-mono text-sm font-bold"
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-900">
                    <div className="flex gap-4 items-center text-xs text-zinc-500">
                         <span>Authenticity Guaranteed</span>
                         <span>•</span>
                         <span>Worldwide Shipping</span>
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
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={24} className="opacity-50" />
                  </div>
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
                        <span className="font-mono text-sm">${item.price * item.quantity}</span>
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
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-lime-400">
                    <span>Discount</span>
                    <span className="font-mono">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-4 border-t border-zinc-900">
                  <span>Total</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-lime-400 text-black font-black py-4 rounded hover:bg-lime-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                Checkout on WhatsApp <ExternalLink size={18} />
              </button>
              <p className="text-[10px] text-zinc-600 text-center">
                  Secure checkout powered by WhatsApp. No card required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg z-40 hover:scale-110 transition duration-300 hover:shadow-[#25d366]/40"
      >
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