import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CreditCard,
  Image as ImageIcon,
  Heart,
  Download,
  CalendarPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  FileText,
  Star,
  MessageSquare,
  X,
  Archive,
  Trash2,
  RotateCcw,
  Inbox,
  Filter
} from 'lucide-react';
import type { Booking, PrintOrder, PhotoProofing, Studio, User, Review } from '../db/types.js';
import { apiRequest, getStoredToken } from '../utils/apiClient.js';
import { generateBookingReceiptPDF, generatePrintReceiptPDF } from '../utils/pdfGenerator.js';
import { getGoogleCalendarUrl, downloadICSFile } from '../utils/calendarSync.js';
import { ClientGallery } from '../components/ClientGallery.js';
import { RescheduleModal } from '../components/RescheduleModal.js';
import { StudioSocialLinks } from '../components/StudioSocialLinks.js';

interface CustomerDashboardProps {
  currentUser: User;
  studios: Studio[];
  favorites: string[];
  onToggleFavorite: (studioId: string) => void;
  onPayBalance: (booking: Booking) => void;
  onNavigate: (page: string, params?: any) => void;
  initialTab?: 'bookings' | 'prints' | 'proofing' | 'favorites' | 'reviews';
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  studios,
  favorites,
  onToggleFavorite,
  onPayBalance,
  onNavigate,
  initialTab = 'bookings'
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'prints' | 'proofing' | 'favorites' | 'reviews'>(initialTab);
  const [bookingSubTab, setBookingSubTab] = useState<'active' | 'archived'>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [proofings, setProofings] = useState<PhotoProofing[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const activeBookings = safeBookings.filter(b => !b.archivedByCustomer);
  const archivedBookings = safeBookings.filter(b => Boolean(b.archivedByCustomer));
  const cancelledActiveBookings = activeBookings.filter(b => b.status === 'Cancelled');

  // Reschedule modal
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

  // Review Modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    loadCustomerData();

    // Auto-refresh when payment is completed or confirmed
    const handlePaymentUpdate = () => {
      loadCustomerData();
    };

    window.addEventListener('booking-payment-confirmed', handlePaymentUpdate);
    window.addEventListener('focus', handlePaymentUpdate);

    // Real-time SSE listener
    let eventSource: EventSource | null = null;
    const token = getStoredToken();
    if (token) {
      try {
        eventSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
        eventSource.onmessage = () => {
          loadCustomerData();
        };
      } catch {
        // fallback
      }
    }

    return () => {
      window.removeEventListener('booking-payment-confirmed', handlePaymentUpdate);
      window.removeEventListener('focus', handlePaymentUpdate);
      if (eventSource) eventSource.close();
    };
  }, [currentUser]);

  const loadCustomerData = async () => {
    setIsLoading(true);
    try {
      const token = getStoredToken();
      if (!token && !currentUser) {
        setBookings([]);
        setPrintOrders([]);
        setProofings([]);
        setMyReviews([]);
        setIsLoading(false);
        return;
      }

      let bData: any = [];
      try {
        bData = await apiRequest<Booking[]>('/api/bookings/my');
      } catch (err: any) {
        if (err?.message === 'Unauthorized' || err?.message?.includes('401')) {
          setBookings([]);
          setPrintOrders([]);
          setProofings([]);
          setMyReviews([]);
          setIsLoading(false);
          return;
        }
        bData = await apiRequest<Booking[]>('/api/bookings').catch(() => []);
      }

      const [pData, prData, rData] = await Promise.all([
        apiRequest<PrintOrder[]>('/api/print-orders/my').catch(() => []),
        apiRequest<PhotoProofing[]>('/api/photo-proofing/my').catch(() => []),
        apiRequest<Review[]>('/api/reviews/my').catch(() => [])
      ]);

      const resolvedBookings = Array.isArray(bData)
        ? bData
        : (bData as any)?.bookings || (bData as any)?.data || (bData && typeof bData === 'object' && bData.id ? [bData] : []);

      setBookings(resolvedBookings);
      setPrintOrders(Array.isArray(pData) ? pData : (pData as any)?.printOrders || (pData as any)?.data || []);
      setProofings(Array.isArray(prData) ? prData : (prData as any)?.photoProofings || (prData as any)?.data || []);
      setMyReviews(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.warn('Customer data load notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewModal = (booking: Booking) => {
    setReviewBooking(booking);
    const existing = myReviews.find(r => r.bookingId === booking.id);
    if (existing) {
      setReviewRating(existing.rating);
      setReviewComment(existing.comment);
    } else {
      setReviewRating(5);
      setReviewComment('');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    if (!reviewComment.trim()) {
      alert('Please write a brief comment describing your experience.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          studioId: reviewBooking.studioId,
          bookingId: reviewBooking.id,
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      });
      alert('Thank you! Your feedback has been published.');
      setReviewBooking(null);
      loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiRequest(`/api/bookings/${bookingId}/cancel`, { method: 'PUT' });
      await loadCustomerData();
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const handleArchiveBooking = async (bookingId: string, archived = true) => {
    setIsProcessingAction(true);
    try {
      await apiRequest(`/api/bookings/${bookingId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ archived })
      });
      await loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to update archive status');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleArchiveAllCancelled = async () => {
    if (!window.confirm('Archive all cancelled bookings? You can access them anytime in the Archived tab or delete them permanently.')) return;
    setIsProcessingAction(true);
    try {
      const res: any = await apiRequest('/api/customer/bookings/archive-all-cancelled', {
        method: 'PUT'
      });
      await loadCustomerData();
      if (res?.count) {
        alert(`Successfully archived ${res.count} cancelled reservation(s).`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to archive cancelled bookings');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteBookingPermanently = async (bookingId: string) => {
    if (!window.confirm('⚠️ Are you sure you want to PERMANENTLY delete this booking record? This action cannot be undone.')) return;
    setIsProcessingAction(true);
    try {
      await apiRequest(`/api/bookings/${bookingId}/permanent`, {
        method: 'DELETE'
      });
      await loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete booking permanently');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStudioForBooking = (studioId: string) => {
    return studios.find(s => s.id === studioId);
  };

  const getStatusBadge = (status: string, booking?: Booking) => {
    if (status === 'Payment Under Review' || booking?.paymentStatus === 'pending_verification' || (booking?.paymentReference && booking?.amountPaid === 0 && status !== 'Cancelled')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" /> Payment Under Review
        </span>
      );
    }
    switch (status) {
      case 'Confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Confirmed</span>;
      case 'Awaiting Payment':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Awaiting Payment</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Completed</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Customer Header */}
      <div className="bg-[#2c2a29] text-white p-6 rounded-3xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Client Portal</span>
          <h2 className="text-xl sm:text-2xl font-bold mt-0.5">Welcome back, {currentUser.fullName}</h2>
          <p className="text-xs text-stone-400">Track your photoshoots, proof photos, and order prints across Cainta studios.</p>
        </div>

        <button
          onClick={() => onNavigate('directory')}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-colors"
        >
          Book New Shoot
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto text-xs font-semibold text-stone-600">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'bookings' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent hover:text-stone-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> My Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('prints')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'prints' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent hover:text-stone-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Print Orders ({printOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('proofing')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'proofing' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent hover:text-stone-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Photo Proofing ({proofings.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'reviews' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent hover:text-stone-900'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> My Reviews ({myReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'favorites' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent hover:text-stone-900'
          }`}
        >
          <Heart className="w-4 h-4" /> Saved Studios ({favorites.length})
        </button>
      </div>

      {/* Tab 1: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Sub-header & Sub-tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBookingSubTab('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  bookingSubTab === 'active'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Active Reservations ({activeBookings.length})
              </button>

              <button
                type="button"
                onClick={() => setBookingSubTab('archived')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  bookingSubTab === 'archived'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Archived ({archivedBookings.length})
              </button>
            </div>

            {/* Quick action for cancelled bookings if in active tab */}
            {bookingSubTab === 'active' && cancelledActiveBookings.length > 0 && (
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleArchiveAllCancelled}
                className="text-xs px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-rose-600" />
                Archive {cancelledActiveBookings.length} Cancelled {cancelledActiveBookings.length === 1 ? 'Shoot' : 'Shoots'}
              </button>
            )}
          </div>

          {/* ACTIVE TAB */}
          {bookingSubTab === 'active' && (
            <>
              {activeBookings.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-3">
                  <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
                  <h3 className="font-bold text-stone-800 text-sm">No active reservations</h3>
                  <p className="text-xs text-stone-500">
                    {archivedBookings.length > 0
                      ? `You have ${archivedBookings.length} archived reservation(s) in your Archive tab.`
                      : 'Explore Cainta photography studios and reserve your first session.'}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {archivedBookings.length > 0 && (
                      <button
                        onClick={() => setBookingSubTab('archived')}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
                      >
                        View Archive ({archivedBookings.length})
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate('directory')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                    >
                      Browse Directory
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBookings.map(b => {
                    const studio = getStudioForBooking(b.studioId);
                    return (
                      <div
                        key={b.id}
                        className={`bg-white p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                          b.status === 'Cancelled' ? 'border-rose-200 bg-rose-50/20' : 'border-stone-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-mono text-stone-400 block">Ref: {b.id}</span>
                              <h4 className="font-bold text-stone-900 text-sm">{studio?.name || 'Studio Session'}</h4>
                              <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-stone-400" /> {studio?.address || 'Cainta, Rizal'}
                              </p>
                            </div>
                            {getStatusBadge(b.status, b)}
                          </div>

                          <div className="mt-4 p-3 bg-stone-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-stone-400 text-[10px] uppercase font-semibold block">Date & Time</span>
                              <span className="font-bold text-stone-800">{b.bookingDate}</span>
                              <span className="text-stone-500 block">{b.timeSlot}</span>
                            </div>
                            <div>
                              <span className="text-stone-400 text-[10px] uppercase font-semibold block">Payment Status</span>
                              <span className="font-bold text-amber-700">₱{b.remainingBalance.toLocaleString()} Due</span>
                              {b.amountPaid > 0 ? (
                                <span className="text-[10px] text-emerald-700 font-bold block">Paid: ₱{b.amountPaid.toLocaleString()}</span>
                              ) : b.paymentReference ? (
                                <span className="text-[10px] text-blue-700 font-semibold block">
                                  Proof Submitted (Ref: {b.paymentReference.slice(0, 10)}...)
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-500 block">Paid: ₱0</span>
                              )}
                            </div>
                          </div>

                          {/* Studio Official Social Links & Website */}
                          {studio && (
                            <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[10px] text-stone-400 font-semibold">Studio Links:</span>
                              <StudioSocialLinks studio={studio} variant="badges" size="xs" />
                            </div>
                          )}

                          {b.status === 'Cancelled' && (
                            <div className="mt-2.5 p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                              <span className="text-[11px] font-medium">This reservation was cancelled.</span>
                              <button
                                type="button"
                                disabled={isProcessingAction}
                                onClick={() => handleArchiveBooking(b.id, true)}
                                className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-[10px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                              >
                                <Archive className="w-3 h-3 text-rose-700" /> Archive Record
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {b.amountPaid > 0 ? (
                              <button
                                onClick={() => generateBookingReceiptPDF(b, studio)}
                                className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 p-1.5 rounded-lg border border-stone-200 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border-amber-200"
                                title="Download PDF Receipt"
                              >
                                <Download className="w-3.5 h-3.5 text-amber-600" /> Receipt
                              </button>
                            ) : (
                              <div className="text-[10px] text-stone-400 italic px-2">Deposit pending for receipt</div>
                            )}
                            {b.status !== 'Cancelled' && (
                              <a
                                href={getGoogleCalendarUrl(b, studio)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 p-1.5 rounded-lg border border-stone-200 flex items-center gap-1"
                                title="Add to Google Calendar"
                              >
                                <CalendarPlus className="w-3.5 h-3.5 text-blue-600" /> Calendar
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {b.status === 'Completed' && (
                              <>
                                <button
                                  onClick={() => handleOpenReviewModal(b)}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                                >
                                  <Star className="w-3.5 h-3.5 fill-white" />
                                  {myReviews.some(r => r.bookingId === b.id) ? 'Edit Review' : 'Leave Feedback'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleArchiveBooking(b.id, true)}
                                  className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium flex items-center gap-1"
                                  title="Move to Archive"
                                >
                                  <Archive className="w-3.5 h-3.5 text-stone-500" /> Archive
                                </button>
                              </>
                            )}

                            {b.remainingBalance > 0 && b.status !== 'Cancelled' && b.status !== 'Completed' && (
                              <button
                                onClick={() => onPayBalance(b)}
                                className="px-3 py-1.5 bg-[#0055ff] hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                {b.amountPaid === 0 ? `Pay ₱${(b.downPaymentAmount || Math.round(b.totalAmount * 0.3)).toLocaleString()} via GCash` : `Pay Balance ₱${b.remainingBalance.toLocaleString()}`}
                              </button>
                            )}

                            {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                              <button
                                onClick={() => setRescheduleBooking(b)}
                                className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                              >
                                Reschedule
                              </button>
                            )}

                            {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5"
                              >
                                Cancel
                              </button>
                            )}

                            {b.status === 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleArchiveBooking(b.id, true)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center gap-1"
                              >
                                <Archive className="w-3.5 h-3.5 text-stone-600" /> Archive
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ARCHIVED TAB */}
          {bookingSubTab === 'archived' && (
            <div className="space-y-4">
              <div className="bg-stone-100/70 border border-stone-200 p-4 rounded-2xl flex items-center justify-between text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-stone-600" />
                  <span>
                    <strong>Archived Reservations:</strong> Cancelled or past shoots stored here. You can restore them to active or delete permanently.
                  </span>
                </div>
              </div>

              {archivedBookings.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-3">
                  <Inbox className="w-12 h-12 text-stone-300 mx-auto" />
                  <h3 className="font-bold text-stone-800 text-sm">Archive is empty</h3>
                  <p className="text-xs text-stone-500">You do not have any archived bookings right now.</p>
                  <button
                    onClick={() => setBookingSubTab('active')}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
                  >
                    Back to Active Reservations
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {archivedBookings.map(b => {
                    const studio = getStudioForBooking(b.studioId);
                    return (
                      <div
                        key={b.id}
                        className="bg-stone-50/90 p-5 rounded-2xl border border-stone-300/80 shadow-2xs flex flex-col justify-between space-y-4 opacity-95 hover:opacity-100 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-mono text-stone-500">Ref: {b.id}</span>
                                <span className="px-2 py-0.2 rounded bg-stone-200 text-stone-700 text-[10px] font-bold">
                                  Archived
                                </span>
                              </div>
                              <h4 className="font-bold text-stone-900 text-sm">{studio?.name || 'Studio Session'}</h4>
                              <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-stone-400" /> {studio?.address || 'Cainta, Rizal'}
                              </p>
                            </div>
                            {getStatusBadge(b.status, b)}
                          </div>

                          <div className="mt-3.5 p-3 bg-white rounded-xl border border-stone-200 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-stone-400 text-[10px] uppercase font-semibold block">Shoot Date</span>
                              <span className="font-bold text-stone-800">{b.bookingDate}</span>
                              <span className="text-stone-500 block">{b.timeSlot}</span>
                            </div>
                            <div>
                              <span className="text-stone-400 text-[10px] uppercase font-semibold block">Total & Paid</span>
                              <span className="font-bold text-stone-900">₱{b.totalAmount.toLocaleString()}</span>
                              <span className="text-[10px] text-stone-500 block">Paid: ₱{b.amountPaid.toLocaleString()}</span>
                            </div>
                          </div>

                          {b.cancellationReason && (
                            <div className="mt-2 text-[11px] text-stone-500 bg-stone-100 p-2 rounded-lg italic">
                              Cancel Note: &quot;{b.cancellationReason}&quot;
                            </div>
                          )}

                          {/* Studio Official Social Links & Website */}
                          {studio && (
                            <div className="mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[10px] text-stone-400 font-semibold">Studio Links:</span>
                              <StudioSocialLinks studio={studio} variant="badges" size="xs" />
                            </div>
                          )}
                        </div>

                        {/* Actions for Archived Bookings: Restore & Delete Permanently */}
                        <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            {b.amountPaid > 0 && (
                              <button
                                onClick={() => generateBookingReceiptPDF(b, studio)}
                                className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 p-1.5 rounded-lg border border-stone-200 flex items-center gap-1 bg-white hover:bg-stone-50"
                                title="Download Archived Receipt"
                              >
                                <Download className="w-3.5 h-3.5 text-stone-500" /> Receipt
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isProcessingAction}
                              onClick={() => handleArchiveBooking(b.id, false)}
                              className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-stone-600" /> Restore
                            </button>

                            <button
                              type="button"
                              disabled={isProcessingAction}
                              onClick={() => handleDeleteBookingPermanently(b.id)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Print Orders */}
      {activeTab === 'prints' && (
        <div className="space-y-4">
          {printOrders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-xs text-stone-500">
              No physical print orders yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {printOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={order.uploadedPhoto}
                      alt="Order print"
                      className="w-16 h-16 rounded-xl object-cover border border-stone-200"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-stone-400">Order: {order.id}</span>
                      <h5 className="font-bold text-xs text-stone-900 truncate">Print Keepsake (x{order.quantity})</h5>
                      <span className="text-xs font-bold text-amber-700 block">₱{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded-xl text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Status:</span>
                      <span className="font-bold text-stone-800 uppercase">{order.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Payment:</span>
                      <span className={`font-bold ${order.paymentStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {order.paymentStatus === 'verified' ? 'Verified' : 'Pending Confirmation'}
                      </span>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Courier Tracking:</span>
                        <span className="font-mono font-bold text-blue-600">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {order.paymentStatus === 'verified' ? (
                      <button
                        onClick={() => generatePrintReceiptPDF(order, studios.find(s => s.id === order.studioId))}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF Invoice
                      </button>
                    ) : (
                      <div className="w-full py-2 text-center text-[10px] text-stone-400 bg-stone-100 rounded-xl italic">
                        Invoice available after verification
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Photo Proofing */}
      {activeTab === 'proofing' && (
        <div className="space-y-6">
          {proofings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-xs text-stone-500">
              No active photo proofing sessions yet. Your studio will send previews once your shoot is completed.
            </div>
          ) : (
            proofings.map(proof => (
              <ClientGallery
                key={proof.id}
                proofing={proof}
                currentUser={currentUser}
                isStudioOwner={false}
                onUpdate={updated => {
                  setProofings(prev => prev.map(p => (p.id === updated.id ? updated : p)));
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Tab 4: Saved Studios */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-xs text-stone-500">
              You haven't saved any studios yet. Click the heart icon on any studio card to save.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {studios
                .filter(s => favorites.includes(s.id))
                .map(s => (
                  <div key={s.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden p-4 space-y-3">
                    <img src={s.portfolioImages?.[0] || s.coverImage || s.logo} alt={s.name} className="w-full h-32 object-cover rounded-xl" />
                    <h5 className="font-bold text-xs text-stone-900">{s.name}</h5>
                    <p className="text-xs text-stone-500">{s.location}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                      <button
                        onClick={() => onToggleFavorite(s.id)}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => onNavigate('directory', { selectedStudioId: s.id })}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold"
                      >
                        View Studio
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: My Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {myReviews.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-3">
              <Star className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-bold text-stone-800 text-sm">No reviews posted yet</h3>
              <p className="text-xs text-stone-500">
                After completing a photoshoot booking with a studio, click "Leave Feedback" on your booking card to rate your experience.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReviews.map(rev => {
                const studio = studios.find(s => s.id === rev.studioId);
                const linkedBooking = bookings.find(b => b.id === rev.bookingId);
                return (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified Customer
                          </span>
                        </div>
                        <h4 className="font-bold text-stone-900 text-sm mt-1">{studio?.name || 'Studio Session'}</h4>
                        {linkedBooking && (
                          <span className="text-[10px] text-stone-400 font-mono block">
                            Shoot Date: {linkedBooking.bookingDate} ({linkedBooking.timeSlot})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold text-amber-900">{rev.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                      "{rev.comment}"
                    </p>

                    <div className="text-[10px] text-stone-400 flex justify-between items-center pt-1">
                      <span>Posted on {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      {linkedBooking && (
                        <button
                          onClick={() => handleOpenReviewModal(linkedBooking)}
                          className="text-xs text-amber-700 hover:underline font-bold"
                        >
                          Edit Feedback
                        </button>
                      )}
                    </div>

                    {rev.reply && (
                      <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs space-y-1 mt-2">
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-700" /> Studio Response
                          <span className="text-[10px] text-stone-400 font-normal ml-auto">
                            {new Date(rev.replyAt || rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-stone-700">{rev.reply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Leave Feedback Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Photoshoot Feedback
                </span>
                <h3 className="font-bold text-stone-900 text-base">
                  Rate {getStudioForBooking(reviewBooking.studioId)?.name || 'Studio Session'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Photoshoot on {reviewBooking.bookingDate} at {reviewBooking.timeSlot} (Ref: {reviewBooking.id})
                </p>
              </div>
              <button
                onClick={() => setReviewBooking(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">Overall Rating:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-black text-amber-700 ml-2">{reviewRating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Your Detailed Experience:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell other Cainta clients about studio equipment, staff warmth, lighting quality, photographer direction, and proofing speed..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full p-3 text-xs bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Publishing...' : 'Publish Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={Boolean(rescheduleBooking)}
        onClose={() => setRescheduleBooking(null)}
        booking={rescheduleBooking}
        onRescheduled={() => loadCustomerData()}
      />
    </div>
  );
};
