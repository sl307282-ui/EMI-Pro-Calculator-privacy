import React, { useState, useMemo } from 'react';
import {
  CreditCard, RotateCcw, Share2, Sparkles, AlertTriangle,
  TrendingDown, ShieldCheck, ArrowRight, Zap, CheckCircle2,
  Clock, DollarSign, Percent
} from 'lucide-react';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { useSettings } from '../context/SettingsContext';
import { shareAsText } from '../utils/exportUtils';
import {
  formatCurrency,
  formatNumericInput,
  parseFormattedNumber,
  calculateCardTrap
} from '../utils/calculatorLogic';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtLakh = (val) => {
  const num = Number(val || 0);
  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${fmt(num)}`;
};

export default function CardTrapCalculator({ onBack }) {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const { currency } = useSettings();

  // Inputs state
  const [balance, setBalance] = useState('100000');
  const [apr, setApr] = useState('42');
  const [minDuePercent, setMinDuePercent] = useState('5');
  const [emiRate, setEmiRate] = useState('15');
  const [emiMonths, setEmiMonths] = useState(12);
  const [processingFeePercent, setProcessingFeePercent] = useState('1.5');

  // Synchronous debt simulation
  const results = useMemo(() => {
    return calculateCardTrap({
      balance: parseFloat(balance) || 100000,
      apr: parseFloat(apr) || 42,
      minDuePercent: parseFloat(minDuePercent) || 5,
      minDueFloor: 200,
      emiRate: parseFloat(emiRate) || 15,
      emiMonths: parseInt(emiMonths) || 12,
      processingFeePercent: parseFloat(processingFeePercent) || 1.5
    });
  }, [balance, apr, minDuePercent, emiRate, emiMonths, processingFeePercent]);

  const handleReset = () => {
    setBalance('100000');
    setApr('42');
    setMinDuePercent('5');
    setEmiRate('15');
    setEmiMonths(12);
    setProcessingFeePercent('1.5');
  };

  const handleShare = () => {
    const text = `💳 Credit Card Minimum-Due Trap (EMI Pro)
---------------------------------------------
Outstanding Balance: ₹${fmt(results.principal)}
Card APR: ${results.annualRate}% p.a. (3.5%/mo)

⚠️ Paying 5% Minimum Due:
• Payoff Duration: ${results.payoffYearsMinDue} Years (${results.monthsMinDue} months)
• Total Interest Paid: ₹${fmt(results.totalInterestMinDue)}
• Total Amount Paid: ₹${fmt(results.totalPaidMinDue)} (${results.multiplierMinDue}x Principal)

✅ Converting to ${emiMonths}-Month EMI (${emiRate}%):
• Monthly EMI: ₹${fmt(results.emiAmount)}
• Total Interest: ₹${fmt(results.totalInterestEMI)}
• Payoff Duration: ${(emiMonths / 12).toFixed(1)} Year
• Total Saved: ₹${fmt(results.interestSaved)} & ${results.timeSavedYears} Years

Calculated via EMI Pro.`;

    shareAsText('Credit Card Trap Analysis', text);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-none overflow-hidden relative"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'opacity, transform'
      }}
    >
      {/* Scrollable Container with Sticky AppHeader */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y min-h-0"
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Card Trap"
          subtitle="Credit Card Min-Due Trap"
          onBack={onBack}
          rightActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Reset values"
                aria-label="Reset"
              >
                <RotateCcw size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Share calculation"
                aria-label="Share"
              >
                <Share2 size={20} strokeWidth={2} />
              </button>
            </div>
          }
        />

        <div className="max-w-md mx-auto px-4 pt-3 pb-8 space-y-4">
          {/* Shocking Savings Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-[#881337] via-[#4C0519] to-[#1F0208] text-white p-5 shadow-xl relative overflow-hidden border border-rose-900/60">
            <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-rose-400" />
                  Minimum-Due Danger Alert
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  {results.multiplierMinDue}x Total Cost
                </span>
              </div>

              <div className="pt-1">
                <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                  Save{' '}
                  <span className="text-emerald-400">
                    {fmtLakh(results.interestSaved)}
                  </span>{' '}
                  & {results.timeSavedYears} Years
                </h3>
                <p className="text-xs text-rose-200 font-medium mt-1">
                  Converting this card debt to a {emiMonths}-month EMI frees you in{' '}
                  {(emiMonths / 12).toFixed(1)} year instead of being trapped for{' '}
                  <strong className="text-white">{results.payoffYearsMinDue} years</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 mt-3 border-t border-rose-800/60 text-center">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                    Min-Due Total Interest
                  </p>
                  <p className="text-sm font-black text-rose-400 mt-0.5">
                    {fmtLakh(results.totalInterestMinDue)}
                  </p>
                  <p className="text-[9px] text-rose-300/80 font-semibold mt-0.5">
                    Takes {results.payoffYearsMinDue} Years
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    EMI Conversion Interest
                  </p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">
                    {fmtLakh(results.totalInterestEMI)}
                  </p>
                  <p className="text-[9px] text-emerald-300/80 font-semibold mt-0.5">
                    Takes {(emiMonths / 12).toFixed(1)} Year
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Principal vs Interest Comparison Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">
              Total Outflow Breakdown
            </h4>

            {/* Path 1 Bar: Minimum Due */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-rose-600 dark:text-rose-400">
                  5% Minimum Due Path ({results.payoffYearsMinDue} Yrs)
                </span>
                <span className="text-gray-900 dark:text-white">
                  ₹{fmt(results.totalPaidMinDue)}
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      (results.principal / results.totalPaidMinDue) * 100
                    )}%`
                  }}
                  className="bg-blue-600"
                  title="Principal"
                />
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      (results.totalInterestMinDue / results.totalPaidMinDue) * 100
                    )}%`
                  }}
                  className="bg-rose-500"
                  title="Interest"
                />
              </div>
            </div>

            {/* Path 2 Bar: EMI Conversion */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  EMI Conversion Path ({(emiMonths / 12).toFixed(1)} Yr)
                </span>
                <span className="text-gray-900 dark:text-white">
                  ₹{fmt(results.totalPaidEMI)}
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      (results.principal / results.totalPaidEMI) * 100
                    )}%`
                  }}
                  className="bg-blue-600"
                  title="Principal"
                />
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      (results.totalInterestEMI / results.totalPaidEMI) * 100
                    )}%`
                  }}
                  className="bg-emerald-500"
                  title="Interest"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-1 text-[10px] font-bold text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Principal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Min-Due Interest
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                EMI Interest
              </span>
            </div>
          </div>

          {/* Side-by-Side Detailed Matrix */}
          <div className="grid grid-cols-2 gap-3">
            {/* MINIMUM DUE CARD */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-2.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-gray-100 dark:border-gray-700">
                <AlertTriangle size={15} className="text-rose-500" />
                <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase">
                  5% Min Due
                </h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Initial Payment
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    ₹{fmt(results.principal * (minDuePercent / 100))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Payoff Duration
                  </span>
                  <span className="font-black text-rose-600 dark:text-rose-400">
                    {results.payoffYearsMinDue} Years
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Total Interest
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.totalInterestMinDue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Total Repayment
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.totalPaidMinDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* EMI CONVERSION CARD */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-2.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-gray-100 dark:border-gray-700">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                  EMI Conversion
                </h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Monthly EMI
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    ₹{fmt(results.emiAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Payoff Duration
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {emiMonths} Months
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Total Interest
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.totalInterestEMI)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Total Repayment
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.totalPaidEMI)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Card Inputs */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3.5">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Credit Card Balance & APR
            </h4>

            {/* Outstanding Balance */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Outstanding Balance
                </span>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                  <span className="text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumericInput(balance)}
                    onChange={(e) =>
                      setBalance(parseFormattedNumber(e.target.value))
                    }
                    className="w-24 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="10000"
                max="1000000"
                step="5000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full accent-rose-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Card APR & Min Due % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Card APR (% p.a.)
                  </span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {apr}%
                  </span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="54"
                  step="0.5"
                  value={apr}
                  onChange={(e) => setApr(e.target.value)}
                  className="w-full accent-rose-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Min Due (%)
                  </span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {minDuePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={minDuePercent}
                  onChange={(e) => setMinDuePercent(e.target.value)}
                  className="w-full accent-rose-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* EMI Conversion Inputs */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3.5">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Alternative EMI Conversion Plan
            </h4>

            {/* EMI Conversion Rate */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Bank EMI Conversion Rate
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {emiRate}% p.a.
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="24"
                step="0.5"
                value={emiRate}
                onChange={(e) => setEmiRate(e.target.value)}
                className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* EMI Tenure Selector */}
            <div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                EMI Tenure
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {[3, 6, 9, 12, 18, 24].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEmiMonths(m)}
                    className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                      emiMonths === m
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
