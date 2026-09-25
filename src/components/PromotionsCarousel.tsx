import React, { useState, useEffect } from 'react';
import { Sparkles, Tag, Calendar, MapPin, ChevronLeft, ChevronRight, ArrowRight, Copy, Check } from 'lucide-react';
import type { Studio, Promotion } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';

interface PromotionsCarouselProps {
  studios: Studio[];
  promotions?: Promotion[];
  onNavigate: (page: string, params?: any) => void;
  onOpenBooking?: (studio?: Studio) => void;
}

export const PromotionsCarousel: React.FC<PromotionsCarouselProps> = ({
  studios,
  promotions: initialPromotions,
  onNavigate,
  onOpenBooking
}) => {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!initialPromotions || initialPromotions.length === 0) {
      apiRequest<Promotion[]>('/api/promotions')
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setPromotions(data.filter(p => p.isActive !== false));
          }
        })
        .catch(() => {});
    } else {
      setPromotions(initialPromotions);
    }
  }, [initialPromotions]);

  // Auto-slide effect
  useEffect(() => {
    if (isPaused || promotions.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, promotions.length]);

  if (promotions.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const currentPromo = promotions[currentIndex % promotions.length];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200/60 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Cainta Special Offers & Discounts
          </div>
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Current Studio Promotions & Seasonal Packages
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Exclusive holiday discounts and photography deals across Felix Ave, Ortigas Ext, and Cainta Poblacion.
          </p>
        </div>

        {promotions.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-3 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 hover:border-amber-400 text-stone-700 shadow-sm transition-all cursor-pointer"
              aria-label="Previous Promotion"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {promotions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-8 bg-amber-600' : 'w-2.5 bg-stone-300 hover:bg-stone-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="p-3 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 hover:border-amber-400 text-stone-700 shadow-sm transition-all cursor-pointer"
              aria-label="Next Promotion"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Carousel Banner Card */}
      <div
        className="relative bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
          {/* Left Content Area */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-600 text-white px-3.5 py-1.5 rounded-xl shadow-xs">
                  {currentPromo.discount}
                </span>
                {currentPromo.badge && (
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    {currentPromo.badge}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block">
                  {currentPromo.subtitle}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                  {currentPromo.title}
                </h3>
              </div>

              <p className="text-sm text-stone-600 leading-relaxed font-normal">
                {currentPromo.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-stone-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" /> {currentPromo.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" /> Valid until {currentPromo.validUntil}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-stone-100 border border-stone-200 px-3.5 py-2 rounded-xl">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span className="font-mono font-bold text-xs text-stone-800">{currentPromo.code}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(currentPromo.code)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  {copiedCode === currentPromo.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('directory')}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  View Studios
                </button>
                <button
                  onClick={() => {
                    const matchedStudio = currentPromo.studioId
                      ? studios.find(s => s.id === currentPromo.studioId) || studios[0]
                      : studios[0];
                    if (matchedStudio && onOpenBooking) {
                      onOpenBooking(matchedStudio);
                    } else {
                      onNavigate('directory');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Claim Promo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Image Area */}
          <div className="lg:col-span-5 relative bg-stone-100 min-h-[280px] lg:min-h-full">
            <img
              src={currentPromo.image}
              alt={currentPromo.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent lg:hidden" />
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-stone-800 shadow-md border border-stone-200">
              Cainta Rizal Exclusive
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
