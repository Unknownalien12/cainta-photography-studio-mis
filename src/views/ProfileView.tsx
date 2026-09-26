import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Shield, Store, Check, ArrowLeft, Camera, Lock } from 'lucide-react';
import type { User } from '../db/types.js';
import { apiRequest, setStoredUser } from '../utils/apiClient.js';
import { toast } from '../utils/toast.js';
import { MagnetButton } from '../components/MotionCard.js';

interface ProfileViewProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: any) => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onNavigate, onUpdateUser }) => {
  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Kinakailangan ang Pag-sign In</h2>
        <p className="text-stone-600 mb-6 text-sm">Mangyaring mag-sign in upang matingnan at ma-edit ang iyong profile.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md"
        >
          Mag-sign In Ngayon
        </button>
      </div>
    );
  }

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [contactNumber, setContactNumber] = useState(currentUser.contactNumber || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/account', {
        method: 'PUT',
        body: JSON.stringify({ fullName, contactNumber, address })
      });
      if (res && res.user) {
        onUpdateUser(res.user);
        setStoredUser(res.user);
        toast.success('Matagumpay na nai-save ang mga pagbabago sa iyong profile!', { title: 'Profile Updated' });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Hindi na-save ang profile.', { title: 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">Super Administrator</span>;
      case 'STUDIO_ADMIN':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Studio Administrator</span>;
      case 'STUDIO_STAFF':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Studio Staff</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Customer / Client</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-6">
        <div>
          <button
            onClick={() => {
              if (currentUser.role === 'SUPER_ADMIN') onNavigate('admin');
              else if (currentUser.role === 'STUDIO_ADMIN' || currentUser.role === 'STUDIO_STAFF') onNavigate('studio-dashboard');
              else onNavigate('customer');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Bumalik sa Dashboard
          </button>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">User Account Profile</h1>
          <p className="text-sm text-stone-500 mt-1">Pamahalaan ang iyong personal na impormasyon, contact, at security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Summary Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-amber-600/10 border-2 border-amber-500 text-amber-700 font-black text-3xl mx-auto flex items-center justify-center shadow-inner">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-stone-900">{currentUser.fullName}</h3>
            <p className="text-xs text-stone-500">{currentUser.email}</p>
          </div>
          <div className="pt-2 flex justify-center">
            {getRoleBadge(currentUser.role)}
          </div>

          <div className="pt-6 border-t border-stone-100 text-left space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span className="text-stone-400">Account ID:</span>
              <span className="font-mono text-stone-700 truncate max-w-[140px]">{currentUser.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Member Since:</span>
              <span className="font-medium text-stone-700">{new Date(currentUser.createdAt).toLocaleDateString()}</span>
            </div>
            {currentUser.studioId && (
              <div className="flex justify-between">
                <span className="text-stone-400">Studio ID:</span>
                <span className="font-mono text-amber-600 font-semibold">{currentUser.studioId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
            <UserIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-base">I-edit ang Impormasyon ng Profile</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Buong Pangalan (Full Name)</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-stone-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Email Address (Hindi naibabago)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Numero ng Telepono</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="+63 917 000 0000"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 text-sm bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Address / Lokasyon</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Cainta, Rizal"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 text-sm bg-stone-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                id="btn-save-profile"
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Nai-save...' : 'I-save ang mga Pagbabago'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
