import React, { useState, useEffect } from 'react';
import type {
  User,
  Studio,
  Service,
  Package,
  PrintProduct,
  Addon,
  Notification,
  CustomPage,
  GCashQRSession,
  Booking
} from './db/types.js';
import { apiRequest, setStoredToken, getStoredUser, setStoredUser } from './utils/apiClient.js';
import { toast } from './utils/toast.js';
import { ToastContainer } from './components/Toast.js';
import { Navbar } from './components/Navbar.js';
import { ScrollProgressBar } from './components/MotionCard.js';
import { Chatbot } from './components/Chatbot.js';
import { InstallPrompt } from './components/InstallPrompt.js';
import { NotificationCenter } from './components/NotificationCenter.js';
import { GCashQRModal } from './components/GCashQRModal.js';
import { BookingWizard } from './components/BookingWizard.js';
import { PrintOrderWizard } from './components/PrintOrderWizard.js';

// Views
import { LandingPage } from './views/LandingPage.js';
import { DirectoryPage } from './views/DirectoryPage.js';
import { CustomerDashboard } from './views/CustomerDashboard.js';
import { StudioDashboard } from './views/StudioDashboard.js';
import { AdminDashboard } from './views/AdminDashboard.js';
import { AuthPage } from './views/AuthPage.js';
import { CustomPageView } from './views/CustomPageView.js';
import { ProfileView } from './views/ProfileView.js';
import { StudioProfileView } from './views/StudioProfileView.js';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [pageParams, setPageParams] = useState<any>({});

  // Global Data
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [studios, setStudios] = useState<Studio[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [printProducts, setPrintProducts] = useState<PrintProduct[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Local Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cainta_studio_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Modals
  const [showNotifications, setShowNotifications] = useState(false);

  // Booking Wizard
  const [bookingStudio, setBookingStudio] = useState<Studio | null>(null);

  // Print Order Wizard
  const [printOrderStudio, setPrintOrderStudio] = useState<Studio | null>(null);

  // GCash QR Modal
  const [gcashSession, setGcashSession] = useState<GCashQRSession | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 1. Session check
      try {
        const me = await apiRequest<{ user: User }>('/api/auth/me');
        if (me && me.user) {
          setCurrentUser(me.user);
          setStoredUser(me.user);
        }
      } catch {
        if (!localStorage.getItem('cainta_mis_token') && !localStorage.getItem('cainta_auth_token')) {
          setCurrentUser(null);
          setStoredUser(null);
        }
      }

      // 2. Fetch studios, products, and CMS pages
      const [sData, pData, pgData] = await Promise.all([
        apiRequest<Studio[]>('/api/studios').catch(err => {
          console.warn('Failed to load studios:', err);
          return [] as Studio[];
        }),
        apiRequest<PrintProduct[]>('/api/print-products').catch(err => {
          console.warn('Failed to load print products:', err);
          return [] as PrintProduct[];
        }),
        apiRequest<CustomPage[]>('/api/custom-pages').catch(err => {
          console.warn('Failed to load custom pages:', err);
          return [] as CustomPage[];
        })
      ]);
      setStudios(sData);
      setPrintProducts(pData);
      setCustomPages(pgData);

      // Fetch sample services and addons for first studio
      if (sData && sData.length > 0) {
        const [srvData, pkgData, adData] = await Promise.all([
          apiRequest<Service[]>(`/api/studios/${sData[0].id}/services`).catch(() => [] as Service[]),
          apiRequest<Package[]>(`/api/studios/${sData[0].id}/packages`).catch(() => [] as Package[]),
          apiRequest<Addon[]>(`/api/studios/${sData[0].id}/addons`).catch(() => [] as Addon[])
        ]);
        setServices(srvData);
        setPackages(pkgData);
        setAddons(adData);
      }

      // Load user notifications if logged in
      loadNotifications();
    } catch (err) {
      console.error('Initial load error:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const nData = await apiRequest<Notification[]>('/api/notifications');
      setNotifications(nData);
    } catch {
      // ignore if unauthenticated
    }
  };

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      toast.info('Matagumpay kang naka-log out. Hanggang sa muli!', { title: 'Naka-log Out' });
    } catch (err) {
      console.error(err);
      toast.info('Naka-log out na sa lokal na session.', { title: 'Naka-log Out' });
    } finally {
      setStoredToken(null);
      setStoredUser(null);
      setCurrentUser(null);
      handleNavigate('landing');
    }
  };

  const toggleFavorite = (studioId: string) => {
    setFavorites(prev => {
      const exists = prev.includes(studioId);
      const next = exists ? prev.filter(id => id !== studioId) : [...prev, studioId];
      const studio = studios.find(s => s.id === studioId);
      const studioName = studio?.name || 'Studio';
      if (exists) {
        toast.info(`Tinanggal ang "${studioName}" sa iyong mga paborito.`, { title: 'Paborito' });
      } else {
        toast.success(`Idinagdag ang "${studioName}" sa iyong mga paborito! ❤️`, { title: 'Paborito' });
      }
      try {
        localStorage.setItem('cainta_studio_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Open booking wizard for selected studio
  const handleOpenBooking = async (studio: Studio) => {
    try {
      const [srvData, pkgData, adData] = await Promise.all([
        apiRequest<Service[]>(`/api/studios/${studio.id}/services`),
        apiRequest<Package[]>(`/api/studios/${studio.id}/packages`),
        apiRequest<Addon[]>(`/api/studios/${studio.id}/addons`)
      ]);
      setServices(srvData);
      setPackages(pkgData);
      setAddons(adData);
      setBookingStudio(studio);
    } catch {
      setBookingStudio(studio);
    }
  };

  // Handle booking complete and trigger GCash QR if selected
  const handleBookingComplete = async (
    booking: Booking,
    paymentOption: string,
    paymentMethod: string
  ) => {
    loadNotifications();
    toast.success(`Matagumpay na naitala ang iyong photoshoot booking (#${booking.id})!`, {
      title: 'Booking Confirmed'
    });
    if (paymentMethod === 'gcash') {
      try {
        const amountToPay =
          paymentOption === 'downpayment' ? booking.downPaymentAmount : booking.totalAmount;
        const session = await apiRequest<GCashQRSession>('/api/payments/gcash/create-session', {
          method: 'POST',
          body: JSON.stringify({
            bookingId: booking.id,
            studioId: booking.studioId,
            amount: amountToPay,
            paymentType: paymentOption === 'downpayment' ? 'downpayment' : 'full',
            description: `Photoshoot Booking ${booking.id} - ${booking.customerName}`
          })
        });
        setGcashSession(session);
      } catch (err: any) {
        console.error('GCash session error:', err);
        toast.error('Hindi ma-generate ang GCash QR code: ' + (err?.message || 'Subukan muli'), {
          title: 'Payment Error'
        });
      }
    }
  };

  // Pay remaining balance from customer dashboard
  const handlePayBalance = async (booking: Booking) => {
    try {
      const session = await apiRequest<GCashQRSession>('/api/payments/gcash/create-session', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking.id,
          studioId: booking.studioId,
          amount: booking.remainingBalance,
          paymentType: 'balance',
          description: `Remaining Balance for Booking ${booking.id}`
        })
      });
      setGcashSession(session);
    } catch (err: any) {
      toast.error('Hindi ma-proseso ang GCash session: ' + (err?.message || 'Error sa pag-bayad'), {
        title: 'GCash Error'
      });
    }
  };

  // Render main page
  const renderCurrentView = () => {
    if (currentPage === 'landing') {
      return (
        <LandingPage
          studios={studios}
          onNavigate={handleNavigate}
          onOpenBooking={handleOpenBooking}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      );
    }

    if (currentPage === 'directory') {
      return (
        <DirectoryPage
          studios={studios}
          services={services}
          packages={packages}
          printProducts={printProducts}
          onOpenBooking={handleOpenBooking}
          onOpenPrintOrder={studio => setPrintOrderStudio(studio)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          initialSelectedStudioId={pageParams?.selectedStudioId}
          currentUser={currentUser}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentPage === 'customer') {
      if (!currentUser) {
        return <AuthPage onLoginSuccess={u => setCurrentUser(u)} initialRole="CUSTOMER" />;
      }
      return (
        <CustomerDashboard
          currentUser={currentUser}
          studios={studios}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onPayBalance={handlePayBalance}
          onNavigate={handleNavigate}
          initialTab={pageParams?.tab || 'bookings'}
        />
      );
    }

    if (currentPage === 'studio-dashboard') {
      const targetStudioId = pageParams?.studioId || currentUser?.studioId;
      const myStudio = studios.find(s => s.id === targetStudioId) || studios[0];
      const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
      const isStudioStaff = currentUser?.role === 'STUDIO_ADMIN' || currentUser?.role === 'STUDIO_STAFF';

      if (!currentUser || (!isStudioStaff && !isSuperAdmin)) {
        return (
          <AuthPage
            onLoginSuccess={u => {
              setCurrentUser(u);
              handleNavigate('studio-dashboard');
            }}
            initialRole="STUDIO_ADMIN"
          />
        );
      }
      return (
        <StudioDashboard
          currentUser={currentUser}
          studio={myStudio}
          onUpdateStudio={updated => {
            setStudios(prev => prev.map(s => (s.id === updated.id ? updated : s)));
          }}
        />
      );
    }

    if (currentPage === 'admin') {
      if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
        return (
          <AuthPage
            onLoginSuccess={u => {
              setCurrentUser(u);
              handleNavigate('admin');
            }}
          />
        );
      }
      return (
        <AdminDashboard
          currentUser={currentUser}
          onRefreshStudios={loadInitialData}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentPage === 'login') {
      return (
        <AuthPage
          onLoginSuccess={u => {
            setCurrentUser(u);
            if (u.role === 'SUPER_ADMIN') handleNavigate('admin');
            else if (u.role === 'STUDIO_ADMIN') handleNavigate('studio-dashboard');
            else handleNavigate('customer');
          }}
          initialRole={pageParams?.registerRole || 'CUSTOMER'}
        />
      );
    }

    if (currentPage === 'profile') {
      return (
        <ProfileView
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onUpdateUser={u => setCurrentUser(u)}
        />
      );
    }

    if (currentPage === 'studio-profile' || currentPage === 'studio') {
      const targetStudioId = pageParams?.studioId || studios[0]?.id;
      return (
        <StudioProfileView
          studioId={targetStudioId}
          studios={studios}
          services={services}
          packages={packages}
          printProducts={printProducts}
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onOpenBooking={handleOpenBooking}
          onOpenPrintOrder={studio => setPrintOrderStudio(studio)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      );
    }

    if (currentPage.startsWith('custom-')) {
      const pageId = pageParams?.pageId;
      const targetPage = customPages.find(p => p.id === pageId || `custom-${p.slug}` === currentPage);
      if (targetPage) {
        return <CustomPageView page={targetPage} onNavigate={handleNavigate} />;
      }
    }

    return (
      <LandingPage
        studios={studios}
        onNavigate={handleNavigate}
        onOpenBooking={handleOpenBooking}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-600 selection:text-white font-sans antialiased overflow-hidden max-w-full">
      {/* Top Scroll Indicator */}
      <ScrollProgressBar />

      {/* Primary Sticky Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        favoritesCount={favorites.length}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        customPages={customPages}
      />

      {/* Main View Area */}
      <main className="flex-1">{renderCurrentView()}</main>

      {/* Footer */}
      <footer className="bg-[#2c2a29] text-stone-400 text-xs border-t border-stone-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Cainta Photography MIS</h4>
            <p className="text-stone-400 leading-relaxed text-xs">
              Accredited Management Information System connecting clients with professional portrait, wedding, and event photographers in Cainta, Rizal.
            </p>
            <div className="text-[11px] text-amber-400">
              📍 Rizal Province • Region IV-A Calabarzon
            </div>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3">Quick Navigation</h5>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigate('landing')} className="hover:text-white">
                  Home Portal
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('directory')} className="hover:text-white">
                  Studio Directory & Map
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('customer')} className="hover:text-white">
                  Client Bookings & Proofs
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('studio-dashboard')} className="hover:text-white">
                  Studio Operations Console
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3">Information & Policy</h5>
            <ul className="space-y-2">
              {customPages
                .filter(p => p.isPublished && p.showInFooter)
                .map(p => (
                  <li key={p.id}>
                    <button
                      onClick={() => handleNavigate(`custom-${p.slug}`, { pageId: p.id })}
                      className="hover:text-white"
                    >
                      {p.title}
                    </button>
                  </li>
                ))}
              <li>
                <span className="text-stone-500">PayMongo GCash QR Ph Compliant</span>
              </li>
              <li>
                <span className="text-stone-500">Anti-Piracy Proof Watermarking</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3">Cainta MIS Support</h5>
            <p className="text-[11px] text-stone-400 mb-3 leading-relaxed">
              Para sa tulong sa account, studio registration, o mga katanungan:
            </p>
            <div className="space-y-1.5 text-[11px] text-stone-300">
              <div>📧 support@cainta-studios.ph</div>
              <div>📞 (02) 8696-2847 / 0917-800-0001</div>
              <div className="text-amber-400">Lunes - Sabado: 8:00 AM - 6:00 PM</div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
          <div>© {new Date().getFullYear()} Cainta Photography Studio MIS. All rights reserved.</div>
          <div>Empowering creative local businesses across Cainta, Rizal.</div>
        </div>
      </footer>

      {/* Floating Gemini AI Chatbot */}
      <Chatbot />

      {/* Floating PWA Install Prompt */}
      <InstallPrompt />

      {/* Notifications Slideover */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onNotificationsChange={loadNotifications}
        onNavigateToItem={(type, id) => {
          if (type.startsWith('booking_')) handleNavigate('customer', { tab: 'bookings' });
          else if (type.startsWith('print_')) handleNavigate('customer', { tab: 'prints' });
          else if (type.startsWith('photos_')) handleNavigate('customer', { tab: 'proofing' });
        }}
      />

      {/* Booking Wizard Modal */}
      {bookingStudio && (
        <BookingWizard
          isOpen={Boolean(bookingStudio)}
          onClose={() => setBookingStudio(null)}
          studio={bookingStudio}
          services={services}
          packages={packages}
          addons={addons}
          currentUser={currentUser}
          onBookingComplete={handleBookingComplete}
          onRequireLogin={() => {
            setBookingStudio(null);
            handleNavigate('login');
          }}
        />
      )}

      {/* Print Order Wizard Modal */}
      {printOrderStudio && (
        <PrintOrderWizard
          isOpen={Boolean(printOrderStudio)}
          onClose={() => setPrintOrderStudio(null)}
          studio={printOrderStudio}
          products={printProducts}
          currentUser={currentUser}
          onOrderComplete={(order, method) => {
            loadNotifications();
            toast.success(`Matagumpay na naipasa ang iyong print order (#${order.id})!`, {
              title: 'Order Submitted'
            });
            if (method === 'gcash') {
              apiRequest<GCashQRSession>('/api/payments/gcash/create-session', {
                method: 'POST',
                body: JSON.stringify({
                  bookingId: order.id,
                  amount: order.totalAmount,
                  description: `Print Order ${order.id}`
                })
              })
                .then(session => setGcashSession(session))
                .catch(err => {
                  console.error(err);
                  toast.error('Hindi ma-load ang GCash payment para sa order.');
                });
            }
          }}
          onRequireLogin={() => {
            setPrintOrderStudio(null);
            handleNavigate('login');
          }}
        />
      )}

      {/* PayMongo GCash QR Ph Realtime Modal */}
      <GCashQRModal
        isOpen={Boolean(gcashSession)}
        onClose={() => setGcashSession(null)}
        session={gcashSession}
        onPaymentConfirmed={(data) => {
          setGcashSession(null);
          loadNotifications();
          toast.success('Kumpirmado na ang iyong bayad sa GCash! Maraming salamat.', {
            title: 'Bayad Tanggap'
          });
          window.dispatchEvent(new CustomEvent('booking-payment-confirmed', { detail: data }));
        }}
      />

      {/* Global Toast & Action Status Notification Container */}
      <ToastContainer />
    </div>
  );
}

export default App;
