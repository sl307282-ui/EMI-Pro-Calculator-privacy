import React, { useState, useMemo } from 'react';
import {
  TrendingUp, RotateCcw, Share2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Sparkles, Layers, DollarSign, Calendar, ArrowRight
} from 'lucide-react';
import {
  formatNumericInput,
  parseFormattedNumber,
  formatCurrency,
  calculateSWP,
  calculateGoalSIP,
  calculateSipPlusLumpsum
} from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import AppHeader from './AppHeader';
import CollapsingTabs from './CollapsingTabs';
import useHeaderScroll from '../hooks/useHeaderScroll';

// Quick helper to format large numbers compactly (e.g., ₹1.25 Cr, ₹35.5 L)
const fmtCompact = (num) => {
  const val = Math.abs(num);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function WealthPlannerCalculator({ onBack }) {
  const { headerRef, scrollRef, tabsRef, handleScroll, syncScroll } = useHeaderScroll({ threshold: 60, tabsThreshold: 64 });
  const [activeTab, setActiveTab] = useState('SWP'); // 'SWP' | 'GOAL_SIP' | 'HYBRID'

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        syncScroll(scrollRef.current.scrollTop);
      }
    });
  };

  // -------------------------------------------------------------
  // TAB 1: SWP State
  // -------------------------------------------------------------
  const [swpInvestment, setSwpInvestment] = useState('2500000');
  const [swpMonthlyWithdrawal, setSwpMonthlyWithdrawal] = useState('20000');
  const [swpReturnRate, setSwpReturnRate] = useState('8');
  const [swpPeriodValue, setSwpPeriodValue] = useState('10');
  const [swpPeriodType, setSwpPeriodType] = useState('Years'); // 'Years' | 'Months'
  const [swpShowSchedule, setSwpShowSchedule] = useState(false);

  // -------------------------------------------------------------
  // TAB 2: GOAL SIP State
  // -------------------------------------------------------------
  const [goalTarget, setGoalTarget] = useState('10000000');
  const [goalExisting, setGoalExisting] = useState('0');
  const [goalReturnRate, setGoalReturnRate] = useState('12');
  const [goalPeriodValue, setGoalPeriodValue] = useState('10');
  const [goalPeriodType, setGoalPeriodType] = useState('Years');
  const [goalStepUpRate, setGoalStepUpRate] = useState('10');
  const [goalShowSchedule, setGoalShowSchedule] = useState(false);

  // -------------------------------------------------------------
  // TAB 3: HYBRID (SIP + LUMPSUM) State
  // -------------------------------------------------------------
  const [hybridLumpsum, setHybridLumpsum] = useState('100000');
  const [hybridSIP, setHybridSIP] = useState('10000');
  const [hybridStepUpPct, setHybridStepUpPct] = useState('0');
  const [hybridReturnRate, setHybridReturnRate] = useState('12');
  const [hybridPeriodValue, setHybridPeriodValue] = useState('10');
  const [hybridPeriodType, setHybridPeriodType] = useState('Years');
  const [hybridShowSchedule, setHybridShowSchedule] = useState(false);

  // -------------------------------------------------------------
  // MEMOIZED FINANCIAL COMPUTATIONS
  // -------------------------------------------------------------
  const swpResults = useMemo(() => {
    const tenureMonths = swpPeriodType === 'Years'
      ? (parseFloat(swpPeriodValue) || 0) * 12
      : parseFloat(swpPeriodValue) || 0;

    return calculateSWP({
      investment: swpInvestment,
      monthlyWithdrawal: swpMonthlyWithdrawal,
      annualRate: swpReturnRate,
      tenureMonths
    });
  }, [swpInvestment, swpMonthlyWithdrawal, swpReturnRate, swpPeriodValue, swpPeriodType]);

  const goalResults = useMemo(() => {
    const tenureMonths = goalPeriodType === 'Years'
      ? (parseFloat(goalPeriodValue) || 0) * 12
      : parseFloat(goalPeriodValue) || 0;

    return calculateGoalSIP({
      targetCorpus: goalTarget,
      existingSavings: goalExisting,
      annualRate: goalReturnRate,
      tenureMonths,
      stepUpRate: goalStepUpRate
    });
  }, [goalTarget, goalExisting, goalReturnRate, goalPeriodValue, goalPeriodType, goalStepUpRate]);

  const hybridResults = useMemo(() => {
    const tenureMonths = hybridPeriodType === 'Years'
      ? (parseFloat(hybridPeriodValue) || 0) * 12
      : parseFloat(hybridPeriodValue) || 0;

    return calculateSipPlusLumpsum({
      initialLumpsum: hybridLumpsum,
      monthlySip: hybridSIP,
      annualStepUpPct: hybridStepUpPct,
      annualRate: hybridReturnRate,
      tenureMonths
    });
  }, [hybridLumpsum, hybridSIP, hybridStepUpPct, hybridReturnRate, hybridPeriodValue, hybridPeriodType]);

  // -------------------------------------------------------------
  // RESET HANDLER
  // -------------------------------------------------------------
  const handleReset = () => {
    if (activeTab === 'SWP') {
      setSwpInvestment('2500000');
      setSwpMonthlyWithdrawal('20000');
      setSwpReturnRate('8');
      setSwpPeriodValue('10');
      setSwpPeriodType('Years');
      setSwpShowSchedule(false);
    } else if (activeTab === 'GOAL_SIP') {
      setGoalTarget('10000000');
      setGoalExisting('0');
      setGoalReturnRate('12');
      setGoalPeriodValue('10');
      setGoalPeriodType('Years');
      setGoalStepUpRate('10');
      setGoalShowSchedule(false);
    } else {
      setHybridLumpsum('100000');
      setHybridSIP('10000');
      setHybridStepUpPct('0');
      setHybridReturnRate('12');
      setHybridPeriodValue('10');
      setHybridPeriodType('Years');
      setHybridShowSchedule(false);
    }
  };

  // -------------------------------------------------------------
  // SHARE SUMMARY
  // -------------------------------------------------------------
  const handleShare = () => {
    if (activeTab === 'SWP') {
      const statusText = swpResults.isDepleted
        ? `⚠️ Corpus depleted after ${swpResults.durationYrs} Yrs ${swpResults.durationMos} Mos`
        : `✅ Sustainable! Final Remaining: ${fmtCompact(swpResults.finalRemainingCorpus)}`;
      const text = `💰 Systematic Withdrawal Plan (SWP) Summary\n` +
        `• Initial Investment: ${fmtCompact(swpResults.investment)}\n` +
        `• Monthly Withdrawal: ₹${parseFloat(swpMonthlyWithdrawal).toLocaleString('en-IN')}\n` +
        `• Expected Return: ${swpReturnRate}% p.a.\n` +
        `• Planned Tenure: ${swpPeriodValue} ${swpPeriodType}\n` +
        `• Total Withdrawn: ${fmtCompact(swpResults.totalWithdrawn)}\n` +
        `• Total Interest Earned: ${fmtCompact(swpResults.totalInterest)}\n` +
        `• Final Remaining Corpus: ${fmtCompact(swpResults.finalRemainingCorpus)}\n` +
        `• Status: ${statusText}\n\n` +
        `Planned with EMI Pro Wealth Planner`;
      shareAsText('SWP Plan Summary', text);
    } else if (activeTab === 'GOAL_SIP') {
      const text = `🎯 Goal SIP Wealth Plan\n` +
        `• Target Corpus: ${fmtCompact(goalResults.targetCorpus)}\n` +
        `• Existing Savings: ${fmtCompact(goalResults.existingSavings)}\n` +
        `• Target Timeframe: ${goalPeriodValue} ${goalPeriodType} @ ${goalReturnRate}% p.a.\n` +
        `• Required Monthly SIP: ₹${goalResults.requiredMonthlySIP.toLocaleString('en-IN')}\n` +
        `• Total Amount You Invest: ${fmtCompact(goalResults.totalAmountInvested)}\n` +
        `• Wealth Gained (Returns): ${fmtCompact(goalResults.wealthGained)}\n` +
        `💡 Step-Up Tip: With 10% annual step-up, start with only ₹${goalResults.stepUpStartingSIP.toLocaleString('en-IN')}/month!\n\n` +
        `Planned with EMI Pro Wealth Planner`;
      shareAsText('Goal SIP Plan Summary', text);
    } else {
      const text = `🌱 Hybrid Wealth Builder (SIP + Lumpsum)\n` +
        `• Initial Lumpsum: ${fmtCompact(hybridResults.initialLumpsum)}\n` +
        `• Monthly SIP: ₹${hybridResults.monthlySip.toLocaleString('en-IN')}\n` +
        `• Annual Step-Up: ${hybridResults.annualStepUpPct}%\n` +
        `• Expected Return: ${hybridReturnRate}% p.a. for ${hybridPeriodValue} ${hybridPeriodType}\n` +
        `• Combined Maturity Value: ${fmtCompact(hybridResults.combinedMaturity)}\n` +
        `• Total Invested: ${fmtCompact(hybridResults.totalInvested)}\n` +
        `• Total Wealth Gained: ${fmtCompact(hybridResults.totalWealthGained)} (${hybridResults.wealthMultiplier}x)\n` +
        `• Lumpsum Growth: ${fmtCompact(hybridResults.initialLumpsum)} ➔ ${fmtCompact(hybridResults.fvLumpsum)}\n` +
        `• SIP Growth: ${fmtCompact(hybridResults.totalSipInvested)} ➔ ${fmtCompact(hybridResults.fvSIP)}\n\n` +
        `Planned with EMI Pro Wealth Planner`;
      shareAsText('Hybrid Wealth Plan Summary', text);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-gray-900 overflow-hidden h-full relative">
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
          title="Wealth Planner"
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

        {/* Sticky Collapsing Tab Switcher */}
        <CollapsingTabs
          ref={tabsRef}
          tabs={[
            { id: 'SWP', label: 'SWP' },
            { id: 'GOAL_SIP', label: 'Goal SIP' },
            { id: 'HYBRID', label: 'SIP + Lumpsum' },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="px-5 pt-3 pb-10 max-w-lg mx-auto">

          {/* ========================================================= */}
          {/* TAB 1: SWP (Systematic Withdrawal Plan)                   */}
          {/* ========================================================= */}
          {activeTab === 'SWP' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 rounded-3xl p-5 text-white shadow-lg shadow-emerald-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-emerald-100 uppercase">
                    Monthly Withdrawal
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    {swpReturnRate}% p.a.
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  ₹{parseFloat(swpMonthlyWithdrawal || 0).toLocaleString('en-IN')}
                  <span className="text-xs font-medium text-emerald-200 ml-1.5">/ month</span>
                </div>
                <p className="text-xs text-emerald-100 mb-5">
                  Regular cash flow generated from your investment corpus
                </p>

                {/* Status Callout Banner */}
                {swpResults.isDepleted ? (
                  <div className="bg-amber-500/20 border border-amber-300/30 rounded-2xl p-3 flex items-start gap-2.5 mb-4 backdrop-blur-sm">
                    <AlertTriangle size={18} className="text-amber-200 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-100">
                        Corpus Runs Out at {swpResults.durationYrs} Yrs {swpResults.durationMos} Mos
                      </div>
                      <div className="text-[11px] text-amber-200/90 leading-tight mt-0.5">
                        Withdrawal rate exceeds earnings. Consider reducing monthly withdrawal to maintain perpetual capital.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/15 border border-white/20 rounded-2xl p-3 flex items-start gap-2.5 mb-4 backdrop-blur-sm">
                    <CheckCircle2 size={18} className="text-emerald-200 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Corpus Lasts Full {swpPeriodValue} {swpPeriodType}!
                      </div>
                      <div className="text-[11px] text-emerald-100 leading-tight mt-0.5">
                        Your capital remains intact with ₹{swpResults.finalRemainingCorpus.toLocaleString('en-IN')} left at the end.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-emerald-100 font-medium">Initial Invested</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(swpResults.investment)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-emerald-100 font-medium">Total Withdrawn</div>
                    <div className="text-xs font-bold mt-0.5 text-emerald-100">{fmtCompact(swpResults.totalWithdrawn)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-emerald-100 font-medium">Final Corpus</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(swpResults.finalRemainingCorpus)}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* 1. Total Investment */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Total Investment Corpus
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(swpInvestment)}
                        onChange={(e) => setSwpInvestment(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="50000000"
                    step="50000"
                    value={parseFloat(swpInvestment) || 0}
                    onChange={(e) => setSwpInvestment(e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹1 Lakh</span>
                    <span>₹50 Lakh</span>
                    <span>₹5 Crore</span>
                  </div>
                </div>

                {/* 2. Monthly Withdrawal */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Monthly Withdrawal Amount
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(swpMonthlyWithdrawal)}
                        onChange={(e) => setSwpMonthlyWithdrawal(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="500000"
                    step="1000"
                    value={parseFloat(swpMonthlyWithdrawal) || 0}
                    onChange={(e) => setSwpMonthlyWithdrawal(e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                    <span>₹5 Lakh</span>
                  </div>
                </div>

                {/* 3. Expected Return Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Expected Return Rate (% p.a.)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={swpReturnRate}
                        onChange={(e) => setSwpReturnRate(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={parseFloat(swpReturnRate) || 0}
                    onChange={(e) => setSwpReturnRate(e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1%</span>
                    <span>8% (Conservative)</span>
                    <span>25%</span>
                  </div>
                </div>

                {/* 4. Time Period */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Time Period
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={swpPeriodValue}
                        onChange={(e) => setSwpPeriodValue(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                      <div className="flex bg-slate-100 dark:bg-gray-700 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            if (swpPeriodType !== 'Years') {
                              setSwpPeriodType('Years');
                              setSwpPeriodValue(String(Math.max(1, Math.round((parseFloat(swpPeriodValue) || 12) / 12))));
                            }
                          }}
                          className={`px-2 py-1 rounded-md transition-all ${
                            swpPeriodType === 'Years'
                              ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          Yrs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (swpPeriodType !== 'Months') {
                              setSwpPeriodType('Months');
                              setSwpPeriodValue(String(Math.round((parseFloat(swpPeriodValue) || 1) * 12)));
                            }
                          }}
                          className={`px-2 py-1 rounded-md transition-all ${
                            swpPeriodType === 'Months'
                              ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm'
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
                    min="1"
                    max={swpPeriodType === 'Years' ? 40 : 480}
                    step="1"
                    value={parseFloat(swpPeriodValue) || 0}
                    onChange={(e) => setSwpPeriodValue(e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 {swpPeriodType === 'Years' ? 'Yr' : 'Mo'}</span>
                    <span>{swpPeriodType === 'Years' ? '20 Yrs' : '240 Mos'}</span>
                    <span>{swpPeriodType === 'Years' ? '40 Yrs' : '480 Mos'}</span>
                  </div>
                </div>
              </div>

              {/* Yearly Breakdown Collapsible Schedule */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800">
                <button
                  onClick={() => setSwpShowSchedule(!swpShowSchedule)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Year-by-Year SWP Schedule
                    </span>
                  </div>
                  {swpShowSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {swpShowSchedule && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-gray-700 text-slate-400 font-semibold">
                          <th className="py-2 pr-2">Yr</th>
                          <th className="py-2 px-2 text-right">Withdrawn</th>
                          <th className="py-2 px-2 text-right">Interest</th>
                          <th className="py-2 pl-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {swpResults.yearlySchedule.map((row) => (
                          <tr key={row.year} className="text-slate-700 dark:text-slate-300">
                            <td className="py-2 pr-2 font-bold text-slate-900 dark:text-white">Yr {row.year}</td>
                            <td className="py-2 px-2 text-right font-medium text-amber-600 dark:text-amber-400">
                              {fmtCompact(row.withdrawn)}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                              +{fmtCompact(row.interestEarned)}
                            </td>
                            <td className="py-2 pl-2 text-right font-bold text-slate-900 dark:text-white">
                              {fmtCompact(row.closingBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GOAL SIP (Reverse Target Corpus Planner)           */}
          {/* ========================================================= */}
          {activeTab === 'GOAL_SIP' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-blue-100 uppercase">
                    Required Monthly SIP
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    {goalReturnRate}% p.a.
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  ₹{goalResults.requiredMonthlySIP.toLocaleString('en-IN')}
                  <span className="text-xs font-medium text-blue-200 ml-1.5">/ month</span>
                </div>
                <p className="text-xs text-blue-100 mb-5">
                  To reach your target goal of {fmtCompact(goalResults.targetCorpus)} in {goalPeriodValue} {goalPeriodType}
                </p>

                {/* Step-Up Intelligence Banner */}
                {goalResults.requiredMonthlySIP > 0 && (
                  <div className="bg-white/15 border border-white/20 rounded-2xl p-3 flex items-start gap-2.5 mb-4 backdrop-blur-sm">
                    <Sparkles size={18} className="text-amber-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Smart Tip: 10% Annual Step-Up
                      </div>
                      <div className="text-[11px] text-blue-100 leading-tight mt-0.5">
                        Start with just <span className="font-bold text-white">₹{goalResults.stepUpStartingSIP.toLocaleString('en-IN')}/mo</span> ({goalResults.stepUpInitialDiscountPct}% lower starting outlay) and increase 10% each year!
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-blue-100 font-medium">Target Goal</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(goalResults.targetCorpus)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-blue-100 font-medium">Your Investment</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(goalResults.totalAmountInvested)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-blue-100 font-medium">Wealth Gained</div>
                    <div className="text-xs font-bold mt-0.5 text-emerald-200">+{fmtCompact(goalResults.wealthGained)}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* 1. Target Wealth Goal */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Target Wealth Goal
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(goalTarget)}
                        onChange={(e) => setGoalTarget(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="100000000"
                    step="50000"
                    value={parseFloat(goalTarget) || 0}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹1 Lakh</span>
                    <span>₹1 Crore</span>
                    <span>₹10 Crore</span>
                  </div>
                </div>

                {/* 2. Existing Savings / Lumpsum */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Existing Savings / Initial Lumpsum
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(goalExisting)}
                        onChange={(e) => setGoalExisting(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000000"
                    step="25000"
                    value={parseFloat(goalExisting) || 0}
                    onChange={(e) => setGoalExisting(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹0</span>
                    <span>₹25 Lakh</span>
                    <span>₹50 Lakh</span>
                  </div>
                </div>

                {/* 3. Expected Annual Return */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Expected Annual Return (% p.a.)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={goalReturnRate}
                        onChange={(e) => setGoalReturnRate(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={parseFloat(goalReturnRate) || 0}
                    onChange={(e) => setGoalReturnRate(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1%</span>
                    <span>12% (Equity)</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* 4. Time to Goal */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Time to Goal
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={goalPeriodValue}
                        onChange={(e) => setGoalPeriodValue(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                      <div className="flex bg-slate-100 dark:bg-gray-700 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            if (goalPeriodType !== 'Years') {
                              setGoalPeriodType('Years');
                              setGoalPeriodValue(String(Math.max(1, Math.round((parseFloat(goalPeriodValue) || 12) / 12))));
                            }
                          }}
                          className={`px-2 py-1 rounded-md transition-all ${
                            goalPeriodType === 'Years'
                              ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          Yrs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (goalPeriodType !== 'Months') {
                              setGoalPeriodType('Months');
                              setGoalPeriodValue(String(Math.round((parseFloat(goalPeriodValue) || 1) * 12)));
                            }
                          }}
                          className={`px-2 py-1 rounded-md transition-all ${
                            goalPeriodType === 'Months'
                              ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
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
                    min="1"
                    max={goalPeriodType === 'Years' ? 40 : 480}
                    step="1"
                    value={parseFloat(goalPeriodValue) || 0}
                    onChange={(e) => setGoalPeriodValue(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 {goalPeriodType === 'Years' ? 'Yr' : 'Mo'}</span>
                    <span>{goalPeriodType === 'Years' ? '20 Yrs' : '240 Mos'}</span>
                    <span>{goalPeriodType === 'Years' ? '40 Yrs' : '480 Mos'}</span>
                  </div>
                </div>
              </div>

              {/* Goal Accumulation Projection Table */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800">
                <button
                  onClick={() => setGoalShowSchedule(!goalShowSchedule)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Goal Progress by Year
                    </span>
                  </div>
                  {goalShowSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {goalShowSchedule && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-gray-700 text-slate-400 font-semibold">
                          <th className="py-2 pr-2">Yr</th>
                          <th className="py-2 px-2 text-right">You Invested</th>
                          <th className="py-2 px-2 text-right">Growth</th>
                          <th className="py-2 pl-2 text-right">Corpus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {goalResults.yearlySchedule.map((row) => (
                          <tr key={row.year} className="text-slate-700 dark:text-slate-300">
                            <td className="py-2 pr-2 font-bold text-slate-900 dark:text-white">Yr {row.year}</td>
                            <td className="py-2 px-2 text-right font-medium text-slate-600 dark:text-slate-400">
                              {fmtCompact(row.totalInvested)}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                              +{fmtCompact(row.interestEarned)}
                            </td>
                            <td className="py-2 pl-2 text-right font-bold text-blue-600 dark:text-blue-400">
                              {fmtCompact(row.corpusAccumulated)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: HYBRID (SIP + LUMPSUM COMBO)                       */}
          {/* ========================================================= */}
          {activeTab === 'HYBRID' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-purple-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-purple-100 uppercase">
                    Combined Maturity Value
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    {hybridResults.wealthMultiplier}x Wealth
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  {fmtCompact(hybridResults.combinedMaturity)}
                </div>
                <p className="text-xs text-purple-100 mb-5">
                  Lumpsum + Monthly SIP compounding together over {hybridPeriodValue} {hybridPeriodType}
                </p>

                {/* Growth Component Breakdown Bars */}
                <div className="space-y-2 mb-4 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-200">Initial Lumpsum Growth:</span>
                    <span className="font-bold">{fmtCompact(hybridResults.initialLumpsum)} ➔ {fmtCompact(hybridResults.fvLumpsum)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-200">Monthly SIP Growth:</span>
                    <span className="font-bold">{fmtCompact(hybridResults.totalSipInvested)} ➔ {fmtCompact(hybridResults.fvSIP)}</span>
                  </div>
                </div>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Total Invested</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(hybridResults.totalInvested)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Wealth Gained</div>
                    <div className="text-xs font-bold mt-0.5 text-emerald-200">+{fmtCompact(hybridResults.totalWealthGained)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Maturity Corpus</div>
                    <div className="text-xs font-bold mt-0.5 text-white">{fmtCompact(hybridResults.combinedMaturity)}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* 1. Initial Lumpsum */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Initial Lumpsum Amount
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(hybridLumpsum)}
                        onChange={(e) => setHybridLumpsum(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10000000"
                    step="25000"
                    value={parseFloat(hybridLumpsum) || 0}
                    onChange={(e) => setHybridLumpsum(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹0</span>
                    <span>₹25 Lakh</span>
                    <span>₹1 Crore</span>
                  </div>
                </div>

                {/* 2. Monthly SIP */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Monthly SIP Amount
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(hybridSIP)}
                        onChange={(e) => setHybridSIP(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="200000"
                    step="500"
                    value={parseFloat(hybridSIP) || 0}
                    onChange={(e) => setHybridSIP(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹500</span>
                    <span>₹50,000</span>
                    <span>₹2 Lakh</span>
                  </div>
                </div>

                {/* 3. Annual Step-Up % */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Annual Step-Up on SIP (%)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={hybridStepUpPct}
                        onChange={(e) => setHybridStepUpPct(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={parseFloat(hybridStepUpPct) || 0}
                    onChange={(e) => setHybridStepUpPct(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0% (No step-up)</span>
                    <span>10% (Recommended)</span>
                    <span>25%</span>
                  </div>
                </div>

                {/* 4. Expected Return Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Expected Return Rate (% p.a.)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={hybridReturnRate}
                        onChange={(e) => setHybridReturnRate(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={parseFloat(hybridReturnRate) || 0}
                    onChange={(e) => setHybridReturnRate(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1%</span>
                    <span>12%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* 5. Time Period */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Time Period
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={hybridPeriodValue}
                        onChange={(e) => setHybridPeriodValue(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                      <div className="flex bg-slate-100 dark:bg-gray-700 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            if (hybridPeriodType !== 'Years') {
                              setHybridPeriodType('Years');
                              setHybridPeriodValue(String(Math.max(1, Math.round((parseFloat(hybridPeriodValue) || 12) / 12))));
                            }
                          }}
                          className={`px-2 py-1 rounded-md transition-all ${
                            hybridPeriodType === 'Years'
                              ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          Yrs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (hybridPeriodType !== 'Months') {
                              setHybridPeriodType('Months');
                              setHybridPeriodValue(String(Math.round((parseFloat(hybridPeriodValue) || 1) * 12)));
                            }
                          }}
                          className={`px-2 py-1 rounded-md transition-all ${
                            hybridPeriodType === 'Months'
                              ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-sm'
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
                    min="1"
                    max={hybridPeriodType === 'Years' ? 40 : 480}
                    step="1"
                    value={parseFloat(hybridPeriodValue) || 0}
                    onChange={(e) => setHybridPeriodValue(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 {hybridPeriodType === 'Years' ? 'Yr' : 'Mo'}</span>
                    <span>{hybridPeriodType === 'Years' ? '20 Yrs' : '240 Mos'}</span>
                    <span>{hybridPeriodType === 'Years' ? '40 Yrs' : '480 Mos'}</span>
                  </div>
                </div>
              </div>

              {/* Hybrid Wealth Growth Schedule */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800">
                <button
                  onClick={() => setHybridShowSchedule(!hybridShowSchedule)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Portfolio Schedule by Year
                    </span>
                  </div>
                  {hybridShowSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {hybridShowSchedule && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-gray-700 text-slate-400 font-semibold">
                          <th className="py-2 pr-2">Yr</th>
                          <th className="py-2 px-2 text-right">Lumpsum</th>
                          <th className="py-2 px-2 text-right">SIP Value</th>
                          <th className="py-2 pl-2 text-right">Total Corpus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {hybridResults.yearlySchedule.map((row) => (
                          <tr key={row.year} className="text-slate-700 dark:text-slate-300">
                            <td className="py-2 pr-2 font-bold text-slate-900 dark:text-white">Yr {row.year}</td>
                            <td className="py-2 px-2 text-right font-medium text-slate-600 dark:text-slate-400">
                              {fmtCompact(row.lumpVal)}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-purple-600 dark:text-purple-400">
                              {fmtCompact(row.sipVal)}
                            </td>
                            <td className="py-2 pl-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {fmtCompact(row.combinedVal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
