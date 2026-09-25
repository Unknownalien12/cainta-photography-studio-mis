import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Star,
  Filter,
  SlidersHorizontal,
  Compass,
  Heart,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Clock,
  ExternalLink
} from 'lucide-react';
import type { Studio, Service, Package, PrintProduct, Review, User } from '../db/types.js';
import { CaintaStudioMap } from '../components/CaintaStudioMap.js';
import { Interactive3DTiltCard } from '../components/MotionCard.js';
import { apiRequest } from '../utils/apiClient.js';

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
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high'>('rating');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [viewMode, setViewMode] = useState<'split' | 'map_only' | 'grid_only'>('split');

  // Studio Detail Modal State
  const [activeDetailStudio, setActiveDetailStudio] = useState<Studio | null>(() => {
    if (initialSelectedStudioId) {
      return studios.find(s => s.id === initialSelectedStudioId) || null;
    }
    return null;
  });
  const [detailTab, setDetailTab] = useState<'services' | 'packages' | 'prints' | 'portfolio' | 'reviews'>('services');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [eligibility, setEligibility] = useState<{
    canReview: boolean;
    hasUnreviewedBookings: boolean;
    completedBookings: any[];
    unreviewedBookings: any[];
    existingReviews: Review[];
  }>({
    canReview: false,
    hasUnreviewedBookings: false,
    completedBookings: [],
    unreviewedBookings: [],
    existingReviews: []
  });
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string>('');

  React.useEffect(() => {
    if (activeDetailStudio) {
      fetchStudioReviews(activeDetailStudio.id);
      if (currentUser) {
        fetchEligibility(activeDetailStudio.id);
      }
    }
  }, [activeDetailStudio, currentUser]);

  const fetchEligibility = async (studioId: string) => {
    try {
      const res = await apiRequest<any>(`/api/reviews/eligibility?studioId=${studioId}`);
      if (res) {
        setEligibility(res);
        if (res.unreviewedBookings && res.unreviewedBookings.length > 0) {
          setSelectedBookingForReview(res.unreviewedBookings[0].id);
        } else if (res.completedBookings && res.completedBookings.length > 0) {
          setSelectedBookingForReview(res.completedBookings[0].id);
        }
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const fetchStudioReviews = async (studioId: string) => {
    setIsReviewsLoading(true);
    try {
      const res = await apiRequest<Review[]>(`/api/reviews?studioId=${studioId}`);
      setReviews(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in as a customer to submit a review.');
      return;
    }
    if (!newReviewComment.trim()) {
      alert('Please write a comment about your booking experience.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          studioId: activeDetailStudio!.id,
          bookingId: selectedBookingForReview || undefined,
          rating: newReviewRating,
          comment: newReviewComment.trim()
        })
      });
      setNewReviewComment('');
      setNewReviewRating(5);
      alert('Thank you! Your verified review has been submitted successfully.');
      fetchStudioReviews(activeDetailStudio!.id);
      fetchEligibility(activeDetailStudio!.id);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review. Only verified customers with completed bookings can review.');
    } finally {
      setIsSubmittingReview(false);
    }
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
        if (sortBy === 'price_low') return a.startingPrice - b.startingPrice;
        if (sortBy === 'price_high') return b.startingPrice - a.startingPrice;
        return 0;
      });
  }, [studios, searchQuery, selectedCategory, maxPrice, sortBy]);

  // Studio detail helper lists
  const studioServices = useMemo(() => {
    if (!activeDetailStudio) return [];
    return services.filter(s => s.studioId === activeDetailStudio.id);
  }, [activeDetailStudio, services]);

  const studioPackages = useMemo(() => {
    if (!activeDetailStudio) return [];
    return packages.filter(p => p.studioId === activeDetailStudio.id);
  }, [activeDetailStudio, packages]);

  const studioPrints = useMemo(() => {
    if (!activeDetailStudio) return [];
    return printProducts.filter(p => p.studioId === activeDetailStudio.id);
  }, [activeDetailStudio, printProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search studio by name, Cainta location (e.g. Felix Ave), or keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Controls: Sort and Layout View Mode */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="text-[11px] font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs p-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
              >
                <option value="rating">Highest Rating</option>
                <option value="price_low">Starting Price: Low to High</option>
                <option value="price_high">Starting Price: High to Low</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'split' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('grid_only')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'grid_only' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('map_only')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'map_only' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500'
                }`}
              >
                Map
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

          <div className="flex items-center gap-2 text-xs text-stone-600">
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
                        </div>
                      </div>

                      <div className="p-4 pt-0 mt-auto border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">From</span>
                          <span className="text-xs font-bold text-amber-700">₱{studio.startingPrice.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveDetailStudio(studio)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => onOpenBooking(studio)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
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
                onSelectStudio={studio => setActiveDetailStudio(studio)}
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
            onSelectStudio={studio => setActiveDetailStudio(studio)}
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
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
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
                    </div>
                  </div>

                  <div className="p-4 pt-0 mt-auto border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">From</span>
                      <span className="text-xs font-bold text-amber-700">₱{studio.startingPrice.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveDetailStudio(studio)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => onOpenBooking(studio)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
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

      {/* Studio Profile Detail Modal */}
      {activeDetailStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-scaleUp">
            {/* Top Banner */}
            <div className="relative h-48 bg-stone-900">
              <img
                src={activeDetailStudio.portfolioImages?.[0] || activeDetailStudio.coverImage || activeDetailStudio.logo}
                alt={activeDetailStudio.name}
                className="w-full h-full object-cover opacity-60"
              />
              <button
                onClick={() => setActiveDetailStudio(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeDetailStudio.logo}
                    alt={activeDetailStudio.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                  />
                  <div className="text-white">
                    <h3 className="text-xl font-bold">{activeDetailStudio.name}</h3>
                    <p className="text-xs text-stone-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> {activeDetailStudio.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const st = activeDetailStudio;
                      setActiveDetailStudio(null);
                      onOpenPrintOrder(st);
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800/90 text-white hover:bg-stone-700 text-xs font-bold border border-stone-600"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-400" /> Order Prints
                  </button>
                  <button
                    onClick={() => {
                      const st = activeDetailStudio;
                      setActiveDetailStudio(null);
                      onOpenBooking(st);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
                  >
                    Book Shoot Slot
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metadata Info */}
            <div className="bg-stone-50 px-6 py-3 border-b border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-stone-400" />
                <span>{activeDetailStudio.businessHours}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-stone-400" />
                <span>{activeDetailStudio.contactInfo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-stone-400" />
                <span>{activeDetailStudio.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{activeDetailStudio.rating} ({activeDetailStudio.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Detail Tabs */}
            <div className="px-6 border-b border-stone-200 flex items-center gap-4 text-xs font-semibold text-stone-600">
              <button
                onClick={() => setDetailTab('services')}
                className={`py-3 border-b-2 transition-all ${
                  detailTab === 'services' ? 'border-amber-600 text-amber-700' : 'border-transparent hover:text-stone-900'
                }`}
              >
                Services ({studioServices.length})
              </button>
              <button
                onClick={() => setDetailTab('packages')}
                className={`py-3 border-b-2 transition-all ${
                  detailTab === 'packages' ? 'border-amber-600 text-amber-700' : 'border-transparent hover:text-stone-900'
                }`}
              >
                Packages ({studioPackages.length})
              </button>
              <button
                onClick={() => setDetailTab('prints')}
                className={`py-3 border-b-2 transition-all ${
                  detailTab === 'prints' ? 'border-amber-600 text-amber-700' : 'border-transparent hover:text-stone-900'
                }`}
              >
                Print Keepsakes ({studioPrints.length})
              </button>
              <button
                onClick={() => setDetailTab('portfolio')}
                className={`py-3 border-b-2 transition-all ${
                  detailTab === 'portfolio' ? 'border-amber-600 text-amber-700' : 'border-transparent hover:text-stone-900'
                }`}
              >
                Portfolio Gallery
              </button>
              <button
                onClick={() => setDetailTab('reviews')}
                className={`py-3 border-b-2 transition-all ${
                  detailTab === 'reviews' ? 'border-amber-600 text-amber-700' : 'border-transparent hover:text-stone-900'
                }`}
              >
                Reviews & Ratings ({reviews.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4">
              {detailTab === 'services' && (
                <div className="space-y-3">
                  {studioServices.map(srv => (
                    <div
                      key={srv.id}
                      className="p-3.5 rounded-2xl border border-stone-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={srv.image} alt={srv.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          <div>
                            <h5 className="font-bold text-xs text-stone-900">{srv.name}</h5>
                            <p className="text-xs text-stone-500 line-clamp-1">{srv.description}</p>
                            <span className="text-[10px] text-amber-700 font-semibold">{srv.durationMinutes} mins • {srv.category}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-stone-900">₱{srv.basePrice.toLocaleString()}</div>
                          <button
                            onClick={() => {
                              const st = activeDetailStudio;
                              setActiveDetailStudio(null);
                              onOpenBooking(st);
                            }}
                            className="mt-1 text-[11px] px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shadow-xs"
                          >
                            Book Service
                          </button>
                        </div>
                      </div>
                      {/* Sample Gallery Photos */}
                      {srv.images && srv.images.length > 1 && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 overflow-x-auto">
                          <span className="text-[10px] text-stone-400 font-semibold whitespace-nowrap">Sample Shots:</span>
                          {srv.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="w-9 h-9 rounded-lg object-cover border border-stone-200" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'packages' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studioPackages.map(pkg => (
                    <div key={pkg.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2">
                      <div className="relative h-28 rounded-xl overflow-hidden mb-1">
                        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-xs text-stone-900">{pkg.name}</h5>
                        <span className="text-xs font-bold text-amber-700">₱{pkg.price.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-2">{pkg.description}</p>
                      {/* Package Gallery Photos */}
                      {pkg.images && pkg.images.length > 1 && (
                        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                          {pkg.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="w-8 h-8 rounded-lg object-cover border border-stone-200" />
                          ))}
                        </div>
                      )}
                      <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                        Includes: {pkg.includedPrints}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'prints' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studioPrints.map(p => (
                    <div key={p.id} className="p-3 rounded-2xl border border-stone-200 flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-stone-900 truncate">{p.name}</h5>
                        <span className="text-xs font-bold text-amber-700 block">₱{p.price.toLocaleString()}</span>
                        <span className="text-[10px] text-stone-400">Turnaround: ~{p.estimatedHours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'portfolio' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(activeDetailStudio.portfolioImages || [activeDetailStudio.coverImage, activeDetailStudio.logo]).map((img: string, i: number) => (
                    <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden shadow-xs">
                      <img src={img} alt="Portfolio sample" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews Summary */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-stone-900">Customer Ratings & Reviews</h5>
                      <p className="text-xs text-stone-500">Verified booking experiences across Cainta studios</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-amber-700 flex items-center gap-1 justify-end">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                        <span>{activeDetailStudio.rating}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 font-semibold">{reviews.length} verified reviews</span>
                    </div>
                  </div>

                  {/* Write Review Form or Eligibility Notice */}
                  {currentUser ? (
                    eligibility.canReview ? (
                      <form onSubmit={handleReviewSubmit} className="bg-white p-4.5 rounded-2xl border border-amber-200/80 space-y-3 shadow-xs">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div>
                            <span className="font-bold">Verified Customer</span> — You have {eligibility.completedBookings.length} completed photoshoot booking(s) with {activeDetailStudio.name}.
                          </div>
                        </div>

                        {eligibility.completedBookings.length > 1 && (
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              Select Completed Booking to Review:
                            </label>
                            <select
                              value={selectedBookingForReview}
                              onChange={e => setSelectedBookingForReview(e.target.value)}
                              className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                            >
                              {eligibility.completedBookings.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                  Shoot on {b.bookingDate} at {b.timeSlot} (Ref: {b.id})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <h6 className="font-bold text-xs text-stone-900">Leave Your Verified Feedback</h6>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-600 font-medium">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => setNewReviewRating(star)}
                                className="p-1 focus:outline-none hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    star <= newReviewRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-stone-700 ml-2">{newReviewRating}.0 / 5.0</span>
                        </div>

                        <textarea
                          rows={3}
                          placeholder="Share details about your photoshoot experience, lighting, photographer guidance, and turnaround time..."
                          value={newReviewComment}
                          onChange={e => setNewReviewComment(e.target.value)}
                          className="w-full p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                          >
                            {isSubmittingReview ? 'Submitting...' : 'Post Verified Review'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-stone-900">
                          <span>🔒 Verified Customer Reviews Only</span>
                        </div>
                        <p className="text-stone-600 text-[11px] leading-relaxed">
                          To ensure complete authenticity across Cainta photography listings, only clients with a verified completed photoshoot booking at <strong>{activeDetailStudio.name}</strong> can submit reviews.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                      <span>Please log in as a customer to leave a review and rating.</span>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {isReviewsLoading ? (
                      <p className="text-xs text-stone-500 text-center py-6">Loading verified reviews...</p>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8 text-stone-500 text-xs bg-stone-50 rounded-2xl border border-stone-200">
                        No reviews yet for this studio. Complete a booking to leave the first review!
                      </div>
                    ) : (
                      reviews.map(rev => (
                        <div key={rev.id} className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                                {rev.customerName.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h6 className="font-bold text-xs text-stone-900">{rev.customerName}</h6>
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified Customer
                                  </span>
                                </div>
                                <span className="text-[10px] text-stone-400">
                                  {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="text-xs font-bold text-amber-900">{rev.rating}.0</span>
                            </div>
                          </div>

                          <p className="text-xs text-stone-700 leading-relaxed pl-10">{rev.comment}</p>

                          {rev.reply && (
                            <div className="ml-10 mt-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                              <div className="font-bold text-stone-900 flex items-center gap-1">
                                <span>Studio Management Reply</span>
                                <span className="text-[10px] text-stone-400 font-normal">
                                  ({new Date(rev.replyAt || rev.createdAt).toLocaleDateString()})
                                </span>
                              </div>
                              <p className="text-stone-600">{rev.reply}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setActiveDetailStudio(null)}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
