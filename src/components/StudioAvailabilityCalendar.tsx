import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, X, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Booking, AvailabilityBlackout } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';

interface StudioAvailabilityCalendarProps {
  studioId: string;
  bookings: Booking[];
  onRefreshData?: () => void;
}

export const StudioAvailabilityCalendar: React.FC<StudioAvailabilityCalendarProps> = ({
  studioId,
  bookings,
  onRefreshData
}) => {
  const [blackouts, setBlackouts] = useState<AvailabilityBlackout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Modal State
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBlackouts();
  }, [studioId]);

  const loadBlackouts = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<AvailabilityBlackout[]>(`/api/studios/${studioId}/blackouts`);
      setBlackouts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load blackouts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper date formatting
  const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get days to render for Month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding for previous month
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }
    // Padding for next month to complete grid (up to 35 or 42)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }
    return days;
  };

  // Get days for Week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Sunday start

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push({ date: d, isCurrentMonth: true });
    }
    return days;
  };

  const activeDays = viewMode === 'month' ? getMonthDays() : viewMode === 'week' ? getWeekDays() : [{ date: currentDate, isCurrentMonth: true }];

  const handleCreateBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr || !blockReason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest<AvailabilityBlackout>(`/api/studios/${studioId}/blackouts`, {
        method: 'POST',
        body: JSON.stringify({
          blackoutDate: selectedDateStr,
          reason: blockReason.trim(),
          isRecurring: false
        })
      });
      setBlackouts(prev => [...prev, res]);
      setSelectedDateStr(null);
      setBlockReason('');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Failed to block date');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlackout = async (id: string) => {
    try {
      await apiRequest(`/api/studios/${studioId}/blackouts/${id}`, {
        method: 'DELETE'
      });
      setBlackouts(prev => prev.filter(b => b.id !== id));
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('Failed to remove blackout');
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" /> Interactive Studio Availability & Booking Calendar
          </h3>
          <p className="text-xs text-stone-500">
            Click on any date to block off studio maintenance, holidays, or private closures. View client bookings in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'day' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'}`}
            >
              Day
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-800"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Current Title Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <h4 className="font-extrabold text-base text-stone-900">
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', ...(viewMode === 'day' ? { day: 'numeric' } : {}) })}
        </h4>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-600" />
            <span>Booked Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-600" />
            <span>Blocked / Holiday</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-stone-400 uppercase tracking-wider py-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {activeDays.map(({ date, isCurrentMonth }, idx) => {
            const dateKey = formatDateKey(date);
            const dayBookings = bookings.filter(b => b.bookingDate === dateKey);
            const dayBlackouts = blackouts.filter(b => b.blackoutDate === dateKey);
            const isToday = formatDateKey(new Date()) === dateKey;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDateStr(dateKey)}
                className={`min-h-[110px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isToday ? 'border-amber-500 bg-amber-50/20 shadow-xs' : 'border-stone-200 bg-white hover:border-amber-400 hover:shadow-sm'
                } ${!isCurrentMonth ? 'opacity-40 bg-stone-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isToday ? 'bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-stone-800'}`}>
                    {date.getDate()}
                  </span>
                  <span className="text-[9px] text-stone-400">Click to block</span>
                </div>

                <div className="space-y-1 my-1 overflow-y-auto max-h-[70px]">
                  {/* Blackouts */}
                  {dayBlackouts.map(b => (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove blackout: "${b.reason}"?`)) {
                          handleDeleteBlackout(b.id);
                        }
                      }}
                      className="p-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold flex items-center justify-between shadow-xs"
                      title="Click to remove blackout"
                    >
                      <span className="truncate">🚫 {b.reason}</span>
                      <Trash2 className="w-3 h-3 flex-shrink-0" />
                    </div>
                  ))}

                  {/* Bookings */}
                  {dayBookings.map(b => (
                    <div
                      key={b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(b);
                      }}
                      className="p-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-semibold truncate shadow-xs hover:bg-amber-100"
                      title={`${(b as any).serviceName || 'Photoshoot'} - ${b.customerName}`}
                    >
                      📸 {b.timeSlot || '09:00'} {b.customerName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Blocking or Viewing Booking */}
      {(selectedDateStr || selectedBooking) && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 relative animate-scaleUp">
            <button
              onClick={() => {
                setSelectedDateStr(null);
                setSelectedBooking(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>

            {selectedDateStr && (
              <form onSubmit={handleCreateBlackout} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-stone-900">Block Studio Date</h4>
                    <p className="text-xs text-stone-500">{selectedDateStr}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Reason for Blocking / Holiday</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Studio Light Repair, Cainta Fiesta, Holiday"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    className="w-full p-3 text-xs border border-stone-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDateStr(null)}
                    className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {isSubmitting ? 'Blocking...' : 'Confirm Block Date'}
                  </button>
                </div>
              </form>
            )}

            {selectedBooking && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-stone-900">Booking Details</h4>
                    <p className="text-xs text-stone-500">{selectedBooking.id}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Client Name:</span>
                    <span className="font-bold text-stone-900">{selectedBooking.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Email / Phone:</span>
                    <span className="font-semibold text-stone-800">{selectedBooking.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Service:</span>
                    <span className="font-semibold text-amber-700">{(selectedBooking as any).serviceName || 'Photoshoot Session'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date & Time:</span>
                    <span className="font-semibold text-stone-800">{selectedBooking.bookingDate} @ {selectedBooking.timeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Status:</span>
                    <span className="font-bold text-emerald-700">{selectedBooking.status}</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-2 font-bold">
                    <span>Total Amount:</span>
                    <span className="text-amber-600">₱{(selectedBooking.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
