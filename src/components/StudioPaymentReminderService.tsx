import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Send, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Filter,
  Check
} from 'lucide-react';
import type { Studio, Booking, AutomatedReminderLog, StudioReminderSettings, ReminderCheckResult } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';

interface StudioPaymentReminderServiceProps {
  studio: Studio;
  bookings: Booking[];
  onRefreshBookings: () => void;
}

export const StudioPaymentReminderService: React.FC<StudioPaymentReminderServiceProps> = ({
  studio,
  bookings,
  onRefreshBookings
}) => {
  const [settings, setSettings] = useState<StudioReminderSettings>({
    autoRemindersEnabled: true,
    checkIntervalSeconds: 60,
    remindDownpaymentHoursBefore: 48,
    remindBalanceDaysBefore: 3,
    minHoursBetweenReminders: 12,
    notifyViaInApp: true,
    notifyViaEmail: true,
    notifyViaSMS: true
  });
  const [logs, setLogs] = useState<AutomatedReminderLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ReminderCheckResult | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'logs' | 'settings'>('pending');
  const [filterType, setFilterType] = useState<'all' | 'downpayment' | 'balance'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadReminderData();
    const timer = setInterval(() => {
      // background polling update
      loadReminderData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [studio.id]);

  const loadReminderData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [settingsData, logsData] = await Promise.all([
        apiRequest<StudioReminderSettings>(`/api/studios/${studio.id}/reminders/settings`).catch(() => settings),
        apiRequest<AutomatedReminderLog[]>(`/api/studios/${studio.id}/reminders/logs`).catch(() => [])
      ]);
      setSettings(settingsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load reminders data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    setNotice(null);
    try {
      const res = await apiRequest<ReminderCheckResult>(`/api/studios/${studio.id}/reminders/trigger`, {
        method: 'POST'
      });
      setLastScanResult(res);
      await loadReminderData();
      onRefreshBookings();
      setNotice(`Scan complete! Dispatched ${res.remindersSent.length} automated payment reminder(s).`);
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      console.error('Failed to run reminder scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSendSingle = async (bookingId: string) => {
    try {
      await apiRequest(`/api/studios/${studio.id}/reminders/single/${bookingId}`, {
        method: 'POST'
      });
      await loadReminderData();
      onRefreshBookings();
      setNotice('Reminder successfully dispatched to client!');
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      console.error('Failed to send reminder:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ success: boolean; settings: StudioReminderSettings }>(
        `/api/studios/${studio.id}/reminders/settings`,
        {
          method: 'PUT',
          body: JSON.stringify(settings)
        }
      );
      setSettings(res.settings);
      setNotice('Reminder daemon settings saved successfully!');
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  // Filter bookings needing payment reminders
  const activeBookings = bookings.filter(b => b.status !== 'Cancelled' && b.status !== 'Completed');
  const pendingDownpaymentBookings = activeBookings.filter(
    b => (b.paymentStatus === 'unpaid' || (b.paymentOption === 'downpayment' && b.amountPaid === 0)) && (b.downPaymentAmount > 0)
  );
  const pendingBalanceBookings = activeBookings.filter(
    b => b.remainingBalance > 0 && b.amountPaid > 0
  );

  const totalDownpaymentDue = pendingDownpaymentBookings.reduce((acc, b) => acc + b.downPaymentAmount, 0);
  const totalBalanceDue = pendingBalanceBookings.reduce((acc, b) => acc + b.remainingBalance, 0);

  const filteredBookings = activeBookings.filter(b => {
    const isDP = (b.paymentStatus === 'unpaid' || (b.paymentOption === 'downpayment' && b.amountPaid === 0)) && (b.downPaymentAmount > 0);
    const isBal = b.remainingBalance > 0 && b.amountPaid > 0;
    if (!isDP && !isBal) return false;
    if (filterType === 'downpayment') return isDP;
    if (filterType === 'balance') return isBal;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-stone-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full animate-pulse ${settings.autoRemindersEnabled ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {settings.autoRemindersEnabled ? 'Background Service: Active & Polling' : 'Background Service: Paused'}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">Automated Payment Reminders</h3>
          <p className="text-stone-300 text-xs max-w-2xl leading-relaxed">
            Autonomous background daemon scans upcoming bookings for unpaid downpayments and remaining balances, instantly dispatching multi-channel reminders (In-App, GCash link SMS & Email) before shoot deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Bookings...' : 'Run Automated Scan Now'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {notice}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-stone-400">Pending Downpayments</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 mt-2">{pendingDownpaymentBookings.length}</div>
          <div className="text-xs text-amber-700 font-semibold mt-1">₱{totalDownpaymentDue.toLocaleString()} at risk</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-stone-400">Pending Balances</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 mt-2">{pendingBalanceBookings.length}</div>
          <div className="text-xs text-blue-700 font-semibold mt-1">₱{totalBalanceDue.toLocaleString()} balance due</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-stone-400">Total Reminders Sent</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Send className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 mt-2">{logs.length}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Across all clients</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-stone-400">Daemon Cooldown</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 mt-2">{settings.minHoursBetweenReminders}h</div>
          <div className="text-xs text-stone-500 font-medium mt-1">Anti-spam interval</div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'pending' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Pending Payment Bookings ({filteredBookings.length})
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'logs' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-4 h-4" /> Dispatch History & Audit Trail ({logs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'settings' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Settings className="w-4 h-4" /> Daemon Rules & Channels
        </button>
      </div>

      {/* Tab 1: Pending Bookings */}
      {activeSubTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-stone-900">Clients Needing Downpayment or Balance Payment</h4>
              <p className="text-xs text-stone-500 mt-0.5">Click "Send Reminder Now" to instantly dispatch a custom reminder notice to the client's in-app portal and simulated GCash channel.</p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none"
              >
                <option value="all">All Pending ({pendingDownpaymentBookings.length + pendingBalanceBookings.length})</option>
                <option value="downpayment">Unpaid Downpayment ({pendingDownpaymentBookings.length})</option>
                <option value="balance">Unpaid Balance ({pendingBalanceBookings.length})</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-stone-100 overflow-x-auto">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-xs font-medium">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                No pending payment bookings found! All upcoming clients are fully paid.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Client Details</th>
                    <th className="p-4">Shoot Date & Slot</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Amount Due</th>
                    <th className="p-4">Last Reminder</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredBookings.map(b => {
                    const isDP = (b.paymentStatus === 'unpaid' || (b.paymentOption === 'downpayment' && b.amountPaid === 0)) && (b.downPaymentAmount > 0);
                    const amountDue = isDP ? b.downPaymentAmount : b.remainingBalance;
                    return (
                      <tr key={b.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-stone-900">{b.customerName}</div>
                          <div className="text-[11px] text-stone-500">{b.customerEmail} • {b.customerPhone}</div>
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Ref: {b.id}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-stone-900">{b.bookingDate}</div>
                          <div className="text-[11px] text-stone-500">{b.timeSlot}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isDP ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isDP ? 'Downpayment Pending' : 'Remaining Balance Due'}
                          </span>
                        </td>
                        <td className="p-4 font-extrabold text-stone-900 text-sm">
                          ₱{amountDue.toLocaleString()}
                        </td>
                        <td className="p-4 text-stone-500 text-[11px]">
                          {b.lastReminderSentAt ? (
                            <div>
                              <span>{new Date(b.lastReminderSentAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <div className="text-[10px] text-stone-400">({b.reminderCount || 1} sent)</div>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Never sent</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSendSingle(b.id)}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl font-bold text-[11px] flex items-center gap-1.5 ml-auto shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" /> Send Reminder Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Dispatch History & Audit Trail */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h4 className="font-bold text-sm text-stone-900">Automated Reminder Dispatch Logs</h4>
            <p className="text-xs text-stone-500 mt-0.5">Chronological audit trail of all automated and manual reminder notices sent to studio clients.</p>
          </div>

          <div className="divide-y divide-stone-100 overflow-x-auto">
            {logs.length === 0 ? (
              <div className="text-center py-16 text-stone-400 text-xs">
                No reminder logs recorded yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Client / Recipient</th>
                    <th className="p-4">Reminder Type</th>
                    <th className="p-4">Amount Due</th>
                    <th className="p-4">Channels</th>
                    <th className="p-4">Trigger Source</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50/80">
                      <td className="p-4 text-stone-500 whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-stone-900">{log.customerName}</div>
                        <div className="text-[11px] text-stone-500">{log.customerEmail}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.reminderType === 'downpayment_due' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.reminderType === 'downpayment_due' ? 'Downpayment Due' : 'Balance Due'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-stone-900">₱{log.amountDue.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded bg-stone-100 text-stone-700 text-[10px] font-bold" title="In-App System Notification">App</span>
                          <span className="p-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold" title="Simulated Email">Email</span>
                          <span className="p-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold" title="Simulated SMS">SMS</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.triggeredBy === 'background_service' ? 'bg-purple-100 text-purple-800' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {log.triggeredBy === 'background_service' ? '⚡ Background Daemon' : 'Manual Trigger'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Daemon Rules & Settings */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <h4 className="font-bold text-base text-stone-900">Configure Automated Background Service</h4>
              <p className="text-xs text-stone-500 mt-0.5">Customize polling schedules, thresholds, and dispatch channels for this studio.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer">
                <div>
                  <div className="font-bold text-sm text-stone-900">Enable Automated Background Reminders</div>
                  <div className="text-xs text-stone-500">Autonomous daemon checks bookings and dispatches payment reminders without manual intervention.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoRemindersEnabled}
                  onChange={e => setSettings({ ...settings, autoRemindersEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Downpayment Window (Hours Before Due)</label>
                  <input
                    type="number"
                    value={settings.remindDownpaymentHoursBefore}
                    onChange={e => setSettings({ ...settings, remindDownpaymentHoursBefore: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Remaining Balance Window (Days Before Shoot)</label>
                  <input
                    type="number"
                    value={settings.remindBalanceDaysBefore}
                    onChange={e => setSettings({ ...settings, remindBalanceDaysBefore: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Minimum Cooldown Between Reminders (Hours)</label>
                <input
                  type="number"
                  value={settings.minHoursBetweenReminders}
                  onChange={e => setSettings({ ...settings, minHoursBetweenReminders: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:border-amber-600"
                />
                <p className="text-[11px] text-stone-400">Prevents spamming the same client within this timeframe.</p>
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Active Communication Channels</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyViaInApp}
                      onChange={e => setSettings({ ...settings, notifyViaInApp: e.target.checked })}
                      className="rounded text-amber-600"
                    />
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> In-App Notification</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyViaEmail}
                      onChange={e => setSettings({ ...settings, notifyViaEmail: e.target.checked })}
                      className="rounded text-amber-600"
                    />
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email Gateway</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyViaSMS}
                      onChange={e => setSettings({ ...settings, notifyViaSMS: e.target.checked })}
                      className="rounded text-amber-600"
                    />
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> SMS GCash Link</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Save Daemon Rules
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
