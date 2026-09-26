import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { StudioAvailability, AvailabilityBlackout } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { toast } from '../utils/toast.js';

interface AvailabilityManagerProps {
  studioId: string;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ studioId }) => {
  const [schedule, setSchedule] = useState<StudioAvailability[]>([]);
  const [blackouts, setBlackouts] = useState<AvailabilityBlackout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  // New Blackout Form
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadData();
  }, [studioId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [avData, blkData] = await Promise.all([
        apiRequest<StudioAvailability[]>(`/api/studios/${studioId}/availability`),
        apiRequest<AvailabilityBlackout[]>(`/api/studios/${studioId}/blackouts`)
      ]);

      // If empty schedule, initialize default 7 days
      if (!avData || avData.length === 0) {
        const defaults: StudioAvailability[] = [0, 1, 2, 3, 4, 5, 6].map(day => ({
          id: `av_init_${day}`,
          studioId,
          dayOfWeek: day,
          openingTime: '09:00',
          closingTime: day === 0 ? '17:00' : '19:00',
          isAvailable: day !== 0,
          slotDurationMinutes: 60
        }));
        setSchedule(defaults);
      } else {
        setSchedule(avData);
      }
      setBlackouts(blkData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScheduleRow = (index: number, updates: Partial<StudioAvailability>) => {
    setSchedule(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleSaveSchedule = async () => {
    try {
      await Promise.all(
        schedule.map(row =>
          row.id.startsWith('av_init')
            ? apiRequest(`/api/studios/${studioId}/availability`, {
                method: 'POST',
                body: JSON.stringify(row)
              })
            : apiRequest(`/api/studios/${studioId}/availability/${row.id}`, {
                method: 'PUT',
                body: JSON.stringify(row)
              })
        )
      );
      setSavedNotice(true);
      toast.success('Nai-save ang operating hours at slot availability ng iyong studio!', {
        title: 'Schedule Updated'
      });
      setTimeout(() => setSavedNotice(false), 3000);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pag-update ng schedule', { title: 'Schedule Error' });
    }
  };

  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newReason) return;
    try {
      const res = await apiRequest<AvailabilityBlackout>(`/api/studios/${studioId}/blackouts`, {
        method: 'POST',
        body: JSON.stringify({
          blackoutDate: newDate,
          reason: newReason,
          isRecurring
        })
      });
      setBlackouts(prev => [...prev, res]);
      setNewDate('');
      setNewReason('');
      toast.success(`Na-block ang petsa (${newDate}) para sa "${newReason}"!`, { title: 'Blackout Added' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pag-block ng petsa', { title: 'Blackout Error' });
    }
  };

  const handleDeleteBlackout = async (id: string) => {
    try {
      await apiRequest(`/api/studios/${studioId}/blackouts/${id}`, {
        method: 'DELETE'
      });
      setBlackouts(prev => prev.filter(b => b.id !== id));
      toast.success('Naibalik sa open status ang petsa.', { title: 'Blackout Removed' });
    } catch (err: any) {
      toast.error(err.message || 'Nabigo ang pag-alis ng blackout', { title: 'Delete Error' });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-stone-500">Loading schedule...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Weekly Schedule Configuration */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" /> Weekly Studio Hours & Slot Durations
            </h3>
            <p className="text-xs text-stone-500">Configure operating times and session intervals per day of week.</p>
          </div>
          <button
            onClick={handleSaveSchedule}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Save Weekly Hours
          </button>
        </div>

        {savedNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Weekly schedule saved successfully!
          </div>
        )}

        <div className="divide-y divide-stone-100">
          {schedule.map((row, idx) => (
            <div key={row.dayOfWeek} className="py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="w-28 font-bold text-stone-800">
                {dayNames[row.dayOfWeek]}
              </div>

              {/* Available toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.isAvailable}
                  onChange={e => handleUpdateScheduleRow(idx, { isAvailable: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className={`font-semibold ${row.isAvailable ? 'text-emerald-700' : 'text-stone-400'}`}>
                  {row.isAvailable ? 'Open' : 'Closed'}
                </span>
              </label>

              {/* Time inputs */}
              {row.isAvailable ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={row.openingTime}
                    onChange={e => handleUpdateScheduleRow(idx, { openingTime: e.target.value })}
                    className="p-1.5 border border-stone-300 rounded-lg text-xs"
                  />
                  <span className="text-stone-400">to</span>
                  <input
                    type="time"
                    value={row.closingTime}
                    onChange={e => handleUpdateScheduleRow(idx, { closingTime: e.target.value })}
                    className="p-1.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
              ) : (
                <div className="text-stone-400 italic">No bookings accepted</div>
              )}

              {/* Slot duration dropdown */}
              {row.isAvailable && (
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500 text-[11px]">Slot Interval:</span>
                  <select
                    value={row.slotDurationMinutes}
                    onChange={e => handleUpdateScheduleRow(idx, { slotDurationMinutes: parseInt(e.target.value) })}
                    className="p-1.5 border border-stone-300 rounded-lg text-xs"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins (1 hour)</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins (2 hours)</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blackout Dates Manager */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" /> Studio Blackout Dates & Holidays
          </h3>
          <p className="text-xs text-stone-500">Prevent bookings on maintenance days, holidays, or private events.</p>
        </div>

        <form onSubmit={handleAddBlackout} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">Blackout Date</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full text-xs p-2 border border-stone-300 rounded-xl bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">Reason / Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Renovation, Cainta Town Fiesta, Christmas"
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
              className="w-full text-xs p-2 border border-stone-300 rounded-xl bg-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Blackout
            </button>
          </div>
        </form>

        {/* Existing Blackouts Table */}
        <div className="divide-y divide-stone-100">
          {blackouts.length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">No blackout dates registered.</p>
          ) : (
            blackouts.map(b => (
              <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-800">{b.blackoutDate}</span>
                  <span className="text-stone-500 ml-2">— {b.reason}</span>
                </div>
                <button
                  onClick={() => handleDeleteBlackout(b.id)}
                  className="p-1 text-stone-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
