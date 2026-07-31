import React, { useState } from 'react';
import { 
  Calculator, Zap, FilePlus, LayoutGrid, Sigma,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const SIPGrowthIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
    <circle cx="12" cy="12" r="10" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="2" fill="none" />
    <path d="M12 2 A 10 10 0 1 1 2 12" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" />
    <path d="M6 16 L10 12 L14 14 L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 8 H18 V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <text x="12" y="18" fontSize="8" fontWeight="bold" fontFamily="system-ui" fill="currentColor" textAnchor="middle">₹</text>
  </svg>
);

const CalculatorsScreen = ({ onNavigate, onBack }) => {
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const { theme } = useSettings();

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    const opacity = Math.min(0.6, (scrollTop / 60) * 0.6);
    setScrollOpacity(opacity);
  };

  const calculatorTools = [
    { 
      id: 'emi', 
      icon: Calculator, 
      label: 'EMI Calculator', 
      sub: 'Standard Monthly Installment', 
      route: 'INPUT',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      id: 'sip-growth', 
      icon: SIPGrowthIcon, 
      label: 'SIP Calculator', 
      sub: 'Standard, Lumpsum & Step-Up Savings', 
      route: 'SIP_CALC',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      id: 'quick', 
      icon: Zap, 
      label: 'Quick Calculator', 
      sub: 'Instant EMI Results', 
      route: 'QUICK_CALCULATOR',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      id: 'advance', 
      icon: FilePlus, 
      label: 'Advance EMI', 
      sub: 'Detailed Loan Planning', 
      route: 'ADVANCE_EMI',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    { 
      id: 'standard', 
      icon: LayoutGrid, 
      label: 'Standard Calc', 
      sub: 'Basic Mathematical Operations', 
      route: 'STANDARD_CALC',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      id: 'scientific', 
      icon: Sigma, 
      label: 'Scientific Calc', 
      sub: 'Advanced Math Functions', 
      route: 'SCIENTIFIC_CALC',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    }
  ];

  const filteredTools = calculatorTools;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300 relative">
      {/* Header */}
      <header 
        style={{
          backgroundColor: theme === 'dark' 
            ? `rgba(17, 24, 39, ${scrollOpacity})` 
            : `rgba(255, 255, 255, ${scrollOpacity})`,
          backdropFilter: scrollOpacity > 0 ? `blur(${scrollOpacity * 10}px)` : 'none',
          WebkitBackdropFilter: scrollOpacity > 0 ? `blur(${scrollOpacity * 10}px)` : 'none',
        }}
        className={`absolute top-0 left-0 right-0 px-6 pt-12 pb-3.5 z-30 transition-all duration-200 ${
          scrollOpacity > 0 
            ? 'shadow-sm border-b border-gray-100 dark:border-gray-800' 
            : 'border-b border-transparent'
        }`}
      >
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">All Calculators</h1>
        </div>
      </header>

      {/* Main Content */}
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar px-6 pt-24 pb-36 space-y-4"
      >
        <div className="mb-2">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 mb-4">Primary Tools</h2>
          <div className="space-y-3">
            {filteredTools.map((tool) => (
              <motion.button
                key={tool.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(tool.route, tool.label)}
                className="w-full bg-white dark:bg-gray-800 rounded-[2rem] p-5 flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-all text-left group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 ${tool.bgColor} dark:bg-opacity-20 ${tool.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                    <tool.icon size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight mb-1">{tool.label}</h3>
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{tool.sub}</p>
                  </div>
                </div>
                
                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <ChevronRight size={20} strokeWidth={3} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Suggestion Card */}
        <div className="mt-4 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] text-white shadow-lg shadow-blue-200 opacity-80">
           <h4 className="text-lg font-black mb-2">Need Help?</h4>
           <p className="text-xs font-bold text-blue-100 mb-4 leading-relaxed">
             Our smart banking tools can help you plan your savings and investments more effectively.
           </p>
           <button 
            onClick={() => onNavigate('SMART_BANKING')}
            className="px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm"
           >
             Explore Smart Banking
           </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorsScreen;
