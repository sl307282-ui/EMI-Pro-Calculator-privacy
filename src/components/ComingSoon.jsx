import React from 'react';
import { ChevronLeft, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

const ComingSoon = ({ onBack, title }) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 bg-white shadow-sm border border-gray-100 rounded-xl text-gray-700 active:scale-90 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{title || 'Coming Soon'}</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-6"
        >
          <Construction size={48} />
        </motion.div>
        
        <h2 className="text-2xl font-black text-gray-900 mb-2">Work in Progress!</h2>
        <p className="text-gray-500 font-medium max-w-[240px]">
          We are working hard to bring this feature to you. Stay tuned for updates!
        </p>
        
        <button
          onClick={onBack}
          className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
