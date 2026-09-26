import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Star,
  Compass,
  Heart,
  Calendar,
  Layers
} from 'lucide-react';
import type { Studio, Service, Package, PrintProduct, User } from '../db/types.js';
import { CaintaStudioMap } from '../components/CaintaStudioMap.js';
import { calculateHaversineDistance } from '../utils/leafletConfig.js';
import { StudioSocialLinks } from '../components/StudioSocialLinks.js';

interface DirectoryPageProps {
  studios: Studio[];
  services: Service[];
  packages: Package[];
  printProducts: PrintProduct[];
  onOpenBooking: (studio: Studio) => void;
  onOpenPrintOrder: (studio: Studio) => void;
  favorites: string[];
  onToggleFavorite: (studioId: string) => void;
  initialSelectedStudioId?: string;
  currentUser?: User | null;
  onNavigate: (page: string, params?: any) => void;
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({
  studios,
  services,
  packages,
  printProducts,
  onOpenBooking,
  onOpenPrintOrder,
  favorites,
  onToggleFavorite,
  initialSelectedStudioId,
  currentUser,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'availability' | 'price_low' | 'price_high'>('rating');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [viewMode, setViewMode] = useState<'split' | 'map_only' | 'grid_only'>('split');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleCalculateDistance = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      err => {
        console.error(err);
        alert('Unable to retrieve your location. Please check browser location permissions.');
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const categories = [
    'All',
    'Graduation',
    'Wedding & Debut',
    'Maternity & Newborn',
    'Portrait & Headshot',
    'Commercial',
    'Event Coverage'
  ];

  // Filter and Sort Studios
  const filteredStudios = useMemo(() => {
    return studios
      .filter(studio => {
        if (studio.status.toLowerCase() !== 'approved') return false;

        const studioCategories = studio.servicesOffered || studio.categories || [];

        const matchesSearch =
          studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          studio.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          studio.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          studio.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          studioCategories.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'All' ||
          studioCategories.some((s: string) => s.toLowerCase().includes(selectedCategory.toLowerCase()));

        const matchesPrice = studio.startingPrice <= maxPrice;

        return matchesSearch && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'availability') {
          const aOpen = a.businessHours ? 1 : 0;
          const bOpen = b.businessHours ? 1 : 0;
          if (aOpen !== bOpen) return bOpen - aOpen;
          return b.reviewCount - a.reviewCount;
        }
        if (sortBy === 'price_low') return a.startingPrice - b.startingPrice;
        if (sortBy === 'price_high') return b.startingPrice - a.startingPrice;
        return 0;
      });
  }, [studios, searchQuery, selectedCategory, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Search & Filter Header Box */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search studio by name, category, or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
            />
          </div>

          {/* Sort and View Mode switchers */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="rating">Top Rated (★)</option>
                <option value="availability">Operational & Active</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center p-1 bg-stone-100 rounded-2xl text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  viewMode === 'split' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('map_only')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  viewMode === 'map_only' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('grid_only')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  viewMode === 'grid_only' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips & Price Slider */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-600 flex-wrap">
            <button
              onClick={handleCalculateDistance}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-all shadow-xs cursor-pointer"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : userLocation ? 'Distance Active 📍' : 'Calculate Distance from Me'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold">Max Price:</span>
              <span className="font-bold text-amber-700">₱{maxPrice.toLocaleString()}</span>
              <input
                type="range"
                min="500"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={e => setMaxPrice(parseInt(e.target.value))}
                className="w-24 accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="space-y-6">
        {/* Split View */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Studio Cards List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
                <span>Showing {filteredStudios.length} verified Cainta studios</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredStudios.map(studio => {
                  const isFav = favorites.includes(studio.id);
                  return (
                    <div
                      key={studio.id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={studio.portfolioImages?.[0] || studio.coverImage || studio.logo}
                            alt={studio.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onToggleFavorite(studio.id);
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md text-stone-600 hover:text-rose-600 shadow-sm"
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
                          </button>
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {studio.rating}
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="font-bold text-stone-900 text-sm leading-snug truncate">
                            {studio.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                            <span>{studio.location}</span>
                          </p>
                          {userLocation && studio.latitude && studio.longitude && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                              📍 {calculateHaversineDistance(userLocation[0], userLocation[1], studio.latitude, studio.longitude)} km from you
                            </span>
                          )}
                          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                            {studio.description}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {(studio.servicesOffered || studio.categories || []).slice(0, 2).map((s: string) => (
                              <span
                                key={s}
                                className="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md"
                              >
                                {s}
                              </span>
                            ))}
                          </div>

                          {/* Clickable Social Media & Website Badges */}
                          <div className="pt-2 border-t border-stone-100">
                            <StudioSocialLinks studio={studio} variant="badges" size="xs" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 mt-auto border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">From</span>
                          <span className="text-xs font-bold text-amber-700">₱{studio.startingPrice.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            id={`btn-profile-${studio.id}`}
                            onClick={() => onNavigate('studio-profile', { studioId: studio.id })}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium cursor-pointer"
                          >
                            Profile
                          </button>
                          <button
                            id={`btn-book-${studio.id}`}
                            onClick={() => onOpenBooking(studio)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs cursor-pointer"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Sticky Interactive Map (5 cols) */}
            <div className="lg:col-span-5 sticky top-20">
              <CaintaStudioMap
                studios={filteredStudios}
                height="620px"
                onSelectStudio={studio => onNavigate('studio-profile', { studioId: studio.id })}
                onBookStudio={studio => onOpenBooking(studio)}
              />
            </div>
          </div>
        )}

        {/* Map Only View */}
        {viewMode === 'map_only' && (
          <CaintaStudioMap
            studios={filteredStudios}
            height="720px"
            onSelectStudio={studio => onNavigate('studio-profile', { studioId: studio.id })}
            onBookStudio={studio => onOpenBooking(studio)}
          />
        )}

        {/* Grid Only View */}
        {viewMode === 'grid_only' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredStudios.map(studio => {
              const isFav = favorites.includes(studio.id);
              return (
                <div
                  key={studio.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={studio.portfolioImages?.[0] || studio.coverImage || studio.logo}
                        alt={studio.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onToggleFavorite(studio.id);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md text-stone-600 hover:text-rose-600 shadow-sm"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
                      </button>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {studio.rating}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-stone-900 text-sm leading-snug truncate">{studio.name}</h4>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span>{studio.location}</span>
                      </p>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{studio.description}</p>
                      
                      {/* Clickable Social Media & Website Badges */}
                      <div className="pt-2 border-t border-stone-100">
                        <StudioSocialLinks studio={studio} variant="badges" size="xs" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 mt-auto border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">From</span>
                      <span className="text-xs font-bold text-amber-700">₱{studio.startingPrice.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        id={`btn-profile-grid-${studio.id}`}
                        onClick={() => onNavigate('studio-profile', { studioId: studio.id })}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        id={`btn-book-grid-${studio.id}`}
                        onClick={() => onOpenBooking(studio)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs cursor-pointer"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
