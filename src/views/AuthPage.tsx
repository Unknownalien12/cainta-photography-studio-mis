import React, { useState } from 'react';
import { Camera, ShieldCheck, User as UserIcon, Store, ArrowRight, Sparkles } from 'lucide-react';
import type { User } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  initialRole?: 'CUSTOMER' | 'STUDIO_ADMIN';
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, initialRole = 'CUSTOMER' }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'CUSTOMER' | 'STUDIO_ADMIN'>(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studioName, setStudioName] = useState('');
  const [studioAddress, setStudioAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoLogin = async (demoRole: 'CUSTOMER' | 'STUDIO_ADMIN' | 'SUPER_ADMIN') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ message: string; user: User }>('/api/auth/demo-switch', {
        method: 'POST',
        body: JSON.stringify({ role: demoRole })
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        const res = await apiRequest<{ message: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            fullName,
            role,
            contactNumber: phone,
            studioName: role === 'STUDIO_ADMIN' ? studioName : undefined,
            studioAddress: role === 'STUDIO_ADMIN' ? studioAddress : undefined
          })
        });
        onLoginSuccess(res.user);
      } else {
        const res = await apiRequest<{ message: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden space-y-6 p-8">
        {/* Top Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            {isRegister ? 'Create Cainta Studio MIS Account' : 'Sign in to Cainta Studio MIS'}
          </h2>
          <p className="text-xs text-stone-500">
            Access client booking dashboards, photo proofing, and studio operations.
          </p>
        </div>

        {/* 1-Click Demo Logins & Google Sign In */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              setErrorMsg(null);
              try {
                const res = await apiRequest<{ token: string; user: User }>('/api/auth/google', {
                  method: 'POST',
                  body: JSON.stringify({
                    email: 'danielpadilla140600@gmail.com',
                    name: 'Daniel Padilla'
                  })
                });
                onLoginSuccess(res.user);
              } catch (err: any) {
                setErrorMsg(err.message || 'Google authentication failed');
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full py-2.5 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2.5 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google OAuth
          </button>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider text-center">
              ⚡ Quick 1-Click Demo Profiles
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('CUSTOMER')}
                className="px-2 py-1.5 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-[11px] font-bold text-stone-700 shadow-2xs text-center transition-all hover:scale-102"
              >
                Client (Maria)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('STUDIO_ADMIN')}
                className="px-2 py-1.5 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-[11px] font-bold text-stone-700 shadow-2xs text-center transition-all hover:scale-102"
              >
                Lumina Studio
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('SUPER_ADMIN')}
                className="px-2 py-1.5 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-[11px] font-bold text-stone-700 shadow-2xs text-center transition-all hover:scale-102"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`py-1.5 font-bold rounded-lg ${
                    role === 'CUSTOMER' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Client / Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('STUDIO_ADMIN')}
                  className={`py-1.5 font-bold rounded-lg ${
                    role === 'STUDIO_ADMIN' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Studio Owner
                </button>
              </div>

              <div>
                <label className="font-semibold block text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {role === 'STUDIO_ADMIN' && (
                <>
                  <div>
                    <label className="font-semibold block text-stone-700 mb-1">Studio Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cainta Flash Works"
                      value={studioName}
                      onChange={e => setStudioName(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-stone-700 mb-1">Cainta Physical Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Felix Avenue, Cainta, Rizal"
                      value={studioAddress}
                      onChange={e => setStudioAddress(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="font-semibold block text-stone-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="font-semibold block text-stone-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
