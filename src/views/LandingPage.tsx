import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Star,
  Users,
  Clock,
  Heart,
  Layers,
  Compass,
  Zap
} from 'lucide-react';
import type { Studio, User, Review } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { Interactive3DTiltCard, MagnetButton, ScrollReveal } from '../components/MotionCard.js';
import { PromotionsCarousel } from '../components/PromotionsCarousel.js';
import { FAQAccordion } from '../components/FAQAccordion.js';
import { StudioSocialLinks } from '../components/StudioSocialLinks.js';

interface LandingPageProps {
  studios: Studio[];
  onNavigate: (page: string, params?: any) => void;
  onOpenBooking: (studio: Studio) => void;
  favorites: string[];
  onToggleFavorite: (studioId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  studios,
  onNavigate,
  onOpenBooking,
  favorites,
  onToggleFavorite
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    apiRequest<Review[]>('/api/reviews')
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch(() => {});
  }, []);

  const verifiedStudios = studios.filter(s => s.status.toLowerCase() === 'approved');
  const avgStudioRating = verifiedStudios.length > 0
    ? (verifiedStudios.reduce((acc, s) => acc + (s.rating || 5.0), 0) / verifiedStudios.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-24 pb-28 bg-stone-50 text-stone-900">
      {/* Clean, Light Hero Section (No Hero Image, Light Theme) */}
      <section className="relative bg-white border-b border-stone-200/80 pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Cainta, Rizal's Premier Studio MIS & Directory
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-900 leading-[1.15]">
            Capture Life’s Milestones with Cainta’s <span className="text-amber-600">Finest Photographers.</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto font-normal">
            From graduation portrait sessions and luxury wedding coverage to newborn shoots and commercial studio rentals. Discover verified creative spaces across Felix Avenue, Ortigas Ave Extension, and Cainta Poblacion with instant PayMongo GCash QR booking and online client proofing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <MagnetButton
              id="btn-hero-explore"
              onClick={() => onNavigate('directory')}
              className="px-7 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/20 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Studios & Map</span>
              <ArrowRight className="w-4 h-4" />
            </MagnetButton>

            <button
              id="btn-hero-how-it-works"
              onClick={() => {
                const el = document.getElementById('section-how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 font-semibold text-sm transition-all"
            >
              How It Works
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-10 max-w-2xl mx-auto border-t border-stone-200 text-stone-800">
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight">{verifiedStudios.length}</span>
              <span className="text-xs text-stone-500 font-medium block">Accredited Cainta Studios</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">100%</span>
              <span className="text-xs text-stone-500 font-medium block">GCash QR Ph Verified</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">{avgStudioRating}★</span>
              <span className="text-xs text-stone-500 font-medium block">Average Studio Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Studios Showcase (Top Rated Cainta Photography Studios) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Handpicked Quality
            </div>
            <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              Top Rated Cainta Photography Studios
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              Verified business permits, real portfolio shots, and instant slot reservations.
            </p>
          </div>

          <button
            onClick={() => onNavigate('directory')}
            className="text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors border border-amber-200/60"
          >
            <span>View All {verifiedStudios.length} Studios</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {verifiedStudios.slice(0, 3).map((studio, idx) => {
            const isFav = favorites.includes(studio.id);
            return (
              <ScrollReveal key={studio.id} delay={idx * 0.1}>
                <Interactive3DTiltCard className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between h-full group hover:shadow-xl transition-all">
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                      <img
                        src={studio.portfolioImages?.[0] || studio.coverImage || studio.logo}
                        alt={studio.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onToggleFavorite(studio.id);
                        }}
                        className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-md text-stone-600 hover:text-rose-600 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
                      </button>

                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="text-xs font-bold bg-white/90 text-stone-900 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-lg border border-stone-200">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {studio.rating} ({studio.reviewCount})
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3.5">
                      <div>
                        <h4 className="font-bold text-lg text-stone-900 group-hover:text-amber-700 transition-colors leading-snug">
                          {studio.name}
                        </h4>
                        <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1.5">
                          <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          <span className="truncate">{studio.location}</span>
                        </p>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-light">
                        {studio.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(studio.servicesOffered || studio.categories || []).slice(0, 3).map((s: string) => (
                          <span
                            key={s}
                            className="text-[11px] font-semibold bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Studio Social Links & Website */}
                      <div className="pt-2 border-t border-stone-100/80">
                        <StudioSocialLinks studio={studio} variant="badges" size="xs" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-auto border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Starts from</span>
                      <span className="text-base font-extrabold text-amber-600">₱{studio.startingPrice.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('directory', { selectedStudioId: studio.id })}
                        className="text-xs px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onOpenBooking(studio)}
                        className="text-xs px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 transition-all"
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                </Interactive3DTiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Corridor Spotlight: Cainta Neighborhoods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200/60">
              <MapPin className="w-3.5 h-3.5 text-amber-600" /> Local Geography
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Photography Hubs Across Cainta Corridors
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Convenient studio locations accessible via Ortigas Extension, Felix Avenue, and Marcos Highway.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Ortigas Ave Extension',
                desc: 'Commercial high-traffic corridor near Junction & Robinsons Place Cainta',
                badge: 'Junction Core',
                icon: '📸',
                color: 'from-amber-500/10 to-amber-600/5'
              },
              {
                title: 'Felix Avenue Corridor',
                desc: 'Boutique natural light & maternity studios near Valley Golf & Greenpark',
                badge: 'Lifestyle & Portrait',
                icon: '🌿',
                color: 'from-emerald-500/10 to-emerald-600/5'
              },
              {
                title: 'Cainta Poblacion',
                desc: 'Heritage, wedding, and corporate studios near Municipal Hall & Rotonda',
                badge: 'Heritage & Events',
                icon: '🏛️',
                color: 'from-blue-500/10 to-blue-600/5'
              },
              {
                title: 'Masinag & Marcos Hwy',
                desc: 'Quick access studios adjacent to LRT-2 Masinag Hub & Antipolo border',
                badge: 'Transit Accessible',
                icon: '🚆',
                color: 'from-purple-500/10 to-purple-600/5'
              }
            ].map(hub => (
              <div
                key={hub.title}
                onClick={() => onNavigate('directory')}
                className="p-6 rounded-3xl border border-stone-200 bg-white hover:border-amber-400 hover:shadow-xl transition-all duration-300 cursor-pointer space-y-3 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${hub.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-2xl shadow-inner">
                    {hub.icon}
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-full inline-block">
                    {hub.badge}
                  </span>
                  <h4 className="font-bold text-base text-stone-900 group-hover:text-amber-700 transition-colors">
                    {hub.title}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">{hub.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Promotions Carousel Component */}
      <PromotionsCarousel studios={studios} onNavigate={onNavigate} onOpenBooking={(s) => s && onOpenBooking(s)} />

      {/* How It Works Section (Clean Light Theme) */}
      <section id="section-how-it-works" className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-y border-stone-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-600" /> Streamlined Process
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              How the Cainta Studio MIS Works
            </h3>
            <p className="text-sm text-stone-600 font-normal">
              From discovering local photography talents to high-res proof delivery in just 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Find & Compare',
                desc: 'Browse studios near you in Cainta with real-time Leaflet map and distance calculator.',
                icon: <MapPin className="w-5 h-5 text-amber-600" />
              },
              {
                step: '02',
                title: 'Pick Date & Pay 30%',
                desc: 'Lock your slot with PayMongo GCash QR Ph downpayment. Receipt & Calendar link auto-generated.',
                icon: <CreditCard className="w-5 h-5 text-blue-600" />
              },
              {
                step: '03',
                title: 'Attend Photoshoot',
                desc: 'Enjoy your photo session with professional studio lighting, backgrounds, and guidance in Cainta.',
                icon: <Camera className="w-5 h-5 text-purple-600" />
              },
              {
                step: '04',
                title: 'Proof & Order Prints',
                desc: 'Review watermarked proofs online, star retouch favorites, and order framed fine-art prints.',
                icon: <ImageIcon className="w-5 h-5 text-emerald-600" />
              }
            ].map(card => (
              <div
                key={card.step}
                className="p-7 rounded-3xl bg-stone-50 border border-stone-200 shadow-sm space-y-4 hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-white shadow-inner border border-stone-100">{card.icon}</div>
                  <span className="text-2xl font-black text-stone-300 font-mono">{card.step}</span>
                </div>
                <h4 className="font-bold text-stone-900 text-base">{card.title}</h4>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Reviews Section */}
      {reviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200/60">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Client Voices
            </div>
            <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight">What Cainta Clients Say</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 6).map((rev) => {
              const std = studios.find(s => s.id === rev.studioId);
              return (
                <div
                  key={rev.id}
                  className="p-7 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200/50">
                        Verified Customer
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed italic font-light">"{rev.comment}"</p>
                  </div>
                  <div className="pt-3 border-t border-stone-100">
                    <h5 className="font-bold text-xs text-stone-900">{rev.customerName || 'Verified Client'}</h5>
                    <span className="text-[11px] text-stone-400 font-medium block">{std ? std.name : 'Cainta Studio Client'}</span>
                    {rev.reply && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/50 text-[11px] text-amber-900">
                        <span className="font-bold block mb-0.5">Studio Response:</span>
                        {rev.reply}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ Accordion Section */}
      <FAQAccordion />

      {/* CTA Footer Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 border border-amber-200 text-stone-900 p-8 sm:p-12 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
              Studio Partners
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-900">Are you a Cainta Photography Studio Owner?</h3>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
              Join our accredited studio network. Manage bookings, accept automated GCash QR payments, offer proofing, and grow your local client base across Cainta corridors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => onNavigate('login', { registerRole: 'STUDIO_ADMIN' })}
              className="px-7 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Register Studio
            </button>
            <button
              onClick={() => onNavigate('directory')}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-semibold text-xs transition-all shadow-xs"
            >
              Browse Directory
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
