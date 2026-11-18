import React, { useState, useMemo } from 'react';
import {
  Building2, RotateCcw, Share2, Sparkles, TrendingUp,
  ShieldCheck, ArrowRight, ChevronDown, ChevronUp, Check,
  Scale, Home, Wallet, PieChart, Coins
} from 'lucide-react';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { useSettings } from '../context/SettingsContext';
import { shareAsText } from '../utils/exportUtils';
import {
  formatCurrency,
  formatNumericInput,
  parseFormattedNumber,
  calculateRentVsBuy
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

export default function RentVsBuyCalculator({ onBack }) {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const { currency } = useSettings();

  // Inputs state
  const [propertyPrice, setPropertyPrice] = useState('8000000');
  const [downPaymentPercent, setDownPaymentPercent] = useState('20');
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanTenureYrs, setLoanTenureYrs] = useState('20');
  const [appreciationRate, setAppreciationRate] = useState('6');
  const [monthlyRent, setMonthlyRent] = useState('22000');
  const [rentEscalationRate, setRentEscalationRate] = useState('5');
  const [sipReturnRate, setSipReturnRate] = useState('12');
  const [maintenanceRate, setMaintenanceRate] = useState('0.5');
  const [horizonYrs, setHorizonYrs] = useState(20);
  const [showTrajectory, setShowTrajectory] = useState(false);

  // Derived down payment amount
  const downPaymentAmount = useMemo(() => {
    const price = parseFloat(propertyPrice) || 0;
    const pct = parseFloat(downPaymentPercent) || 0;
    return (price * pct) / 100;
  }, [propertyPrice, downPaymentPercent]);

  // Synchronous calculation engine
  const results = useMemo(() => {
    return calculateRentVsBuy({
      propertyPrice: parseFloat(propertyPrice) || 0,
      downPayment: downPaymentAmount,
      loanRate: parseFloat(loanRate) || 0,
      loanTenureYrs: parseInt(loanTenureYrs) || 1,
      appreciationRate: parseFloat(appreciationRate) || 0,
      monthlyRent: parseFloat(monthlyRent) || 0,
      rentEscalationRate: parseFloat(rentEscalationRate) || 0,
      sipReturnRate: parseFloat(sipReturnRate) || 0,
      maintenanceRate: parseFloat(maintenanceRate) || 0,
      horizonYrs: parseInt(horizonYrs) || 20
    });
  }, [
    propertyPrice,
    downPaymentAmount,
    loanRate,
    loanTenureYrs,
    appreciationRate,
    monthlyRent,
    rentEscalationRate,
    sipReturnRate,
    maintenanceRate,
    horizonYrs
  ]);

  const handleReset = () => {
    setPropertyPrice('8000000');
    setDownPaymentPercent('20');
    setLoanRate('8.5');
    setLoanTenureYrs('20');
    setAppreciationRate('6');
    setMonthlyRent('22000');
    setRentEscalationRate('5');
    setSipReturnRate('12');
    setMaintenanceRate('0.5');
    setHorizonYrs(20);
  };

  const handleShare = () => {
    const verdict = results.buyWins
      ? `Buying Wins by ${fmtLakh(results.netDifference)}`
      : `Renting + SIP Wins by ${fmtLakh(Math.abs(results.netDifference))}`;

    const text = `🏡 Rent vs. Buy Analysis (${horizonYrs} Years Horizon)
Verdict: ${verdict}
${results.breakEvenYear ? `Break-even Year: Year ${results.breakEvenYear}` : 'Break-even: Never'}

📊 BUY OPTION:
• Property Market Value: ${fmtLakh(results.finalPropertyValue)}
• Remaining Loan: ${fmtLakh(results.remainingLoanBalance)}
• Net Wealth: ${fmtLakh(results.finalNetWealthBuy)}
• Total Outflow: ${fmtLakh(results.totalBuyOutflow)}

📈 RENT + SIP OPTION:
• Final SIP Corpus: ${fmtLakh(results.finalNetWealthRent)}
• Total Rent Paid: ${fmtLakh(results.totalRentOutflow)}
• Net Wealth: ${fmtLakh(results.finalNetWealthRent)}

Calculated via EMI Pro.`;

    shareAsText('Rent vs. Buy Valuation Result', text);
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
          title="Rent vs. Buy"
          subtitle="Home Wealth Analyzer"
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
          {/* Horizon Selector */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              Analysis Horizon
            </span>
            <div className="flex bg-gray-200/70 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700/60">
              {[5, 10, 15, 20, 25, 30].map((yrs) => (
                <button
                  key={yrs}
                  type="button"
                  onClick={() => setHorizonYrs(yrs)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    horizonYrs === yrs
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {yrs}y
                </button>
              ))}
            </div>
          </div>

          {/* Verdict Hero Card */}
          <div
            className={`rounded-3xl p-5 shadow-xl relative overflow-hidden border ${
              results.buyWins
                ? 'bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#01140F] text-white border-emerald-900/60'
                : 'bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#020617] text-white border-indigo-900/60'
            }`}
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-teal-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-teal-400" />
                  {horizonYrs}-Year Wealth Verdict
                </span>
                {results.breakEvenYear ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    Break-even: Yr {results.breakEvenYear}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    No Break-even
                  </span>
                )}
              </div>

              <div className="pt-1">
                <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                  {results.buyWins ? (
                    <>
                      Buying Wins by{' '}
                      <span className="text-emerald-400">
                        {fmtLakh(results.netDifference)}
                      </span>
                    </>
                  ) : (
                    <>
                      Renting + SIP Wins by{' '}
                      <span className="text-indigo-300">
                        {fmtLakh(Math.abs(results.netDifference))}
                      </span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  {results.buyWins
                    ? `Property appreciation & principal build-up outpace the SIP corpus after ${horizonYrs} years.`
                    : `Investing down payment & monthly cash savings in a 12% SIP generates higher net worth than real estate.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 mt-3 border-t border-slate-700/60 text-center">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Buy Net Wealth
                  </p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">
                    {fmtLakh(results.finalNetWealthBuy)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    Prop ₹{fmtLakh(results.finalPropertyValue)}
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Rent + SIP Wealth
                  </p>
                  <p className="text-sm font-black text-indigo-300 mt-0.5">
                    {fmtLakh(results.finalNetWealthRent)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    SIP Corpus
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="grid grid-cols-2 gap-3">
            {/* BUY OPTION CARD */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-2.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-gray-100 dark:border-gray-700">
                <Home size={15} className="text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase">
                  Buy Option
                </h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Monthly EMI
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    ₹{fmt(results.emi)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Down Payment
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.dp)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Total Outflow
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.totalBuyOutflow)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Loan Balance ({horizonYrs}y)
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {results.remainingLoanBalance > 0
                      ? fmtLakh(results.remainingLoanBalance)
                      : 'Fully Paid (₹0)'}
                  </span>
                </div>
              </div>
            </div>

            {/* RENT OPTION CARD */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-2.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-gray-100 dark:border-gray-700">
                <Wallet size={15} className="text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase">
                  Rent + SIP
                </h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Starting Rent
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    ₹{fmt(monthlyRent)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Initial SIP Lumpsum
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.dp)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Total Rent Paid
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {fmtLakh(results.totalRentOutflow)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    SIP Growth Rate
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {sipReturnRate}% p.a.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Form Inputs */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3.5">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Property & Home Loan Parameters
            </h4>

            {/* Property Price */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Property Cost
                </span>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                  <span className="text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumericInput(propertyPrice)}
                    onChange={(e) =>
                      setPropertyPrice(parseFormattedNumber(e.target.value))
                    }
                    className="w-24 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="2000000"
                max="50000000"
                step="500000"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(e.target.value)}
                className="w-full accent-teal-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Down Payment & Loan Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Down Payment
                  </span>
                  <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                    {downPaymentPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(e.target.value)}
                  className="w-full accent-teal-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Loan Rate
                  </span>
                  <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                    {loanRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="6.5"
                  max="14"
                  step="0.1"
                  value={loanRate}
                  onChange={(e) => setLoanRate(e.target.value)}
                  className="w-full accent-teal-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Loan Tenure & Appreciation Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Loan Tenure
                  </span>
                  <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                    {loanTenureYrs} Yrs
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={loanTenureYrs}
                  onChange={(e) => setLoanTenureYrs(e.target.value)}
                  className="w-full accent-teal-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Appreciation
                  </span>
                  <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                    {appreciationRate}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.5"
                  value={appreciationRate}
                  onChange={(e) => setAppreciationRate(e.target.value)}
                  className="w-full accent-teal-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Rent & Investment Parameters */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3.5">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Rental & SIP Investment Parameters
            </h4>

            {/* Monthly Rent */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Current Monthly Rent
                </span>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                  <span className="text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumericInput(monthlyRent)}
                    onChange={(e) =>
                      setMonthlyRent(parseFormattedNumber(e.target.value))
                    }
                    className="w-20 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="1000"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Rent Escalation & Expected SIP Return */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Annual Rent Hike
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {rentEscalationRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={rentEscalationRate}
                  onChange={(e) => setRentEscalationRate(e.target.value)}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    SIP Return
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {sipReturnRate}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="18"
                  step="0.5"
                  value={sipReturnRate}
                  onChange={(e) => setSipReturnRate(e.target.value)}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Trajectory Breakdown Table Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
            <button
              type="button"
              onClick={() => setShowTrajectory(!showTrajectory)}
              className="w-full flex items-center justify-between text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider"
            >
              <span>Year-by-Year Wealth Trajectory</span>
              {showTrajectory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showTrajectory && (
              <div className="overflow-x-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400">
                      <th className="py-2 pr-2 font-bold">Year</th>
                      <th className="py-2 px-1 font-bold">Buy Wealth</th>
                      <th className="py-2 px-1 font-bold">SIP Wealth</th>
                      <th className="py-2 pl-2 font-bold text-right">Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {results.trajectory.map((row) => (
                      <tr key={row.year} className="font-semibold text-gray-700 dark:text-gray-300">
                        <td className="py-2 pr-2 font-black text-gray-900 dark:text-white">
                          Yr {row.year}
                        </td>
                        <td className="py-2 px-1 text-teal-600 dark:text-teal-400 font-bold">
                          {fmtLakh(row.netWealthBuy)}
                        </td>
                        <td className="py-2 px-1 text-indigo-600 dark:text-indigo-400 font-bold">
                          {fmtLakh(row.netWealthRent)}
                        </td>
                        <td className="py-2 pl-2 text-right font-black">
                          {row.difference >= 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              +Buy {fmtLakh(row.difference)}
                            </span>
                          ) : (
                            <span className="text-indigo-500 dark:text-indigo-400">
                              +Rent {fmtLakh(Math.abs(row.difference))}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
