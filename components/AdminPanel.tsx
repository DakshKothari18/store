
import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, VariantSize, Coupon } from '../types';
import { getProducts, saveProducts, getCategories, saveCategories, getGlobalSizes, saveGlobalSizes, getCoupons, saveCoupons } from '../services/storageService';
import { Trash2, Plus, Edit, Package, Save, X, Layers, Upload, ImageIcon, List, Tag } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'sizes' | 'coupons'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [globalSizes, setGlobalSizes] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ variants: [] });
  
  // New Variant Entry State
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({ name: '', images: [], sizes: [] });
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeStock, setNewSizeStock] = useState<number>(0);

  // General Tab States
  const [newCategory, setNewCategory] = useState('');
  const [newGlobalSize, setNewGlobalSize] = useState('');
  
  // New Coupon States
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState<number>(0);

  useEffect(() => {
    setProducts(getProducts());
    setCategories(getCategories());
    setGlobalSizes(getGlobalSizes());
    setCoupons(getCoupons());
  }, []);

  const handleSaveProduct = () => {
    if (!currentProduct.name || !currentProduct.price) return;
    const allProducts = getProducts();
    let updated;
    
    const aggregatedStock = (currentProduct.variants || []).reduce((acc, v) => 
        acc + v.sizes.reduce((a, s) => a + s.stock, 0), 0);
    
    const aggregatedSizes = Array.from(new Set((currentProduct.variants || []).flatMap(v => v.sizes.map(s => s.size))));

    if (currentProduct.id) {
        updated = allProducts.map(p => p.id === currentProduct.id ? { 
            ...p, 
            ...currentProduct, 
            stock: aggregatedStock, 
            sizes: aggregatedSizes 
        } as Product : p);
    } else {
        const newP: Product = {
            ...currentProduct,
            id: Date.now().toString(),
            stock: aggregatedStock,
            images: currentProduct.images?.length ? currentProduct.images : ['https://picsum.photos/800/1000'],
            ratings: [],
            sizes: aggregatedSizes
        } as Product;
        updated = [newP, ...allProducts];
    }
    setProducts(updated);
    saveProducts(updated);
    setIsEditingProduct(false);
  };

  const handleAddCoupon = () => {
    if (!newCouponCode) return;
    const nc: Coupon = { code: newCouponCode.toUpperCase(), type: newCouponType, value: newCouponValue };
    const updated = [...coupons, nc];
    setCoupons(updated);
    saveCoupons(updated);
    setNewCouponCode('');
    setNewCouponValue(0);
  };

  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.sizes || newVariant.sizes.length === 0) return;
    const v: ProductVariant = {
      id: Date.now().toString(),
      name: newVariant.name,
      images: newVariant.images || [],
      sizes: newVariant.sizes as VariantSize[]
    };
    setCurrentProduct(prev => ({
      ...prev,
      variants: [...(prev.variants || []), v]
    }));
    setNewVariant({ name: '', images: [], sizes: [] });
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      const base64s = await Promise.all(Array.from(files).map((file: File) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = err => reject(err);
        });
      }));
      setNewVariant({ ...newVariant, images: [...(newVariant.images || []), ...base64s] });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-8">
        <div>
            <div className="flex flex-col items-start select-none leading-[0.7] mb-4">
                <span className="font-black text-[2.8rem] tracking-tighter text-white lowercase">that</span>
                <span className="font-light text-[1rem] tracking-tight text-white ml-10 lowercase">store.</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Admin Control</p>
        </div>
        <nav className="flex flex-col gap-2">
            <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'products' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}><Package size={20} /> Products</button>
            <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'categories' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}><List size={20} /> Categories</button>
            <button onClick={() => setActiveTab('sizes')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'sizes' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}><Layers size={20} /> Sizes Manager</button>
            <button onClick={() => setActiveTab('coupons')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'coupons' ? 'bg-lime-400 text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}><Tag size={20} /> Coupons</button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Inventory</h2>
                <button onClick={() => { setCurrentProduct({ variants: [] }); setIsEditingProduct(true); }} className="bg-lime-400 text-black px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2"><Plus size={16} /> Add New Drop</button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 tracking-widest"><tr><th className="p-4">Drop</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-zinc-800">
                        {products.map(p => (
                            <tr key={p.id} className="text-sm hover:bg-zinc-800/50 transition">
                                <td className="p-4 flex items-center gap-4"><img src={p.images[0]} className="w-10 h-10 object-cover rounded bg-zinc-800" /> <div><div className="font-bold">{p.name}</div><div className="text-[10px] text-zinc-500">{p.variants?.length || 0} Variants | {p.stock} Stock</div></div></td>
                                <td className="p-4 uppercase text-[10px] font-bold tracking-widest text-zinc-500">{p.category}</td>
                                <td className="p-4 font-mono font-bold">₹{p.price}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => { setCurrentProduct(p); setIsEditingProduct(true); }} className="p-2 text-lime-400"><Edit size={16} /></button>
                                    <button onClick={() => { if(confirm('Delete drop?')) { const u = products.filter(x => x.id !== p.id); setProducts(u); saveProducts(u); } }} className="p-2 text-red-500"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
            <div className="max-w-xl space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Coupons</h2>
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <input type="text" placeholder="CODE (e.g. FLASH20)" value={newCouponCode} onChange={e => setNewCouponCode(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-1 ring-lime-400 uppercase" />
                    <div className="flex gap-4">
                        <select value={newCouponType} onChange={e => setNewCouponType(e.target.value as any)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-1 ring-lime-400">
                            <option value="PERCENTAGE">% Off</option>
                            <option value="FIXED">Flat ₹ Off</option>
                        </select>
                        <input type="number" placeholder="Value" value={newCouponValue} onChange={e => setNewCouponValue(Number(e.target.value))} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm outline-none focus:ring-1 ring-lime-400" />
                    </div>
                    <button onClick={handleAddCoupon} className="w-full bg-lime-400 text-black py-3 rounded-xl font-bold uppercase text-xs">Create Coupon</button>
                </div>
                <div className="space-y-2">
                    {coupons.map(c => (
                        <div key={c.code} className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <div>
                                <span className="font-black text-lime-400 mr-4 tracking-widest">{c.code}</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase">{c.value}{c.type === 'PERCENTAGE' ? '%' : '₹'} DISCOUNT</span>
                            </div>
                            <button onClick={() => { const u = coupons.filter(x => x.code !== c.code); setCoupons(u); saveCoupons(u); }} className="text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'categories' && (
            <div className="max-w-xl space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Categories</h2>
                <div className="flex gap-2">
                    <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:ring-1 ring-lime-400" />
                    <button onClick={() => { if(newCategory) { const u = [...categories, newCategory]; setCategories(u); saveCategories(u); setNewCategory(''); }}} className="bg-lime-400 text-black px-6 rounded-xl font-bold uppercase text-xs">Add</button>
                </div>
                <div className="space-y-2">
                    {categories.map(c => (
                        <div key={c} className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <span className="font-bold uppercase text-xs tracking-widest">{c}</span>
                            <button onClick={() => { const u = categories.filter(x => x !== c); setCategories(u); saveCategories(u); }} className="text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'sizes' && (
            <div className="max-w-xl space-y-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Global Sizes</h2>
                <div className="flex gap-2">
                    <input type="text" value={newGlobalSize} onChange={e => setNewGlobalSize(e.target.value)} placeholder="E.g. XXL, US 12..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:ring-1 ring-lime-400" />
                    <button onClick={() => { if(newGlobalSize) { const u = [...globalSizes, newGlobalSize]; setGlobalSizes(u); saveGlobalSizes(u); setNewGlobalSize(''); }}} className="bg-lime-400 text-black px-6 rounded-xl font-bold uppercase text-xs">Add Size</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {globalSizes.map(s => (
                        <div key={s} className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <span className="font-bold font-mono text-xs">{s}</span>
                            <button onClick={() => { const u = globalSizes.filter(x => x !== s); setGlobalSizes(u); saveGlobalSizes(u); }} className="text-red-500"><X size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      {isEditingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-900 w-full max-w-4xl rounded-2xl border border-zinc-700 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-widest">{currentProduct.id ? 'Edit Drop' : 'New Drop'}</h2>
              <button onClick={() => setIsEditingProduct(false)}><X /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div><label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">Product Name</label><input type="text" value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:ring-1 ring-lime-400" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">Price (₹)</label><input type="number" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:ring-1 ring-lime-400" /></div>
                  <div><label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">Category</label><select value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:ring-1 ring-lime-400 uppercase">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div><label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">Color Way</label><input type="text" value={currentProduct.color || ''} onChange={e => setCurrentProduct({...currentProduct, color: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm outline-none focus:ring-1 ring-lime-400" placeholder="e.g. Black" /></div>
                <div><label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">Description</label><textarea value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm h-32 outline-none focus:ring-1 ring-lime-400 resize-none" /></div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2"><Layers size={14}/> Variant Editor</h3>
                  <div className="space-y-4 mb-6 pb-6 border-b border-zinc-800">
                    <input type="text" placeholder="Variant Name" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none" />
                    
                    <div className="flex gap-2">
                      <select value={newSizeName} onChange={e => setNewSizeName(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none">
                        <option value="">Select Size...</option>
                        {globalSizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input type="number" placeholder="Qty" value={newSizeStock} onChange={e => setNewSizeStock(Number(e.target.value))} className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs outline-none" />
                      <button onClick={() => { if(newSizeName) { setNewVariant({...newVariant, sizes: [...(newVariant.sizes || []), {size: newSizeName, stock: newSizeStock}]}); setNewSizeName(''); setNewSizeStock(0); }}} className="p-3 bg-zinc-800 rounded-xl text-lime-400"><Plus size={16}/></button>
                    </div>

                    <div className="flex flex-wrap gap-2 py-2">
                      {newVariant.sizes?.map((s, i) => <span key={i} className="text-[10px] font-bold bg-zinc-800 px-3 py-1 rounded-full uppercase">{s.size}: {s.stock}</span>)}
                    </div>

                    <label className="w-full h-12 border border-dashed border-zinc-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-lime-400 transition"><ImageIcon size={14} className="mr-2" /><span className="text-[10px] font-bold uppercase">Upload Photos</span><input type="file" multiple onChange={handleVariantImageUpload} className="hidden" /></label>
                    <button onClick={handleAddVariant} className="w-full bg-lime-400 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mt-2">Add Variant</button>
                  </div>

                  <div className="space-y-3">
                    {currentProduct.variants?.map((v, i) => (
                      <div key={i} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <img src={v.images[0] || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded object-cover" />
                          <div><div className="text-[10px] font-black uppercase">{v.name}</div><div className="text-[9px] text-zinc-500">{v.sizes.length} Sizes</div></div>
                        </div>
                        <button onClick={() => setCurrentProduct({...currentProduct, variants: currentProduct.variants?.filter((_, idx) => idx !== i)})} className="text-red-500"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-end gap-4 border-t border-zinc-800 pt-8">
              <button onClick={() => setIsEditingProduct(false)} className="px-10 py-4 text-zinc-500 font-bold uppercase text-xs">Cancel</button>
              <button onClick={handleSaveProduct} className="px-14 py-4 bg-lime-400 text-black font-black rounded-full uppercase tracking-widest text-xs shadow-2xl flex items-center gap-2"><Save size={18}/> Save Drop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
