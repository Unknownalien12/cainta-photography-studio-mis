import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Heart,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  ArrowLeft,
  Globe,
  Share2,
  Camera,
  Layers,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Send,
  Navigation
} from 'lucide-react';
import type { Studio, Service, Package, PrintProduct, Review, User } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { toast } from '../utils/toast.js';
import { StudioSocialLinks, formatUrl } from '../components/StudioSocialLinks.js';
import { CaintaStudioMap } from '../components/CaintaStudioMap.js';
import { calculateHaversineDistance } from '../utils/leafletConfig.js';
import { MagnetButton, ScrollReveal } from '../components/MotionCard.js';

interface StudioProfileViewProps {
  studioId: string;
  studios: Studio[];
  services: Service[];
  packages: Package[];
  printProducts: PrintProduct[];
  currentUser: User | null;
  onNavigate: (page: string, params?: any) => void;
  onOpenBooking: (studio: Studio, preselectedServiceId?: string, preselectedPackageId?: string) => void;
  onOpenPrintOrder: (studio: Studio, preselectedProductId?: string) => void;
  favorites: string[];
  onToggleFavorite: (studioId: string) => void;
}

export const StudioProfileView: React.FC<StudioProfileViewProps> = ({
  studioId,
  studios,
  services,
  packages,
  printProducts,
  currentUser,
  onNavigate,
  onOpenBooking,
  onOpenPrintOrder,
  favorites,
  onToggleFavorite
}) => {
  const studio = studios.find(s => s.id === studioId) || studios[0];

  const [activeTab, setActiveTab] = useState<'services' | 'packages' | 'prints' | 'portfolio' | 'reviews' | 'location'>('services');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Review eligibility
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (studio) {
      fetchStudioReviews(studio.id);
      if (currentUser) {
        fetchEligibility(studio.id);
      }
    }
  }, [studio?.id, currentUser]);

  const fetchEligibility = async (targetStudioId: string) => {
    try {
      const res = await apiRequest<any>(`/api/reviews/eligibility?studioId=${targetStudioId}`);
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

  const fetchStudioReviews = async (targetStudioId: string) => {
    setIsReviewsLoading(true);
    try {
      const res = await apiRequest<Review[]>(`/api/reviews?studioId=${targetStudioId}`);
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
      toast.error('Mangyaring mag-sign in bilang customer upang makapag-iwan ng review.', { title: 'Sign In Required' });
      return;
    }
    if (!newReviewComment.trim()) {
      toast.error('Pakilagay ang iyong komento tungkol sa iyong karanasan.', { title: 'Missing Comment' });
      return;
    }
    setIsSubmittingReview(true);
    try {
      await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          studioId: studio.id,
          bookingId: selectedBookingForReview || undefined,
          rating: newReviewRating,
          comment: newReviewComment.trim()
        })
      });
      toast.success('Salamat sa iyong review! Naipasa na ito para sa pag-apruba.', { title: 'Review Submitted' });
      setNewReviewComment('');
      fetchStudioReviews(studio.id);
      fetchEligibility(studio.id);
    } catch (err: any) {
      toast.error(err.message || 'Hindi maipasa ang review.', { title: 'Review Error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Hindi suportado ang geolocation sa browser na ito.', { title: 'Location Error' });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
        toast.success('Nakuha ang iyong lokasyon para sa pagkwenta ng distansya.', { title: 'Location Active' });
      },
      err => {
        console.error(err);
        setIsLocating(false);
        toast.error('Hindi makuha ang lokasyon. Tiyaking pinapayagan ang location permission.', { title: 'Location Error' });
      },
      { timeout: 10000 }
    );
  };

  if (!studio) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Hindi Matagpuan ang Studio</h2>
        <p className="text-stone-600 mb-6 text-sm">Ang hinahanap mong photography studio ay wala o hindi rehistrado.</p>
        <button
          onClick={() => onNavigate('directory')}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md"
        >
          Bumalik sa Directory
        </button>
      </div>
    );
  }

  const studioServices = services.filter(s => s.studioId === studio.id && s.isActive);
  const studioPackages = packages.filter(p => p.studioId === studio.id && p.isActive);
  const studioPrints = printProducts.filter(p => p.studioId === studio.id && p.isActive);
  const isFav = favorites.includes(studio.id);

  const allPhotos = [
    ...(studio.portfolioImages || []),
    studio.coverImage,
    ...studioServices.map(s => s.image).filter(Boolean),
    ...studioPackages.map(p => p.image).filter(Boolean)
  ].filter((img, idx, arr) => img && arr.indexOf(img) === idx);

  const distanceKm = userLocation && studio.latitude && studio.longitude
    ? calculateHaversineDistance(userLocation[0], userLocation[1], studio.latitude, studio.longitude)
    : null;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 animate-fadeIn">
      {/* Top Navigation Breadcrumbs Bar */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            id="btn-back-directory"
            onClick={() => onNavigate('directory')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Bumalik sa Cainta Studio Directory</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${studio.name} - Cainta Photography Studio MIS`,
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Na-kopya ang link ng profile sa clipboard!', { title: 'Link Copied' });
                }
              }}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Share Studio Profile"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Profile</span>
            </button>

            <button
              onClick={() => onToggleFavorite(studio.id)}
              className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                isFav
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-600'
              }`}
              title="Save to Favorites"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span className="hidden sm:inline">{isFav ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header Cover & Banner */}
      <div className="relative bg-stone-900 text-white">
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          <img
            src={studio.coverImage || studio.portfolioImages?.[0] || studio.logo}
            alt={studio.name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        {/* Studio Identity Box (Overlaid onto bottom of Hero) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 sm:-mt-28 pb-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 text-stone-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <img
                src={studio.logo || studio.coverImage}
                alt={studio.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-stone-100 flex-shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                    {studio.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Cainta Verified
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{studio.address || studio.location}</span>
                  {distanceKm && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      📍 {distanceKm} km from you
                    </span>
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div className="flex items-center gap-1 font-bold text-stone-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{studio.rating} ({studio.reviewCount} customer reviews)</span>
                  </div>

                  <div className="text-stone-600">
                    Starts from <span className="font-extrabold text-amber-700 text-sm">₱{studio.startingPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-stretch md:self-center">
              {studio.printingAvailable && (
                <button
                  id="btn-order-prints-header"
                  onClick={() => onOpenPrintOrder(studio)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl border-2 border-stone-800 text-stone-800 hover:bg-stone-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>Order Prints</span>
                </button>
              )}

              <button
                id="btn-book-shoot-header"
                onClick={() => onOpenBooking(studio)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all transform hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Shoot Slot</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-6">
        {/* Quick Contact & Info Strip */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-stone-600 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-stone-900 block">Business Hours</span>
              <span>{studio.businessHours || 'Mon - Sat: 9:00 AM - 6:00 PM'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-stone-900 block">Contact Phone</span>
              <span>{studio.contactInfo || 'Available upon booking'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-stone-900 block">Email Address</span>
              <span>{studio.email}</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting...' : distanceKm ? `${distanceKm} km away` : 'Calculate Distance'}</span>
            </button>
          </div>
        </div>

        {/* Studio Social Links & Official Website */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700">Online Presence:</span>
            <StudioSocialLinks studio={studio} variant="bar" size="sm" />
          </div>

          {studio.website && (
            <a
              href={formatUrl(studio.website, 'website')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Website</span>
            </a>
          )}
        </div>

        {/* Tab Navigation Navigation */}
        <div className="bg-white rounded-2xl border border-stone-200 p-1.5 flex items-center gap-1 overflow-x-auto shadow-xs text-xs font-bold">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'services'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Services Offered ({studioServices.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Studio Packages ({studioPackages.length})
          </button>
          <button
            onClick={() => setActiveTab('prints')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'prints'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Print Keepsakes ({studioPrints.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'portfolio'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Portfolio & Gallery ({allPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'location'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Location & Map
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            Reviews & Ratings ({reviews.length})
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="space-y-6">
          {/* TAB 1: SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Available Photography Services</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Pumili ng serbisyo para sa iyong photoshoot session sa {studio.name}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studioServices.map(srv => (
                    <div
                      key={srv.id}
                      className="bg-stone-50/70 hover:bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-4">
                          <img
                            src={srv.image}
                            alt={srv.name}
                            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm border border-stone-200"
                          />
                          <div className="space-y-1">
                            <h4 className="font-bold text-base text-stone-900 leading-snug">{srv.name}</h4>
                            <span className="inline-block text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                              {srv.category} • {srv.durationMinutes} mins
                            </span>
                            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mt-1">
                              {srv.description}
                            </p>
                          </div>
                        </div>

                        {/* Extra Sample Photos */}
                        {srv.images && srv.images.length > 1 && (
                          <div className="pt-2 border-t border-stone-200/80">
                            <span className="text-[10px] text-stone-400 font-semibold block mb-1">Sample Photos:</span>
                            <div className="flex items-center gap-2 overflow-x-auto">
                              {srv.images.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt=""
                                  onClick={() => setSelectedPhotoIndex(allPhotos.indexOf(img))}
                                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 cursor-pointer hover:opacity-80 flex-shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block">Base Rate</span>
                          <span className="text-lg font-black text-amber-700">₱{srv.basePrice.toLocaleString()}</span>
                        </div>

                        <button
                          id={`btn-book-srv-${srv.id}`}
                          onClick={() => onOpenBooking(studio, srv.id)}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/10 flex items-center gap-1.5 transition-all"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book This Service</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PACKAGES */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">All-Inclusive Studio Packages</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Kumpletong package deals na may kasamang edited photos, prints, at dedicated photographers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studioPackages.map(pkg => (
                    <div
                      key={pkg.id}
                      className="bg-stone-50/70 hover:bg-stone-50 rounded-3xl border border-stone-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg transition-all"
                    >
                      <div>
                        <div className="relative h-44 overflow-hidden bg-stone-100">
                          <img
                            src={pkg.image}
                            alt={pkg.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-white text-xs font-extrabold px-3 py-1 rounded-full">
                            ₱{pkg.price.toLocaleString()}
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <h4 className="font-bold text-base text-stone-900 leading-snug">{pkg.name}</h4>
                          <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                            {pkg.description}
                          </p>

                          {/* Inclusions checklist */}
                          <div className="space-y-1.5 pt-2 border-t border-stone-200 text-xs text-stone-700">
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{pkg.durationMinutes} minutes shooting session</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{pkg.editedPhotosCount} high-res enhanced digital photos</span>
                            </div>
                            {pkg.includedPrints && (
                              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{pkg.includedPrints}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{pkg.photographerCount} dedicated professional photographer</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 mt-auto">
                        <button
                          id={`btn-book-pkg-${pkg.id}`}
                          onClick={() => onOpenBooking(studio, undefined, pkg.id)}
                          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/10 flex items-center justify-center gap-2 transition-all"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Reserve This Package</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRINT KEEPSAKES */}
          {activeTab === 'prints' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Custom Photo Prints & Keepsakes</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Direktang mag-order ng premium photo frames, canvas prints, at photobooks.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {studioPrints.map(pr => (
                    <div
                      key={pr.id}
                      className="bg-stone-50/70 hover:bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="relative aspect-square overflow-hidden bg-stone-100">
                          <img src={pr.image} alt={pr.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-white/90 text-stone-800 px-2 py-0.5 rounded-md shadow-xs">
                            {pr.size}
                          </span>
                        </div>

                        <div className="p-4 space-y-1.5">
                          <h4 className="font-bold text-sm text-stone-900 leading-snug">{pr.name}</h4>
                          <p className="text-xs text-stone-500 line-clamp-2">{pr.description}</p>
                          <div className="text-xs font-black text-amber-700 pt-1">₱{pr.price.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          id={`btn-order-print-${pr.id}`}
                          onClick={() => onOpenPrintOrder(studio, pr.id)}
                          className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Order Print</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PORTFOLIO & GALLERY */}
          {activeTab === 'portfolio' && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="text-xl font-bold text-stone-900">Studio Portfolio Showcase</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Tunay na kuha at outputs mula sa mga kliyente ng {studio.name}.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {allPhotos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPhotoIndex(i)}
                    className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-stone-200 shadow-xs hover:shadow-lg transition-all"
                  >
                    <img
                      src={photo}
                      alt={`Portfolio shot ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      <span>View Photo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LOCATION & MAP */}
          {activeTab === 'location' && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="text-xl font-bold text-stone-900">Location & Studio Vicinity</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Matatagpuan sa {studio.address || studio.location}.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-md">
                <CaintaStudioMap
                  studios={[studio]}
                  height="450px"
                  onSelectStudio={() => {}}
                  onBookStudio={() => onOpenBooking(studio)}
                />
              </div>

              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-stone-900">Cainta Studio Address</h4>
                  <p className="text-xs text-stone-600 mt-0.5">{studio.address || studio.location}</p>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.name + ' ' + (studio.address || studio.location))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS & RATINGS */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-8 shadow-xs">
              <div>
                <h3 className="text-xl font-bold text-stone-900">Customer Reviews & Ratings</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Tunay na feedback mula sa mga customer na nakapag-book na sa studio na ito.
                </p>
              </div>

              {/* Review Submission Form if Eligible */}
              {currentUser && eligibility.canReview && (
                <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-sm text-stone-900">Mag-iwan ng Review para sa Iyong Booking</h4>
                  </div>

                  <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Pumili ng Rating:</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setNewReviewRating(st)}
                            className="p-1 text-amber-500 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${st <= newReviewRating ? 'fill-amber-500' : 'text-stone-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Ang iyong Feedback:</label>
                      <textarea
                        rows={3}
                        required
                        value={newReviewComment}
                        onChange={e => setNewReviewComment(e.target.value)}
                        placeholder="Ibahagi ang iyong karanasan sa photoshoot, photographer, studio ambiance, at photo output..."
                        className="w-full p-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReview ? 'Ipinapasa...' : 'I-submit ang Review'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {isReviewsLoading ? (
                  <div className="text-center py-8 text-stone-400 text-xs">Ikinakarga ang mga review...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-2xl border border-stone-200">
                    <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-stone-600">Wala pang nakasulat na review para sa studio na ito.</p>
                    <p className="text-[11px] text-stone-400 mt-1">Maging unang mag-book at mag-iwan ng feedback!</p>
                  </div>
                ) : (
                  reviews.map(rev => (
                    <div key={rev.id} className="p-5 bg-stone-50/70 rounded-2xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500 text-amber-800 font-bold text-xs flex items-center justify-center">
                            {rev.customerName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-stone-900 block">{rev.customerName}</span>
                            <span className="text-[10px] text-stone-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 leading-relaxed pl-10">{rev.comment}</p>

                      {rev.reply && (
                        <div className="mt-3 ml-10 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-stone-800 space-y-1">
                          <span className="font-bold text-amber-900 block">Sagot mula sa Studio:</span>
                          <p>{rev.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            ✕
          </button>
          <img
            src={allPhotos[selectedPhotoIndex]}
            alt="Enlarged gallery photo"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default StudioProfileView;
