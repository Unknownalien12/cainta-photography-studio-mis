import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed previously in this session
      if (!sessionStorage.getItem('cainta_pwa_dismissed')) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('cainta_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm bg-[#2c2a29] text-white p-3.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center justify-between gap-3 animate-slideUp">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white flex-shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <h5 className="font-bold text-xs leading-tight">Install Cainta Studio MIS</h5>
          <p className="text-[11px] text-stone-300">Add to home screen for offline access</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-stone-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
