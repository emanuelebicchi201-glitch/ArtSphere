
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Artwork, Category, ArtworkStatus, UserRole, Order, PaymentAccount } from '../types';
import { getStore, saveArtworks, saveUsers } from '../store';
import { generateArtworkDescription, generateArtImage } from '../services/geminiService';

const Dashboard: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'artworks' | 'orders' | 'profile'>('artworks');
  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: Category.PAINTINGS,
    tagsString: '',
    price: 0,
    imageUrl: ''
  });

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    paymentType: currentUser?.paymentAccount?.type || 'PayPal',
    paymentIdentifier: currentUser?.paymentAccount?.identifier || ''
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.ARTIST) {
      navigate('/auth');
      return;
    }
    refreshData();
  }, [currentUser, navigate]);

  const refreshData = () => {
    const { artworks, orders } = getStore();
    setMyArtworks(artworks.filter((a: Artwork) => a.artistId === currentUser?.id));
    setMyOrders(orders.filter((o: Order) => o.artistId === currentUser?.id));
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(base64);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        alert("Gallery requirements: PNG or JPEG only.");
        return;
      }
      try {
        setIsSubmitting(true);
        const base64 = await fileToBase64(file);
        const optimized = await compressImage(base64);
        setFormData(prev => ({ ...prev, imageUrl: optimized }));
      } catch (err) {
        console.error("File processing error:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAiDescription = async () => {
    if (!formData.title) return alert("Define a title first.");
    setIsAiLoading(true);
    const desc = await generateArtworkDescription(formData.title, formData.category);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsAiLoading(false);
  };

  const handleAiImageGeneration = async () => {
    if (!formData.title) return alert("AI requires a title for contextual generation.");
    setIsImageGenerating(true);
    const tags = formData.tagsString.split(',').map(t => t.trim());
    const generatedImage = await generateArtImage(formData.title, formData.category, tags);
    if (generatedImage) {
      const optimized = await compressImage(generatedImage);
      setFormData(prev => ({ ...prev, imageUrl: optimized }));
    } else {
      alert("AI canvas generation failed.");
    }
    setIsImageGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.paymentAccount) {
      alert("A connected payment account is mandatory for publication.");
      return;
    }
    
    let finalImageUrl = formData.imageUrl;
    if (!finalImageUrl) {
      if (confirm("Visual missing. Generate AI placeholder masterpiece?")) {
        setIsSubmitting(true);
        const tags = formData.tagsString.split(',').map(t => t.trim());
        const aiImg = await generateArtImage(formData.title, formData.category, tags);
        if (aiImg) {
          finalImageUrl = await compressImage(aiImg);
        } else {
          setIsSubmitting(false);
          return alert("Masterpiece invocation failed.");
        }
      } else {
        return alert("Gallery visuals are mandatory for publication.");
      }
    }
    
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));

    const { artworks } = getStore();
    const tags = formData.tagsString.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '');
    
    let updated;
    if (editingId) {
      updated = artworks.map((a: Artwork) => a.id === editingId ? { 
        ...a, 
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: tags,
        price: formData.price,
        imageUrl: finalImageUrl
      } : a);
    } else {
      const newArt: Artwork = {
        id: 'w' + Math.random().toString(36).substr(2, 9),
        artistId: currentUser!.id,
        artistName: currentUser!.name,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: tags,
        price: formData.price,
        imageUrl: finalImageUrl,
        status: ArtworkStatus.AVAILABLE,
        createdAt: new Date().toISOString()
      };
      updated = [newArt, ...artworks];
    }
    
    const success = saveArtworks(updated);
    if (success) {
      refreshData();
      if (!editingId) setShowSuccessModal(true);
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', description: '', category: Category.PAINTINGS, tagsString: '', price: 0, imageUrl: '' });
    }
    setIsSubmitting(false);
  };

  const updateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const { users } = getStore();
    const updatedUser = { 
      ...currentUser!, 
      name: profileData.name, 
      bio: profileData.bio,
      paymentAccount: {
        type: profileData.paymentType as any,
        identifier: profileData.paymentIdentifier,
        connectedAt: currentUser?.paymentAccount?.connectedAt || new Date().toISOString()
      }
    };
    const updatedUsers = users.map((u: User) => u.id === currentUser?.id ? updatedUser : u);
    saveUsers(updatedUsers);
    localStorage.setItem('as_current_user', JSON.stringify(updatedUser));
    alert("Artist Identity and Payment Settings synchronized.");
  };

  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
             <div>
               <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">Creator Studio</h1>
               <div className="flex items-center gap-3">
                 <p className="text-slate-500">Managing portfolio for {currentUser?.name}.</p>
                 <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-green-100 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                   Payment Ready
                 </span>
               </div>
             </div>
             {!isAdding && activeTab === 'artworks' && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                  <span className="text-xl">+</span> Publish Masterpiece
                </button>
             )}
          </div>
          
          <div className="flex gap-8 border-b border-slate-200 overflow-x-auto">
            <button 
              onClick={() => {setActiveTab('artworks'); setIsAdding(false);}}
              className={`pb-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'artworks' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              My Gallery
            </button>
            <button 
              onClick={() => {setActiveTab('orders'); setIsAdding(false);}}
              className={`pb-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Orders & Payments
            </button>
            <button 
              onClick={() => {setActiveTab('profile'); setIsAdding(false);}}
              className={`pb-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Account Settings
            </button>
          </div>
        </header>

        {isAdding ? (
          <div className="bg-white rounded-[2.5rem] p-8 md:p-16 mb-12 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-12 pb-8 border-b border-slate-50">
              <h2 className="text-4xl font-serif font-bold">{editingId ? 'Refine Creation' : 'Publish New Artwork'}</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 underline font-bold text-sm tracking-widest uppercase">Discard</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-10">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Masterpiece Title</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-serif text-xl"
                    placeholder="e.g. Echoes of Eternity"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Curated Description</label>
                    <button type="button" onClick={handleAiDescription} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 tracking-wider">
                      {isAiLoading ? 'Invoking Muse...' : '✨ Generate AI Description'}
                    </button>
                  </div>
                  <textarea 
                    rows={4} required
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 leading-relaxed italic text-slate-600"
                    placeholder="Describe your creative process..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Medium Category</label>
                    <select 
                      className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                    >
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Acquisition Price ($)</label>
                    <input 
                      type="number" required min="1"
                      className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-2xl text-indigo-600"
                      value={formData.price || ''}
                      placeholder="0"
                      onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Tags (for Classification)</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="e.g. digital, ethereal, canvas, abstract"
                    value={formData.tagsString}
                    onChange={e => setFormData({ ...formData, tagsString: e.target.value })}
                  />
                  <p className="mt-3 text-[10px] text-slate-400 italic">Tags help collectors discover your work in specific collections.</p>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Artwork Visuals</label>
                    <button 
                      type="button" 
                      onClick={handleAiImageGeneration}
                      disabled={isImageGenerating}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {isImageGenerating ? 'Painting AI Vision...' : '✨ Invoke AI Placeholder'}
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} accept=".png, .jpg, .jpeg" className="hidden" onChange={handleFileChange} />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative aspect-square rounded-[3rem] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${formData.imageUrl ? 'border-transparent ring-8 ring-indigo-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'}`}
                  >
                    {isImageGenerating ? (
                      <div className="text-center">
                        <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-sm font-serif italic text-slate-500">Synthesizing artistic expression...</p>
                      </div>
                    ) : formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-1000" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <span className="px-8 py-3 bg-white text-xs font-bold rounded-full uppercase tracking-widest shadow-2xl">Replace Masterpiece</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-12">
                        <span className="text-7xl mb-8 block opacity-40">🖼️</span>
                        <p className="text-slate-900 font-bold text-xl mb-3">Upload Masterpiece</p>
                        <p className="text-slate-400 text-sm italic">Museum standard: PNG or JPEG only</p>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-7 bg-slate-900 text-white font-bold rounded-[2rem] hover:bg-indigo-600 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4 text-xl tracking-wide"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Encrypting & Publishing...
                    </>
                  ) : (
                    editingId ? 'Commit Gallery Updates' : 'Confirm & Publish to Global Marketplace'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {activeTab === 'artworks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {myArtworks.map(art => (
                  <div key={art.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 group animate-in fade-in duration-700">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img src={art.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" />
                      <div className={`absolute top-8 left-8 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm backdrop-blur-md ${art.status === ArtworkStatus.SOLD ? 'bg-red-500/90 text-white' : 'bg-white/90 text-slate-900'}`}>
                        {art.status}
                      </div>
                    </div>
                    <div className="p-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{art.title}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{art.category}</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900">${art.price.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            setEditingId(art.id); 
                            setFormData({
                              title: art.title,
                              description: art.description,
                              category: art.category,
                              tagsString: art.tags.join(', '),
                              price: art.price,
                              imageUrl: art.imageUrl
                            }); 
                            setIsAdding(true);
                          }} 
                          className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                          Refine
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm("Permanently remove this creation from ArtSphere?")){
                              const {artworks} = getStore();
                              saveArtworks(artworks.filter((a: Artwork) => a.id !== art.id));
                              refreshData();
                            }
                          }} 
                          className="flex-1 py-4 border-2 border-red-50 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-50 transition-all uppercase tracking-widest"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {myArtworks.length === 0 && (
                  <div className="col-span-full py-48 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                    <span className="text-8xl mb-10 block opacity-10 grayscale">🎨</span>
                    <h3 className="text-3xl font-serif text-slate-300 italic mb-10">Your personal gallery is currently silent.</h3>
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="px-12 py-5 bg-indigo-600 text-white font-bold rounded-full shadow-2xl shadow-indigo-100 uppercase tracking-widest text-sm"
                    >
                      Begin Your Legacy
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-bold text-slate-900">Marketplace Ledger</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales: {myOrders.length}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Order ID</th>
                        <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Masterpiece</th>
                        <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Patron Info</th>
                        <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Value</th>
                        <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Gateway</th>
                        <th className="px-10 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myOrders.map(order => (
                        <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                          <td className="px-10 py-8 font-mono text-xs text-slate-400">#{order.id.split('-')[1].toUpperCase()}</td>
                          <td className="px-10 py-8">
                            <p className="font-bold text-slate-900">{order.artworkTitle}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-10 py-8">
                            <p className="font-bold text-slate-700">{order.buyerName}</p>
                            <p className="text-xs text-slate-400 font-medium">{order.buyerEmail}</p>
                          </td>
                          <td className="px-10 py-8">
                            <p className="font-black text-indigo-600 text-lg">${order.amount.toLocaleString()}</p>
                          </td>
                          <td className="px-10 py-8">
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${order.paymentMethod === 'PayPal' ? 'bg-[#003087]/5 text-[#003087] border-[#003087]/10' : 'bg-slate-900 text-white border-slate-900'}`}>
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <span className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${order.status === 'Completed' ? 'bg-green-50 text-green-600' : order.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {myOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-10 py-40 text-center text-slate-300 italic">
                             <p className="text-xl font-serif">The ledger is currently blank.</p>
                             <p className="text-sm mt-4 uppercase tracking-widest font-bold">Collectors are still discovering your vision.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-4xl bg-white rounded-[3rem] p-12 md:p-20 shadow-sm border border-slate-100 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row gap-20">
                  <div className="flex-1 space-y-12">
                    <h2 className="text-4xl font-serif font-bold text-slate-900">Creator Identity</h2>
                    <form onSubmit={updateProfile} className="space-y-10">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Gallery Name</label>
                        <input 
                          type="text" required
                          className="w-full px-8 py-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 font-serif text-xl"
                          value={profileData.name}
                          onChange={e => setProfileData({...profileData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Artistic Philosophy</label>
                        <textarea 
                          rows={8} required
                          className="w-full px-8 py-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 leading-relaxed italic text-slate-600 text-lg"
                          value={profileData.bio}
                          onChange={e => setProfileData({...profileData, bio: e.target.value})}
                        />
                      </div>
                      
                      <div className="pt-10 border-t border-slate-50">
                        <h3 className="text-xl font-serif font-bold mb-8">Global Payout Gateway</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                           <button 
                            type="button"
                            onClick={() => setProfileData({...profileData, paymentType: 'PayPal'})}
                            className={`p-6 border-2 rounded-2xl transition-all flex items-center gap-4 ${profileData.paymentType === 'PayPal' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}
                           >
                             <div className="w-8 h-8 bg-[#003087] rounded-full text-white font-bold flex items-center justify-center text-xs">P</div>
                             <span className="font-bold text-slate-900 text-sm">PayPal</span>
                           </button>
                           <button 
                            type="button"
                            onClick={() => setProfileData({...profileData, paymentType: 'Revolut'})}
                            className={`p-6 border-2 rounded-2xl transition-all flex items-center gap-4 ${profileData.paymentType === 'Revolut' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}
                           >
                             <div className="w-8 h-8 bg-black rounded-full text-white font-bold flex items-center justify-center text-xs">R</div>
                             <span className="font-bold text-slate-900 text-sm">Revolut</span>
                           </button>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Payout Identifier</label>
                          <input 
                            type="text" required
                            className="w-full px-8 py-6 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                            value={profileData.paymentIdentifier}
                            onChange={e => setProfileData({...profileData, paymentIdentifier: e.target.value})}
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-6 bg-slate-900 text-white font-bold rounded-[2rem] hover:bg-indigo-600 transition-all shadow-2xl uppercase tracking-widest text-sm"
                      >
                        Synchronize Settings
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[4rem] p-16 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-10 shadow-xl shadow-green-100">
              ✨
            </div>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-6">Exhibition Live</h2>
            <p className="text-slate-500 mb-12 leading-relaxed italic text-lg">
              "Your masterpiece has been encrypted, optimized, and successfully added to the ArtSphere archives."
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
              >
                Back to Studio
              </button>
              <button 
                onClick={() => {setShowSuccessModal(false); navigate('/gallery')}}
                className="w-full py-5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
              >
                View in Marketplace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
