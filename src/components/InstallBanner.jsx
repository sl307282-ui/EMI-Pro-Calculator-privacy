import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallBanner = ({ onShowModal }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Only show if not installed and not dismissed
    const isDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-50"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-4 shadow-2xl border border-white/20 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0">
              <Smartphone size={24} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-black text-white leading-tight">Install EMI Pro</h3>
              <p className="text-[10px] text-blue-100 font-medium opacity-80">Get the best mobile experience</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onShowModal}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black shadow-lg active:scale-95 transition-all"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white/10 text-white/50 p-2 rounded-xl hover:text-white active:scale-95 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallBanner;
