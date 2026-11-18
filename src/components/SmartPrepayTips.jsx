import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, TrendingDown, Rocket, ShieldCheck, 
  Lightbulb, Calculator, FileText, CalendarRange, 
  Sparkles, CheckCircle2 
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { t } from '../utils/calculatorLogic';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

/* ─── Premium Custom Prepayment Badge ─── */
const PrepaymentCircleIcon = () => (
  <div className="w-12 h-12 rounded-[1.1rem] bg-emerald-100/80 dark:bg-emerald-950/50 flex items-center justify-center relative shadow-inner">
    <div className="absolute inset-0 rounded-[1.1rem] border border-dashed border-emerald-400 animate-[spin_10s_linear_infinite] opacity-40"></div>
    <div className="flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400">
      <TrendingDown size={22} className="relative z-10" />
      <span className="text-[10px] font-black leading-none mt-0.5 relative z-10">₹</span>
    </div>
  </div>
);

/* ─── High-Fidelity Custom Vector Illustration ─── */
const PremiumIllustration = () => (
  <div className="relative w-[120px] h-[120px] flex-shrink-0 flex items-center justify-center select-none">
    {/* Ambient Glowing Aura */}
    <div className="absolute inset-0 bg-emerald-400/10 dark:bg-emerald-400/5 blur-xl rounded-full" />
    
    {/* Clipboard (LOAN) */}
    <svg className="w-[90px] h-[90px] drop-shadow-md transform translate-y-[-5px]" viewBox="0 0 100 100" fill="none">
      {/* Clipboard base */}
      <rect x="15" y="20" width="70" height="75" rx="10" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="2" />
      {/* Dark theme base support */}
      <rect x="15" y="20" width="70" height="75" rx="10" fill="currentColor" className="text-emerald-900/10 pointer-events-none" />
      {/* Clip */}
      <rect x="35" y="10" width="30" height="15" rx="4" fill="#374151" />
      <circle cx="50" cy="17" r="3" fill="#A5D6A7" />
      {/* "LOAN" Text */}
      <text x="50" y="42" fill="#1B5E20" fontSize="10" fontWeight="900" fontFamily="system-ui" textAnchor="middle" letterSpacing="0.5">LOAN</text>
      
      {/* Graph line */}
      <path d="M25 75 L45 60 L60 68 L78 48" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Declining Arrow head */}
      <path d="M70 48 H78 V56" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Grid bars */}
      <rect x="28" y="55" width="8" height="20" rx="2" fill="#81C784" opacity="0.8" />
      <rect x="42" y="50" width="8" height="25" rx="2" fill="#66BB6A" opacity="0.8" />
      <rect x="56" y="58" width="8" height="17" rx="2" fill="#4CAF50" opacity="0.8" />
      <rect x="70" y="40" width="8" height="35" rx="2" fill="#388E3C" opacity="0.8" />
    </svg>
    
    {/* Gold Coins Stack (Bottom Left of Clipboard) */}
    <div className="absolute bottom-3 left-[28px] -translate-x-1/2 flex flex-col gap-[2px] z-10">
      <div className="w-[24px] h-[6px] rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-600 shadow-sm flex items-center justify-center text-[4px] font-black text-amber-950">₹</div>
      <div className="w-[24px] h-[6px] rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-600 shadow-sm flex items-center justify-center text-[4px] font-black text-amber-950">₹</div>
      <div className="w-[24px] h-[6px] rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-600 shadow-sm flex items-center justify-center text-[4px] font-black text-amber-950">₹</div>
    </div>
    
    {/* Money Bag (Bottom Right of Clipboard) */}
    <svg className="absolute bottom-2 right-[6px] w-[38px] h-[38px] drop-shadow-lg z-10" viewBox="0 0 42 42" fill="none">
      {/* Bag Body */}
      <path d="M6 32 C6 22 14 14 21 14 C28 14 36 22 36 32 C36 38 28 40 21 40 C14 40 6 38 6 32 Z" fill="#2E7D32" />
      {/* Bag Neck ties */}
      <path d="M16 14 C16 11 26 11 26 14" stroke="#81C784" strokeWidth="2.5" />
      <circle cx="21" cy="28" r="5.5" fill="#C8E6C9" opacity="0.9" />
      <text x="21" y="31" fill="#1B5E20" fontSize="9" fontWeight="bold" fontFamily="system-ui" textAnchor="middle">₹</text>
    </svg>
    
    {/* Pocket Calculator (Middle-bottom) */}
    <div className="absolute bottom-2 right-[36px] bg-slate-800 dark:bg-slate-700 w-[22px] h-[28px] rounded-md border border-slate-600 flex flex-col p-[2px] shadow-lg z-20">
      {/* Screen */}
      <div className="bg-emerald-100 dark:bg-emerald-200 w-full h-[5px] rounded-[1px] flex justify-end items-center pr-[1px]">
        <div className="w-[1.5px] h-[3px] bg-slate-900" />
      </div>
      {/* Keys */}
      <div className="grid grid-cols-3 gap-[1px] mt-[2px] flex-1">
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-slate-600 rounded-[1px]" />
        <div className="bg-amber-500 rounded-[1px]" />
      </div>
    </div>
  </div>
);

/* ─── List Benefit Item ─── */
const BenefitItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
      <Icon size={14} strokeWidth={2.5} />
    </div>
    <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200 leading-snug">{text}</span>
  </div>
);

/* ─── Micro Grid Step Card ─── */
const StepCard = ({ title, icon: Icon, color, bg }) => (
  <div className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/5 shadow-sm flex-1 min-w-0 transition-transform duration-300 hover:scale-105">
    <div className={`w-8 h-8 rounded-xl ${color} ${bg} flex items-center justify-center mb-1.5 shadow-sm`}>
      <Icon size={16} strokeWidth={2.5} />
    </div>
    <p className="text-[8px] font-black text-gray-700 dark:text-gray-300 leading-tight tracking-tight mt-0.5">
      {title}
    </p>
  </div>
);

export default function SmartPrepayTips({ onBack, onCalculate }) {
  const { headerRef, handleScroll } = useHeaderScroll();
  const { language } = useSettings();

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-50/50 dark:bg-transparent transition-colors duration-500 min-h-0 overflow-hidden relative">
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Main Body with Sticky AppHeader */}
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Prepayment Insights"
          onBack={onBack}
        />

        <div className="px-6 py-5 space-y-6">
        
        {/* Card 1: Reduce Loan Faster with Prepayment */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/80 dark:border-emerald-900/30 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden">
          
          {/* Subtle Graphic background dots */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#10B981 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }} />

          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <PrepaymentCircleIcon />
              <h2 className="text-lg font-black text-emerald-900 dark:text-emerald-100 mt-4 leading-tight">
                Reduce Loan Faster<br />with Prepayment
              </h2>
            </div>
            
            <PremiumIllustration />
          </div>

          <p className="text-[11px] text-emerald-900/70 dark:text-emerald-300/70 font-bold leading-relaxed mt-4">
            Paying extra EMI during the early loan period can significantly reduce your loan tenure and save a large amount of interest.
          </p>

          <div className="mt-5 space-y-2 border-t border-emerald-100/50 dark:border-emerald-900/20 pt-4">
            <BenefitItem icon={TrendingDown} text="Lower total interest" />
            <BenefitItem icon={Rocket} text="Faster loan closure" />
            <BenefitItem icon={ShieldCheck} text="Better financial freedom" />
          </div>

          {/* Example Alert box */}
          <div className="mt-5 bg-white/60 dark:bg-white/5 border border-emerald-200/50 dark:border-white/5 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb size={16} />
            </div>
            <p className="text-[11.5px] leading-relaxed text-emerald-900/80 dark:text-emerald-200/80 font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 font-black">Example:</span> Prepaying ₹50,000 in the first year of a loan can save thousands in future interest.
            </p>
          </div>
        </div>

        {/* Card 2: Use Me for Smart Prepayment */}
        <div className="relative group">
          {/* Ambient Glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-indigo-500/10 rounded-[2.5rem] blur-[3px]" />
          
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl shadow-blue-500/5">
            
            {/* Header: Title + Active Tag */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-gray-900 dark:text-white leading-tight">
                    Use Me for Smart Prepayment
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold leading-normal mt-0.5">
                    Calculate your prepayment benefit and see how much you can save.
                  </p>
                </div>
              </div>

              {/* Active Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full border border-emerald-500/20 flex-shrink-0">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
                  Active
                </span>
              </div>
            </div>

            {/* Horizontal Micro Step cards */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <StepCard title="Enter Loan Details" icon={FileText} color="text-emerald-500" bg="bg-emerald-500/10 dark:bg-emerald-500/20" />
              <StepCard title="Add Prepayment" icon={Calculator} color="text-blue-500" bg="bg-blue-500/10 dark:bg-blue-500/20" />
              <StepCard title="See Total Savings" icon={TrendingDown} color="text-purple-500" bg="bg-purple-500/10 dark:bg-purple-500/20" />
              <StepCard title="Plan Smart Strategy" icon={CalendarRange} color="text-orange-500" bg="bg-orange-500/10 dark:bg-orange-500/20" />
            </div>

            {/* Action CTA Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onCalculate}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 text-white font-black py-4.5 rounded-2xl text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 relative overflow-hidden group"
            >
              {/* Dynamic shining shimmer overlay */}
              <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
              <Sparkles size={16} />
              Calculate Prepayment Savings
            </motion.button>

            {/* Security Footer */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-4">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>100% Secure • Private • Instant Results</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
