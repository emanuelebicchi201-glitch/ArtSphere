
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole, Artwork } from './types';
import { getStore, setCurrentUser as setStoreCurrentUser } from './store';

// Pages
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import ArtworkDetail from './pages/ArtworkDetail';
import ArtistProfile from './pages/ArtistProfile';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth';

const Navbar: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="text-2xl font-serif font-bold tracking-tight text-slate-900">
            ArtSphere<span className="text-indigo-600">.</span>
          </Link>
          
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/gallery" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Explore Gallery</Link>
            {user?.role === UserRole.ADMIN && (
              <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Admin Panel</Link>
            )}
            {user ? (
              <div className="flex items-center space-x-6">
                <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
                <button 
                  onClick={onLogout}
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-all shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                  Login
                </Link>
                <Link 
                  to="/auth" 
                  state={{ mode: 'signup' }}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-xl font-serif font-bold mb-4">ArtSphere</h2>
          <p className="text-slate-500 max-w-sm">
            Empowering artists worldwide to share their vision and connect with collectors who value authentic craftsmanship.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">Marketplace</h3>
          <ul className="space-y-2">
            <li><Link to="/gallery" className="text-slate-500 hover:text-indigo-600 text-sm">Paintings</Link></li>
            <li><Link to="/gallery" className="text-slate-500 hover:text-indigo-600 text-sm">Sculptures</Link></li>
            <li><Link to="/gallery" className="text-slate-500 hover:text-indigo-600 text-sm">Indoor Art</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">Support</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm">Artist Help</a></li>
            <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm">Buying Guide</a></li>
            <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-8 flex justify-between items-center text-xs text-slate-400">
        <p>&copy; 2024 ArtSphere. All rights reserved.</p>
        <div className="flex space-x-6">
          <a href="#">Instagram</a>
          <a href="#">Twitter</a>
          <a href="#">Pinterest</a>
        </div>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { currentUser } = getStore();
    setUser(currentUser);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setStoreCurrentUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setStoreCurrentUser(null);
    window.location.hash = '/';
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/artwork/:id" element={<ArtworkDetail currentUser={user} />} />
            <Route path="/artist/:id" element={<ArtistProfile />} />
            <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
            <Route path="/dashboard" element={<Dashboard currentUser={user} />} />
            <Route path="/admin" element={<AdminPanel currentUser={user} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
