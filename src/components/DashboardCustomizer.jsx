import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { 
  ChevronLeft, GripVertical, ChevronUp, ChevronDown, Plus, Minus, RotateCcw, Check, CheckCircle2,
  Calculator, FilePlus, Scale, Sparkles, TrendingUp,
  UserCircle, FileBadge, HandCoins, Zap, RefreshCw, 
  LayoutGrid, Sigma, Ruler, Map, Wallet, Layers,
  Building2, CreditCard, Sprout, Receipt, ShieldCheck, LineChart
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { t } from '../utils/calculatorLogic';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const SIPGrowthIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" fill="none" />
    <path d="M12 2 A 10 10 0 1 1 2 12" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" />
    <path d="M6 16 L10 12 L14 14 L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 8 H18 V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <text x="12" y="18" fontSize="8" fontWeight="bold" fontFamily="system-ui" fill="currentColor" textAnchor="middle">₹</text>
  </svg>
);

const getToolIconStyles = (id) => {
  switch (id) {
    case 'emi':
      return 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white';
    case 'sip-growth':
      return 'bg-gradient-to-br from-[#06b6d4] to-[#10b981] text-white';
    case 'wealth-planner':
      return 'bg-gradient-to-br from-[#10b981] to-[#0d9488] text-white';
    case 'rent-buy':
      return 'bg-gradient-to-br from-[#0d9488] to-[#047857] text-white';
    case 'card-trap':
      return 'bg-gradient-to-br from-[#e11d48] to-[#be123c] text-white';
    case 'advance':
      return 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white';
    case 'compare':
      return 'bg-gradient-to-br from-[#4f46e5] to-[#3b82f6] text-white';
    case 'smart-prepay':
      return 'bg-gradient-to-br from-[#f97316] to-[#ef4444] text-white';
    case 'inflation':
      return 'bg-gradient-to-br from-[#f43f5e] to-[#e11d48] text-white';
    case 'profile':
      return 'bg-gradient-to-br from-[#a855f7] to-[#7c3aed] text-white';
    case 'eligible':
      return 'bg-gradient-to-br from-[#10b981] to-[#059669] text-white';
    case 'affordability':
      return 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white';
    case 'quick':
      return 'bg-gradient-to-br from-[#facc15] to-[#f97316] text-white';
    case 'loan-split':
      return 'bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white';
    case 'tax-salary':
      return 'bg-gradient-to-br from-[#2563eb] to-[#4f46e5] text-white';
    case 'retirement':
      return 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white';
    case 'smart-roi':
      return 'bg-gradient-to-br from-[#f59e0b] to-[#ea580c] text-white';
    case 'refinance':
      return 'bg-gradient-to-br from-[#0d9488] to-[#0f766e] text-white';
    case 'standard':
      return 'bg-gradient-to-br from-[#6b7280] to-[#4b5563] text-white';
    case 'scientific':
      return 'bg-gradient-to-br from-[#ec4899] to-[#db2777] text-white';
    case 'unit':
      return 'bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white';
    case 'land':
      return 'bg-gradient-to-br from-[#047857] to-[#065f46] text-white';
    case 'chit':
      return 'bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white';
    default:
      return 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white';
  }
};

const SortablePinnedItem = ({
  tool,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={tool}
      id={tool.id}
      dragListener={false}
      dragControls={dragControls}
      className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-3 shadow-sm flex items-center justify-between gap-2.5 select-none transition-shadow"
      whileDrag={{
        scale: 1.025,
        boxShadow: '0 16px 30px -10px rgba(0,0,0,0.25)',
        zIndex: 50,
      }}
      transition={{ duration: 0.15 }}
    >
      {/* Drag Handle */}
      <div
        className="p-1.5 -ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing rounded-lg touch-none flex items-center justify-center flex-shrink-0"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical size={19} />
      </div>

      {/* Position Badge */}
      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center flex-shrink-0 border border-gray-200/50 dark:border-gray-600/50">
        <span className="text-[10px] font-black text-gray-600 dark:text-gray-300">
          #{index + 1}
        </span>
      </div>

      {/* Tool Icon */}
      <div className={`w-10 h-10 ${getToolIconStyles(tool.id)} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
        <tool.icon size={19} strokeWidth={2.2} className="text-white" />
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-black text-gray-900 dark:text-white truncate">
          {tool.label}
        </p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate mt-0.5">
          {tool.sub}
        </p>
      </div>

      {/* Controls: Up/Down Arrows + Remove */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            className={`p-1 rounded-md transition-colors ${
              index === 0
                ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90'
            }`}
            title="Move Up"
          >
            <ChevronUp size={13} strokeWidth={3} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMoveDown(index)}
            className={`p-1 rounded-md transition-colors ${
              index === total - 1
                ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90'
            }`}
            title="Move Down"
          >
            <ChevronDown size={13} strokeWidth={3} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemove(tool.id)}
          className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center transition-all active:scale-90 ml-1"
          title="Remove from Home"
        >
          <Minus size={15} strokeWidth={2.5} />
        </button>
      </div>
    </Reorder.Item>
  );
};

const DashboardCustomizer = ({ onBack }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const { language } = useSettings();

  const allTools = useMemo(() => [
    { id: 'emi', icon: Calculator, label: t('emi', language), sub: 'EMI & Totals', route: 'INPUT' },
    { id: 'sip-growth', icon: SIPGrowthIcon, label: t('sip_growth', language) || 'SIP Growth', sub: t('sip_growth_sub', language) || 'Continuous Wealth', route: 'SIP_CALC' },
    { id: 'wealth-planner', icon: Sprout, label: t('wealth_planner', language) || 'Wealth Planner', sub: t('wealth_planner_sub', language) || 'SWP, Goal & Hybrid', route: 'WEALTH_PLANNER' },
    { id: 'rent-buy', icon: Building2, label: t('rent_vs_buy', language) || 'Rent vs. Buy', sub: 'Home Wealth Analyzer', route: 'RENT_VS_BUY' },
    { id: 'card-trap', icon: CreditCard, label: t('card_trap', language) || 'Card Trap', sub: 'Min-Due Calculator', route: 'CARD_TRAP' },
    { id: 'advance', icon: FilePlus, label: t('advance_emi', language) || 'Advance EMI', sub: t('advance_emi_sub', language) || 'Detailed plan', route: 'ADVANCE_EMI' },
    { id: 'compare', icon: Scale, label: t('compare_loans', language) || 'Compare Loans', sub: t('compare_loans_sub', language) || 'Best options', route: 'COMPARE_INPUT' },
    { id: 'smart-prepay', icon: Sparkles, label: 'Smart Prepay', sub: 'Save Interest', route: 'SMART_PREPAY' },
    { id: 'inflation', icon: TrendingUp, label: 'Inflation Insights', sub: 'Purchasing Power', route: 'INFLATION_INSIGHTS' },
    { id: 'profile', icon: UserCircle, label: t('loan_tracker', language) || 'Loan Tracker', sub: 'Saved profiles', route: 'LOAN_PROFILE' },
    { id: 'eligible', icon: FileBadge, label: t('loan_eligibility', language) || 'Loan Eligible', sub: t('loan_eligibility_sub', language) || 'Check limits', route: 'LOAN_ELIGIBILITY' },
    { id: 'affordability', icon: HandCoins, label: t('loan_affordability', language) || 'Loan Affordability', sub: t('loan_affordability_sub', language) || 'Know limits', route: 'LOAN_AFFORDABILITY' },
    { id: 'quick', icon: Zap, label: t('quick_calculator', language) || 'Quick Calculator', sub: t('quick_calculator_sub', language) || 'Instant results', route: 'QUICK_CALCULATOR' },
    { id: 'refinance', icon: RefreshCw, label: t('loan_refinance', language) || 'Loan Refinance', sub: t('loan_refinance_sub', language) || 'Switch & Save', route: 'LOAN_REFINANCE' },
    { id: 'standard', icon: LayoutGrid, label: t('standard_calc', language) || 'Standard Calc', sub: t('standard_calc_sub', language) || 'Basic math', route: 'STANDARD_CALC' },
    { id: 'scientific', icon: Sigma, label: t('scientific_calc', language) || 'Scientific Calc', sub: t('scientific_calc_sub', language) || 'Advanced math', route: 'SCIENTIFIC_CALC' },
    { id: 'unit', icon: Ruler, label: t('unit_converter', language) || 'Unit Converter', sub: t('unit_converter_sub', language) || 'Instant conv.', route: 'UNIT_CONVERTER' },
    { id: 'loan-split', icon: Layers, label: t('loan_split', language) || 'Loan Split', sub: 'Gold, Car & Home', route: 'LOAN_SPLIT' },
    { id: 'tax-salary', icon: Receipt, label: t('tax_salary', language) || 'Tax & Salary', sub: t('tax_salary_sub', language) || 'Income Tax, CTC & GST', route: 'TAX_SALARY' },
    { id: 'retirement', icon: ShieldCheck, label: t('retirement', language) || 'Retirement', sub: t('retirement_sub', language) || 'NPS, EPF & Gratuity', route: 'RETIREMENT' },
    { id: 'smart-roi', icon: LineChart, label: t('smart_roi', language) || 'Smart ROI', sub: t('smart_roi_sub', language) || 'CAGR, Real Return & Doubling', route: 'SMART_ROI' },
    { id: 'land', icon: Map, label: 'Land Purchase', sub: 'Calculator', route: 'LAND_PURCHASE' },
    { id: 'chit', icon: Wallet, label: 'Chit Fund', sub: 'Calculator', route: 'CHIT_CALCULATOR' },
  ], [language]);

  const [pinnedTools, setPinnedTools] = useState(() => {
    try {
      const saved = localStorage.getItem('home_icon_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded = [];
          parsed.forEach(id => {
            const tool = allTools.find(t => t.id === id);
            if (tool && !loaded.some(l => l.id === tool.id)) {
              loaded.push(tool);
            }
          });
          // Also append newly introduced tools if not already present
          allTools.forEach(tool => {
            if (!loaded.some(l => l.id === tool.id)) {
              loaded.push(tool);
            }
          });
          if (loaded.length > 0) {
            return loaded;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse home_icon_order in DashboardCustomizer', e);
    }
    return [...allTools];
  });

  const availableTools = useMemo(() => {
    return allTools.filter(tool => !pinnedTools.some(p => p.id === tool.id));
  }, [allTools, pinnedTools]);

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setPinnedTools(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= pinnedTools.length - 1) return;
    setPinnedTools(prev => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRemove = (id) => {
    setPinnedTools(prev => prev.filter(t => t.id !== id));
  };

  const handleAdd = (tool) => {
    setPinnedTools(prev => [...prev, tool]);
  };

  const handleReset = () => {
    setPinnedTools([...allTools]);
  };

  const handleSave = () => {
    if (pinnedTools.length === 0) return;
    const newOrder = pinnedTools.map(t => t.id);
    localStorage.setItem('home_icon_order', JSON.stringify(newOrder));
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden relative">
      {/* Main Scrollable Content Area with Sticky AppHeader */}
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y min-h-0" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 88px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Customize Home"
          subtitle={`${pinnedTools.length} ${pinnedTools.length === 1 ? 'Tool' : 'Tools'} Active`}
          onBack={onBack}
          rightActions={
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset to default order"
              title="Reset to default order"
              className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center gap-1.5 text-xs font-bold"
            >
              <RotateCcw size={15} strokeWidth={2.2} />
              <span>Reset</span>
            </button>
          }
        />

        <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-28">

          {/* Section 1: Pinned on Home */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  Pinned on Home
                </h2>
                <p className="text-[10px] text-gray-400 font-medium">
                  Drag handle (⋮⋮) or use arrows to reorder
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary dark:bg-blue-900/30 dark:text-blue-400">
                {pinnedTools.length} Active
              </span>
            </div>

            {pinnedTools.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center bg-white/50 dark:bg-gray-800/40">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  No tools currently pinned.
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Tap <span className="font-bold text-primary">+</span> in More Tools below to add.
                </p>
              </div>
            ) : (
              <Reorder.Group 
                axis="y" 
                values={pinnedTools} 
                onReorder={setPinnedTools} 
                className="space-y-2.5"
              >
                {pinnedTools.map((tool, index) => (
                  <SortablePinnedItem
                    key={tool.id}
                    tool={tool}
                    index={index}
                    total={pinnedTools.length}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onRemove={handleRemove}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>

          {/* Section 2: More Tools (Tap to Add) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  More Tools
                </h2>
                <p className="text-[10px] text-gray-400 font-medium">
                  Tap to add back to your home dashboard
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200/70 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {availableTools.length} Hidden
              </span>
            </div>

            {availableTools.length === 0 ? (
              <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-800/60 flex items-center justify-center gap-2.5 text-center">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  All tools are active on your Home dashboard!
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTools.map((tool) => (
                  <motion.div
                    key={tool.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleAdd(tool)}
                    className="group bg-white dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-3 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 ${getToolIconStyles(tool.id)} rounded-xl flex items-center justify-center shadow-sm opacity-90 group-hover:opacity-100 flex-shrink-0 transition-opacity`}>
                        <tool.icon size={19} strokeWidth={2.2} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                          {tool.label}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate mt-0.5">
                          {tool.sub}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdd(tool);
                      }}
                      className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
                      title="Add to Home"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Floating Bottom Save Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-gray-900 via-white/95 dark:via-gray-900/95 to-transparent border-t border-gray-100/60 dark:border-gray-800/60 z-20"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 0.75rem)' }}
      >
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={pinnedTools.length === 0}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              pinnedTools.length > 0
                ? 'bg-primary text-white shadow-primary/25 hover:brightness-110 cursor-pointer'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check size={18} strokeWidth={3} />
            <span>Update Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;

