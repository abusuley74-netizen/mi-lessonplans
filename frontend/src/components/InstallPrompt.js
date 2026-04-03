import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-install-dismissed')) {
      setDismissed(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('pwa-install-dismissed')) {
        setShowPrompt(true);
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
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white border border-[#E4DFD5] rounded-xl shadow-2xl p-4 z-[9999] animate-in slide-in-from-bottom-4" data-testid="pwa-install-prompt">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#2D5A27]/10 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-[#2D5A27]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-[#1A2E16] text-sm">Install miLessonPlan</h3>
          <p className="text-xs text-[#7A8A76] mt-0.5">Add to your home screen for quick access, even offline.</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-[#2D5A27] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#21441C] transition-colors"
              data-testid="pwa-install-btn"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-[#7A8A76] hover:text-[#1A2E16] font-medium px-2 py-1.5"
              data-testid="pwa-dismiss-btn"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-[#7A8A76] hover:text-[#1A2E16] p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
