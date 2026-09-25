import React, { useState } from 'react';
import {
  Camera,
  Heart,
  Bell,
  Volume2,
  VolumeX,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Store,
  Shield,
  MapPin
} from 'lucide-react';
import type { User, CustomPage } from '../db/types.js';
import { isSoundMuted, setSoundMuted, playStudioJingle } from '../utils/soundEffects.js';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: User | null;
  onLogout: () => void;
  favoritesCount: number;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  customPages: CustomPage[];
  onOpenQuickSwitcher: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  favoritesCount,
  unreadNotificationsCount,
  onOpenNotifications,
  customPages,
  onOpenQuickSwitcher
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [muted, setMutedState] = useState(isSoundMuted());

  const toggleSound = () => {
    const next = !muted;
    setMutedState(next);
    setSoundMuted(next);
    if (!next) {
      playStudioJingle();
    }
  };

  const navItemClass = (page: string) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      currentPage === page
        ? 'bg-amber-600 text-white shadow-sm'
        : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#2c2a29]/95 backdrop-blur-md border-b border-stone-800 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div
            id="brand-logo-btn"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base sm:text-lg block leading-tight">
                Cainta Studios
              </span>
              <span className="text-[11px] text-amber-400 font-medium tracking-wider uppercase block">
                Studio MIS • Rizal
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-link-home"
              onClick={() => onNavigate('landing')}
              className={navItemClass('landing')}
            >
              Home
            </button>
            <button
              id="nav-link-directory"
              onClick={() => onNavigate('directory')}
              className={navItemClass('directory')}
            >
              Directory & Map
            </button>

            {/* Custom CMS Pages marked for Navbar */}
            {customPages
              .filter(p => p.isPublished && p.showInNavbar)
              .map(p => (
                <button
                  key={p.id}
                  id={`nav-link-custom-${p.slug}`}
                  onClick={() => onNavigate(`custom-${p.slug}`, { pageId: p.id })}
                  className={navItemClass(`custom-${p.slug}`)}
                >
                  {p.title}
                </button>
              ))}

            {/* Role specific shortcuts */}
            {currentUser?.role === 'CUSTOMER' && (
              <button
                id="nav-link-customer-dashboard"
                onClick={() => onNavigate('customer')}
                className={navItemClass('customer')}
              >
                My Bookings
              </button>
            )}

            {(currentUser?.role === 'STUDIO_ADMIN' || currentUser?.role === 'STUDIO_STAFF') && (
              <button
                id="nav-link-studio-dashboard"
                onClick={() => onNavigate('studio-dashboard')}
                className={`flex items-center gap-1.5 ${navItemClass('studio-dashboard')}`}
              >
                <Store className="w-4 h-4" />
                Studio Portal
              </button>
            )}

            {currentUser?.role === 'SUPER_ADMIN' && (
              <button
                id="nav-link-admin-dashboard"
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 ${navItemClass('admin')}`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Super Admin
              </button>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Audio sound toggle */}
            <button
              id="btn-sound-toggle"
              onClick={toggleSound}
              title={muted ? 'Unmute Audio & Jingle' : 'Mute Sound'}
              className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            >
              {muted ? <VolumeX className="w-5 h-5 text-stone-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
            </button>

            {/* Notification Bell */}
            <button
              id="btn-navbar-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-amber-600 text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Customer Favorites */}
            {currentUser?.role === 'CUSTOMER' && (
              <button
                id="btn-navbar-favorites"
                onClick={() => onNavigate('customer', { tab: 'favorites' })}
                className="relative p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                title="Saved Favorites"
              >
                <Heart className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-rose-600 text-white rounded-full flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}

            {/* Role Demo Quick Switcher Button */}
            <button
              id="btn-demo-quick-switcher"
              onClick={onOpenQuickSwitcher}
              className="hidden lg:inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-stone-800 border border-stone-700 text-amber-300 hover:bg-stone-700 transition-colors"
            >
              <span>Demo Role:</span>
              <span className="font-semibold text-white uppercase">{currentUser?.role || 'Guest'}</span>
            </button>

            {/* Auth / Account Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-700">
                <button
                  id="btn-user-profile"
                  onClick={() => {
                    if (currentUser.role === 'SUPER_ADMIN') onNavigate('admin');
                    else if (currentUser.role === 'STUDIO_ADMIN' || currentUser.role === 'STUDIO_STAFF')
                      onNavigate('studio-dashboard');
                    else onNavigate('customer');
                  }}
                  className="flex items-center gap-2 text-left hover:opacity-90"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300 font-semibold text-xs">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="hidden xl:block">
                    <div className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-stone-400 capitalize">
                      {currentUser.role.replace('_', ' ').toLowerCase()}
                    </div>
                  </div>
                </button>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-navbar-login"
                onClick={() => onNavigate('login')}
                className="ml-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#2c2a29] border-b border-stone-800 px-4 pt-2 pb-6 space-y-2 animate-fadeIn">
          <button
            onClick={() => {
              onNavigate('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-stone-200 hover:bg-stone-800"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('directory');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-stone-200 hover:bg-stone-800"
          >
            Studio Directory & Map
          </button>

          {currentUser?.role === 'CUSTOMER' && (
            <button
              onClick={() => {
                onNavigate('customer');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-stone-200 hover:bg-stone-800"
            >
              My Bookings & Prints
            </button>
          )}

          {(currentUser?.role === 'STUDIO_ADMIN' || currentUser?.role === 'STUDIO_STAFF') && (
            <button
              onClick={() => {
                onNavigate('studio-dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-amber-400 hover:bg-stone-800 font-medium"
            >
              Studio Management Portal
            </button>
          )}

          {currentUser?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-amber-400 hover:bg-stone-800 font-medium"
            >
              Super Admin Console
            </button>
          )}

          <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
            <button
              onClick={() => {
                onOpenQuickSwitcher();
                setMobileMenuOpen(false);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-amber-400"
            >
              Switch Demo Role
            </button>
            {currentUser ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-rose-400"
              >
                Sign Out ({currentUser.fullName.split(' ')[0]})
              </button>
            ) : (
              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
