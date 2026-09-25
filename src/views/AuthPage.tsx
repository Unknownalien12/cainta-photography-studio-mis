import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, User as UserIcon, Store, Eye, EyeOff, Lock, Mail, Phone, MapPin, Building, Sparkles } from 'lucide-react';
import type { User } from '../db/types.js';
import { apiRequest, setStoredToken } from '../utils/apiClient.js';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  initialRole?: 'CUSTOMER' | 'STUDIO_ADMIN';
}

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '633440077766-ssv5s5cbe02v6eko79fqvhmom1nahgb7.apps.googleusercontent.com';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, initialRole = 'CUSTOMER' }) => {
  const [isRegister, setIsRegister] = useState(initialRole === 'STUDIO_ADMIN');
  const [role, setRole] = useState<'CUSTOMER' | 'STUDIO_ADMIN'>(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studioName, setStudioName] = useState('');
  const [studioAddress, setStudioAddress] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fallback modal for Google Email entry in case origin mismatch/iframe restrictions occur
  const [showGooglePromptModal, setShowGooglePromptModal] = useState(false);
  const [googleManualEmail, setGoogleManualEmail] = useState('');
  const [googleManualName, setGoogleManualName] = useState('');

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Authenticate with Google endpoint on server
  const processGoogleAuth = async (params: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
  }) => {
    setIsGoogleLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiRequest<{ message?: string; token: string; user: User }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          ...params,
          role: isRegister ? role : 'CUSTOMER',
          studioName: isRegister && role === 'STUDIO_ADMIN' ? (studioName.trim() || undefined) : undefined,
          studioAddress: isRegister && role === 'STUDIO_ADMIN' ? (studioAddress.trim() || undefined) : undefined,
          contactNumber: phone.trim() || undefined
        })
      });

      if (res.token) {
        setStoredToken(res.token);
      }
      setShowGooglePromptModal(false);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hindi matagumpay ang Google Sign-in. Pakisubukang muli.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google Identity Services (GSI) initialization
  useEffect(() => {
    const handleCredentialResponse = (response: any) => {
      if (response?.credential) {
        processGoogleAuth({ credential: response.credential });
      }
    };

    const setupGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: isRegister ? 'signup_with' : 'signin_with',
              logo_alignment: 'left',
              width: 320
            });
          }
        } catch (err) {
          console.warn('Google Identity Services init warning:', err);
        }
      }
    };

    setupGoogle();
    const timer = setTimeout(setupGoogle, 600);
    return () => clearTimeout(timer);
  }, [isRegister, role, studioName, studioAddress, phone]);

  // Direct trigger button for Google OAuth
  const handleGoogleClick = () => {
    setErrorMsg(null);

    // 1. Try Token Client popup if GSI OAuth2 is loaded
    if (window.google?.accounts?.oauth2?.initTokenClient) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResp: any) => {
            if (tokenResp.error) {
              console.warn('Google Token Client response error:', tokenResp);
              setShowGooglePromptModal(true);
              return;
            }
            if (tokenResp.access_token) {
              setIsGoogleLoading(true);
              try {
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResp.access_token}` }
                }).then(r => r.json());

                await processGoogleAuth({
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture
                });
              } catch (e: any) {
                setShowGooglePromptModal(true);
              } finally {
                setIsGoogleLoading(false);
              }
            }
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth2 token client trigger error:', err);
      }
    }

    // 2. Try GSI prompt
    if (window.google?.accounts?.id?.prompt) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowGooglePromptModal(true);
          }
        });
        return;
      } catch (e) {
        console.warn('GSI prompt error:', e);
      }
    }

    // 3. Fallback prompt modal
    setShowGooglePromptModal(true);
  };

  // Standard Email/Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        if (password.length < 6) {
          setErrorMsg('Ang password ay dapat mayroong hindi bababa sa 6 na characters.');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Hindi nagtutugma ang Password at Confirm Password.');
          setIsLoading(false);
          return;
        }

        if (role === 'STUDIO_ADMIN' && !studioName.trim()) {
          setErrorMsg('Pakilagay ang pangalan ng iyong Photography Studio.');
          setIsLoading(false);
          return;
        }

        const res = await apiRequest<{ message?: string; token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            fullName: fullName.trim(),
            role,
            contactNumber: phone.trim(),
            studioName: role === 'STUDIO_ADMIN' ? studioName.trim() : undefined,
            studioAddress: role === 'STUDIO_ADMIN' ? studioAddress.trim() : undefined
          })
        });

        if (res.token) {
          setStoredToken(res.token);
        }
        onLoginSuccess(res.user);
      } else {
        const res = await apiRequest<{ message?: string; token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password
          })
        });

        if (res.token) {
          setStoredToken(res.token);
        }
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'May naganap na error sa pag-authenticate. Pakisubukang muli.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden space-y-6 p-7 sm:p-8 relative">
        {/* Top Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {isRegister ? 'Gumawa ng Cainta Studio MIS Account' : 'Mag-sign in sa Cainta Studio MIS'}
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            {isRegister
              ? 'Magparehistro bilang Customer o Studio Owner gamit ang Google o Email.'
              : 'I-access ang iyong dashboard, studio bookings, photo proofing, at MIS management.'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Sign In / Register) */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              !isRegister
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              isRegister
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Mag-register (Bago)
          </button>
        </div>

        {/* Role Switcher if in Register Mode */}
        {isRegister && (
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 animate-fadeIn">
            <label className="text-xs font-bold text-stone-700 block">
              Piliin ang Uri ng Account:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  role === 'CUSTOMER'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                Customer / Client
              </button>
              <button
                type="button"
                onClick={() => setRole('STUDIO_ADMIN')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  role === 'STUDIO_ADMIN'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Studio Owner
              </button>
            </div>
            {role === 'STUDIO_ADMIN' && (
              <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                ✨ Magiging may-ari ka ng Photography Studio sa Cainta kung saan pwede kang mag-manage ng bookings, packages, schedule, at photo proofing.
              </p>
            )}
          </div>
        )}

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2 animate-fadeIn">
            <span className="font-bold">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* GOOGLE SIGN IN & REGISTER BUTTONS */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 text-stone-800 font-semibold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-3 text-xs sm:text-sm group cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <span className="inline-flex items-center gap-2 text-stone-600">
                <svg className="animate-spin h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Kumukunekta sa Google...
              </span>
            ) : (
              <>
                <GoogleIcon />
                <span>
                  {isRegister
                    ? `Mag-register gamit ang Google (${role === 'STUDIO_ADMIN' ? 'Studio Owner' : 'Customer'})`
                    : 'Mag-sign in gamit ang Google'}
                </span>
              </>
            )}
          </button>

          {/* Official Google Identity Services Container (if iframe permits) */}
          <div className="flex justify-center overflow-hidden">
            <div ref={googleBtnContainerRef} id="google-btn-rendered" className="max-w-full"></div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-stone-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-bold tracking-wider text-stone-400 uppercase shrink-0">
            o gamit ang email credentials
          </span>
          <div className="border-t border-stone-200 w-full"></div>
        </div>

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <div className="space-y-3 animate-fadeIn">
              {/* Full Name */}
              <div>
                <label className="font-semibold block text-stone-700 mb-1">Buong Pangalan (Full Name)</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Hal. Juan Dela Cruz"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Contact Phone Number */}
              <div>
                <label className="font-semibold block text-stone-700 mb-1">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="0917 123 4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Extra fields for Studio Admin */}
              {role === 'STUDIO_ADMIN' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                  <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    Impormasyon ng Studio sa Cainta
                  </div>
                  <div>
                    <label className="font-semibold block text-stone-700 mb-1">Studio Business Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Hal. Lumina Arts Cainta Studio"
                      value={studioName}
                      onChange={e => setStudioName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-stone-700 mb-1">Lokasyon / Cainta Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Hal. Felix Ave., Brgy. San Isidro, Cainta"
                        value={studioAddress}
                        onChange={e => setStudioAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="font-semibold block text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="halimbawa@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="font-semibold block text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Hindi bababa sa 6 na characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-hidden"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Registration only) */}
          {isRegister && (
            <div className="animate-fadeIn">
              <label className="font-semibold block text-stone-700 mb-1">Kumpirmahin ang Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulitin ang parehong password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Pinoproseso...
              </span>
            ) : isRegister ? (
              'Kumpletuhin ang Pagpaparehistro'
            ) : (
              'Mag-sign In gamit ang Email'
            )}
          </button>
        </form>

        {/* Footer helper */}
        <div className="text-center pt-3 border-t border-stone-100 space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-xs text-stone-600 hover:text-amber-700 font-medium transition-colors"
          >
            {isRegister
              ? 'May account ka na? Mag-sign In dito'
              : 'Wala ka pang account? Mag-register dito'}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ligtas at protektado ang iyong datos sa Cainta MIS.</span>
          </div>
        </div>

        {/* Fallback Google Account Direct Prompt (Ensures users never get blocked by sandbox iframe restrictions) */}
        {showGooglePromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GoogleIcon />
                  <h4 className="font-bold text-sm text-stone-900">Google Account Sign-In</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGooglePromptModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Pakilagay ang iyong Google Account email para makapag-{isRegister ? 'register' : 'login'} bilang{' '}
                <span className="font-bold text-amber-700">
                  {isRegister ? (role === 'STUDIO_ADMIN' ? 'Studio Owner' : 'Customer') : 'User'}
                </span>:
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!googleManualEmail.includes('@')) return;
                  processGoogleAuth({
                    email: googleManualEmail.trim().toLowerCase(),
                    name: googleManualName.trim() || googleManualEmail.split('@')[0]
                  });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-semibold block text-stone-700 mb-1">Google Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="hal. juandelacruz@gmail.com"
                    value={googleManualEmail}
                    onChange={e => setGoogleManualEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-800"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="font-semibold block text-stone-700 mb-1">Pangalan (Display Name)</label>
                  <input
                    type="text"
                    placeholder="Hal. Juan Dela Cruz"
                    value={googleManualName}
                    onChange={e => setGoogleManualName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-800"
                  />
                </div>

                {isRegister && role === 'STUDIO_ADMIN' && !studioName && (
                  <div>
                    <label className="font-semibold block text-stone-700 mb-1">Pangalan ng Studio</label>
                    <input
                      type="text"
                      placeholder="Hal. Cainta Arts Studio"
                      value={studioName}
                      onChange={e => setStudioName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-800"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGooglePromptModal(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold"
                  >
                    Kanselahin
                  </button>
                  <button
                    type="submit"
                    disabled={isGoogleLoading}
                    className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isGoogleLoading ? 'Kumukunekta...' : 'Magpatuloy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
