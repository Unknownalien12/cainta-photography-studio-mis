import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Booking } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onRescheduled: (updated: Booking) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  booking,
  onRescheduled
}) => {
  if (!isOpen || !booking) return null;

  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().substring(0, 10);
  });
  const [newTime, setNewTime] = useState(booking.timeSlot || '10:00');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiRequest<{ message: string; booking: Booking }>(
        `/api/bookings/${booking.id}/reschedule`,
        {
          method: 'PUT',
          body: JSON.stringify({
            newDate,
            newTime,
            reason
          })
        }
      );
      onRescheduled(res.booking);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Slot unavailable on that date');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-scaleUp">
        <div className="bg-[#2c2a29] text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base leading-tight">Reschedule Studio Session</h3>
            <p className="text-xs text-amber-400">Ref: {booking.id}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
            Current Schedule: <strong className="text-stone-900">{booking.bookingDate} at {booking.timeSlot}</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">New Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().substring(0, 10)}
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Select Time Slot</label>
            <div className="grid grid-cols-4 gap-2">
              {slots.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setNewTime(s)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    newTime === s
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Reason for Rescheduling</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Family emergency, weather conflict..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
