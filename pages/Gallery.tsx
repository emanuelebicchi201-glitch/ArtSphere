
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Artwork, Category, ArtworkStatus } from '../types';
import { getStore } from '../store';

const Gallery: React.FC = () => {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const initialCategory = queryParams.get('category') || 'All';

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [searchTerm, setSearchTerm] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const { artworks: storeArtworks } = getStore();
    setArtworks(storeArtworks);
    
    // Extract unique tags
    const tags = new Set<string>();
    storeArtworks.forEach((art: Artwork) => {
      art.tags.forEach(t => tags.add(t));
    });
    setAllTags(Array.from(tags).sort());
  }, []);

  useEffect(() => {
    let filtered = artworks;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(art => art.category === selectedCategory);
    }

    if (selectedTag) {
      filtered = filtered.filter(art => art.tags.includes(selectedTag));
    }

    filtered = filtered.filter(art => art.price <= maxPrice);

    if (searchTerm) {
      filtered = filtered.filter(art => 
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        art.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredArtworks(filtered);
  }, [artworks, selectedCategory, selectedTag, maxPrice, searchTerm]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <header className="mb-16">
          <h1 className="text-5xl font-serif font-bold text-slate-900 mb-4 tracking-tight">Art Collection</h1>
          <p className="text-slate-500 text-lg max-w-2xl font-light">Explore a curated selection of original works from the world's most promising contemporary artists.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 space-y-12">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Search Repository</h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Artist, title or tag..."
                  className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Medium</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className={`block w-full text-left text-sm font-medium transition-colors ${selectedCategory === 'All' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  All Masterpieces
                </button>
                {Object.values(Category).map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`block w-full text-left text-sm font-medium transition-colors ${selectedCategory === cat ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Discover Tags</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${!selectedTag ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-400'}`}
                  >
                    All Tags
                  </button>
                  {allTags.slice(0, 15).map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedTag === tag ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-400'}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Value</h3>
                <span className="text-xs font-bold text-slate-900">Up to ${maxPrice.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="500"
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              />
              <div className="flex justify-between mt-3 text-[10px] text-slate-300 font-bold tracking-widest uppercase">
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-1">
            {filteredArtworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-16 gap-x-10">
                {filteredArtworks.map(art => (
                  <Link key={art.id} to={`/artwork/${art.id}`} className="group animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="relative aspect-[3/4] overflow-hidden mb-8 bg-slate-50 group-hover:shadow-2xl transition-all duration-700 rounded-2xl">
                      <img 
                        src={art.imageUrl} 
                        alt={art.title} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      {art.status === ArtworkStatus.SOLD ? (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                           <span className="px-6 py-2 bg-white text-slate-900 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-xl">Sold Out</span>
                        </div>
                      ) : (
                        <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          {art.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/90 backdrop-blur text-slate-900 text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-start px-2">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{art.title}</h3>
                        <p className="text-sm text-slate-400 italic font-medium mb-3">{art.artistName}</p>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{art.category}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-slate-900">${art.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-48 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem]">
                <span className="text-5xl mb-6 block opacity-20">🔍</span>
                <p className="text-slate-400 font-serif text-2xl italic mb-8">Your filter yields no results.</p>
                <button 
                  onClick={() => {setSelectedCategory('All'); setSelectedTag(null); setMaxPrice(10000); setSearchTerm('')}}
                  className="px-8 py-4 bg-white border border-slate-200 text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-all shadow-sm"
                >
                  Clear Collection Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
