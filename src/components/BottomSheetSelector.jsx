import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const BottomSheetSelector = ({ isOpen, onClose, options, selectedValue, onSelect, title }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-sm"
            style={{ zIndex: 9999 }}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[2.5rem] z-[10000] overflow-hidden max-h-[80vh] flex flex-col shadow-2xl border-t border-gray-100 dark:border-gray-800"
            style={{
              zIndex: 10000,
              paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 20px)',
            }}
          >
            {/* Handle/Indicator */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Header / Done Bar */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">{title || 'Select Option'}</h3>
              <button 
                onClick={onClose}
                className="text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-wider px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl active:scale-95 transition-all"
              >
                Done
              </button>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-2">
              <div className="space-y-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSelect(option.value);
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${
                      selectedValue === option.value 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800'
                    }`}
                  >
                    <span className={`text-base ${selectedValue === option.value ? 'font-black' : 'font-bold'}`}>
                      {option.label}
                    </span>
                    {selectedValue === option.value && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BottomSheetSelector;
