import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Bell, Calculator, Zap, FilePlus, UserCircle,
  Scale, TrendingUp, CalendarClock, FileBadge, HandCoins,
  RefreshCw, LayoutGrid, Sigma,
  Ruler, Map, ChevronRight, ArrowRight, Lightbulb, Wallet,
  Vault, PiggyBank, ShieldCheck, Percent, Landmark, Cpu, Smartphone, Sparkles, Crown,
  Sun, Moon, Menu, X, Settings, Star, Share2, DollarSign, Globe, Pencil, Layers,
  Building2, CreditCard, Sprout, Receipt, LineChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share } from '@capacitor/share';
import InstallBanner from './InstallBanner';
import QuickEMIBanner from './QuickEMIBanner';
import { useSettings } from '../context/SettingsContext';
import { t, formatCurrency } from '../utils/calculatorLogic';
import { version as packageVersion } from '../../package.json';

const SIPGrowthIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
    <path d="M6 16 L10 12 L14 14 L18 8" stroke="currentColor" strokeWidth="2.5" />
    <path d="M14 8 H18 V12" stroke="currentColor" strokeWidth="2.5" />
    <text x="12" y="18" fontSize="8" fontWeight="bold" fontFamily="system-ui" fill="currentColor" stroke="none" textAnchor="middle">₹</text>
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

const GridItem = ({ action, onNavigate, language }) => {
  return (
    <div
      className="bg-transparent flex flex-col items-center justify-start p-0.5 select-none cursor-pointer active:scale-95 transition-transform"
      onClick={() => {
        onNavigate(action.route, action.id === 'emi' ? t('emi', language) : action.id === 'profile' ? t('loan_tracker', language) : action.label);
      }}
    >
      <div className={`w-14 h-14 ${getToolIconStyles(action.id)} rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/5 dark:shadow-none flex-shrink-0 mb-2`}>
        <action.icon size={26} strokeWidth={2.2} className="text-white" />
      </div>
      <span className="block text-[12px] font-semibold text-gray-900 dark:text-white leading-[1.25] text-center w-full px-0.5 line-clamp-2">
        {action.id === 'emi' ? t('emi', language) : action.id === 'profile' ? t('loan_tracker', language) : action.label}
      </span>
    </div>
  );
};

const HomeScreen = ({ onNavigate, onNotifications, notificationCount, onInstall }) => {
  const { theme, setTheme, language, setLanguage, currency, setCurrency } = useSettings();
  const [appVersion, setAppVersion] = useState(packageVersion || '1.2.9');

  useEffect(() => {
    const getVersion = async () => {
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
          const info = await window.Capacitor.Plugins.App.getInfo();
          if (info && info.version) {
            setAppVersion(info.version);
          }
        }
      } catch (e) {
        console.warn('Failed to get app version from Capacitor:', e);
      }
    };
    getVersion();

    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
    const handle = idleCallback(() => {
      try {
        localStorage.getItem('loan_profiles');
        localStorage.getItem('emi_quick_calc');
        localStorage.getItem('home_icon_order');
      } catch (e) {
        // ignore
      }
    });
    return () => {
      if (window.cancelIdleCallback && typeof handle === 'number') {
        window.cancelIdleCallback(handle);
      }
    };
  }, []);

  const quickActions = useMemo(() => {
    const defaultActions = [
      { id: 'emi', icon: Calculator, label: t('emi', language), sub: 'EMI & Totals', route: 'INPUT' },
      { id: 'sip-growth', icon: SIPGrowthIcon, label: t('sip_growth', language), sub: t('sip_growth_sub', language), route: 'SIP_CALC' },
      { id: 'wealth-planner', icon: Sprout, label: t('wealth_planner', language) || 'Wealth Planner', sub: t('wealth_planner_sub', language) || 'SWP, Goal & Hybrid', route: 'WEALTH_PLANNER' },
      { id: 'rent-buy', icon: Building2, label: t('rent_vs_buy', language) || 'Rent vs. Buy', sub: 'Home Wealth Analyzer', route: 'RENT_VS_BUY' },
      { id: 'card-trap', icon: CreditCard, label: t('card_trap', language) || 'Card Trap', sub: 'Min-Due Calculator', route: 'CARD_TRAP' },
      { id: 'advance', icon: FilePlus, label: t('advance_emi', language), sub: t('advance_emi_sub', language), route: 'ADVANCE_EMI' },
      { id: 'compare', icon: Scale, label: t('compare_loans', language), sub: t('compare_loans_sub', language), route: 'COMPARE_INPUT' },
      { id: 'smart-prepay', icon: Sparkles, label: t('smart_prepay', language), sub: t('smart_prepay_sub', language), route: 'SMART_PREPAY' },
      { id: 'inflation', icon: TrendingUp, label: t('inflation_insights', language), sub: t('inflation_insights_sub', language), route: 'INFLATION_INSIGHTS' },
      { id: 'profile', icon: UserCircle, label: t('loan_tracker', language), sub: t('loan_tracker_sub', language), route: 'LOAN_PROFILE' },
      { id: 'eligible', icon: FileBadge, label: t('loan_eligible', language), sub: t('loan_eligible_sub', language), route: 'LOAN_ELIGIBILITY' },
      { id: 'affordability', icon: HandCoins, label: t('loan_affordability', language), sub: t('loan_affordability_sub', language), route: 'LOAN_AFFORDABILITY' },
      { id: 'quick', icon: Zap, label: t('quick_calculator', language), sub: t('quick_calculator_sub', language), route: 'QUICK_CALCULATOR' },
      { id: 'refinance', icon: RefreshCw, label: t('loan_refinance', language), sub: t('loan_refinance_sub', language), route: 'LOAN_REFINANCE' },
      { id: 'standard', icon: LayoutGrid, label: t('standard_calc', language), sub: t('standard_calc_sub', language), route: 'STANDARD_CALC' },
      { id: 'scientific', icon: Sigma, label: t('scientific_calc', language), sub: t('scientific_calc_sub', language), route: 'SCIENTIFIC_CALC' },
      { id: 'unit', icon: Ruler, label: t('unit_converter', language), sub: t('unit_converter_sub', language), route: 'UNIT_CONVERTER' },
      { id: 'loan-split', icon: Layers, label: t('loan_split', language) || 'Loan Split', sub: 'Gold, Car & Home', route: 'LOAN_SPLIT' },
      { id: 'tax-salary', icon: Receipt, label: t('tax_salary', language) || 'Tax & Salary', sub: t('tax_salary_sub', language) || 'Income Tax, CTC & GST', route: 'TAX_SALARY' },
      { id: 'retirement', icon: ShieldCheck, label: t('retirement', language) || 'Retirement', sub: t('retirement_sub', language) || 'NPS, EPF & Gratuity', route: 'RETIREMENT' },
      { id: 'smart-roi', icon: LineChart, label: t('smart_roi', language) || 'Smart ROI', sub: t('smart_roi_sub', language) || 'CAGR, Real Return & Doubling', route: 'SMART_ROI' },
    ];

    try {
      const saved = localStorage.getItem('home_icon_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = [];
          parsed.forEach(id => {
            const action = defaultActions.find(a => a.id === id);
            if (action) sorted.push(action);
          });
          // Also append any newly introduced default action not yet in user's saved order
          defaultActions.forEach(action => {
            if (!sorted.some(s => s.id === action.id)) {
              sorted.push(action);
            }
          });
          if (sorted.length > 0) {
            return sorted;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse home_icon_order in HomeScreen', e);
    }
    return defaultActions;
  }, [language]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'EMI Pro',
        text: 'Check out EMI Pro - calculate loan EMIs, plan prepayments, and track your loans!',
        url: 'https://play.google.com/store/apps/details?id=com.sohan.emiprocalculator',
        dialogTitle: 'Share EMI Pro',
      });
    } catch (e) {
      console.warn('Share failed:', e);
      if (navigator.share) {
        navigator.share({
          title: 'EMI Pro',
          text: 'Check out EMI Pro - calculate loan EMIs, plan prepayments, and track your loans!',
          url: window.location.origin
        }).catch(() => {});
      }
    }
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // Clean State-Driven Scroll Shrink (GPU-only, pure native scroll)
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = React.useRef(null);

  useEffect(() => {
    setIsScrolled(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (!isScrolled && scrollTop > 40) {
      setIsScrolled(true);
    } else if (isScrolled && scrollTop < 10) {
      setIsScrolled(false);
    }
  };

  const filteredActions = quickActions.filter(action => {
    const label = (action.id === 'emi' ? t('emi', language) : action.id === 'profile' ? t('loan_tracker', language) : action.label) || '';
    const sub = action.sub || '';
    return label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const visibleActions = filteredActions;

  const tipsData = [
    {
      id: 0,
      title: t('smart_tip', language),
      content: (
        <p className="text-[11px] text-emerald-900/70 dark:text-emerald-300/70 font-bold leading-normal">
          Paying extra EMI can reduce your loan tenure and save big on interest.
        </p>
      ),
      icon: Lightbulb,
      iconBg: 'bg-emerald-500 shadow-emerald-100 dark:shadow-emerald-900/20',
      cardBg: 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30',
      titleColor: 'text-emerald-700 dark:text-emerald-400',
      actionRoute: 'SMART_PREPAY_TIPS',
      actionLabel: t('know_more', language),
    },
    {
      id: 1,
      title: '💡 SIP Tip',
      content: (
        <p className="text-[11px] text-blue-900/70 dark:text-blue-300/70 font-bold leading-normal">
          Starting your SIP early gives your money more time to grow through the power of compounding.
        </p>
      ),
      icon: TrendingUp,
      iconBg: 'bg-blue-500 shadow-blue-100 dark:shadow-blue-900/20',
      cardBg: 'bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30',
      titleColor: 'text-blue-700 dark:text-blue-400',
      actionRoute: 'SIP_TIPS',
      actionLabel: t('know_more', language),
    },
    {
      id: 2,
      title: 'Savings Tip',
      content: (
        <p className="text-[11px] text-purple-900/70 dark:text-purple-300/70 font-bold leading-normal">
          Auditing your loan balances periodically helps refinance at lower interest rates.
        </p>
      ),
      icon: Wallet,
      iconBg: 'bg-purple-500 shadow-purple-100 dark:shadow-purple-900/20',
      cardBg: 'bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30',
      titleColor: 'text-purple-700 dark:text-purple-400',
      actionRoute: 'LOAN_PROFILE',
      actionLabel: 'Check Profiles',
    }
  ];

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 30;
    if (info.offset.x < -swipeThreshold) {
      setActiveTipIndex((prev) => (prev + 1) % 3);
    } else if (info.offset.x > swipeThreshold) {
      setActiveTipIndex((prev) => (prev - 1 + 3) % 3);
    }
  };

  const currentTip = tipsData[activeTipIndex];
  const CurrentIcon = currentTip.icon;



  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden h-full relative">
      {/* Scrollable Content with Native Sticky Header */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar bg-transparent transition-colors duration-300"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 88px)',
        }}
      >
        {/* Header (Sticky Top App Bar) */}
        <header
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(180deg, #172554 0%, #1E293B 100%)' 
              : 'linear-gradient(180deg, #DBEAFE 0%, #E0EFFE 100%)',
            paddingTop: `calc(max(var(--safe-top, 0px), 38px) + ${isScrolled ? 6 : 12}px)`,
            paddingBottom: `${isScrolled ? 6 : 12}px`,
            borderBottom: theme === 'dark' 
              ? '1px solid rgba(96, 165, 250, 0.18)' 
              : '1px solid rgba(37, 99, 235, 0.18)',
            boxShadow: isScrolled
              ? (theme === 'dark' ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)' : '0 4px 16px -2px rgba(15, 23, 42, 0.05)')
              : 'none',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transition: 'padding 0.25s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="sticky top-0 left-0 right-0 px-6 flex justify-between items-center z-50"
        >
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.div
                key="logo-title"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 origin-left">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(true)}
                      className="text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 flex-shrink-0 p-1 cursor-pointer select-none"
                      aria-label="Open menu"
                      title="Open menu"
                    >
                      <Menu size={22} strokeWidth={2} />
                    </button>
                    <h1
                      style={{
                        transform: isScrolled ? 'scale(0.92)' : 'scale(1)',
                        transformOrigin: 'left center',
                        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                      className="text-base font-black tracking-wider text-[#0F172A] dark:text-[#F8FAFC] uppercase leading-none mt-[1px]"
                    >
                      EMI <span className="text-blue-600 dark:text-blue-400">PRO</span>
                    </h1>
                  </div>
                  <div
                    style={{
                      maxHeight: isScrolled ? '0px' : '24px',
                      opacity: isScrolled ? 0 : 1,
                      marginTop: isScrolled ? '0px' : '4px',
                      transition: 'max-height 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1), margin-top 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    className="overflow-hidden"
                  >
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 pl-[30px] whitespace-nowrap">
                      Plan smart, calculate better, save more.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="search-bar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-1 mr-4"
              >
                <div className="relative flex items-center">
                  <Search size={18} className="absolute left-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search tools & calculators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-blue-100/50 dark:border-gray-700 rounded-2xl py-3 pl-11 pr-10 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500/20 transition-all"
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-3 text-[10px] font-black text-gray-400 bg-gray-200/50 dark:bg-gray-700 px-2 py-1 rounded-lg uppercase"
                  >
                    Esc
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`flex items-center origin-right ${isSearchOpen ? 'w-auto' : ''}`}
            style={{
              gap: isScrolled ? '4px' : '6px',
              transition: 'gap 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {!isSearchOpen && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search"
                title="Search"
                style={{
                  width: isScrolled ? '32px' : '36px',
                  height: isScrolled ? '32px' : '36px',
                  transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center p-0 rounded-full header-right-btn"
              >
                <Search size={20} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: isScrolled ? '32px' : '36px',
                height: isScrolled ? '32px' : '36px',
                transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center p-0 rounded-full header-right-btn"
            >
              {theme === 'dark' ? (
                <Sun size={20} strokeWidth={2} />
              ) : (
                <Moon size={20} strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              onClick={onNotifications}
              aria-label="Notifications"
              title="Notifications"
              style={{
                width: isScrolled ? '32px' : '36px',
                height: isScrolled ? '32px' : '36px',
                transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center relative p-0 rounded-full header-right-btn"
            >
              <Bell size={20} strokeWidth={2} />
              {notificationCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: theme === 'dark' ? '1.5px solid #172554' : '1.5px solid #DBEAFE',
                    top: isScrolled ? '1px' : '2px',
                    right: isScrolled ? '1px' : '2px',
                    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  className="absolute min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black flex items-center justify-center leading-none shadow-sm pointer-events-none"
                >
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex flex-col justify-start">
          {/* Quick EMI Calculator – Hero Card */}
          {!isSearchOpen && (
            <section
              style={{
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              className="px-5 h-[140px] mt-2.5 mb-2 flex-shrink-0 relative"
            >
              <QuickEMIBanner
                onNavigate={onNavigate}
              />
            </section>
          )}

          {/* Main Grid */}
          <section className="px-6 mt-2">
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                {t('financial_tools', language)}
              </h3>
              <button
                onClick={() => onNavigate('DASHBOARD_CUSTOMIZER')}
                className="p-2 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border border-blue-100/50 dark:border-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                title={t('customize_home', language)}
              >
                <Pencil size={15} className="stroke-[2.5]" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-y-5 gap-x-3">
              {visibleActions.length > 0 ? (
                visibleActions.map((action) => (
                  <GridItem
                    key={action.id}
                    action={action}
                    onNavigate={onNavigate}
                    language={language}
                  />
                ))
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                  <Search size={40} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold">No calculators found for "{searchQuery}"</p>
                  <p className="text-[11px] mt-1 font-medium">Try searching for EMI, Loan or ROI</p>
                </div>
              )}
            </div>
          </section>

          {/* Smart Tip Card Swipeable Carousel */}
          <section className="px-6 mt-6">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className={`relative overflow-hidden p-4.5 pb-7 flex items-start gap-4 rounded-[2.2rem] border transition-colors duration-500 cursor-grab active:cursor-grabbing select-none ${currentTip.cardBg}`}
            >
              {/* Tip content transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTipIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-4.5 w-full"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0 mt-0.5 transition-all ${currentTip.iconBg}`}>
                    <CurrentIcon size={20} />
                  </div>
                  <div className="flex-1 flex flex-col items-start gap-2.5 min-w-0">
                    <div className="w-full">
                      <h4 className={`text-[14px] font-black tracking-tight mb-1 ${currentTip.titleColor}`}>{currentTip.title}</h4>
                      {currentTip.content}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(currentTip.actionRoute); }}
                      className={`flex items-center gap-1 text-[11px] font-black bg-white dark:bg-gray-800 px-3.5 py-1.8 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 active:scale-95 transition-all mt-0.5 ${currentTip.titleColor}`}
                    >
                      {currentTip.actionLabel} <ChevronRight size={13} />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dots Pagination */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setActiveTipIndex(idx); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTipIndex === idx
                        ? idx === 0 ? 'bg-emerald-500 w-3' : idx === 1 ? 'bg-blue-500 w-3' : 'bg-purple-500 w-3'
                        : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                  />
                ))}
              </div>
            </motion.div>
          </section>
        </div>
      </div>

      {/* Smart Navigation Drawer Overlay */}
      {createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Drawer Backdrop */}
              <motion.div
                key="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
              />

              {/* Drawer Panel */}
              <motion.div
                key="drawer-panel"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed left-0 top-0 bottom-0 w-[290px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-2xl z-[10000] flex flex-col pt-16 pb-8 px-6 overflow-y-auto"
              >
                {/* Close Button & Branding */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/10">
                      <Calculator size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider leading-none">
                        EMI <span className="text-blue-600 dark:text-blue-400">PRO</span>
                      </h2>
                      <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Plan Smart</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Navigation Menu List */}
                <div className="flex flex-col gap-2.5 flex-1">
                  {/* My Loan Profile option */}
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onNavigate('LOAN_PROFILE');
                    }}
                    className="flex items-center gap-4 p-4.5 bg-transparent border border-transparent hover:border-gray-50 dark:hover:border-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 rounded-2.5xl text-gray-700 dark:text-gray-300 transition-all text-left"
                  >
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex-shrink-0">
                      <HandCoins size={22} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-black text-gray-900 dark:text-white">{t('my_loan_profile', language)}</span>
                      <span className="block text-xs font-bold text-gray-400 dark:text-gray-505 mt-0.5">{t('track_loans', language)}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  {/* Customize Dashboard option (renamed to Customize Home) */}
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onNavigate('DASHBOARD_CUSTOMIZER');
                    }}
                    className="flex items-center gap-4 p-4.5 bg-transparent border border-transparent hover:border-gray-50 dark:hover:border-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 rounded-2.5xl text-gray-700 dark:text-gray-300 transition-all text-left"
                  >
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0">
                      <Sparkles size={22} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-black text-gray-900 dark:text-white">{t('customize_home', language)}</span>
                      <span className="block text-xs font-bold text-gray-400 dark:text-gray-505 mt-0.5">{t('reorder_icons', language)}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  {/* Rate Us option */}
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      window.open('https://play.google.com/store/apps/details?id=com.sohan.emiprocalculator', '_blank');
                    }}
                    className="flex items-center gap-4 p-4.5 bg-transparent border border-transparent hover:border-gray-50 dark:hover:border-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 rounded-2.5xl text-gray-700 dark:text-gray-300 transition-all text-left"
                  >
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 rounded-xl flex-shrink-0">
                      <Star size={22} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-black text-gray-900 dark:text-white">{t('rate_us', language)}</span>
                      <span className="block text-xs font-bold text-gray-400 dark:text-gray-555 mt-0.5">{t('rate_app_store', language)}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  {/* Share Us option */}
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      handleShare();
                    }}
                    className="flex items-center gap-4 p-4.5 bg-transparent border border-transparent hover:border-gray-50 dark:hover:border-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 rounded-2.5xl text-gray-700 dark:text-gray-300 transition-all text-left"
                  >
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0">
                      <Share2 size={22} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-black text-gray-900 dark:text-white">{t('share_us', language)}</span>
                      <span className="block text-xs font-bold text-gray-400 dark:text-gray-505 mt-0.5">{t('share_friends', language)}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>

                  {/* Currency Picker */}
                  <div className="rounded-2.5xl border border-transparent overflow-hidden">
                    <button
                      onClick={() => setShowCurrencyPicker(v => !v)}
                      className="w-full flex items-center gap-4 p-4.5 bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-900/50 rounded-2.5xl text-gray-700 dark:text-gray-300 transition-all text-left"
                    >
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                        <DollarSign size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-black text-gray-900 dark:text-white">{t('currency', language)}</span>
                        <span className="block text-xs font-bold text-gray-400 dark:text-gray-505 mt-0.5 truncate">{t('std_currency', language)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.8 rounded-full">
                          {currency.split(' ')[0]}
                        </span>
                        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${showCurrencyPicker ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {showCurrencyPicker && (
                      <div className="px-2 pb-3.5 pt-1">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: '₹ INR',  symbol: '₹',    code: 'INR', country: 'India' },
                            { value: '$ USD',  symbol: '$',    code: 'USD', country: 'USA' },
                            { value: '€ EUR',  symbol: '€',    code: 'EUR', country: 'Europe' },
                            { value: '£ GBP',  symbol: '£',    code: 'GBP', country: 'UK' },
                            { value: '¥ JPY',  symbol: '¥',    code: 'JPY', country: 'Japan' },
                            { value: 'R$ BRL', symbol: 'R$',   code: 'BRL', country: 'Brazil' },
                            { value: 'Rp IDR', symbol: 'Rp',   code: 'IDR', country: 'Indonesia' },
                            { value: 'د.إ AED', symbol: 'د.إ', code: 'AED', country: 'UAE' },
                            { value: 'ر.س SAR', symbol: 'ر.س', code: 'SAR', country: 'Saudi' },
                          ].map(cur => (
                            <button
                              key={cur.value}
                              onClick={() => { setCurrency(cur.value); setShowCurrencyPicker(false); }}
                              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-3 rounded-xl border transition-all ${
                                currency === cur.value
                                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700'
                                  : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800'
                              }`}
                            >
                              <span className={`text-base font-black leading-none ${
                                currency === cur.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                              }`}>{cur.symbol}</span>
                              <span className={`text-[11px] font-black leading-tight ${
                                currency === cur.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'
                              }`}>{cur.code}</span>
                              <span className="text-[9px] font-bold text-gray-405 dark:text-gray-500 leading-tight">{cur.country}</span>
                              {currency === cur.value && (
                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Language Picker */}
                  <div className="rounded-2.5xl border border-transparent overflow-hidden">
                    {/* Language Row Header — tap to expand */}
                    <button
                      onClick={() => setShowLangPicker(v => !v)}
                      className="w-full flex items-center gap-4 p-4.5 bg-transparent hover:bg-gray-50/50 dark:hover:bg-gray-900/50 rounded-2.5xl text-gray-700 dark:text-gray-300 transition-all text-left"
                    >
                      <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl flex-shrink-0">
                        <Globe size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-black text-gray-900 dark:text-white">{t('language', language)}</span>
                        <span className="block text-xs font-bold text-gray-400 dark:text-gray-505 mt-0.5 truncate">{t('choose_language', language)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-0.8 rounded-full">
                          {language === 'English' ? '🇬🇧' : language === 'Hindi' ? '🇮🇳' : language === 'Spanish' ? '🇪🇸' : language === 'Arabic' ? '🇸🇦' : language === 'French' ? '🇫🇷' : language === 'Portuguese' ? '🇧🇷' : '🇮🇩'}
                        </span>
                        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${showLangPicker ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {/* Expandable language grid */}
                    {showLangPicker && (
                      <div className="px-2 pb-3.5 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'English',    flag: '🇬🇧', native: 'English',          label: 'English' },
                            { value: 'Hindi',      flag: '🇮🇳', native: 'हिंदी',             label: 'Hindi' },
                            { value: 'Spanish',    flag: '🇪🇸', native: 'Español',           label: 'Spanish' },
                            { value: 'Arabic',     flag: '🇸🇦', native: 'العربية',           label: 'Arabic' },
                            { value: 'French',     flag: '🇫🇷', native: 'Français',          label: 'French' },
                            { value: 'Portuguese', flag: '🇧🇷', native: 'Português',         label: 'Portuguese' },
                            { value: 'Indonesian', flag: '🇮🇩', native: 'Bahasa Indonesia',  label: 'Indonesian' },
                          ].map(lang => (
                            <button
                              key={lang.value}
                              onClick={() => { setLanguage(lang.value); setShowLangPicker(false); }}
                              className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-all text-left ${
                                language === lang.value
                                  ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700'
                                  : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/50 hover:border-violet-200 dark:hover:border-violet-800'
                              }`}
                            >
                              <span className="text-base leading-none">{lang.flag}</span>
                              <div className="min-w-0">
                                <span className={`block text-xs font-black leading-tight truncate ${
                                  language === lang.value ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-gray-200'
                                }`}>{lang.native}</span>
                                <span className="block text-[10px] font-bold text-gray-405 dark:text-gray-500 leading-tight mt-0.5">{lang.label}</span>
                              </div>
                              {language === lang.value && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Version Info footer */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Version {appVersion}</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default HomeScreen;
