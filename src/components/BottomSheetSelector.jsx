import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const BottomSheetSelector = ({ isOpen, onClose, options, selectedValue, onSelect, title }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 z-50 backdrop-blur-[2px]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[60] overflow-hidden max-h-[80vh] flex flex-col"
          >
            {/* Handle/Indicator */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            {/* Header / Done Bar */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50">
              <h3 className="text-lg font-black text-gray-900">{title || 'Select Option'}</h3>
              <button 
                onClick={onClose}
                className="text-blue-600 font-black text-sm uppercase tracking-wider px-4 py-2 bg-blue-50 rounded-xl"
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
                      // Don't close immediately to let user see the selection? 
                      // Actually, for "Done" bar pattern, we usually stay open until Done is clicked.
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${
                      selectedValue === option.value 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 active:bg-gray-50'
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
            
            {/* Bottom Safe Area Padding */}
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheetSelector;
