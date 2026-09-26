import { playSuccessSound, playErrorSound, playWarningSound, playInfoSound } from './soundEffects.js';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 4000 (0 for persistent until dismissed)
  action?: ToastAction;
  createdAt: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private maxToasts = 5;

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const copy = [...this.toasts];
    this.listeners.forEach(l => l(copy));
  }

  show(
    type: ToastType,
    message: string,
    options?: {
      title?: string;
      duration?: number;
      action?: ToastAction;
      playSound?: boolean;
    }
  ): string {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const duration = options?.duration !== undefined ? options.duration : type === 'loading' ? 0 : 4500;
    
    // Play sound cues
    if (options?.playSound !== false) {
      if (type === 'success') playSuccessSound();
      else if (type === 'error') playErrorSound();
      else if (type === 'warning') playWarningSound();
      else if (type === 'info') playInfoSound();
    }

    const newToast: ToastItem = {
      id,
      type,
      title: options?.title,
      message,
      duration,
      action: options?.action,
      createdAt: Date.now()
    };

    // Keep within max limit (remove oldest non-loading or oldest)
    if (this.toasts.length >= this.maxToasts) {
      this.toasts = this.toasts.slice(1);
    }

    this.toasts = [...this.toasts, newToast];
    this.notify();

    return id;
  }

  success(message: string, options?: { title?: string; duration?: number; action?: ToastAction; playSound?: boolean }) {
    return this.show('success', message, {
      title: options?.title || 'Tagumpay!',
      ...options
    });
  }

  error(message: string, options?: { title?: string; duration?: number; action?: ToastAction; playSound?: boolean }) {
    return this.show('error', message, {
      title: options?.title || 'May Naganap na Error',
      duration: options?.duration ?? 6000,
      ...options
    });
  }

  warning(message: string, options?: { title?: string; duration?: number; action?: ToastAction; playSound?: boolean }) {
    return this.show('warning', message, {
      title: options?.title || 'Paalala',
      ...options
    });
  }

  info(message: string, options?: { title?: string; duration?: number; action?: ToastAction; playSound?: boolean }) {
    return this.show('info', message, {
      title: options?.title || 'Impormasyon',
      ...options
    });
  }

  loading(message: string, options?: { title?: string }) {
    return this.show('loading', message, {
      title: options?.title || 'Pinoproseso...',
      duration: 0,
      playSound: false
    });
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  // Promise helper: automatically handles loading -> success/error state
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ): Promise<T> {
    const loadingId = this.loading(messages.loading);
    try {
      const result = await promise;
      this.dismiss(loadingId);
      const successMsg = typeof messages.success === 'function' ? messages.success(result) : messages.success;
      this.success(successMsg);
      return result;
    } catch (err: any) {
      this.dismiss(loadingId);
      const errMsg = typeof messages.error === 'function' ? messages.error(err) : messages.error || err.message || 'Nabigo ang aksyon';
      this.error(errMsg);
      throw err;
    }
  }
}

export const toast = new ToastManager();
