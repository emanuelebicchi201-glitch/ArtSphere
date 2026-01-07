
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Artwork } from '../types';
import { getStore } from '../store';

const ArtistProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    const { users, artworks } = getStore();
    const foundArtist = users.find((u: User) => u.id === id);
    if (foundArtist) {
      setArtist(foundArtist);
      setArtworks(artworks.filter((a: Artwork) => a.artistId === id));
    }
  }, [id]);

  if (!artist) return <div className="py-40 text-center font-serif text-2xl italic animate-pulse">Artist not found in archives...</div>;

  return (
    <div className="bg-white min-h-screen">
      <header className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/5 -skew-x-12 transform translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative z-10">
          <div className="w-48 h-48 rounded-full border-[12px] border-white shadow-2xl overflow-hidden mb-10 transition-transform hover:scale-105 duration-700">
            <img src={artist.avatar || `https://picsum.photos/seed/${artist.id}/400`} alt={artist.name} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-6xl font-serif font-bold text-slate-900 mb-6 tracking-tight">{artist.name}</h1>
          <p className="max-w-2xl text-xl text-slate-500 font-light italic leading-relaxed px-4">
            "{artist.bio || 'A dedicated visual explorer translating human experience into form and color.'}"
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
             <div className="px-8 py-3 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-xl shadow-indigo-100 uppercase tracking-widest">
               {artworks.length} Published Masterpieces
             </div>
             <div className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-full text-xs font-bold shadow-sm uppercase tracking-widest">
               Studio Joined {new Date(artist.joinedAt).getFullYear()}
             </div>
          </div>
        </div>
      </header>

      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-20">
            <h2 className="text-4xl font-serif font-bold text-slate-900">Portfolio of Works</h2>
            <div className="h-px flex-1 bg-slate-100 mx-10 hidden md:block" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {artworks.map(art => (
              <Link key={art.id} to={`/artwork/${art.id}`} className="group animate-in fade-in duration-1000">
                <div className="relative aspect-square overflow-hidden rounded-[2rem] mb-8 bg-slate-50 shadow-sm transition-all duration-700 group-hover:shadow-2xl">
                  <img src={art.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={art.title} />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8 text-center">
                    <span className="px-8 py-3 bg-white text-slate-900 text-xs font-bold rounded-full transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 shadow-xl uppercase tracking-widest">Inquire Piece</span>
                    <div className="mt-6 flex flex-wrap justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity delay-200">
                      {art.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] text-white font-bold uppercase tracking-wider border border-white/30 px-2 py-1 rounded-full">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-serif font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{art.title}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{art.category}</p>
                    <p className="text-xl font-bold text-indigo-600">${art.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {artworks.length === 0 && (
            <div className="text-center py-40 bg-slate-50 rounded-[3rem] border border-slate-100">
              <p className="text-2xl font-serif text-slate-300 italic">No published creations discovered in this portfolio yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ArtistProfile;
