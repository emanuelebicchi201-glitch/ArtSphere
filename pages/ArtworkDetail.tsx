
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Artwork, User, ArtworkStatus, Order } from '../types';
import { getStore, saveArtworks, saveOrders } from '../store';
import { generateArtImage } from '../services/geminiService';

const ArtworkDetail: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [isFixingImage, setIsFixingImage] = useState(false);

  useEffect(() => {
    const { artworks } = getStore();
    const art = artworks.find((a: Artwork) => a.id === id);
    if (art) {
      setArtwork(art);
      if (!art.imageUrl) {
        fixMissingImage(art);
      }
    }
  }, [id]);

  const fixMissingImage = async (art: Artwork) => {
    setIsFixingImage(true);
    const aiImg = await generateArtImage(art.title, art.category, art.tags);
    if (aiImg) {
      const { artworks } = getStore();
      const updated = artworks.map((a: Artwork) => a.id === art.id ? { ...a, imageUrl: aiImg } : a);
      saveArtworks(updated);
      setArtwork({ ...art, imageUrl: aiImg });
    }
    setIsFixingImage(false);
  };

  const handlePurchase = (method: 'PayPal' | 'Revolut') => {
    if (!currentUser) {
      navigate('/auth', { state: { from: `/artwork/${id}` } });
      return;
    }

    setPaymentStep('processing');
    setTimeout(() => {
      const { artworks, orders } = getStore();
      
      // Update Artwork Status
      const updatedArtworks = artworks.map((a: Artwork) => a.id === id ? { ...a, status: ArtworkStatus.SOLD } : a);
      saveArtworks(updatedArtworks);
      
      // Create New Order
      const newOrder: Order = {
        id: 'ord-' + Math.random().toString(36).substr(2, 9),
        buyerId: currentUser.id,
        buyerName: currentUser.name,
        buyerEmail: currentUser.email,
        artistId: artwork!.artistId,
        artworkId: artwork!.id,
        artworkTitle: artwork!.title,
        amount: artwork!.price,
        paymentMethod: method,
        status: 'Completed',
        createdAt: new Date().toISOString()
      };
      
      saveOrders([...orders, newOrder]);
      setArtwork(prev => prev ? { ...prev, status: ArtworkStatus.SOLD } : null);
      setPaymentStep('success');
    }, 1800);
  };

  if (!artwork) return <div className="py-40 text-center animate-pulse">Invoking the masterpiece...</div>;

  return (
    <div className="bg-white min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/gallery" className="text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-[0.2em] mb-12 inline-block transition-all hover:-translate-x-1">
          ← Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div className="bg-slate-50/50 p-6 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden group min-h-[500px] flex items-center justify-center relative">
            {isFixingImage ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="font-serif italic text-slate-400">Restoring visual archive via AI...</p>
              </div>
            ) : (
              <img 
                src={artwork.imageUrl || 'https://via.placeholder.com/800x1000?text=Restoring+Visuals'} 
                alt={artwork.title} 
                className="w-full h-auto shadow-2xl rounded-sm max-h-[75vh] object-contain mx-auto transition-transform duration-1000 group-hover:scale-[1.02]"
              />
            )}
          </div>

          <div className="lg:sticky lg:top-32 space-y-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600 mb-6">{artwork.category}</p>
              <h1 className="text-6xl font-serif font-bold text-slate-900 mb-6 leading-tight">{artwork.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-10">
                {artwork.tags.map(tag => (
                  <Link 
                    key={tag} 
                    to={`/gallery?tag=${tag}`}
                    className="px-4 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              <div className="flex items-center mb-10 pb-10 border-b border-slate-100">
                <Link to={`/artist/${artwork.artistId}`} className="group flex items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full mr-6 overflow-hidden border-4 border-white shadow-sm transition-transform group-hover:scale-110">
                    <img src={`https://picsum.photos/seed/${artwork.artistId}/100`} alt={artwork.artistName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Created By</p>
                    <p className="text-2xl font-serif group-hover:text-indigo-600 transition-colors font-bold">{artwork.artistName}</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900">Artist Statement</h3>
              <p className="text-slate-600 leading-relaxed text-xl font-light italic">
                "{artwork.description}"
              </p>
            </div>

            <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Acquisition Value</p>
                <p className="text-5xl font-serif font-bold">${artwork.price.toLocaleString()}</p>
              </div>
              
              {artwork.status === ArtworkStatus.AVAILABLE ? (
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="w-full sm:w-auto px-12 py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-900/40 active:scale-95 text-lg"
                >
                  Acquire Piece
                </button>
              ) : (
                <div className="px-12 py-5 bg-white/10 text-white/40 font-bold rounded-2xl cursor-not-allowed border border-white/5 uppercase tracking-widest text-sm">
                  Already in a Private Collection
                </div>
              )}
            </div>
            
            <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
              Free Insured Global Shipping • Museum-Grade Packaging
            </p>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setShowCheckout(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {paymentStep === 'selection' && (
              <div className="p-10 md:p-14">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-serif font-bold">Checkout</h2>
                  <button onClick={() => setShowCheckout(false)} className="text-slate-300 hover:text-slate-900 transition-colors p-2">✕</button>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl mb-10 flex gap-6 items-center border border-slate-100">
                  <img src={artwork.imageUrl} className="w-24 h-24 object-cover rounded-xl shadow-sm" />
                  <div>
                    <h4 className="font-serif font-bold text-xl text-slate-900">{artwork.title}</h4>
                    <p className="text-sm text-slate-500 mb-2">{artwork.artistName}</p>
                    <p className="font-bold text-indigo-600 text-lg">${artwork.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Secure Payment Gateway</p>
                  <button 
                    onClick={() => handlePurchase('PayPal')}
                    className="w-full flex items-center justify-between p-6 border-2 border-slate-100 rounded-[1.5rem] hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">P</div>
                      <div className="text-left">
                        <span className="block font-bold text-slate-900 text-lg">PayPal</span>
                        <span className="text-xs text-slate-400">One-click secure checkout</span>
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1">→</span>
                  </button>
                  <button 
                    onClick={() => handlePurchase('Revolut')}
                    className="w-full flex items-center justify-between p-6 border-2 border-slate-100 rounded-[1.5rem] hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xl">R</div>
                      <div className="text-left">
                        <span className="block font-bold text-slate-900 text-lg">Revolut</span>
                        <span className="text-xs text-slate-400">Transfer directly with Revolut Pay</span>
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="p-24 text-center">
                <div className="w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-10 shadow-sm"></div>
                <h3 className="text-3xl font-serif font-bold mb-6">Securing Acquisition</h3>
                <p className="text-slate-500 font-light leading-relaxed">Processing your transaction via bank-grade encryption...</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-16 text-center bg-indigo-50/30">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-10 shadow-xl shadow-indigo-100">✓</div>
                <h3 className="text-4xl font-serif font-bold mb-6 text-slate-900">Success</h3>
                <p className="text-slate-600 mb-10 leading-relaxed italic text-lg">
                  "Art is the only way to run away without leaving home." <br/>
                  <span className="block mt-4 not-italic font-medium text-slate-500 text-sm">You are now the patron of <strong>{artwork.title}</strong>.</span>
                </p>
                <button 
                  onClick={() => {setShowCheckout(false); setPaymentStep('selection')}}
                  className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                >
                  Return to Collection
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkDetail;
