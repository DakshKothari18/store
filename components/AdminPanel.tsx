import React, { useState, useEffect } from 'react';
import { Product, Coupon, SIZES, COLORS, ProductVariant, Order } from '../types';
import { getProducts, saveProducts, getCoupons, saveCoupons, getCategories, saveCategories, getOrders, updateOrder } from '../services/storageService';
import { generateProductContent } from '../services/geminiService';
import { Trash2, Plus, Sparkles, Loader2, Edit, Package, Tag, Save, X, Layers, Upload, List, Star, ClipboardList, CheckCircle, Truck, ShoppingBag, AlertCircle } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'coupons' | 'categories' | 'orders'>('products');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // UI State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    category: '',
    sizes: [],
    images: [],
    brand: '',
    color: '',
    variants: []
  });
  
  // Variant Input State
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantStock, setNewVariantStock] = useState<number>(0);
  
  // Custom Size Input State
  const [customSize, setCustomSize] = useState('');

  const [loadingAI, setLoadingAI] = useState(false);

  // Coupon UI State
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({
    type: 'PERCENTAGE',
    value: 10,
    code: ''
  });

  // Category UI State
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    setProducts(getProducts());
    setCoupons(getCoupons());
    setCategories(getCategories());
    setOrders(getOrders());
  }, []);

  // --- Product Handlers ---
  const handleSaveProduct = () => {
    if (!currentProduct.name || !currentProduct.price) return;

    let updatedProducts;
    if (currentProduct.id) {
        updatedProducts = products.map(p => p.id === currentProduct.id ? { ...p, ...currentProduct } as Product : p);
    } else {
        const newProduct: Product = {
            ...currentProduct,
            id: Date.now().toString(),
            images: currentProduct.images?.length ? currentProduct.images : [`https://picsum.photos/seed/${Date.now()}/800/1000`],
            stock: currentProduct.stock || 0,
            description: currentProduct.description || '',
            sizes: currentProduct.sizes || ['M', 'L'],
            category: currentProduct.category || categories[0] || 'Uncategorized',
            price: Number(currentProduct.price),
            brand: currentProduct.brand || 'Thatstore',
            color: currentProduct.color || 'Black',
            variants: currentProduct.variants || [],
            ratings: []
        } as Product;
        updatedProducts = [newProduct, ...products];
    }
    
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setIsEditingProduct(false);
    resetProductForm();
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Delete this product?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
    }
  };

  const handleEditProduct = (product: Product) => {
      setCurrentProduct({...product});
      setIsEditingProduct(true);
  }

  const resetProductForm = () => {
      setCurrentProduct({ category: categories[0] || '', sizes: [], images: [], brand: '', color: '', variants: [] });
      setNewVariantName('');
      setNewVariantStock(0);
      setCustomSize('');
  }

  const handleAddVariant = () => {
      if (!newVariantName) return;
      const variant: ProductVariant = {
          id: Date.now().toString(),
          name: newVariantName,
          stock: newVariantStock
      };
      const updatedVariants = [...(currentProduct.variants || []), variant];
      
      // Optionally update total stock based on variants
      const totalStock = updatedVariants.reduce((acc, v) => acc + v.stock, 0);

      setCurrentProduct({
          ...currentProduct,
          variants: updatedVariants,
          stock: totalStock > 0 ? totalStock : (currentProduct.stock || 0)
      });
      setNewVariantName('');
      setNewVariantStock(0);
  };

  const removeVariant = (variantId: string) => {
      const updatedVariants = (currentProduct.variants || []).filter(v => v.id !== variantId);
      setCurrentProduct({ ...currentProduct, variants: updatedVariants });
  };

  // --- Image Upload Handlers ---
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        try {
            const base64Images = await Promise.all(files.map(convertToBase64));
            setCurrentProduct(prev => ({
                ...prev,
                images: [...(prev.images || []), ...base64Images]
            }));
        } catch (error) {
            console.error("Error uploading images", error);
            alert("Failed to upload images");
        }
    }
  };

  const removeImage = (index: number) => {
    setCurrentProduct(prev => ({
        ...prev,
        images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateAI = async () => {
    if (!currentProduct.name) {
      alert("Please enter a product name first.");
      return;
    }
    setLoadingAI(true);
    try {
      const result = await generateProductContent(
        currentProduct.name,
        currentProduct.category || 'Apparel',
        "Streetwear, high quality, trending"
      );
      setCurrentProduct(prev => ({
        ...prev,
        description: result.description,
        seoTitle: result.seoTitle,
        seoKeywords: result.keywords
      }));
    } catch (e) {
      alert("Failed to generate content. Check API Key.");
    } finally {
      setLoadingAI(false);
    }
  };

  const toggleSize = (size: string) => {
    const currentSizes = currentProduct.sizes || [];
    if (currentSizes.includes(size)) {
      setCurrentProduct({ ...currentProduct, sizes: currentSizes.filter(s => s !== size) });
    } else {
      setCurrentProduct({ ...currentProduct, sizes: [...currentSizes, size] });
    }
  };

  const handleAddCustomSize = () => {
      if(!customSize.trim()) return;
      const sizeToAdd = customSize.trim().toUpperCase();
      const currentSizes = currentProduct.sizes || [];
      if(!currentSizes.includes(sizeToAdd)) {
          setCurrentProduct({ ...currentProduct, sizes: [...currentSizes, sizeToAdd] });
      }
      setCustomSize('');
  }

  // --- Coupon Handlers ---
  const handleSaveCoupon = () => {
      if (!currentCoupon.code || !currentCoupon.value) return;
      const code = currentCoupon.code.toUpperCase();

      const newCoupon = {
          code,
          type: currentCoupon.type || 'PERCENTAGE',
          value: Number(currentCoupon.value)
      } as Coupon;

      const otherCoupons = coupons.filter(c => c.code !== code);
      const updatedCoupons = [...otherCoupons, newCoupon];
      
      setCoupons(updatedCoupons);
      saveCoupons(updatedCoupons);
      setIsEditingCoupon(false);
      setCurrentCoupon({ type: 'PERCENTAGE', value: 10, code: '' });
  };

  const handleDeleteCoupon = (code: string) => {
      if(window.confirm(`Delete coupon ${code}?`)) {
          const updated = coupons.filter(c => c.code !== code);
          setCoupons(updated);
          saveCoupons(updated);
      }
  };

  // --- Category Handlers ---
  const handleAddCategory = () => {
      if (!newCategoryName.trim()) return;
      if (categories.includes(newCategoryName.trim())) {
          alert('Category already exists');
          return;
      }
      const updated = [...categories, newCategoryName.trim()];
      setCategories(updated);
      saveCategories(updated);
      setNewCategoryName('');
  };

  const handleDeleteCategory = (cat: string) => {
      if (window.confirm(`Delete category "${cat}"? Products in this category will remain but might not be filterable unless updated.`)) {
          const updated = categories.filter(c => c !== cat);
          setCategories(updated);
          saveCategories(updated);
      }
  };

  // --- Order Handlers ---
  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          const updatedOrder = { ...order, status: newStatus };
          updateOrder(updatedOrder);
          setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      }
  };

  const getAverageRating = (ratings?: number[]) => {
      if (!ratings || ratings.length === 0) return 'N/A';
      const sum = ratings.reduce((a, b) => a + b, 0);
      return (sum / ratings.length).toFixed(1);
  };

  const getStatusColor = (status: Order['status']) => {
      switch (status) {
          case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
          case 'CONFIRMED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
          case 'IN_TRANSIT': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
          case 'DELIVERED': return 'bg-green-500/10 text-green-500 border-green-500/20';
          case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
          default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-8">
        <div>
            <h1 className="text-2xl font-black text-lime-400 tracking-tighter">THAT ADMIN</h1>
            <p className="text-xs text-zinc-500 mt-1">Management Console</p>
        </div>
        
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
            <button 
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${activeTab === 'products' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
                <Package size={20} /> Products
            </button>
            <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${activeTab === 'orders' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
                <ClipboardList size={20} /> Orders
            </button>
            <button 
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${activeTab === 'categories' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
                <List size={20} /> Categories
            </button>
            <button 
                onClick={() => setActiveTab('coupons')}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${activeTab === 'coupons' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}
            >
                <Tag size={20} /> Coupons
            </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-80px)] md:h-screen">
        
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <button
                        onClick={() => { resetProductForm(); setIsEditingProduct(true); }}
                        className="bg-lime-400 text-black px-4 py-2 rounded-full font-bold hover:bg-lime-500 transition flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} /> New Product
                    </button>
                </div>

                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Item</th>
                                <th className="p-4">Info</th>
                                <th className="p-4">Rating</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-sm">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-zinc-800/50 transition">
                                <td className="p-4 flex items-center gap-3 min-w-[200px]">
                                    <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded bg-zinc-800" />
                                    <div>
                                        <div className="font-bold text-white">{p.name}</div>
                                        {p.originalPrice && p.originalPrice > p.price && (
                                            <div className="text-lime-400 text-xs">On Sale</div>
                                        )}
                                        {p.variants && p.variants.length > 0 && (
                                            <div className="text-purple-400 text-[10px] flex items-center gap-1 mt-1">
                                                <Layers size={10} /> {p.variants.length} Variants
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-zinc-400">
                                    <div>{p.category}</div>
                                    <div className="text-xs">{p.brand} • {p.color}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                        <Star size={12} fill="currentColor" /> {getAverageRating(p.ratings)}
                                    </div>
                                </td>
                                <td className="p-4 font-mono">
                                    ₹{p.price.toLocaleString('en-IN')}
                                    {p.originalPrice && <span className="text-zinc-500 line-through ml-2 text-xs">₹{p.originalPrice.toLocaleString('en-IN')}</span>}
                                </td>
                                <td className="p-4">{p.stock}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEditProduct(p)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">No products found. Add one to get started.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
                </div>
                
                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Items</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-sm">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-zinc-800/50 transition">
                                        <td className="p-4 font-mono text-lime-400">{order.id}</td>
                                        <td className="p-4 text-zinc-400">
                                            {new Date(order.date).toLocaleDateString()}
                                            <div className="text-[10px]">{new Date(order.date).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-zinc-300 text-xs">
                                                        <span className="text-zinc-500 font-bold">{item.quantity}x</span> 
                                                        {item.name} 
                                                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">{item.selectedSize}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold">
                                            ₹{order.finalAmount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <select 
                                                    value={order.status}
                                                    onChange={(e) => handleOrderStatusChange(order.id, e.target.value as Order['status'])}
                                                    className={`bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs font-bold uppercase tracking-wide outline-none focus:border-lime-400 ${
                                                        order.status === 'PENDING' ? 'text-yellow-500' :
                                                        order.status === 'CONFIRMED' ? 'text-blue-500' :
                                                        order.status === 'IN_TRANSIT' ? 'text-purple-500' :
                                                        order.status === 'DELIVERED' ? 'text-green-500' :
                                                        'text-red-500'
                                                    }`}
                                                >
                                                    <option value="PENDING">Pending</option>
                                                    <option value="CONFIRMED">Confirmed</option>
                                                    <option value="IN_TRANSIT">In Transit</option>
                                                    <option value="DELIVERED">Delivered</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                                
                                                {order.status === 'IN_TRANSIT' && <Truck size={14} className="text-purple-500"/>}
                                                {order.status === 'DELIVERED' && <CheckCircle size={14} className="text-green-500"/>}
                                                {order.status === 'CANCELLED' && <X size={14} className="text-red-500"/>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-zinc-500">No orders received yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
            <div className="space-y-6 max-w-2xl">
                 <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex gap-4 mb-8">
                        <input 
                            type="text" 
                            placeholder="New Category Name..." 
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 outline-none focus:border-lime-400"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        />
                        <button 
                            onClick={handleAddCategory}
                            className="bg-lime-400 text-black font-bold px-6 py-2 rounded-lg hover:bg-lime-500"
                        >
                            Add
                        </button>
                    </div>

                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat} className="flex justify-between items-center bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                                <span className="font-bold">{cat}</span>
                                <button onClick={() => handleDeleteCategory(cat)} className="text-zinc-500 hover:text-red-400 transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="text-center text-zinc-500 py-4">No categories found.</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
                    <button
                        onClick={() => { setCurrentCoupon({type: 'PERCENTAGE', value: 10, code: ''}); setIsEditingCoupon(true); }}
                        className="bg-lime-400 text-black px-4 py-2 rounded-full font-bold hover:bg-lime-500 transition flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} /> New Coupon
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((coupon, idx) => (
                        <div key={`${coupon.code}-${idx}`} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex justify-between items-start group hover:border-lime-500/50 transition">
                            <div>
                                <div className="text-2xl font-black text-white tracking-widest">{coupon.code}</div>
                                <div className="text-lime-400 font-mono mt-1">
                                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT OFF`}
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteCoupon(coupon.code)}
                                className="text-zinc-600 hover:text-red-400 transition"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    {coupons.length === 0 && (
                        <div className="col-span-full p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                            No active coupons. Create one to boost sales.
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* Product Edit Modal */}
      {isEditingProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 w-full max-w-3xl rounded-2xl border border-zinc-700 p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{currentProduct.id ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setIsEditingProduct(false)}><X /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Product Name</label>
                    <input
                      type="text"
                      value={currentProduct.name || ''}
                      onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none transition"
                      placeholder="e.g. Cyberpunk Hoodie"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Price (₹)</label>
                        <input
                        type="number"
                        value={currentProduct.price || ''}
                        onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Original Price (₹)</label>
                        <input
                        type="number"
                        value={currentProduct.originalPrice || ''}
                        onChange={e => setCurrentProduct({...currentProduct, originalPrice: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none font-mono"
                        placeholder="Optional"
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                        <select
                          value={currentProduct.category}
                          onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none appearance-none"
                        >
                          <option value="" disabled>Select Category</option>
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Color</label>
                         <select
                            value={currentProduct.color || ''}
                            onChange={e => setCurrentProduct({...currentProduct, color: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none appearance-none"
                         >
                             <option value="">Select</option>
                             {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                     </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Brand</label>
                      <input
                          type="text"
                          value={currentProduct.brand || ''}
                          onChange={e => setCurrentProduct({...currentProduct, brand: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none"
                          placeholder="e.g. THAT ORIGINALS"
                      />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Product Images</label>
                    <div className="grid grid-cols-3 gap-3">
                        {currentProduct.images?.map((img, idx) => (
                            <div key={idx} className="relative aspect-[3/4] group rounded overflow-hidden border border-zinc-800">
                                <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-black/70 text-white p-1.5 rounded-full hover:bg-red-500 transition opacity-0 group-hover:opacity-100"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        
                        <label className="aspect-[3/4] border-2 border-dashed border-zinc-800 rounded hover:border-lime-400 hover:bg-zinc-900/50 transition cursor-pointer flex flex-col items-center justify-center text-zinc-600 hover:text-lime-400 group">
                            <Upload size={24} className="mb-2 group-hover:scale-110 transition" />
                            <span className="text-[10px] font-bold uppercase">Upload</span>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="hidden" 
                            />
                        </label>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2">
                        Supported: JPG, PNG, WEBP. Images stored locally (Base64).
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                   {/* AI Section */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 relative group">
                    <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition">
                        <Sparkles className="text-purple-500" size={16} />
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">AI Description & SEO</label>
                        <button 
                            onClick={handleGenerateAI}
                            disabled={loadingAI}
                            className="text-[10px] bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-white flex items-center gap-1 uppercase font-bold tracking-wide"
                        >
                            {loadingAI ? <Loader2 className="animate-spin" size={10} /> : "Generate"}
                        </button>
                    </div>
                    <textarea
                      placeholder="Product description..."
                      value={currentProduct.description || ''}
                      onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-sm h-32 focus:border-purple-500 outline-none mb-3 resize-none"
                    />
                    <div>
                        <label className="block text-[10px] text-zinc-600 mb-1">SEO Keywords</label>
                        <div className="flex flex-wrap gap-1 min-h-[24px]">
                            {currentProduct.seoKeywords?.map((k, i) => (
                                <span key={i} className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">#{k}</span>
                            ))}
                        </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Selected Sizes</label>
                    <div className="flex gap-2 flex-wrap mb-3">
                         {currentProduct.sizes && currentProduct.sizes.length > 0 ? (
                             currentProduct.sizes.map(s => (
                                 <div key={s} className="bg-lime-400 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                     {s}
                                     <button onClick={() => toggleSize(s)} className="hover:text-red-700"><X size={12}/></button>
                                 </div>
                             ))
                         ) : (
                             <span className="text-xs text-zinc-500 italic">No sizes selected.</span>
                         )}
                    </div>
                    
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Quick Add</label>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {SIZES.map(s => (
                        <button
                          key={s}
                          onClick={() => toggleSize(s)}
                          className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold border transition ${
                            currentProduct.sizes?.includes(s) 
                              ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-default opacity-50' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-lime-400 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Add Custom Size</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="e.g. XS, 3XL" 
                            value={customSize}
                            onChange={(e) => setCustomSize(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs outline-none focus:border-lime-400"
                        />
                        <button 
                            onClick={handleAddCustomSize}
                            className="bg-zinc-800 hover:bg-lime-400 hover:text-black text-white px-3 py-2 rounded text-xs font-bold transition"
                        >
                            Add
                        </button>
                    </div>
                  </div>

                  {/* VARIANT MANAGEMENT */}
                  <div className="border-t border-zinc-800 pt-4">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                          <Layers size={14}/> Product Variants
                      </label>
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-3">
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Variant (e.g. Red, Cotton)" 
                                value={newVariantName}
                                onChange={e => setNewVariantName(e.target.value)}
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
                              />
                              <input 
                                type="number" 
                                placeholder="Stock" 
                                value={newVariantStock}
                                onChange={e => setNewVariantStock(Number(e.target.value))}
                                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
                              />
                              <button 
                                onClick={handleAddVariant}
                                className="bg-lime-400 text-black p-1 rounded hover:bg-lime-500"
                              >
                                  <Plus size={16} />
                              </button>
                          </div>
                          
                          {currentProduct.variants && currentProduct.variants.length > 0 && (
                             <div className="space-y-1 max-h-32 overflow-y-auto">
                                 {currentProduct.variants.map((v) => (
                                     <div key={v.id} className="flex justify-between items-center text-xs bg-zinc-900 p-2 rounded">
                                         <span>{v.name}</span>
                                         <div className="flex items-center gap-3">
                                             <span className="text-zinc-500">Qty: {v.stock}</span>
                                             <button onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-white"><X size={12}/></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                          )}
                          
                          {(!currentProduct.variants || currentProduct.variants.length === 0) && (
                              <p className="text-[10px] text-zinc-600 italic text-center">No variants added.</p>
                          )}
                      </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 border rounded flex items-center justify-center transition ${currentProduct.isNewDrop ? 'bg-lime-400 border-lime-400' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                             {currentProduct.isNewDrop && <div className="w-2 h-2 bg-black rounded-full" />}
                        </div>
                        <input 
                            type="checkbox" 
                            checked={currentProduct.isNewDrop || false}
                            onChange={e => setCurrentProduct({...currentProduct, isNewDrop: e.target.checked})}
                            className="hidden"
                        />
                        <span className="text-sm font-medium">Mark as New Drop</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-zinc-800">
                <button
                  onClick={() => setIsEditingProduct(false)}
                  className="px-6 py-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="px-8 py-2 bg-lime-400 text-black rounded-full hover:bg-lime-500 transition text-sm font-bold flex items-center gap-2"
                >
                  <Save size={16} /> Save Product
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Coupon Edit Modal */}
      {isEditingCoupon && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-700 p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Manage Coupon</h2>
                    <button onClick={() => setIsEditingCoupon(false)}><X /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Coupon Code</label>
                        <input
                            type="text"
                            value={currentCoupon.code || ''}
                            onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none font-black tracking-wider uppercase placeholder:text-zinc-800"
                            placeholder="CODE123"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Discount Type</label>
                        <div className="flex bg-zinc-950 rounded p-1 border border-zinc-700">
                            <button 
                                onClick={() => setCurrentCoupon({...currentCoupon, type: 'PERCENTAGE'})}
                                className={`flex-1 py-2 text-xs font-bold rounded transition ${currentCoupon.type === 'PERCENTAGE' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Percentage (%)
                            </button>
                            <button 
                                onClick={() => setCurrentCoupon({...currentCoupon, type: 'FIXED'})}
                                className={`flex-1 py-2 text-xs font-bold rounded transition ${currentCoupon.type === 'FIXED' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                Fixed Amount (₹)
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Value</label>
                        <input
                            type="number"
                            value={currentCoupon.value}
                            onChange={e => setCurrentCoupon({...currentCoupon, value: Number(e.target.value)})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-lime-400 outline-none font-mono"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={() => setIsEditingCoupon(false)}
                        className="px-6 py-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition text-sm font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveCoupon}
                        className="px-8 py-2 bg-lime-400 text-black rounded-full hover:bg-lime-500 transition text-sm font-bold"
                    >
                        Save Coupon
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};