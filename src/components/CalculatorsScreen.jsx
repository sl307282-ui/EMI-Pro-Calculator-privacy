import React, { useEffect } from 'react';
import { 
  Calculator, Zap, FilePlus, LayoutGrid, Sigma, Layers, Building2, CreditCard, Sprout,
  Receipt, ShieldCheck, LineChart, ChevronRight, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { StatusBar, Style } from '@capacitor/status-bar';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

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
  const { headerRef, handleScroll } = useHeaderScroll();
  const { theme } = useSettings();

  useEffect(() => {
    const isDark = theme === 'dark';
    try {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch (err) {}
  }, [theme]);

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
      id: 'rent-buy', 
      icon: Building2, 
      label: 'Rent vs. Buy', 
      sub: 'Home Wealth & Break-Even Analyzer', 
      route: 'RENT_VS_BUY',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    { 
      id: 'card-trap', 
      icon: CreditCard, 
      label: 'Card Trap', 
      sub: 'Credit Card Min-Due Trap Simulator', 
      route: 'CARD_TRAP',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    { 
      id: 'loan-split', 
      icon: Layers, 
      label: 'Loan Split', 
      sub: 'Gold, Car & Home Portfolio Split', 
      route: 'LOAN_SPLIT',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
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
      id: 'wealth-planner', 
      icon: Sprout, 
      label: 'Wealth Planner', 
      sub: 'SWP, Goal SIP & Hybrid Plan', 
      route: 'WEALTH_PLANNER',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    { 
      id: 'tax-salary', 
      icon: Receipt, 
      label: 'Tax & Salary', 
      sub: 'Income Tax, Take-Home CTC & GST', 
      route: 'TAX_SALARY',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      id: 'retirement', 
      icon: ShieldCheck, 
      label: 'Retirement Planner', 
      sub: 'NPS, EPF & Gratuity Calculation', 
      route: 'RETIREMENT',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      id: 'smart-roi', 
      icon: LineChart, 
      label: 'Smart ROI', 
      sub: 'CAGR, Real Return & Doubling Time', 
      route: 'SMART_ROI',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
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
      {/* Scrollable Container with Sticky AppHeader */}
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 88px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="All Calculators"
          onBack={onBack}
          variant="soft-blue"
        />

        <div className="px-6 pt-4 space-y-4">
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
    </div>
  );
};

export default CalculatorsScreen;
