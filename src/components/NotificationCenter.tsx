import React from 'react';
import { X, Check, Bell, Calendar, CreditCard, Image, AlertCircle, Trash2 } from 'lucide-react';
import type { Notification } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { toast } from '../utils/toast.js';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationsChange: () => void;
  onNavigateToItem?: (type: string, id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationsChange,
  onNavigateToItem
}) => {
  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' });
      onNotificationsChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PUT' });
      toast.info('Minarkahan ang lahat ng notifications bilang nabasa na.', { title: 'Notifications' });
      onNotificationsChange();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_rescheduled':
      case 'booking_cancelled':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'print_status_updated':
      case 'photos_ready_for_proofing':
        return <Image className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 animate-slideLeft">
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm">Notifications</h3>
            <span className="text-[11px] bg-stone-800 text-amber-400 px-2 py-0.5 rounded-full font-mono">
              {notifications.filter(n => !n.isRead).length} unread
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-stone-300 hover:text-white hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-stone-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl transition-all ${
                  n.isRead ? 'bg-white opacity-70' : 'bg-amber-50/40 border border-amber-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-stone-100 flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-stone-900 truncate">{n.title}</h5>
                      <span className="text-[10px] text-stone-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{n.message}</p>

                    <div className="mt-2 flex items-center justify-between">
                      {n.link ? (
                        <button
                          onClick={() => {
                            if (onNavigateToItem) onNavigateToItem(n.type, n.link!);
                            onClose();
                          }}
                          className="text-[11px] font-bold text-amber-700 hover:underline"
                        >
                          View Details →
                        </button>
                      ) : <div />}

                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-[10px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
