import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  FileText,
  Sparkles,
  Download,
  CalendarPlus
} from 'lucide-react';
import type { Studio, Service, Package, Addon, User, Booking } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { generateBookingReceiptPDF } from '../utils/pdfGenerator.js';
import { getGoogleCalendarUrl, downloadICSFile } from '../utils/calendarSync.js';
import { playCameraShutter } from '../utils/soundEffects.js';
import { StudioSocialLinks } from './StudioSocialLinks.js';
import { toast } from '../utils/toast.js';

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  studio: Studio;
  services: Service[];
  packages: Package[];
  addons: Addon[];
  currentUser: User | null;
  onBookingComplete: (booking: Booking, paymentOption: string, paymentMethod: string) => void;
  onRequireLogin: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  isOpen,
  onClose,
  studio,
  services,
  packages,
  addons,
  currentUser,
  onBookingComplete,
  onRequireLogin
}) => {
  const [step, setStep] = useState(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().substring(0, 10);
  });
  const [timeSlot, setTimeSlot] = useState<string>('10:00');
  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.contactNumber || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [requirementsDoc, setRequirementsDoc] = useState<string | null>(null);

  const [paymentOption, setPaymentOption] = useState<'downpayment' | 'full'>('downpayment');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'cash' | 'bank_transfer'>('gcash');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Available slots logic
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  const availableSlots = useMemo(() => {
    if (selectedService && selectedService.availableSlots?.length > 0) {
      return selectedService.availableSlots;
    }
    return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  }, [selectedService]);

  // Pricing calculations
  const basePrice = useMemo(() => {
    if (selectedPackageId && selectedPackage) return selectedPackage.price;
    if (selectedService) return selectedService.basePrice;
    return 0;
  }, [selectedPackageId, selectedPackage, selectedService]);

  const addonsTotal = useMemo(() => {
    return Object.entries(selectedAddons).reduce((acc, [id, qty]) => {
      const addon = addons.find(a => a.id === id);
      return acc + (addon ? addon.price * qty : 0);
    }, 0);
  }, [selectedAddons, addons]);

  const totalAmount = basePrice + addonsTotal;
  const downPaymentAmount = Math.round(totalAmount * 0.3);

  const toggleAddon = (addonId: string, delta: number) => {
    setSelectedAddons(prev => {
      const cur = prev[addonId] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: next };
    });
  };

  const handleCreateBooking = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const formattedAddons = Object.entries(selectedAddons).map(([addonId, quantity]) => {
      const ad = addons.find(a => a.id === addonId);
      return {
        addonId,
        name: ad?.name || 'Add-on',
        price: ad?.price || 0,
        quantity
      };
    });

    try {
      playCameraShutter();
      const payload = {
        studioId: studio.id,
        serviceId: selectedServiceId || undefined,
        packageId: selectedPackageId || undefined,
        bookingDate,
        timeSlot,
        addons: formattedAddons,
        customerName,
        customerEmail,
        customerPhone,
        customerNotes,
        requirementsDoc,
        paymentOption
      };

      const booking = await apiRequest<Booking>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCompletedBooking(booking);
      setStep(6); // confirmation step
      toast.success(`Matagumpay na naitakda ang reservation sa ${studio.name}!`, {
        title: 'Booking Saved'
      });
      onBookingComplete(booking, paymentOption, paymentMethod);
    } catch (err: any) {
      const msg = err.message || 'Hindi ma-proseso ang booking. Pakisuri ang slot availability.';
      setErrorMsg(msg);
      toast.error(msg, { title: 'Booking Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-scaleUp">
        {/* Header */}
        <div className="bg-[#2c2a29] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={studio.logo}
              alt={studio.name}
              className="w-10 h-10 rounded-xl object-cover border border-stone-700"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base leading-tight">Book a Session at {studio.name}</h3>
              </div>
              <p className="text-xs text-amber-400">Step {step} of 5 • {studio.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StudioSocialLinks studio={studio} variant="compact-icons" size="xs" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="bg-stone-100 px-6 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-amber-700 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Service</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-amber-700 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-amber-600 text-white' : 'bg-stone-300'}`}>2</span>
            <span>Addons</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-amber-700 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-amber-600 text-white' : 'bg-stone-300'}`}>3</span>
            <span>Date & Slot</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-amber-700 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-amber-600 text-white' : 'bg-stone-300'}`}>4</span>
            <span>Details</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <div className={`flex items-center gap-1.5 ${step >= 5 ? 'text-amber-700 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 5 ? 'bg-amber-600 text-white' : 'bg-stone-300'}`}>5</span>
            <span>Payment</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SERVICE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-stone-900 text-base">Select Primary Photography Service</h4>
                <p className="text-xs text-stone-500">Choose the package or service tailored to your milestone in Cainta.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {services.map(srv => (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedServiceId === srv.id
                        ? 'border-amber-600 bg-amber-50/40 shadow-md'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <img
                        src={srv.image}
                        alt={srv.name}
                        className="w-full h-32 object-cover rounded-xl mb-2.5"
                      />
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-stone-900 text-sm">{srv.name}</h5>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          ₱{srv.basePrice.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">{srv.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" /> {srv.durationMinutes} mins
                      </span>
                      <span className="font-medium text-amber-600">{srv.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PACKAGES & ADD-ONS */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-stone-900 text-base">Upgrade with Packages & Add-ons (Optional)</h4>
                <p className="text-xs text-stone-500">Enhance your session with extra prints, HMUA, or high-res raw files.</p>
              </div>

              {packages.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Milestone Packages</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packages.map(pkg => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(selectedPackageId === pkg.id ? '' : pkg.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedPackageId === pkg.id
                            ? 'border-amber-600 bg-amber-50/50 shadow-md'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h6 className="font-bold text-sm text-stone-900">{pkg.name}</h6>
                          <span className="text-xs font-bold text-amber-600">₱{pkg.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">{pkg.description}</p>
                        <div className="mt-2 text-[11px] text-stone-500">
                          <span>Includes: {pkg.includedPrints}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Available Studio Add-ons</h5>
                <div className="space-y-2">
                  {addons.map(addon => {
                    const qty = selectedAddons[addon.id] || 0;
                    return (
                      <div
                        key={addon.id}
                        className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-stone-900">{addon.name}</div>
                          <div className="text-[11px] text-stone-500">{addon.description}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-stone-800">₱{addon.price.toLocaleString()}</span>
                          <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => toggleAddon(addon.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-semibold">{qty}</span>
                            <button
                              type="button"
                              onClick={() => toggleAddon(addon.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-stone-900 text-base">Select Date & Time Slot</h4>
                <p className="text-xs text-stone-500">Choose from real-time available studio slots.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().substring(0, 10)}
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Operating Hours: {studio.businessHours}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Available Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className={`py-2 px-1 text-xs rounded-xl font-medium border text-center transition-all ${
                          timeSlot === slot
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: YOUR DETAILS */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-stone-900 text-base">Your Booking Information</h4>
                <p className="text-xs text-stone-500">We'll use these details to confirm your session and email receipts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number (PH)</label>
                  <input
                    type="tel"
                    required
                    placeholder="+63 9XX XXX XXXX"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Special Notes / Posing Requests</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Need university hood color blue, bring 2 outfits"
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    className="w-full text-xs p-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PAYMENT & SUMMARY */}
          {step === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Payment Settings */}
              <div className="md:col-span-3 space-y-4">
                <div>
                  <h4 className="font-bold text-stone-900 text-base">Select Payment Terms & Method</h4>
                  <p className="text-xs text-stone-500">Secure your Cainta studio slot with downpayment or full payment.</p>
                </div>

                {/* Option Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('downpayment')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      paymentOption === 'downpayment'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    30% Downpayment (₱{downPaymentAmount.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentOption('full')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      paymentOption === 'full'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Full Payment (₱{totalAmount.toLocaleString()})
                  </button>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-700">Choose Payment Channel</label>
                  <div className="space-y-2">
                    <div
                      onClick={() => setPaymentMethod('gcash')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'gcash'
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                          G
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900">GCash QR Ph (Real-time Instant)</div>
                          <div className="text-[11px] text-stone-500">Generates instant PayMongo QR code</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'cash'
                          ? 'border-amber-600 bg-amber-50/40'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                          ₱
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900">Cash Payment On-site</div>
                          <div className="text-[11px] text-stone-500">Pay downpayment in person within 24 hours</div>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-amber-600 bg-amber-50/40'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-stone-800 text-white font-bold flex items-center justify-center text-xs">
                          🏛️
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900">BDO / BPI Bank Transfer</div>
                          <div className="text-[11px] text-stone-500">Upload bank slip proof after booking</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="md:col-span-2 bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <h5 className="font-bold text-xs uppercase text-stone-500 tracking-wider">Order Summary</h5>

                <div className="text-xs space-y-1.5 pb-3 border-b border-stone-200 text-stone-700">
                  <div className="flex justify-between">
                    <span className="font-medium truncate max-w-[140px]">{selectedService?.name}</span>
                    <span>₱{basePrice.toLocaleString()}</span>
                  </div>
                  {Object.entries(selectedAddons).map(([id, qty]) => {
                    const ad = addons.find(a => a.id === id);
                    return (
                      <div key={id} className="flex justify-between text-[11px] text-stone-500">
                        <span>{ad?.name} (x{qty})</span>
                        <span>₱{((ad?.price || 0) * qty).toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-[11px] text-stone-500 pt-1">
                    <span>Date: {bookingDate}</span>
                    <span>Time: {timeSlot}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Total Session Amount</span>
                    <span className="font-semibold text-stone-900">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Due Now ({paymentOption === 'downpayment' ? '30%' : '100%'})</span>
                    <span>₱{(paymentOption === 'downpayment' ? downPaymentAmount : totalAmount).toLocaleString()}</span>
                  </div>
                  {paymentOption === 'downpayment' && (
                    <div className="flex justify-between text-stone-500 text-[11px]">
                      <span>Balance Due at Studio</span>
                      <span>₱{(totalAmount - downPaymentAmount).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200">
                  ⚡ Time slot is reserved for 24 hours. Booking automatically confirms upon downpayment.
                </div>

                {/* Studio Social Links & Official Channels */}
                <div className="pt-2 border-t border-stone-100">
                  <div className="text-[10px] text-stone-400 font-semibold mb-1.5 uppercase tracking-wider">
                    Studio Official Social Pages & Website:
                  </div>
                  <StudioSocialLinks studio={studio} variant="badges" size="xs" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CONFIRMATION SUCCESS */}
          {step === 6 && completedBooking && (
            <div className="text-center py-6 space-y-4 animate-scaleUp">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-stone-900">Booking Reservation Created!</h4>
                <p className="text-xs text-stone-600 mt-1">
                  Reference: <strong className="text-stone-900">{completedBooking.id}</strong> • Studio: {studio.name}
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-stone-500">Scheduled Date:</span>
                  <span className="font-bold">{completedBooking.bookingDate} at {completedBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Amount Due:</span>
                  <span className="font-bold text-amber-600">
                    ₱{(completedBooking.paymentOption === 'downpayment' ? completedBooking.downPaymentAmount : completedBooking.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                    {completedBooking.status}
                  </span>
                </div>

                {/* Studio Connect Social Links */}
                <div className="pt-2 mt-2 border-t border-stone-200/80">
                  <span className="text-[10px] text-stone-500 font-semibold block mb-1">
                    Connect with {studio.name}:
                  </span>
                  <StudioSocialLinks studio={studio} variant="badges" size="xs" />
                </div>
              </div>

              {/* Action Buttons: PDF Receipt & Google Calendar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => generateBookingReceiptPDF(completedBooking, studio)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  Download PDF Receipt
                </button>

                <a
                  href={getGoogleCalendarUrl(completedBooking, studio)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
                >
                  <CalendarPlus className="w-4 h-4 text-blue-600" />
                  Add to Google Calendar
                </a>

                <button
                  onClick={() => downloadICSFile(completedBooking, studio)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold"
                >
                  <Calendar className="w-4 h-4 text-stone-600" />
                  .ics File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {step < 6 && (
          <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl shadow-md transition-colors"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-confirm-and-pay"
                disabled={isSubmitting}
                onClick={handleCreateBooking}
                className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm & Proceed to Payment'}
              </button>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 text-center">
            <button
              onClick={onClose}
              className="text-xs font-bold text-stone-700 hover:text-stone-900 px-6 py-2 rounded-xl border border-stone-300 hover:bg-white"
            >
              Done & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
