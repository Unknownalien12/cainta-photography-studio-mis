import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  ShieldCheck,
  X,
  Copy,
  Check,
  Download,
  Building2,
  Phone,
  FileCheck2,
  Sparkles,
  RefreshCw,
  Coins,
  Send,
  HelpCircle,
  Info
} from 'lucide-react';
import type { GCashQRSession } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { playPaymentSuccessSound } from '../utils/soundEffects.js';

interface GCashQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: GCashQRSession | null;
  onPaymentConfirmed: (data: any) => void;
}

export const GCashQRModal: React.FC<GCashQRModalProps> = ({
  isOpen,
  onClose,
  session,
  onPaymentConfirmed
}) => {
  const [activeSession, setActiveSession] = useState<GCashQRSession | null>(session);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSwitchingOption, setIsSwitchingOption] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'qr' | 'express'>('qr');

  // Manual proof submission state
  const [manualRef, setManualRef] = useState('');
  const [manualProofFile, setManualProofFile] = useState<string | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveSession(session);
    setTimeLeft(30 * 60);
    setIsSuccess(false);
    setIsPendingReview(false);
    setManualRef('');
    setManualProofFile(null);
  }, [session]);

  // 30-minute countdown
  useEffect(() => {
    if (!isOpen || !activeSession) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeSession]);

  // Polling every 4 seconds
  useEffect(() => {
    if (!isOpen || !activeSession || isSuccess) return;

    const pollInterval = setInterval(async () => {
      try {
        const fresh = await apiRequest<GCashQRSession>(`/api/payments/gcash/session/${activeSession.id}`);
        if (fresh.status === 'paid') {
          handleConfirmed(fresh);
        }
      } catch (err) {
        // silent retry
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [isOpen, activeSession, isSuccess]);

  // SSE Stream Listener
  useEffect(() => {
    if (!isOpen || !activeSession || isSuccess) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/payments/gcash/stream');
      eventSource.onmessage = e => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'payment.confirmed' && (data.sessionId === activeSession.id || data.bookingId === activeSession.bookingId)) {
            handleConfirmed(data);
          } else if (data.type === 'payment.proof_submitted' && data.sessionId === activeSession.id) {
            setIsPendingReview(true);
          }
        } catch {
          // ignore heartbeats
        }
      };
    } catch {
      // fallback to polling
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isOpen, activeSession, isSuccess]);

  const handleConfirmed = (data: any) => {
    setIsSuccess(true);
    setIsPendingReview(false);
    playPaymentSuccessSound();
    setTimeout(() => {
      onPaymentConfirmed(data);
    }, 1800);
  };

  const handleCopyNumber = (num?: string) => {
    if (!num) return;
    const cleanNum = num.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(cleanNum);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Switch between 30% Downpayment and 100% Full Payment (Regenerates dynamic QR code)
  const handleSwitchOption = async (option: 'downpayment' | 'full') => {
    if (!activeSession || isSwitchingOption || activeSession.paymentType === option) return;

    setIsSwitchingOption(true);
    setErrorMsg(null);
    try {
      const updated = await apiRequest<GCashQRSession>(`/api/payments/gcash/session/${activeSession.id}/switch-option`, {
        method: 'PUT',
        body: JSON.stringify({ paymentOption: option })
      });
      setActiveSession(updated);
    } catch (err: any) {
      console.warn('Switch option request failed, calculating locally:', err);
      const full = activeSession.fullAmount || activeSession.amount;
      const down = activeSession.downPaymentAmount || Math.round(full * 0.3);
      const newAmt = option === 'full' ? full : down;
      setActiveSession(prev => prev ? {
        ...prev,
        paymentType: option,
        amount: newAmt
      } : null);
    } finally {
      setIsSwitchingOption(false);
    }
  };

  // Instant sandbox test simulation trigger
  const handleSimulateWebhook = async () => {
    if (!activeSession) return;
    setIsSimulating(true);
    try {
      await apiRequest('/api/webhooks/paymongo', {
        method: 'POST',
        body: JSON.stringify({ sessionId: activeSession.id })
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Webhook simulation error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setManualProofFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !manualRef.trim()) return;

    setSubmittingManual(true);
    setErrorMsg(null);
    try {
      await apiRequest('/api/payments/gcash/submit-proof', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSession.id,
          referenceNumber: manualRef.trim(),
          proofOfPayment: manualProofFile
        })
      });
      setIsPendingReview(true);
      playPaymentSuccessSound();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit payment proof');
    } finally {
      setSubmittingManual(false);
    }
  };

  if (!isOpen || !activeSession) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const studioName = activeSession.studioName || 'Cainta Photography Studio';
  const gcashName = activeSession.studioGcashName || studioName;
  const gcashNumber = activeSession.studioGcashNumber || '0917-822-1010';

  const fullAmount = activeSession.fullAmount || (activeSession.paymentType === 'full' ? activeSession.amount : Math.round(activeSession.amount / 0.3));
  const downPaymentAmount = activeSession.downPaymentAmount || Math.round(fullAmount * 0.3);
  const remainingBalance = Math.max(0, fullAmount - activeSession.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-scaleUp max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-[#0055ff] p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black text-xl text-[#0055ff] shadow-sm">
              G
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base leading-tight">GCash & QR Ph Payment</h3>
                <span className="px-2 py-0.5 bg-emerald-400 text-emerald-950 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-Generated
                </span>
              </div>
              <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" /> Studio: <strong>{studioName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Confirmed Screen */}
          {isSuccess ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="text-xl font-bold text-stone-900">Payment Confirmed!</h4>
              <p className="text-sm text-stone-600 max-w-sm mx-auto">
                Ang iyong GCash payment na <span className="font-bold text-stone-900">₱{activeSession.amount.toLocaleString()}</span> ay kumpirmado na para sa <strong className="text-stone-900">{studioName}</strong>. Naka-reserve na ang iyong photoshoot schedule!
              </p>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800">
                Napadala na ang confirmation receipt at studio directions sa iyong dashboard at notification.
              </div>
            </div>
          ) : isPendingReview ? (
            /* Proof Submitted & Pending Studio Review */
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <FileCheck2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Naisumite na ang Proof sa {studioName}!</h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Ang GCash Reference <strong>#{manualRef}</strong> ay naipadala na sa studio owner. Kapag na-verify ito sa kanilang GCash app, magiging <strong>Confirmed</strong> agad ang iyong reservation.
              </p>
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 text-left space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" /> Real-time Studio Verification:
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Maaari mong subaybayan ang booking status sa iyong Customer Dashboard habang bineberipika ng studio owner.
                </p>
              </div>
              <button
                onClick={() => onPaymentConfirmed({ sessionId: activeSession.id, pendingReview: true })}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
              >
                Pumunta sa My Bookings
              </button>
            </div>
          ) : (
            <>
              {/* Payment Mode Selector: 30% Downpayment vs Full Payment */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#0055ff]" /> 1. Piliin ang Halaga ng Babayaran
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">Awtomatikong mag-uupdate ang QR</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => handleSwitchOption('downpayment')}
                    disabled={isSwitchingOption}
                    className={`p-3 rounded-xl font-bold transition-all text-left flex flex-col justify-between ${
                      activeSession.paymentType === 'downpayment'
                        ? 'bg-white text-blue-950 shadow-sm border border-blue-200 ring-2 ring-[#0055ff]/20'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">30% Downpayment</span>
                      {activeSession.paymentType === 'downpayment' && (
                        <span className="w-2 h-2 rounded-full bg-[#0055ff]" />
                      )}
                    </div>
                    <div className="text-base font-black text-[#0055ff] mt-1">
                      ₱{downPaymentAmount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal mt-0.5">
                      I-lock ang slot, balance sa shoot day
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchOption('full')}
                    disabled={isSwitchingOption}
                    className={`p-3 rounded-xl font-bold transition-all text-left flex flex-col justify-between ${
                      activeSession.paymentType === 'full'
                        ? 'bg-white text-blue-950 shadow-sm border border-blue-200 ring-2 ring-[#0055ff]/20'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">100% Full Payment</span>
                      {activeSession.paymentType === 'full' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <div className="text-base font-black text-emerald-700 mt-1">
                      ₱{fullAmount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-stone-500 font-normal mt-0.5">
                      Bayad nang buo
                    </span>
                  </button>
                </div>
              </div>

              {/* Recipient Studio & Amount Due Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                      Halaga na Babayaran
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-blue-950">
                        ₱{activeSession.amount.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-stone-500 font-semibold">
                        ({activeSession.paymentType === 'downpayment' ? '30% Downpayment' : 'Full Payment'})
                      </span>
                    </div>
                    {activeSession.paymentType === 'downpayment' && remainingBalance > 0 && (
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Ang natitirang balance na <strong>₱{remainingBalance.toLocaleString()}</strong> ay babayaran sa shoot day sa studio.
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-blue-700 font-bold uppercase flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-blue-600" /> Session Timer
                    </span>
                    <span className="text-sm font-bold text-blue-950 font-mono">
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Direct Studio GCash Details */}
                <div className="bg-white/95 p-3 rounded-xl border border-blue-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[11px]">Pangalan sa GCash:</span>
                    <span className="font-bold text-stone-900">{gcashName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[11px]">GCash Mobile Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#0055ff]">{gcashNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(gcashNumber)}
                        className="py-1 px-2 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-[#0055ff] rounded-lg transition-colors flex items-center gap-1 border border-blue-200"
                        title="Kopyahin ang GCash Number"
                      >
                        {copiedNumber ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Kopyado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods: QR Ph Scan vs Express Send */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPaymentTab('qr')}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      paymentTab === 'qr'
                        ? 'bg-white text-[#0055ff] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    1. QR Ph Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTab('express')}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      paymentTab === 'express'
                        ? 'bg-white text-[#0055ff] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    2. GCash Express Send
                  </button>
                </div>

                {paymentTab === 'qr' ? (
                  /* Dynamic QR Presentation Box */
                  <div className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-200 animate-fadeIn">
                    <div className="relative">
                      <div className="bg-white p-3.5 rounded-2xl shadow-md border border-stone-200 relative group">
                        {isSwitchingOption ? (
                          <div className="w-52 h-52 flex flex-col items-center justify-center bg-stone-50 rounded-xl gap-2 text-stone-500 text-xs font-semibold">
                            <RefreshCw className="w-6 h-6 text-[#0055ff] animate-spin" />
                            <span>Ina-update ang Dynamic QR...</span>
                          </div>
                        ) : (
                          <img
                            src={activeSession.qrCodeData}
                            alt={`${studioName} Dynamic Order QR`}
                            className="w-52 h-52 object-contain"
                          />
                        )}
                        <a
                          href={activeSession.qrCodeData}
                          download={`GCash_QR_${studioName.replace(/\s+/g, '_')}_P${activeSession.amount}.png`}
                          className="absolute bottom-2 right-2 p-1.5 bg-white/95 hover:bg-white text-stone-700 rounded-lg shadow-xs border border-stone-200 text-[10px] font-semibold flex items-center gap-1"
                          title="I-save ang QR Code"
                        >
                          <Download className="w-3.5 h-3.5 text-[#0055ff]" /> Save QR
                        </a>
                      </div>
                    </div>

                    <div className="mt-2.5 text-center space-y-0.5 max-w-xs">
                      <p className="text-xs text-stone-800 font-bold">
                        I-scan gamit ang GCash / Maya / Bank QR Ph Scanner
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Nakasulat na sa QR ang eksaktong halaga na <strong className="text-stone-800">₱{activeSession.amount.toLocaleString()}</strong> para sa {studioName}.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Express Send Instructions Box */
                  <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3 animate-fadeIn text-xs">
                    <div className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-[#0055ff]" />
                      Paano magbayad gamit ang GCash Express Send:
                    </div>
                    <ol className="space-y-2 text-stone-700 text-[11px] pl-1">
                      <li className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0055ff] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                        <span>Buksan ang iyong GCash app at pumunta sa <strong>Send</strong> → <strong>Express Send</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0055ff] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                        <span>I-send ang <strong className="text-blue-900">₱{activeSession.amount.toLocaleString()}</strong> sa GCash Number: <strong className="font-mono text-[#0055ff]">{gcashNumber}</strong> ({gcashName}).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0055ff] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                        <span>Kopyahin ang <strong>13-digit Reference Number</strong> mula sa GCash SMS o receipt at i-paste sa Step 2 sa ibaba.</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Step 2: Reference Number & Receipt Submission Form */}
              <form onSubmit={handleSubmitProof} className="bg-stone-50/90 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" /> Step 2: I-enter ang GCash Reference Number
                  </h5>
                  <span className="text-[10px] text-stone-400 font-medium">Awtomatikong mapapadala sa studio</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    13-Digit GCash Reference Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Hal. 1029384756123 o 20260925-102938"
                    value={manualRef}
                    onChange={e => setManualRef(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#0055ff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    I-attach ang Screenshot / Receipt (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-stone-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {manualProofFile && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Naka-attach
                      </span>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submittingManual || !manualRef.trim()}
                  className="w-full py-2.5 bg-[#0055ff] hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingManual ? 'Ipinapadala sa Studio Owner...' : `Isumite ang ₱${activeSession.amount.toLocaleString()} Payment sa Studio`}
                </button>
              </form>

              {/* Developer / Demo Instant Test Tool */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-amber-950">
                    <span className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Sparkles className="w-4 h-4 text-amber-600" /> Testing & Demo Sandbox Mode
                    </span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Para ma-test ang booking nang hindi kailangang magbawas ng totoong pera sa iyong GCash account:
                    </p>
                  </div>
                </div>
                <button
                  id="btn-simulate-gcash-scan"
                  type="button"
                  onClick={handleSimulateWebhook}
                  disabled={isSimulating}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSimulating ? 'Pinoproseso ang Test...' : '⚡ I-simulate ang Instant GCash Scan (Test Confirm)'}
                </button>
              </div>

              {/* Security Tag */}
              <div className="flex items-center justify-center gap-1 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dynamic EMVCo QR Ph Generated for {studioName}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
