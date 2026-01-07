
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole, PaymentAccount } from '../types';
import { getStore, saveUsers } from '../store';

const Auth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Identity, 2: Payment (Artist only), 3: Confirmation
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    paymentType: 'PayPal' as 'PayPal' | 'Revolut',
    paymentIdentifier: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (location.state?.mode === 'signup') {
      setIsLogin(false);
      setStep(1);
    }
  }, [location.state]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { users } = getStore();
    const user = users.find((u: User) => u.email === formData.email);
    if (user) {
      onLogin(user);
      navigate(user.role === UserRole.ARTIST ? '/dashboard' : '/gallery');
    } else {
      alert("Credentials not found. Use 'elena@art.com' for demo.");
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const { users } = getStore();
    
    if (step === 1) {
      if (users.find((u: User) => u.email === formData.email)) {
        alert("This email is already registered.");
        return;
      }
      if (role === UserRole.ARTIST) {
        setStep(2);
      } else {
        completeSignup();
      }
    } else if (step === 2) {
      if (!formData.paymentIdentifier) {
        alert("Payment account is mandatory for Artists.");
        return;
      }
      completeSignup();
    }
  };

  const completeSignup = async () => {
    setIsProcessing(true);
    // Simulation delay
    await new Promise(r => setTimeout(r, 1000));

    const { users } = getStore();
    const newUser: User = {
      id: 'u' + Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      role: role,
      joinedAt: new Date().toISOString(),
      ...(role === UserRole.ARTIST ? {
        paymentAccount: {
          type: formData.paymentType,
          identifier: formData.paymentIdentifier,
          connectedAt: new Date().toISOString()
        }
      } : {})
    };

    saveUsers([...users, newUser]);
    onLogin(newUser);
    setStep(3);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-slate-50 p-4 md:p-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100">
        
        {/* Visual Sidebar */}
        <div className="hidden lg:block relative">
          <img 
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800" 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Art Gallery" 
          />
          <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex flex-col justify-end p-20 text-white">
            <span className="text-indigo-300 font-bold uppercase tracking-[0.3em] text-xs mb-4">Elite Marketplace</span>
            <h2 className="text-6xl font-serif font-bold mb-8 leading-[1.1]">Where Vision Meets Value.</h2>
            <p className="text-xl font-light text-white/70 leading-relaxed max-w-md">
              Join thousands of collectors and artists in the world's most sophisticated digital art ecosystem.
            </p>
          </div>
        </div>

        {/* Auth Content */}
        <div className="p-10 md:p-20 relative overflow-hidden">
          {isLogin ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-12">
                <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Welcome Back</h1>
                <p className="text-slate-500">Reconnect with the global art community.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Email Repository</label>
                  <input 
                    type="email" required
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="name@gallery.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Security Key</label>
                  <input 
                    type="password" required
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 text-lg mt-4">
                  Sign In to Gallery
                </button>
              </form>
              <div className="mt-12 text-center border-t border-slate-50 pt-12">
                <button onClick={() => {setIsLogin(false); setStep(1);}} className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                  First time visiting? <span className="text-indigo-600 font-bold">Create an account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Step Indicator */}
              <div className="flex gap-4 mb-12">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${s <= step ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                ))}
              </div>

              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="mb-10">
                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Step 01 / 03</span>
                    <h1 className="text-4xl font-serif font-bold text-slate-900 mt-2 mb-4">Identity Setup</h1>
                    <p className="text-slate-500">Define your presence in the marketplace.</p>
                  </div>
                  <form onSubmit={handleNextStep} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">I am visiting as an...</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          type="button"
                          onClick={() => setRole(UserRole.BUYER)}
                          className={`py-5 rounded-2xl font-bold transition-all border-2 ${role === UserRole.BUYER ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                        >
                          Patron / Buyer
                        </button>
                        <button 
                          type="button"
                          onClick={() => setRole(UserRole.ARTIST)}
                          className={`py-5 rounded-2xl font-bold transition-all border-2 ${role === UserRole.ARTIST ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                        >
                          Creator / Artist
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Legal Name / Pseudonym</label>
                      <input 
                        type="text" required
                        className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Email Address</label>
                      <input 
                        type="email" required
                        className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all text-lg shadow-xl shadow-slate-200">
                      Continue Registration →
                    </button>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="mb-10">
                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Step 02 / 03</span>
                    <h1 className="text-4xl font-serif font-bold text-slate-900 mt-2 mb-4">Link Payment Account</h1>
                    <p className="text-slate-500">Mandatory for artists to receive global acquisition payments.</p>
                  </div>
                  <form onSubmit={handleNextStep} className="space-y-8">
                    <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100 mb-6">
                      <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                        To maintain a secure and professional environment, all artists must connect a verified payout method before publishing works.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, paymentType: 'PayPal'})}
                        className={`w-full flex items-center justify-between p-6 border-2 rounded-2xl transition-all ${formData.paymentType === 'PayPal' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#003087] rounded-full flex items-center justify-center text-white font-bold">P</div>
                          <span className="font-bold text-slate-900">PayPal Express</span>
                        </div>
                        {formData.paymentType === 'PayPal' && <span className="text-indigo-600 text-lg">✓</span>}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, paymentType: 'Revolut'})}
                        className={`w-full flex items-center justify-between p-6 border-2 rounded-2xl transition-all ${formData.paymentType === 'Revolut' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">R</div>
                          <span className="font-bold text-slate-900">Revolut Pay</span>
                        </div>
                        {formData.paymentType === 'Revolut' && <span className="text-indigo-600 text-lg">✓</span>}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                        {formData.paymentType} Account ID (Email or Tag)
                      </label>
                      <input 
                        type="text" required
                        className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                        placeholder={formData.paymentType === 'PayPal' ? 'email@example.com' : '@revolut_tag'}
                        value={formData.paymentIdentifier}
                        onChange={e => setFormData({ ...formData, paymentIdentifier: e.target.value })}
                      />
                    </div>

                    <button type="submit" disabled={isProcessing} className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all text-lg disabled:opacity-50">
                      {isProcessing ? 'Verifying Gateway...' : 'Secure & Connect Account'}
                    </button>
                  </form>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-10 shadow-xl shadow-green-100">
                    ✓
                  </div>
                  <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">Account Finalized</h1>
                  <p className="text-slate-500 mb-10 leading-relaxed max-w-sm mx-auto">
                    Welcome to ArtSphere. Your {role === UserRole.ARTIST ? 'Creator' : 'Patron'} profile is ready. You can now explore or publish your vision.
                  </p>
                  <button 
                    onClick={() => navigate(role === UserRole.ARTIST ? '/dashboard' : '/gallery')}
                    className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    Enter the Marketplace
                  </button>
                </div>
              )}

              {step < 3 && (
                <div className="mt-12 text-center border-t border-slate-50 pt-12">
                  <button onClick={() => setIsLogin(true)} className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                    Already a member? <span className="text-indigo-600 font-bold">Sign in</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
