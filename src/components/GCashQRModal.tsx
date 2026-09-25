import React, { useState, useEffect } from 'react';
import { QrCode, Clock, CheckCircle2, AlertCircle, Upload, ShieldCheck, X } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Manual fallback state
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualRef, setManualRef] = useState('');
  const [manualProofFile, setManualProofFile] = useState<string | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 30-minute countdown
  useEffect(() => {
    if (!isOpen || !session) return;
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
  }, [isOpen, session]);

  // Polling every 4 seconds
  useEffect(() => {
    if (!isOpen || !session || isSuccess) return;

    const pollInterval = setInterval(async () => {
      try {
        const fresh = await apiRequest<GCashQRSession>(`/api/payments/gcash/session/${session.id}`);
        if (fresh.status === 'paid') {
          handleConfirmed(fresh);
        }
      } catch (err) {
        // silent retry
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [isOpen, session, isSuccess]);

  // SSE Stream Listener
  useEffect(() => {
    if (!isOpen || !session || isSuccess) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/payments/gcash/stream');
      eventSource.onmessage = e => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'payment.confirmed' && data.sessionId === session.id) {
            handleConfirmed(data);
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
  }, [isOpen, session, isSuccess]);

  const handleConfirmed = (data: any) => {
    setIsSuccess(true);
    playPaymentSuccessSound();
    setTimeout(() => {
      onPaymentConfirmed(data);
    }, 1800);
  };

  // Instant sandbox test simulation trigger
  const handleSimulateWebhook = async () => {
    if (!session) return;
    setIsSimulating(true);
    try {
      await apiRequest('/api/webhooks/paymongo', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id })
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

  const handleSubmitManualProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !manualRef) return;

    setSubmittingManual(true);
    setErrorMsg(null);
    try {
      await apiRequest('/api/payments/gcash/submit-proof', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.id,
          referenceNumber: manualRef,
          proofOfPayment: manualProofFile
        })
      });
      setIsSuccess(true);
      playPaymentSuccessSound();
      setTimeout(() => {
        onPaymentConfirmed({ sessionId: session.id, manual: true });
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit proof');
    } finally {
      setSubmittingManual(false);
    }
  };

  if (!isOpen || !session) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-scaleUp">
        {/* Top Header */}
        <div className="bg-[#0055ff] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/20">
              G
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pay with GCash QR Ph</h3>
              <p className="text-xs text-blue-100">PayMongo Sandbox Real-time Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Splash Screen */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h4 className="text-xl font-bold text-stone-900">Payment Confirmed!</h4>
            <p className="text-sm text-stone-600">
              Your GCash payment of <span className="font-bold text-stone-900">₱{session.amount.toLocaleString()}</span> has been verified and processed in real time.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Amount and 30-min countdown */}
            <div className="flex items-center justify-between bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
              <div>
                <span className="text-[11px] text-blue-800 font-semibold uppercase block">Amount Due</span>
                <span className="text-2xl font-extrabold text-blue-950">₱{session.amount.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-blue-800 font-semibold uppercase flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Expires In
                </span>
                <span className="text-base font-bold text-blue-950 font-mono">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* QR Code Presentation Box */}
            <div className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="bg-white p-3 rounded-xl shadow-md border border-stone-200">
                <img
                  src={session.qrCodeData}
                  alt="GCash QR Ph"
                  className="w-52 h-52 object-contain"
                />
              </div>
              <p className="mt-3 text-xs text-center text-stone-600 max-w-xs font-medium">
                Open GCash or any QR Ph compliant e-wallet app, tap <strong className="text-blue-700">Scan QR</strong>, and point camera at the screen.
              </p>
            </div>

            {/* PayMongo Sandbox Demo Trigger */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="text-xs text-amber-900">
                <span className="font-bold block">Sandbox Test Mode:</span>
                <span>Simulate instant customer GCash scan</span>
              </div>
              <button
                id="btn-simulate-gcash-scan"
                onClick={handleSimulateWebhook}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
              >
                {isSimulating ? 'Processing...' : 'Simulate Scan'}
              </button>
            </div>

            {/* Manual Fallback Option */}
            <div className="pt-2 border-t border-stone-100 text-center">
              {!showManualFallback ? (
                <button
                  onClick={() => setShowManualFallback(true)}
                  className="text-xs font-medium text-stone-600 hover:text-stone-900 underline"
                >
                  Already scanned? Enter reference number or upload screenshot manually
                </button>
              ) : (
                <form onSubmit={handleSubmitManualProof} className="space-y-3 text-left mt-2 animate-fadeIn">
                  <h5 className="text-xs font-bold text-stone-800">Attach Manual GCash Reference</h5>
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. GCASH-10928374"
                      value={manualRef}
                      onChange={e => setManualRef(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Screenshot / Receipt Photo (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-stone-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-stone-100 file:text-stone-700"
                    />
                  </div>
                  {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
                  <button
                    type="submit"
                    disabled={submittingManual}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium text-xs shadow-sm"
                  >
                    {submittingManual ? 'Verifying...' : 'Submit Manual Reference'}
                  </button>
                </form>
              )}
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit Encrypted GCash QR Ph Gateway</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
