import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, ArrowRight } from 'lucide-react';

const UpdateModal = ({ isOpen, onClose, updateUrl, latestVersion, isForceUpdate }) => {
  const handleUpdate = () => {
    if (updateUrl) {
      window.open(updateUrl, '_blank');
    }
  };

  const handleBackdropClick = () => {
    if (!isForceUpdate && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-gray-950/70 backdrop-blur-md"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm bg-white dark:bg-gray-850 rounded-[2.5rem] overflow-hidden shadow-2xl relative z-[10000] border border-gray-100 dark:border-gray-800 transition-colors duration-300"
          >
            {/* Header / Graphic */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-inner">
                <RefreshCw size={32} className="animate-spin-slow" />
              </div>
              <h2 className="text-xl font-black text-white">Update Available</h2>
              <p className="text-xs text-blue-100 font-medium opacity-80 mt-1">
                Version {latestVersion || 'latest'} is now ready
              </p>
            </div>

            {/* Content & Actions */}
            <div className="p-8 flex flex-col items-center text-center">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-sans">
                {isForceUpdate 
                  ? "This update is required to continue using the application. Please update to the latest version now." 
                  : "A new version of the app is available. Please update to access the latest features and improvements."}
              </p>

              <div className={isForceUpdate ? "w-full" : "grid grid-cols-2 gap-3 w-full"}>
                {!isForceUpdate && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs active:scale-95 transition-all border border-transparent dark:border-gray-700"
                  >
                    Later
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-md shadow-blue-200 dark:shadow-none active:scale-95 transition-all w-full"
                >
                  <Download size={14} />
                  Update Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpdateModal;
