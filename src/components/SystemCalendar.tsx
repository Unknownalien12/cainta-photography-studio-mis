import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Download, CalendarPlus } from 'lucide-react';
import type { Booking, Studio } from '../db/types.js';
import { getGoogleCalendarUrl, downloadICSFile } from '../utils/calendarSync.js';

interface SystemCalendarProps {
  bookings: Booking[];
  studio?: Studio;
  onSelectBooking?: (booking: Booking) => void;
}

export const SystemCalendar: React.FC<SystemCalendarProps> = ({
  bookings,
  studio,
  onSelectBooking
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map bookings by date string YYYY-MM-DD
  const bookingsByDate = React.useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(b => {
      const list = map.get(b.bookingDate) || [];
      list.push(b);
      map.set(b.bookingDate, list);
    });
    return map;
  }, [bookings]);

  const selectedDayBookings = bookingsByDate.get(selectedDateStr) || [];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-500';
      case 'Ongoing':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-purple-500';
      case 'Awaiting Payment':
      case 'Pending':
        return 'bg-amber-500';
      case 'Cancelled':
      case 'Expired':
        return 'bg-rose-500';
      default:
        return 'bg-stone-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
      {/* Calendar Grid (2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-stone-900">
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-500 py-1 border-b border-stone-200">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 rounded-xl bg-stone-50/50" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayBookings = bookingsByDate.get(dateStr) || [];
            const isSelected = selectedDateStr === dateStr;
            const isToday = new Date().toISOString().substring(0, 10) === dateStr;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-16 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/60 shadow-sm'
                    : isToday
                    ? 'border-stone-400 bg-stone-50'
                    : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${isToday ? 'w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]' : 'text-stone-700'}`}>
                    {dayNum}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[9px] font-bold px-1 rounded-full bg-stone-200 text-stone-700">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Status dots */}
                <div className="flex items-center gap-1 overflow-hidden">
                  {dayBookings.slice(0, 4).map(b => (
                    <span
                      key={b.id}
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusBadgeColor(b.status)}`}
                      title={`${b.timeSlot} - ${b.customerName} (${b.status})`}
                    />
                  ))}
                  {dayBookings.length > 4 && (
                    <span className="text-[9px] text-stone-400">+{dayBookings.length - 4}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Side Panel */}
      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Agenda For</span>
              <h4 className="font-bold text-stone-900 text-sm">{selectedDateStr}</h4>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {selectedDayBookings.length} Session{selectedDayBookings.length === 1 ? '' : 's'}
            </span>
          </div>

          {selectedDayBookings.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              No sessions scheduled for this date.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayBookings.map(b => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking && onSelectBooking(b)}
                  className="p-3 bg-white rounded-xl border border-stone-200 hover:border-amber-400 transition-all cursor-pointer shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" /> {b.timeSlot}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${getStatusBadgeColor(b.status)}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600">
                    <div className="font-semibold text-stone-800 truncate">{b.customerName}</div>
                    <div className="text-[11px] text-stone-500">Ref: {b.id} • ₱{b.totalAmount.toLocaleString()}</div>
                  </div>

                  <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <a
                      href={getGoogleCalendarUrl(b, studio)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      <CalendarPlus className="w-3 h-3" /> GCal
                    </a>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        downloadICSFile(b, studio);
                      }}
                      className="text-stone-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Download className="w-3 h-3" /> .ics
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
