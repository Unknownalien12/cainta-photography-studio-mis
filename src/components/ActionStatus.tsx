import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

export type ActionState = 'idle' | 'loading' | 'success' | 'error' | 'warning';

interface ActionStatusBadgeProps {
  status: ActionState;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  warningMessage?: string;
  className?: string;
  showIconOnly?: boolean;
}

export const ActionStatusBadge: React.FC<ActionStatusBadgeProps> = ({
  status,
  loadingMessage = 'Pinoproseso...',
  successMessage = 'Matagumpay!',
  errorMessage = 'Nagka-problema',
  warningMessage = 'Paalala',
  className = '',
  showIconOnly = false
}) => {
  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/30 animate-pulse ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
        {!showIconOnly && <span>{loadingMessage}</span>}
      </span>
    );
  }

  if (status === 'success') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        {!showIconOnly && <span>{successMessage}</span>}
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-500/35 animate-in fade-in zoom-in-95 duration-200 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        {!showIconOnly && <span>{warningMessage}</span>}
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/30 animate-in fade-in zoom-in-95 duration-200 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        {!showIconOnly && <span>{errorMessage}</span>}
      </span>
    );
  }

  return null;
};
