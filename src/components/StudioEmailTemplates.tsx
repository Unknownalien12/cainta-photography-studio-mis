import React, { useState } from 'react';
import { Mail, Copy, Check, Sparkles, Send, User, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import type { Studio, Booking } from '../db/types.js';
import { toast } from '../utils/toast.js';

interface StudioEmailTemplatesProps {
  studio: Studio;
  bookings: Booking[];
}

export const StudioEmailTemplates: React.FC<StudioEmailTemplatesProps> = ({
  studio,
  bookings
}) => {
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const [selectedTemplate, setSelectedTemplate] = useState<'confirmation' | 'payment_reminder' | 'proofing' | 'print_ready'>('confirmation');
  const [selectedBookingId, setSelectedBookingId] = useState<string>(safeBookings[0]?.id || '');
  const [customClientName, setCustomClientName] = useState(safeBookings[0]?.customerName || 'Valued Client');
  const [customClientEmail, setCustomClientEmail] = useState(safeBookings[0]?.customerEmail || 'client@example.com');
  const [copied, setCopied] = useState(false);

  const activeBooking = safeBookings.find(b => b.id === selectedBookingId);

  const clientName = activeBooking?.customerName || customClientName;
  const bookingDate = activeBooking?.bookingDate || '2026-10-15';
  const timeSlot = activeBooking?.timeSlot || '14:00 - 15:00';
  const totalAmount = activeBooking?.totalAmount ? `₱${activeBooking.totalAmount.toLocaleString()}` : '₱2,500';
  const balanceAmount = activeBooking?.remainingBalance ? `₱${activeBooking.remainingBalance.toLocaleString()}` : '₱1,000';
  const refId = activeBooking?.id || 'BK-2026-X9';

  const getTemplateContent = () => {
    switch (selectedTemplate) {
      case 'confirmation':
        return {
          subject: `Booking Confirmed! [${refId}] - ${studio.name} (Cainta)`,
          body: `Dear ${clientName},

We are thrilled to confirm your photography shoot reservation with ${studio.name}! Here are your official booking details:

• Reference ID: ${refId}
• Studio Location: ${studio.address}
• Date & Time Slot: ${bookingDate} at ${timeSlot}
• Total Package Amount: ${totalAmount}

Payment & Arrival Instructions:
Please arrive 10 minutes prior to your scheduled slot. You may present your GCash payment confirmation upon arrival. Free parking is available on-site.

If you need to reschedule or have any questions, feel free to reply directly to this email or contact us at ${studio.contactInfo}.

Warm regards,
${studio.name} Team
Cainta, Rizal`
        };

      case 'payment_reminder':
        return {
          subject: `Payment Reminder: Balance Due for Booking ${refId} - ${studio.name}`,
          body: `Hi ${clientName},

This is a friendly automated payment reminder from ${studio.name} regarding your upcoming photo session on ${bookingDate} (${timeSlot}).

• Remaining Balance Due: ${balanceAmount}
• GCash QR Ph Account: 0917-888-9999 (${studio.name})

Kindly settle your balance prior to or upon your arrival at our studio in ${studio.address}. Once paid, please reply with a screenshot of your GCash receipt.

Thank you and we look forward to capturing your amazing moments!

Best regards,
${studio.name} Management`
        };

      case 'proofing':
        return {
          subject: `Your Photo Proofing Gallery is Ready! - ${studio.name}`,
          body: `Hello ${clientName},

Great news! The raw and unretouched photos from your photo session at ${studio.name} on ${bookingDate} are now ready for your review and selection.

Please log in to your Cainta Studio MIS client dashboard to access your private proofing gallery, favorite your top shots, and submit your retouching notes.

Gallery Access: Cainta Studio MIS Portal
Session ID: ${refId}

We can't wait to deliver your final edited masterpieces!

Warmly,
${studio.name} Photography Team`
        };

      case 'print_ready':
        return {
          subject: `Print Order Update: Ready for Pickup / Shipped - ${studio.name}`,
          body: `Dear ${clientName},

We have an exciting update regarding your physical print order from ${studio.name}! 

Your high-resolution prints and framed portraits for booking ${refId} have passed our laboratory quality inspection and are now ready for pickup at our Cainta studio (${studio.address}) or have been dispatched via courier.

Thank you for trusting us with your cherished memories!

Best regards,
${studio.name} Print Fulfillment Center`
        };
    }
  };

  const currentTemplate = getTemplateContent();

  const handleCopy = () => {
    const textToCopy = `Subject: ${currentTemplate.subject}\n\n${currentTemplate.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success(`Nai-kopya sa clipboard ang email template para sa "${currentTemplate.subject.slice(0, 32)}..."!`, {
      title: 'Email Copied'
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Email Templates & Client Messaging Utility</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Instant Copy Utility
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Generate pre-filled professional email templates for booking confirmations, payment reminders, photo proofing galleries, and print updates for {studio.name}.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
            copied ? 'bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Full Email Text'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Selection & Booking Selector */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">1. Select Email Template</h4>
            <div className="space-y-2">
              {[
                { id: 'confirmation', label: 'Booking Confirmation', desc: 'Confirm slot, location, and instructions' },
                { id: 'payment_reminder', label: 'Payment & Balance Reminder', desc: 'GCash reminder for unpaid deposits' },
                { id: 'proofing', label: 'Photo Proofing Gallery Ready', desc: 'Notify client to select favorite shots' },
                { id: 'print_ready', label: 'Print Fulfillment Update', desc: 'Notify pickup or courier shipping' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id as any)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="font-bold text-xs text-stone-900">{t.label}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">2. Auto-Fill from Booking Record</h4>
            {safeBookings.length === 0 ? (
              <p className="text-xs text-stone-400">No bookings available for auto-fill.</p>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Select Booking</label>
                  <select
                    value={selectedBookingId}
                    onChange={e => setSelectedBookingId(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white"
                  >
                    {safeBookings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.customerName} ({b.bookingDate} - ₱{b.totalAmount})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-[11px] text-stone-600">
                  <div className="flex justify-between">
                    <span className="font-semibold text-stone-800">Client:</span>
                    <span>{clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-stone-800">Date & Slot:</span>
                    <span>{bookingDate} @ {timeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-stone-800">Balance Due:</span>
                    <span className="text-amber-700 font-bold">{balanceAmount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Email Preview & Copy */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">Live Email Preview</h4>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Subject Line</label>
                <input
                  type="text"
                  readOnly
                  value={currentTemplate.subject}
                  className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">Email Body Content</label>
                <textarea
                  readOnly
                  rows={14}
                  value={currentTemplate.body}
                  className="w-full text-xs p-4 bg-stone-50 border border-stone-200 rounded-2xl font-mono text-stone-700 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-stone-500 border-t border-stone-100">
              <span>Ready for Gmail, Yahoo Mail, or copy-paste into messaging apps</span>
              <span className="text-amber-700 font-bold">{studio.name} MIS Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
