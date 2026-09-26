import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { toast, ToastItem, ToastType } from '../utils/toast.js';
import { isSoundMuted, setSoundMuted } from '../utils/soundEffects.js';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundOff, setSoundOff] = useState(() => isSoundMuted());

  useEffect(() => {
    const unsubscribe = toast.subscribe(updated => {
      setToasts(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleSound = () => {
    const next = !soundOff;
    setSoundOff(next);
    setSoundMuted(next);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Sound toggle floating button if there are toasts */}
      <div className="flex items-center justify-end mb-1 pr-1 pointer-events-auto">
        <button
          onClick={handleToggleSound}
          title={soundOff ? 'I-on ang audio cues' : 'I-mute ang audio cues'}
          className="text-[11px] px-2 py-0.5 rounded-full bg-stone-900/80 backdrop-blur text-stone-300 hover:text-white border border-stone-700/60 shadow-sm flex items-center gap-1.5 transition-all"
        >
          {soundOff ? <VolumeX className="w-3 h-3 text-stone-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
          <span>{soundOff ? 'Audio: Naka-off' : 'Audio: Naka-on'}</span>
        </button>
      </div>

      {toasts.map(item => (
        <SingleToast key={item.id} item={item} onDismiss={() => toast.dismiss(item.id)} />
      ))}
    </div>
  );
};

const SingleToast: React.FC<{ item: ToastItem; onDismiss: () => void }> = ({ item, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!item.duration || item.duration <= 0) return;

    const intervalTime = 40;
    const step = (intervalTime / item.duration) * 100;

    const timer = setInterval(() => {
      if (!isHovered) {
        setProgress(prev => {
          if (prev <= step) {
            clearInterval(timer);
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [item.duration, isHovered]);

  useEffect(() => {
    if (progress <= 0) {
      const t = setTimeout(() => {
        onDismiss();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [progress, onDismiss]);

  const configByType: Record<
    ToastType,
    {
      bg: string;
      border: string;
      iconColor: string;
      titleColor: string;
      barColor: string;
      badgeText: string;
      badgeBg: string;
      Icon: React.ElementType;
    }
  > = {
    success: {
      bg: 'bg-stone-900/95 backdrop-blur-md text-stone-100',
      border: 'border-emerald-500/40 shadow-emerald-950/40 shadow-xl ring-1 ring-emerald-500/20',
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-300',
      barColor: 'bg-emerald-400',
      badgeText: 'Tagumpay / Success',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      Icon: CheckCircle2
    },
    error: {
      bg: 'bg-stone-950/95 backdrop-blur-md text-stone-100',
      border: 'border-rose-500/50 shadow-rose-950/50 shadow-xl ring-1 ring-rose-500/30',
      iconColor: 'text-rose-400',
      titleColor: 'text-rose-300',
      barColor: 'bg-rose-500',
      badgeText: 'Nabigo / Failed',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      Icon: AlertCircle
    },
    warning: {
      bg: 'bg-stone-900/95 backdrop-blur-md text-stone-100',
      border: 'border-amber-500/40 shadow-amber-950/40 shadow-xl ring-1 ring-amber-500/20',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      barColor: 'bg-amber-400',
      badgeText: 'Babala / Warning',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      Icon: AlertTriangle
    },
    info: {
      bg: 'bg-stone-900/95 backdrop-blur-md text-stone-100',
      border: 'border-cyan-500/40 shadow-cyan-950/40 shadow-xl ring-1 ring-cyan-500/20',
      iconColor: 'text-cyan-400',
      titleColor: 'text-cyan-300',
      barColor: 'bg-cyan-400',
      badgeText: 'Notipikasyon / Info',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      Icon: Info
    },
    loading: {
      bg: 'bg-stone-900/95 backdrop-blur-md text-stone-100',
      border: 'border-amber-500/40 shadow-stone-950/50 shadow-xl ring-1 ring-amber-500/20',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      barColor: 'bg-amber-400 animate-pulse',
      badgeText: 'Pinoproseso / In Progress',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      Icon: Loader2
    }
  };

  const style = configByType[item.type] || configByType.info;
  const IconComponent = style.Icon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 transition-all duration-300 transform translate-y-0 ${style.bg} ${style.border}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Status Indicator Icon */}
        <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
          <IconComponent className={`w-5 h-5 ${item.type === 'loading' ? 'animate-spin' : ''}`} />
        </div>

        {/* Message and Title */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${style.badgeBg}`}
            >
              {style.badgeText}
            </span>
            {item.title && (
              <h4 className={`text-xs font-bold leading-tight ${style.titleColor}`}>
                {item.title}
              </h4>
            )}
          </div>
          <p className="text-xs text-stone-200 leading-relaxed break-words font-medium">
            {item.message}
          </p>

          {/* Action button inside toast if present */}
          {item.action && (
            <div className="mt-2.5 pt-2 border-t border-stone-700/50 flex justify-end">
              <button
                onClick={() => {
                  item.action?.onClick();
                  onDismiss();
                }}
                className={`text-xs font-bold px-3 py-1 rounded-md transition-all ${
                  item.action.primary
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-sm'
                    : 'bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white border border-stone-600/60'
                }`}
              >
                {item.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/80 transition-colors"
          aria-label="Isara"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-dismiss Progress Bar */}
      {item.duration !== undefined && item.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-800/80">
          <div
            className={`h-full transition-all duration-75 ease-linear ${style.barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
