
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Artwork, Category } from '../types';
import { getStore } from '../store';

const Hero: React.FC = () => (
  <section className="relative h-[85vh] flex items-center overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img 
        src="https://picsum.photos/seed/gallery_hero/1920/1080" 
        alt="Gallery background" 
        className="w-full h-full object-cover brightness-[0.4]"
      />
    </div>
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-3xl">
        <h1 className="text-6xl md:text-8xl font-serif font-bold leading-tight mb-8">
          The Future of <br />
          <span className="text-indigo-400 italic">Fine Art</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 font-light mb-10 max-w-xl leading-relaxed">
          Discover unique pieces from emerging and established contemporary artists globally.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link 
            to="/gallery" 
            className="px-10 py-5 bg-white text-slate-900 font-semibold rounded-full hover:bg-indigo-50 transition-all shadow-xl"
          >
            Explore Collection
          </Link>
          <Link 
            to="/auth" 
            className="px-10 py-5 bg-transparent border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 backdrop-blur-sm transition-all"
          >
            Sell Your Art
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const FeaturedArtworks: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    const { artworks } = getStore();
    setArtworks(artworks.slice(0, 4));
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Curated Highlights</h2>
            <p className="text-slate-500 text-lg">A selection of this week's most compelling acquisitions.</p>
          </div>
          <Link to="/gallery" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center group">
            View All Artworks <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {artworks.map((art) => (
            <Link key={art.id} to={`/artwork/${art.id}`} className="group">
              <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500">
                <img 
                  src={art.imageUrl} 
                  alt={art.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{art.title}</h3>
              <p className="text-sm text-slate-500 mb-2 italic">{art.artistName}</p>
              <p className="text-lg font-medium text-slate-900">${art.price.toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const CategoryCards: React.FC = () => (
  <section className="py-24 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-4xl font-serif font-bold text-center mb-16">Browse by Medium</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(Category).map((cat) => (
          <Link 
            key={cat}
            to={`/gallery?category=${cat}`}
            className="group relative h-80 overflow-hidden rounded-2xl"
          >
            <img 
              src={`https://picsum.photos/seed/${cat}/600/800`} 
              alt={cat} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8">
              <h3 className="text-2xl font-serif font-bold text-white mb-2">{cat}</h3>
              <span className="text-white/70 text-sm font-medium">Explore Collection →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const Home: React.FC = () => {
  return (
    <div>
      <Hero />
      <FeaturedArtworks />
      <CategoryCards />
    </div>
  );
};

export default Home;
