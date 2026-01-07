
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Artwork, UserRole, Order } from '../types';
import { getStore, saveArtworks, saveUsers, saveOrders } from '../store';

const AdminPanel: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'users' | 'artworks' | 'orders'>('users');

  useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }
    const store = getStore();
    setUsers(store.users);
    setArtworks(store.artworks);
    setOrders(store.orders);
  }, [currentUser, navigate]);

  const removeArtwork = (id: string) => {
    if (confirm("Confirm removal of inappropriate content?")) {
      const updated = artworks.filter(a => a.id !== id);
      saveArtworks(updated);
      setArtworks(updated);
    }
  };

  const removeUser = (id: string) => {
    if (confirm("Confirm user account suspension?")) {
      const updated = users.filter(u => u.id !== id);
      saveUsers(updated);
      setUsers(updated);
    }
  };

  const cancelOrder = (id: string) => {
    if (confirm("Force cancel this order?")) {
       const updated = orders.map(o => o.id === id ? { ...o, status: 'Canceled' as const } : o);
       saveOrders(updated);
       setOrders(updated);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4">Master Admin Panel</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setView('users')}
              className={`px-6 py-2 rounded-full font-bold text-sm ${view === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}
            >
              Manage Users
            </button>
            <button 
              onClick={() => setView('artworks')}
              className={`px-6 py-2 rounded-full font-bold text-sm ${view === 'artworks' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}
            >
              Manage Content
            </button>
            <button 
              onClick={() => setView('orders')}
              className={`px-6 py-2 rounded-full font-bold text-sm ${view === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}
            >
              Monitor Orders
            </button>
          </div>
        </header>

        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
          {view === 'users' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Name</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Email</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="px-8 py-6 font-medium text-slate-900">{u.name}</td>
                    <td className="px-8 py-6 text-slate-500">{u.email}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.role === UserRole.ARTIST ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button onClick={() => removeUser(u.id)} className="text-red-500 font-bold hover:underline">Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view === 'artworks' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Preview</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Title</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Artist</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Price</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {artworks.map(a => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="px-8 py-6">
                      <img src={a.imageUrl} className="w-12 h-12 rounded object-cover" />
                    </td>
                    <td className="px-8 py-6 font-medium text-slate-900">{a.title}</td>
                    <td className="px-8 py-6 text-slate-500">{a.artistName}</td>
                    <td className="px-8 py-6 font-bold text-slate-900">${a.price}</td>
                    <td className="px-8 py-6">
                      <button onClick={() => removeArtwork(a.id)} className="text-red-500 font-bold hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view === 'orders' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Artwork</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Buyer</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Method</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-slate-50">
                    <td className="px-8 py-6 font-bold text-slate-900">{o.artworkTitle}</td>
                    <td className="px-8 py-6 text-sm text-slate-500">{o.buyerName}<br/>{o.buyerEmail}</td>
                    <td className="px-8 py-6 text-xs font-medium text-slate-600">{o.paymentMethod}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       {o.status !== 'Canceled' && (
                         <button onClick={() => cancelOrder(o.id)} className="text-red-400 font-bold hover:text-red-600">Force Cancel</button>
                       )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">No orders registered on the platform.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
