import React, { useState, useMemo } from 'react';
import {
  RotateCcw, Share2, LineChart, Percent, TrendingUp,
  Zap, Calendar, ArrowRight, DollarSign, Clock, Sparkles
} from 'lucide-react';
import {
  formatNumericInput,
  parseFormattedNumber,
  formatCurrency,
  calculateCAGR,
  calculateRealReturn,
  calculateDoublingTimeline
} from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const fmtCompact = (num) => {
  const val = Math.abs(num);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function SmartROICalculator({ onBack }) {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [activeTab, setActiveTab] = useState('CAGR'); // 'CAGR' | 'REAL_RETURN' | 'DOUBLING'

  // -------------------------------------------------------------
  // TAB 1: CAGR STATE
  // -------------------------------------------------------------
  const [cagrInitial, setCagrInitial] = useState('100000');
  const [cagrFinal, setCagrFinal] = useState('250000');
  const [cagrPeriodVal, setCagrPeriodVal] = useState('5');
  const [cagrPeriodType, setCagrPeriodType] = useState('Years'); // 'Years' | 'Months'

  // -------------------------------------------------------------
  // TAB 2: REAL RETURN STATE
  // -------------------------------------------------------------
  const [realPrincipal, setRealPrincipal] = useState('500000');
  const [realNominalRate, setRealNominalRate] = useState('12');
  const [realInflationRate, setRealInflationRate] = useState('6');
  const [realYears, setRealYears] = useState('10');

  // -------------------------------------------------------------
  // TAB 3: DOUBLING STATE
  // -------------------------------------------------------------
  const [doublingRate, setDoublingRate] = useState('12');
  const [doublingStartingAmt, setDoublingStartingAmt] = useState('100000');

  // -------------------------------------------------------------
  // MEMOIZED COMPUTATIONS
  // -------------------------------------------------------------
  const cagrResults = useMemo(() => {
    return calculateCAGR({
      initialValue: cagrInitial,
      finalValue: cagrFinal,
      periodValue: cagrPeriodVal,
      periodType: cagrPeriodType
    });
  }, [cagrInitial, cagrFinal, cagrPeriodVal, cagrPeriodType]);

  const realResults = useMemo(() => {
    return calculateRealReturn({
      investmentAmount: realPrincipal,
      nominalReturnRate: realNominalRate,
      inflationRate: realInflationRate,
      periodYears: realYears
    });
  }, [realPrincipal, realNominalRate, realInflationRate, realYears]);

  const doublingResults = useMemo(() => {
    return calculateDoublingTimeline({
      annualRate: doublingRate,
      startingAmount: doublingStartingAmt
    });
  }, [doublingRate, doublingStartingAmt]);

  // -------------------------------------------------------------
  // RESET HANDLER
  // -------------------------------------------------------------
  const handleReset = () => {
    if (activeTab === 'CAGR') {
      setCagrInitial('100000');
      setCagrFinal('250000');
      setCagrPeriodVal('5');
      setCagrPeriodType('Years');
    } else if (activeTab === 'REAL_RETURN') {
      setRealPrincipal('500000');
      setRealNominalRate('12');
      setRealInflationRate('6');
      setRealYears('10');
    } else {
      setDoublingRate('12');
      setDoublingStartingAmt('100000');
    }
  };

  // -------------------------------------------------------------
  // SHARE SUMMARY
  // -------------------------------------------------------------
  const handleShare = () => {
    if (activeTab === 'CAGR') {
      const text = `📈 CAGR (Compounded Annual Growth Rate)\n` +
        `• Initial Investment: ₹${parseFloat(cagrInitial).toLocaleString('en-IN')}\n` +
        `• Final Value: ₹${parseFloat(cagrFinal).toLocaleString('en-IN')}\n` +
        `• Period: ${cagrPeriodVal} ${cagrPeriodType}\n` +
        `• Annualized CAGR: ${cagrResults.cagr}%\n` +
        `• Absolute Return: ${cagrResults.absoluteReturn}%\n` +
        `• Net Profit: ₹${cagrResults.netProfit.toLocaleString('en-IN')}\n\n` +
        `Calculated via EMI Pro Smart ROI`;
      shareAsText('CAGR Valuation', text);
    } else if (activeTab === 'REAL_RETURN') {
      const text = `📉 Inflation-Adjusted Real Return\n` +
        `• Investment Amount: ₹${parseFloat(realPrincipal).toLocaleString('en-IN')}\n` +
        `• Nominal Return: ${realNominalRate}% p.a.\n` +
        `• Inflation Rate: ${realInflationRate}% p.a.\n` +
        `• Real Rate (Fisher Eq): ${realResults.realRate}%\n` +
        `• Nominal Corpus: ${fmtCompact(realResults.nominalMaturity)}\n` +
        `• Real Purchasing Power: ${fmtCompact(realResults.realPurchasingPower)}\n` +
        `• Erosion to Inflation: ${fmtCompact(realResults.purchasingPowerErosion)}\n\n` +
        `Calculated via EMI Pro Smart ROI`;
      shareAsText('Real Return Valuation', text);
    } else {
      const text = `⏳ Wealth Doubling & Multiplication Timeline\n` +
        `• Annual Rate of Return: ${doublingRate}% p.a.\n` +
        `• Exact Doubling Time: ${doublingResults.exactDoublingYears} Years (Rule of 72: ${doublingResults.ruleOf72Years} Yrs)\n` +
        `• Milestones:\n` +
        doublingResults.milestones.map(m => `  - ${m.multiplier}: ${m.years} Yrs ➔ ${fmtCompact(m.amount)}`).join('\n') +
        `\n\nCalculated via EMI Pro Smart ROI`;
      shareAsText('Wealth Doubling Timeline', text);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-gray-900 overflow-hidden h-full relative" style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar bg-transparent"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Smart ROI"
          onBack={onBack}
          rightActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Reset"
                aria-label="Reset"
              >
                <RotateCcw size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Share"
                aria-label="Share"
              >
                <Share2 size={20} strokeWidth={2} />
              </button>
            </div>
          }
        />

        <div className="px-5 pt-4 pb-10 max-w-lg mx-auto">
          {/* 3-Tab Segmented Switcher */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex gap-1 mb-6 shadow-inner">
            <button
              onClick={() => setActiveTab('CAGR')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'CAGR'
                  ? 'bg-[#D97706] text-white shadow-md shadow-[#D97706]/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CAGR
            </button>
            <button
              onClick={() => setActiveTab('REAL_RETURN')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'REAL_RETURN'
                  ? 'bg-[#D97706] text-white shadow-md shadow-[#D97706]/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Real Return
            </button>
            <button
              onClick={() => setActiveTab('DOUBLING')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'DOUBLING'
                  ? 'bg-[#D97706] text-white shadow-md shadow-[#D97706]/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Doubling
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: CAGR (Compound Annual Growth Rate)                 */}
          {/* ========================================================= */}
          {activeTab === 'CAGR' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#1E293B] dark:to-[#0F172A] border border-[#FDE68A] dark:border-amber-500/25 rounded-3xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-wider text-[#92400E] dark:text-amber-400 uppercase">
                    Annualized CAGR
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-600/10 text-[#92400E] border border-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20">
                    {cagrResults.years} Years
                  </span>
                </div>
                <div className="text-3xl font-black mb-1 text-[#0F172A] dark:text-[#FBBF24] tracking-tight">
                  {cagrResults.cagr}%
                  <span className="text-xs font-semibold text-[#B45309] dark:text-amber-400/80 ml-1.5">p.a.</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-slate-400 mb-5">
                  Absolute Gain: <span className="font-bold text-[#059669] dark:text-emerald-400">+{cagrResults.absoluteReturn}%</span> • Net Profit: <span className="font-bold text-[#B45309] dark:text-amber-400">₹{cagrResults.netProfit.toLocaleString('en-IN')}</span>
                </p>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-amber-600/15 dark:border-amber-400/15">
                  <div className="bg-white/85 dark:bg-[#0F172A]/60 border border-amber-600/15 dark:border-amber-400/15 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold tracking-wide uppercase">Initial Value</div>
                    <div className="text-xs font-bold text-[#0F172A] dark:text-slate-100 mt-0.5">{fmtCompact(cagrResults.initialValue)}</div>
                  </div>
                  <div className="bg-white/85 dark:bg-[#0F172A]/60 border border-amber-600/15 dark:border-amber-400/15 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold tracking-wide uppercase">Final Value</div>
                    <div className="text-xs font-bold text-[#0F172A] dark:text-slate-100 mt-0.5">{fmtCompact(cagrResults.finalValue)}</div>
                  </div>
                  <div className="bg-white/85 dark:bg-[#0F172A]/60 border border-amber-600/15 dark:border-amber-400/15 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold tracking-wide uppercase">Total Profit</div>
                    <div className="text-xs font-bold text-[#059669] dark:text-emerald-400 mt-0.5">+{fmtCompact(cagrResults.netProfit)}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Initial Investment */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Initial Investment Amount
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(cagrInitial)}
                        onChange={(e) => setCagrInitial(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="10000000"
                    step="5000"
                    value={parseFloat(cagrInitial) || 0}
                    onChange={(e) => setCagrInitial(e.target.value)}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Final Value */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Final Maturity Value
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(cagrFinal)}
                        onChange={(e) => setCagrFinal(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000000"
                    step="5000"
                    value={parseFloat(cagrFinal) || 0}
                    onChange={(e) => setCagrFinal(e.target.value)}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Duration */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Investment Duration
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cagrPeriodVal}
                        onChange={(e) => setCagrPeriodVal(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                      <div className="flex bg-slate-100 dark:bg-gray-700 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setCagrPeriodType('Years')}
                          className={`px-2 py-1 rounded-md transition-all ${
                            cagrPeriodType === 'Years'
                              ? 'bg-white dark:bg-gray-800 text-amber-600 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          Yrs
                        </button>
                        <button
                          type="button"
                          onClick={() => setCagrPeriodType('Months')}
                          className={`px-2 py-1 rounded-md transition-all ${
                            cagrPeriodType === 'Months'
                              ? 'bg-white dark:bg-gray-800 text-amber-600 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          Mos
                        </button>
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max={cagrPeriodType === 'Years' ? 40 : 480}
                    step={cagrPeriodType === 'Years' ? 0.5 : 1}
                    value={parseFloat(cagrPeriodVal) || 0}
                    onChange={(e) => setCagrPeriodVal(e.target.value)}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: REAL RETURN (Fisher Equation)                      */}
          {/* ========================================================= */}
          {activeTab === 'REAL_RETURN' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#1E293B] dark:to-[#0F172A] border border-[#FDE68A] dark:border-amber-500/25 rounded-3xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-wider text-[#92400E] dark:text-amber-400 uppercase">
                    Real Inflation-Adjusted Return
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-600/10 text-[#92400E] border border-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20">
                    Fisher Eq.
                  </span>
                </div>
                <div className="text-3xl font-black mb-1 text-[#0F172A] dark:text-[#FBBF24] tracking-tight">
                  {realResults.realRate}%
                  <span className="text-xs font-semibold text-[#B45309] dark:text-amber-400/80 ml-1.5">real p.a.</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-slate-400 mb-5">
                  Nominal <span className="font-bold text-[#0F172A] dark:text-slate-200">{realNominalRate}%</span> vs. Inflation <span className="font-bold text-[#E11D48] dark:text-rose-400">{realInflationRate}%</span> over <span className="font-bold text-[#0F172A] dark:text-slate-200">{realYears} Years</span>
                </p>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-amber-600/15 dark:border-amber-400/15">
                  <div className="bg-white/85 dark:bg-[#0F172A]/60 border border-amber-600/15 dark:border-amber-400/15 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold tracking-wide uppercase">Nominal Value</div>
                    <div className="text-xs font-bold text-[#0F172A] dark:text-slate-100 mt-0.5">{fmtCompact(realResults.nominalMaturity)}</div>
                  </div>
                  <div className="bg-white/85 dark:bg-[#0F172A]/60 border border-amber-600/15 dark:border-amber-400/15 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold tracking-wide uppercase">Real Purchasing</div>
                    <div className="text-xs font-bold text-[#059669] dark:text-emerald-400 mt-0.5">{fmtCompact(realResults.realPurchasingPower)}</div>
                  </div>
                  <div className="bg-white/85 dark:bg-[#0F172A]/60 border border-amber-600/15 dark:border-amber-400/15 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold tracking-wide uppercase">Inflation Loss</div>
                    <div className="text-xs font-bold text-[#E11D48] dark:text-rose-400 mt-0.5">-{fmtCompact(realResults.purchasingPowerErosion)}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Investment Amount */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Investment Principal
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(realPrincipal)}
                        onChange={(e) => setRealPrincipal(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="10000000"
                    step="10000"
                    value={parseFloat(realPrincipal) || 0}
                    onChange={(e) => setRealPrincipal(e.target.value)}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Nominal Rate vs Inflation Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Nominal Return (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={realNominalRate}
                      onChange={(e) => setRealNominalRate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Inflation Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={realInflationRate}
                      onChange={(e) => setRealInflationRate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Time Period */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Time Horizon (Years)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={realYears}
                        onChange={(e) => setRealYears(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-400">Yrs</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={parseFloat(realYears) || 0}
                    onChange={(e) => setRealYears(e.target.value)}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DOUBLING (Rule of 72 & Exact Multiplier Timeline)  */}
          {/* ========================================================= */}
          {activeTab === 'DOUBLING' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#1E293B] dark:to-[#0F172A] border border-[#FDE68A] dark:border-amber-500/25 rounded-3xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-wider text-[#92400E] dark:text-amber-400 uppercase">
                    Exact Doubling Time
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-600/10 text-[#92400E] border border-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20">
                    {doublingRate}% p.a.
                  </span>
                </div>
                <div className="text-3xl font-black mb-1 text-[#0F172A] dark:text-[#FBBF24] tracking-tight">
                  {doublingResults.exactDoublingYears}
                  <span className="text-base font-bold text-[#B45309] dark:text-amber-400/80 ml-2">Years</span>
                </div>
                <p className="text-xs text-[#475569] dark:text-slate-400 mb-5">
                  Rule of 72: <span className="font-bold text-[#B45309] dark:text-amber-400">{doublingResults.ruleOf72Years} Years</span> • Exact: <span className="font-bold text-[#059669] dark:text-emerald-400">{doublingResults.exactDoublingYears} Yrs</span>
                </p>

                {/* Multiplier Timeline Grid */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-amber-600/15 dark:border-amber-400/15">
                  {doublingResults.milestones.map((m) => (
                    <div key={m.multiplier} className="bg-white/85 dark:bg-[#0F172A]/60 border border-amber-600/15 dark:border-amber-400/15 rounded-xl p-2 text-center shadow-sm">
                      <div className="text-[10px] text-[#92400E] dark:text-amber-400 font-bold uppercase tracking-wider">{m.multiplier}</div>
                      <div className="text-xs font-black text-[#0F172A] dark:text-slate-100 mt-0.5">{m.years}y</div>
                      <div className="text-[9px] font-semibold text-[#059669] dark:text-emerald-400 truncate mt-0.5">{fmtCompact(m.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Expected Return Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Expected Annual Return (% p.a.)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={doublingRate}
                        onChange={(e) => setDoublingRate(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={parseFloat(doublingRate) || 0}
                    onChange={(e) => setDoublingRate(e.target.value)}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1%</span>
                    <span>12%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Optional Starting Amount */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Starting Investment Amount
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(doublingStartingAmt)}
                        onChange={(e) => setDoublingStartingAmt(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="10000000"
                    step="5000"
                    value={parseFloat(doublingStartingAmt) || 0}
                    onChange={(e) => setDoublingStartingAmt(e.target.value)}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
