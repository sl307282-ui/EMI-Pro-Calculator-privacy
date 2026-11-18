import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, TrendingUp, Target, Shield, 
  Lightbulb, Calculator, FileText, Calendar, 
  Sparkles, CheckCircle2, PieChart, ShieldCheck
} from 'lucide-react';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

/* ─── Sprout-Moneybag Premium Icon ─── */
const SproutMoneyIcon = () => (
  <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-900/30 flex items-center justify-center relative shadow-sm">
    <div className="absolute inset-0 rounded-[1.2rem] border border-dashed border-indigo-400 animate-[spin_15s_linear_infinite] opacity-30"></div>
    <div className="flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400">
      <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Moneybag base */}
        <path d="M6 18 C6 14 10 10 12 10 C14 10 18 14 18 18 C18 21 15 22 12 22 C9 22 6 21 6 18 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M9 10 C9 8 15 8 15 10" />
        <text x="12" y="17" fontSize="8" fontWeight="black" fontFamily="system-ui" fill="currentColor" textAnchor="middle">₹</text>
        {/* Sprout */}
        <path d="M12 10 V6" strokeWidth="2" />
        <path d="M12 7 C10 5 9 5 9 7 C9 8 11 8 12 7" fill="currentColor" />
        <path d="M12 6 C14 4 15 4 15 6 C15 7 13 7 12 6" fill="currentColor" />
      </svg>
    </div>
  </div>
);

/* ─── Premium Solid-White Floating Compound Growth Card ─── */
const SIPGrowthCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-md shadow-indigo-900/5 dark:shadow-black/20 border border-indigo-100/20 dark:border-gray-700/80 flex flex-col justify-between relative overflow-hidden h-[155px] w-[140px] transition-all duration-300">
    {/* Soft glowing ambient background decorative element */}
    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

    <div>
      <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-0.5">Invest</span>
      <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none block">₹10,000/month</span>
      <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 block leading-tight mt-0.5 max-w-[125px]">
        for 20 years at an average return of 12% p.a. can grow to
      </span>
      <span className="text-[13px] font-black text-indigo-700 dark:text-indigo-300 block mt-0.5 tracking-tight leading-none">~₹1 Crore*</span>
    </div>

    {/* Graphic Illustration Section */}
    <div className="relative w-full h-[65px] mt-2 flex items-end justify-between">
      
      {/* Curved Growth Line + Gradient Area Chart Fill */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 120 65" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Soft Area compound shape */}
        <path d="M 15 55 Q 60 50 110 20 L 110 55 Z" fill="url(#areaGradient)" />
        {/* Growth Line curve */}
        <path d="M 15 55 Q 60 50 110 20" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arrow Point dot */}
        <circle cx="110" cy="20" r="2.5" fill="#4F46E5" />
      </svg>

      {/* Gold Coin Stacks Grid with Sprouts */}
      <div className="relative w-full flex items-end justify-between px-2.5 z-10">
        
        {/* Stack 1: Today */}
        <div className="flex flex-col items-center">
          {/* Plant Sprout */}
          <svg className="w-3.5 h-3.5 text-emerald-500 mb-[-2px] animate-pulse" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 10 V6" />
            <path d="M5 7 Q3 5 3 6" />
            <path d="M5 6 Q7 4 7 5" />
          </svg>
          {/* Stack of 3D Coins (2 coins) */}
          <div className="flex flex-col gap-[1px]">
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
          </div>
          <span className="text-[5.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 block leading-none">Today</span>
        </div>

        {/* Stack 2: 10 Years */}
        <div className="flex flex-col items-center">
          {/* Plant Sprout */}
          <svg className="w-4 h-4 text-emerald-500 mb-[-2px]" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 10 V4" strokeWidth="1.8" />
            <path d="M5 6 Q2 4 2 5" fill="currentColor" />
            <path d="M5 5 Q8 3 8 4" fill="currentColor" />
          </svg>
          {/* Stack of 3D Coins (4 coins) */}
          <div className="flex flex-col gap-[1px]">
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
          </div>
          <span className="text-[5.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 block leading-none">10 Yrs</span>
        </div>

        {/* Stack 3: 20 Years */}
        <div className="flex flex-col items-center">
          {/* Plant Sprout */}
          <svg className="w-5 h-5 text-emerald-500 mb-[-2px]" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 10 V2" strokeWidth="2" />
            <path d="M5 5 Q1 3 1 4.5" fill="currentColor" />
            <path d="M5 4 Q9 2 9 3.5" fill="currentColor" />
            <circle cx="5" cy="2" r="0.8" fill="currentColor" />
          </svg>
          {/* Stack of 3D Coins (7 coins) */}
          <div className="flex flex-col gap-[1px]">
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
            <div className="w-[14px] h-[4px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 border border-amber-600/80 shadow-sm flex items-center justify-center text-[3px] font-black text-amber-950">₹</div>
          </div>
          <span className="text-[5.5px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5 block leading-none">20 Yrs</span>
        </div>

      </div>

    </div>

  </div>
);

/* ─── Bullet Feature Item ─── */
const SIPFeatureItem = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-4 py-2 border-b border-indigo-100/20 last:border-0">
    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-100/30 dark:border-indigo-900/30 shadow-sm">
      <Icon size={16} strokeWidth={2.5} />
    </div>
    <div className="flex-1">
      <h4 className="text-[13px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-snug">{title}</h4>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold leading-normal mt-0.5">{desc}</p>
    </div>
  </div>
);

/* ─── Step Column Card ─── */
const SIPStepCard = ({ title, icon: Icon, color, bg }) => (
  <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 shadow-sm flex-1 min-w-0 transition-all duration-300 hover:scale-105">
    <div className={`w-8 h-8 rounded-xl ${color} ${bg} flex items-center justify-center mb-2 shadow-sm`}>
      <Icon size={16} strokeWidth={2.5} />
    </div>
    <p className="text-[8px] font-black text-gray-700 dark:text-gray-300 leading-tight tracking-tight mt-0.5">
      {title}
    </p>
  </div>
);

export default function SIPTips({ onBack, onCalculate }) {
  const { headerRef, handleScroll } = useHeaderScroll();

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-50/50 dark:bg-transparent transition-colors duration-500 min-h-0 overflow-hidden relative">
      
      {/* Ambient glowing radial decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-400/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-emerald-400/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Main scrolling section with Sticky AppHeader */}
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="SIP Insights"
          onBack={onBack}
        />

        <div className="px-6 py-6 space-y-6">
        
        {/* Card 1: Grow Wealth with SIP / Invest Small, Grow Big */}
        <div className="bg-indigo-50/20 dark:bg-indigo-950/5 border border-indigo-100/50 dark:border-indigo-900/10 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden flex flex-col gap-6">
          
          {/* Dot patterns */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#6366F1 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }} />

          {/* Header Row: Title & Sprout Badge + Illustration Card */}
          <div className="flex flex-row gap-4 justify-between items-center">
            
            <div className="flex-1 min-w-0 pr-1">
              <SproutMoneyIcon />
              <h2 className="text-base font-black text-indigo-950 dark:text-indigo-50 mt-3 leading-tight tracking-tight">
                Grow Wealth with SIP
              </h2>
              <span className="text-[12px] text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5 tracking-tight leading-none">
                Invest Small, Grow Big
              </span>
              <p className="text-[9.5px] text-indigo-950/60 dark:text-indigo-300/60 font-bold leading-relaxed mt-2.5">
                SIP helps you build wealth over the long term through compounding and rupee cost averaging.
              </p>
            </div>
            
            <div className="w-[140px] flex-shrink-0">
              <SIPGrowthCard />
            </div>

          </div>

          {/* Core features block */}
          <div className="space-y-1 border-t border-indigo-100/40 dark:border-indigo-900/10 pt-4">
            <SIPFeatureItem icon={TrendingUp} title="Power of Compounding" desc="Your money grows on both returns and time." />
            <SIPFeatureItem icon={Shield} title="Rupee Cost Averaging" desc="Investing regularly reduces the impact of market ups and downs." />
            <SIPFeatureItem icon={Target} title="Build Long-Term Wealth" desc="Stay invested, stay disciplined and create a secure future." />
          </div>

          {/* Example Alert Box */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/25 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb size={16} />
            </div>
            <p className="text-[12px] leading-relaxed text-indigo-950/80 dark:text-indigo-200/80 font-bold">
              <span className="text-indigo-600 dark:text-indigo-400 font-black">Example:</span> Investing ₹10,000 every month for 20 years at an average return of 12% p.a. can grow to ~₹1 Crore.
            </p>
          </div>

          <span className="block text-[8px] font-bold text-gray-400 dark:text-gray-500 text-center mt-[-8px]">
            *This is an illustration. Actual returns may vary.
          </span>
        </div>

        {/* Card 2: Use Me for Smart SIP Planning */}
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-blue-500/10 rounded-[2.5rem] blur-[3px]" />
          
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl shadow-indigo-500/5">
            
            {/* Header: Title + Badge */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-gray-900 dark:text-white leading-tight">
                    Use Me for Smart SIP Planning
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold leading-normal mt-0.5">
                    Calculate your SIP future value and see how your small investments can grow big.
                  </p>
                </div>
              </div>

              {/* Status active badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full border border-emerald-500/20 flex-shrink-0">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
                  Active
                </span>
              </div>
            </div>

            {/* Horizontal steps matrix */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <SIPStepCard title="Enter SIP Details" icon={FileText} color="text-emerald-500" bg="bg-emerald-500/10 dark:bg-emerald-500/20" />
              <SIPStepCard title="Choose Horizon" icon={Calculator} color="text-blue-500" bg="bg-blue-500/10 dark:bg-blue-500/20" />
              <SIPStepCard title="Future Growth" icon={PieChart} color="text-purple-500" bg="bg-purple-500/10 dark:bg-purple-500/20" />
              <SIPStepCard title="Stay Disciplined" icon={Calendar} color="text-orange-500" bg="bg-orange-500/10 dark:bg-orange-500/20" />
            </div>

            {/* Indigo Action CTA Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onCalculate}
              className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-white font-black py-4.5 rounded-2xl text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
              <Sparkles size={16} />
              Calculate SIP Returns
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
