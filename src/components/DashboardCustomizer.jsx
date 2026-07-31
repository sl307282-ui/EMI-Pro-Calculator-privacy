import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Check, Calculator, FilePlus, Scale, Sparkles, 
  UserCircle, FileBadge, HandCoins, Zap, RefreshCw, 
  LayoutGrid, Sigma, Ruler, Map, Wallet, ShieldCheck, Crown,
  TrendingUp
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { t } from '../utils/calculatorLogic';

const SIPGrowthIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" fill="none" />
    <path d="M12 2 A 10 10 0 1 1 2 12" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" />
    <path d="M6 16 L10 12 L14 14 L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 8 H18 V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <text x="12" y="18" fontSize="8" fontWeight="bold" fontFamily="system-ui" fill="currentColor" textAnchor="middle">₹</text>
  </svg>
);

const DashboardCustomizer = ({ onBack }) => {
  const { language } = useSettings();

  const allTools = [
    { id: 'emi', icon: Calculator, label: t('emi', language), sub: 'EMI & Totals', route: 'INPUT' },
    { id: 'sip-growth', icon: SIPGrowthIcon, label: 'SIP Growth', sub: 'Continuous Wealth', route: 'SIP_CALC' },
    { id: 'advance', icon: FilePlus, label: 'Advance EMI', sub: 'Detailed plan', route: 'ADVANCE_EMI' },
    { id: 'compare', icon: Scale, label: 'Compare Loans', sub: 'Best options', route: 'COMPARE_INPUT' },
    { id: 'smart-prepay', icon: Sparkles, label: 'Smart Prepay', sub: 'Save Interest', route: 'SMART_PREPAY' },
    { id: 'inflation', icon: TrendingUp, label: 'Inflation Insights', sub: 'Purchasing Power', route: 'INFLATION_INSIGHTS' },
    { id: 'profile', icon: UserCircle, label: t('loan_tracker', language), sub: 'Saved profiles', route: 'LOAN_PROFILE' },
    { id: 'eligible', icon: FileBadge, label: 'Loan Eligible', sub: 'Check limits', route: 'LOAN_ELIGIBILITY' },
    { id: 'affordability', icon: HandCoins, label: 'Loan Affordability', sub: 'Know limits', route: 'LOAN_AFFORDABILITY' },
    { id: 'quick', icon: Zap, label: 'Quick Calculator', sub: 'Instant results', route: 'QUICK_CALCULATOR' },
    { id: 'refinance', icon: RefreshCw, label: 'Loan Refinance', sub: 'Switch & Save', route: 'LOAN_REFINANCE' },
    { id: 'standard', icon: LayoutGrid, label: 'Standard Calc', sub: 'Basic math', route: 'STANDARD_CALC' },
    { id: 'scientific', icon: Sigma, label: 'Scientific Calc', sub: 'Advanced math', route: 'SCIENTIFIC_CALC' },
    { id: 'unit', icon: Ruler, label: 'Unit Converter', sub: 'Instant conv.', route: 'UNIT_CONVERTER' },
    { id: 'land', icon: Map, label: 'Land Purchase', sub: 'Calculator', route: 'LAND_PURCHASE' },
    { id: 'chit', icon: Wallet, label: 'Chit Fund', sub: 'Calculator', route: 'CHIT_CALCULATOR' },
  ];

  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('home_icon_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 9);
        }
      }
    } catch (e) {
      console.warn('Failed to parse home_icon_order in DashboardCustomizer', e);
    }
    return allTools.slice(0, 9).map(t => t.id);
  });

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length < 9) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleSave = () => {
    if (selectedIds.length !== 9) return;
    
    // Construct the new order: selected ones first, then the rest
    const remaining = allTools.filter(t => !selectedIds.includes(t.id)).map(t => t.id);
    const newOrder = [...selectedIds, ...remaining];
    
    localStorage.setItem('home_icon_order', JSON.stringify(newOrder));
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 flex justify-between items-center border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-800 dark:text-white active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Customize Home</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select exactly 9 tools</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-xs font-black ${selectedIds.length === 9 ? 'text-green-500' : 'text-orange-500'}`}>
                {selectedIds.length}/9
            </span>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 overscroll-contain touch-pan-y min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="grid grid-cols-2 gap-3 pb-32">
          {allTools.map((tool) => {
            const isSelected = selectedIds.includes(tool.id);
            const isDisabled = !isSelected && selectedIds.length >= 9;

            return (
              <motion.button
                key={tool.id}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={() => handleToggle(tool.id)}
                className={`relative p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 text-center ${
                  isSelected 
                    ? 'border-primary bg-primary/5 dark:bg-blue-900/10' 
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 opacity-60'
                } ${isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                    isSelected ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-700'
                }`}>
                  <tool.icon size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-900 dark:text-white leading-tight">{tool.label}</p>
                  <p className="text-[8px] text-gray-400 uppercase font-black tracking-tighter mt-0.5">{tool.sub}</p>
                </div>
                
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white shadow-sm">
                    <Check size={12} strokeWidth={4} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-gray-900 via-white/90 dark:via-gray-900/90 to-transparent">
        <button
          onClick={handleSave}
          disabled={selectedIds.length !== 9}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
            selectedIds.length === 9 
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
        >
          Update Dashboard
        </button>
      </div>
    </div>
  );
};

export default DashboardCustomizer;
