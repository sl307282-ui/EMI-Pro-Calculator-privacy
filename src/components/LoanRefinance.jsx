import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, RefreshCw, RotateCcw, Share2, Sparkles, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { shareAsText } from '../utils/exportUtils';
import { formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import BackButton from './BackButton';

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const calcEMI = (principal, ratePercent, months) => {
  if (!principal || !ratePercent || !months) return 0;
  const r = ratePercent / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

// ---------- Reusable input row ----------
const InputRow = ({ label, prefix, value, onChange, placeholder = '0', type = 'number', children }) => (
  <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <span className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 flex-shrink-0 w-[44%] leading-[1.3]">
      {label}
    </span>
    <div className="flex items-center gap-2 flex-1 justify-end">
      <div className="flex items-center bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-2xl px-3 py-2 shadow-sm focus-within:border-blue-500 transition-colors min-w-0">
        {prefix && <span className="text-slate-400 dark:text-slate-400 text-sm font-bold mr-1">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full text-right text-[13.5px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none bg-transparent min-w-0"
          inputMode="decimal"
        />
      </div>
      {children}
    </div>
  </div>
);

// ---------- Period toggle ----------
const PeriodToggle = ({ mode, setMode }) => (
  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60 text-[12px] font-semibold flex-shrink-0">
    {['Yrs', 'Mos'].map((t) => (
      <button
        key={t}
        onClick={() => setMode(t)}
        className={`px-2.5 py-1.5 rounded-[10px] transition-all ${
          mode === t ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

// ---------- Fee toggle ----------
const FeeToggle = ({ mode, setMode }) => (
  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60 text-[12px] font-semibold flex-shrink-0">
    {['%', '₹'].map((t) => (
      <button
        key={t}
        onClick={() => setMode(t)}
        className={`px-2.5 py-1.5 rounded-[10px] transition-all ${
          mode === t ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

// ---------- Result row ----------
const ResultRow = ({ label, value, highlight, greenValue, subLabel }) => (
  <div
    className={`flex justify-between items-center px-4 py-3 ${
      highlight ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
    } border-b border-gray-100 dark:border-gray-800 last:border-0`}
  >
    <div>
      <span className={`text-[12px] font-semibold ${highlight ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
        {label}
      </span>
      {subLabel && (
        <span className="block text-[10px] text-gray-400 dark:text-gray-500 font-medium">{subLabel}</span>
      )}
    </div>
    <span
      className={`text-[13px] font-black ${
        highlight ? 'text-blue-700 dark:text-blue-400' : greenValue ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
      }`}
    >
      {value}
    </span>
  </div>
);

export default function LoanRefinance({ onBack }) {
  const { theme } = useSettings();
  const scrollRef = useRef(null);
  const summaryRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // --- Input states: empty strings with subtle placeholders ---
  const [oldPrincipal, setOldPrincipal] = useState('');
  const [oldRate, setOldRate] = useState('');
  const [oldPeriod, setOldPeriod] = useState('');
  const [oldPeriodMode, setOldPeriodMode] = useState('Yrs');

  const [newRate, setNewRate] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newPeriodMode, setNewPeriodMode] = useState('Yrs');
  const [feeValue, setFeeValue] = useState('');
  const [feeMode, setFeeMode] = useState('%');

  // Explicit calculation & validation states
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationError, setValidationError] = useState('');

  const invalidateCalculation = () => {
    if (hasCalculated) setHasCalculated(false);
    if (validationError) setValidationError('');
  };

  // Passive RAF-throttled scroll listener toggling isScrolled at scrollTop > 24px
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = el.scrollTop > 24;
          setIsScrolled(scrolled);
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    if (el.scrollTop > 24) setIsScrolled(true);

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAmountChange = (val, setter) => {
    invalidateCalculation();
    const clean = val.replace(/,/g, '');
    if (clean !== '' && !/^\d*\.?\d*$/.test(clean)) {
      return;
    }
    const parts = clean.split('.');
    if (parts[0].length > 9) {
      parts[0] = parts[0].slice(0, 9);
    }
    const cappedValue = parts.join('.');
    setter(cappedValue);
  };

  const handleRateChange = (val, setter) => {
    invalidateCalculation();
    if (val === '') {
      setter('');
      return;
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 50) {
      setter('50');
    } else {
      setter(val);
    }
  };

  const handlePeriodChange = (val, setter) => {
    invalidateCalculation();
    if (val === '' || /^\d*$/.test(val)) {
      setter(val);
    }
  };

  const handleOldPeriodModeChange = (newMode) => {
    if (oldPeriodMode === newMode) return;
    setOldPeriodMode(newMode);
    invalidateCalculation();
    if (!oldPeriod) return;
    const val = parseFloat(oldPeriod);
    if (isNaN(val)) return;

    if (newMode === 'Mos') {
      setOldPeriod(String(Math.round(val * 12)));
    } else {
      const divided = val / 12;
      const formatted = divided % 1 === 0 ? String(divided) : divided.toFixed(1);
      setOldPeriod(formatted);
    }
  };

  const handleNewPeriodModeChange = (newMode) => {
    if (newPeriodMode === newMode) return;
    setNewPeriodMode(newMode);
    invalidateCalculation();
    if (!newPeriod) return;
    const val = parseFloat(newPeriod);
    if (isNaN(val)) return;

    if (newMode === 'Mos') {
      setNewPeriod(String(Math.round(val * 12)));
    } else {
      const divided = val / 12;
      const formatted = divided % 1 === 0 ? String(divided) : divided.toFixed(1);
      setNewPeriod(formatted);
    }
  };

  const handleFeeModeChange = (newMode) => {
    if (feeMode === newMode) return;
    setFeeMode(newMode);
    invalidateCalculation();
  };

  const handleReset = () => {
    setOldPrincipal('');
    setOldRate('');
    setOldPeriod('');
    setOldPeriodMode('Yrs');
    setNewRate('');
    setNewPeriod('');
    setNewPeriodMode('Yrs');
    setFeeValue('');
    setFeeMode('%');
    setHasCalculated(false);
    setValidationError('');
  };

  // Calculations only when hasCalculated is true
  const results = useMemo(() => {
    if (!hasCalculated) return null;

    const P = parseFloat(oldPrincipal) || 0;
    const oldR = parseFloat(oldRate) || 0;
    const newR = parseFloat(newRate) || 0;
    const oldMos = oldPeriodMode === 'Yrs' ? (parseFloat(oldPeriod) || 0) * 12 : (parseFloat(oldPeriod) || 0);
    const newMos = newPeriodMode === 'Yrs' ? (parseFloat(newPeriod) || 0) * 12 : (parseFloat(newPeriod) || 0);

    if (P <= 0 || oldR < 0 || newR < 0 || oldMos <= 0 || newMos <= 0) {
      return null;
    }

    const oldEMI = calcEMI(P, oldR, oldMos);
    const newEMI = calcEMI(P, newR, newMos);
    const savingEMI = oldEMI - newEMI;
    const totalOldInterest = oldEMI * oldMos - P;
    const totalNewInterest = newEMI * newMos - P;
    const totalSaving = oldEMI * oldMos - newEMI * newMos;

    const rawFee = parseFloat(feeValue) || 0;
    const processingFees = feeMode === '%' ? (P * rawFee) / 100 : rawFee;
    const netSaving = totalSaving - processingFees;

    let breakEvenMonths = null;
    if (processingFees <= 0) {
      breakEvenMonths = 0;
    } else if (savingEMI > 0) {
      breakEvenMonths = Math.ceil(processingFees / savingEMI);
    }

    return {
      P,
      oldEMI,
      newEMI,
      savingEMI,
      totalOldInterest,
      totalNewInterest,
      totalSaving,
      processingFees,
      netSaving,
      breakEvenMonths,
    };
  }, [hasCalculated, oldPrincipal, oldRate, oldPeriod, oldPeriodMode, newRate, newPeriod, newPeriodMode, feeValue, feeMode]);

  const handleCalculate = () => {
    const P = parseFloat(oldPrincipal) || 0;
    const oldR = parseFloat(oldRate);
    const oldP = parseFloat(oldPeriod) || 0;
    const newR = parseFloat(newRate);
    const newP = parseFloat(newPeriod) || 0;

    if (P <= 0) {
      setValidationError('Please enter a valid Principal Outstanding amount.');
      return;
    }
    if (isNaN(oldR) || oldR < 0) {
      setValidationError('Please enter a valid Existing Interest Rate.');
      return;
    }
    if (oldP <= 0) {
      setValidationError('Please enter a valid Existing Loan Period.');
      return;
    }
    if (isNaN(newR) || newR < 0) {
      setValidationError('Please enter a valid Proposed Interest Rate.');
      return;
    }
    if (newP <= 0) {
      setValidationError('Please enter a valid Proposed Loan Period.');
      return;
    }

    setValidationError('');
    setHasCalculated(true);
    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  };

  const handleShare = () => {
    if (!results) return;
    const text =
      `🏦 Loan Refinance Analysis (EMI Pro)\n` +
      `──────────────────────────\n` +
      `Principal          : ₹${fmt(results.P)}\n` +
      `Existing EMI       : ₹${fmt(results.oldEMI)}/mo\n` +
      `Proposed EMI       : ₹${fmt(results.newEMI)}/mo\n` +
      `Monthly EMI Cut    : ₹${fmt(Math.abs(results.savingEMI))}${results.savingEMI < 0 ? ' (Increase)' : '/mo'}\n` +
      `Old Total Interest : ₹${fmt(results.totalOldInterest)}\n` +
      `New Total Interest : ₹${fmt(results.totalNewInterest)}\n` +
      `Interest Saved     : ₹${fmt(results.totalOldInterest - results.totalNewInterest)}\n` +
      `Processing Fee     : ₹${fmt(results.processingFees)}\n` +
      `Net Total Savings  : ₹${fmt(results.netSaving)}\n` +
      `Break-Even Period  : ${results.breakEvenMonths !== null ? (results.breakEvenMonths === 0 ? 'Immediate' : `${results.breakEvenMonths} Mos`) : 'N/A'}\n` +
      `──────────────────────────\n` +
      `Calculated with EMI Pro`;
    shareAsText('Loan Refinance Analysis', text);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900 relative h-full">
      {/* 1. Pinned Collapsible Top Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          paddingTop: isScrolled
            ? 'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 6px)'
            : 'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px)',
          paddingBottom: isScrolled ? '8px' : '12px',
          paddingLeft: '16px',
          paddingRight: '16px',
          background: theme === 'dark' 
            ? 'linear-gradient(180deg, #172554 0%, #1E293B 100%)' 
            : 'linear-gradient(180deg, #DBEAFE 0%, #E0EFFE 100%)',
          borderBottom: theme === 'dark' 
            ? '1px solid rgba(96, 165, 250, 0.18)' 
            : '1px solid rgba(37, 99, 235, 0.18)',
          boxShadow: isScrolled
            ? (theme === 'dark' ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)' : '0 4px 16px -2px rgba(15, 23, 42, 0.05)')
            : 'none',
          transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <div
          className="max-w-md mx-auto flex items-center justify-between"
          style={{
            minHeight: isScrolled ? '34px' : '44px',
            transition: 'min-height 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <BackButton
              onClick={onBack}
              variant="soft-blue"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h1
                className={`font-bold text-[#0F172A] dark:text-[#F8FAFC] transition-all duration-200 leading-[1.2] ${
                  isScrolled ? 'text-[15px]' : 'text-[18px]'
                }`}
              >
                Loan Refinance
              </h1>
              <div
                className={`text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-all duration-200 overflow-hidden leading-tight ${
                  isScrolled ? 'opacity-0 max-h-0 mt-0 pointer-events-none' : 'opacity-100 max-h-[18px] mt-0.5'
                }`}
              >
                Compare old &amp; new loan terms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share Calculation"
              title="Share"
              className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
            >
              <Share2 size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Scroll Container with Top and Bottom Clearance */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingTop: 'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 72px)',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 92px)',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        <div className="max-w-md mx-auto space-y-3.5">
          {/* Section 1: Existing Loan */}
          <div className="bg-white dark:bg-gray-800/40 rounded-[1.75rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="px-5 pt-4 pb-1">
              <h2 className="text-[13px] font-black text-gray-850 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                🏛️ Existing Loan
              </h2>
            </div>
            <div className="px-5 pb-3">
              <InputRow
                label="Principal Outstanding"
                prefix="₹"
                type="text"
                value={formatNumericInput(oldPrincipal)}
                onChange={(e) => handleAmountChange(e.target.value, setOldPrincipal)}
                placeholder="e.g. 5,00,000"
              />
              <InputRow
                label="Interest %"
                type="number"
                value={oldRate}
                onChange={(e) => handleRateChange(e.target.value, setOldRate)}
                placeholder="e.g. 10.5"
              />
              <InputRow
                label="Period"
                value={oldPeriod}
                onChange={(e) => handlePeriodChange(e.target.value, setOldPeriod)}
                placeholder={oldPeriodMode === 'Yrs' ? 'e.g. 10' : 'e.g. 120'}
              >
                <PeriodToggle mode={oldPeriodMode} setMode={handleOldPeriodModeChange} />
              </InputRow>
            </div>
          </div>

          {/* Section 2: New Loan & Action Buttons */}
          <div className="bg-white dark:bg-gray-800/40 rounded-[1.75rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
            <div className="px-5 pt-4 pb-1">
              <h2 className="text-[13px] font-black text-gray-850 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                🆕 New Loan
              </h2>
            </div>
            <div className="px-5 pb-4">
              <InputRow
                label="Interest %"
                type="number"
                value={newRate}
                onChange={(e) => handleRateChange(e.target.value, setNewRate)}
                placeholder="e.g. 8.5"
              />
              <InputRow
                label="Period"
                value={newPeriod}
                onChange={(e) => handlePeriodChange(e.target.value, setNewPeriod)}
                placeholder={newPeriodMode === 'Yrs' ? 'e.g. 10' : 'e.g. 120'}
              >
                <PeriodToggle mode={newPeriodMode} setMode={handleNewPeriodModeChange} />
              </InputRow>
              <InputRow
                label="Processing Fees"
                type={feeMode === '₹' ? 'text' : 'number'}
                value={feeMode === '₹' ? formatNumericInput(feeValue) : feeValue}
                onChange={(e) => {
                  if (feeMode === '₹') {
                    handleAmountChange(e.target.value, setFeeValue);
                  } else {
                    invalidateCalculation();
                    setFeeValue(e.target.value);
                  }
                }}
                placeholder={feeMode === '%' ? 'e.g. 1' : 'e.g. 5,000'}
              >
                <FeeToggle mode={feeMode} setMode={handleFeeModeChange} />
              </InputRow>

              {/* Action buttons inside input card */}
              <div className="pt-3.5 mt-1 border-t border-gray-100 dark:border-gray-800 flex gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 text-[13px] font-bold active:scale-95 transition-all shadow-sm"
                >
                  <RotateCcw size={15} /> Reset
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white text-[13px] font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <RefreshCw size={15} /> Calculate
                </button>
              </div>

              {/* Subtle validation message */}
              {validationError && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Refinance Summary Card (Only rendered when hasCalculated && results) */}
          {hasCalculated && results && (
            <div ref={summaryRef} className="space-y-3.5">
              <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] text-white rounded-[1.75rem] p-5 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={13} className="text-blue-400" />
                      Refinance Savings Summary
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      results.netSaving >= 0 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {results.netSaving >= 0 ? 'Profitable Switch' : 'Higher Cost'}
                    </span>
                  </div>

                  {/* Primary Metric: Net Total Savings */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Net Total Savings (After Fees)
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-3xl font-black tracking-tight ${results.netSaving >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {results.netSaving < 0 ? '-' : ''}₹{fmt(Math.abs(results.netSaving))}
                      </span>
                    </div>
                  </div>

                  {/* Metric Grid: Monthly EMI Reduction & Break-Even Months */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <TrendingDown size={11} className="text-blue-400" />
                        Monthly EMI Cut
                      </p>
                      <p className={`text-base font-black mt-0.5 ${results.savingEMI >= 0 ? 'text-white' : 'text-rose-300'}`}>
                        {results.savingEMI < 0 ? '-' : ''}₹{fmt(Math.abs(results.savingEMI))}
                        <span className="text-[11px] font-medium text-slate-400">/mo</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={11} className="text-amber-400" />
                        Break-Even Period
                      </p>
                      <p className="text-base font-black text-amber-300 mt-0.5">
                        {results.breakEvenMonths !== null 
                          ? (results.breakEvenMonths === 0 ? 'Immediate' : `${results.breakEvenMonths} Mos`)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison: Old vs. New Total Interest */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Old Total Interest</p>
                      <p className="text-xs font-black text-slate-200 mt-0.5">₹{fmt(results.totalOldInterest)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Total Interest</p>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">₹{fmt(results.totalNewInterest)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Card */}
              <div className="bg-white dark:bg-gray-800/40 rounded-[1.75rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="px-5 pt-4 pb-1">
                  <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Detailed Breakdown
                  </h3>
                </div>

                <ResultRow
                  label="Total Saving in Cash Outflow"
                  value={`${results.totalSaving < 0 ? '-' : ''}₹${fmt(Math.abs(results.totalSaving))}`}
                  greenValue={results.totalSaving > 0}
                />
                <ResultRow
                  label="Net Saving (After Processing Fees)"
                  subLabel="Key metric"
                  value={`${results.netSaving < 0 ? '-' : ''}₹${fmt(Math.abs(results.netSaving))}`}
                  highlight
                  greenValue={results.netSaving > 0}
                />
                <ResultRow
                  label="Existing EMI"
                  value={`₹${fmt(results.oldEMI)}/mo`}
                />
                <ResultRow
                  label="Proposed EMI"
                  value={`₹${fmt(results.newEMI)}/mo`}
                />
                <ResultRow
                  label="Saving in EMI"
                  value={
                    results.savingEMI < 0
                      ? `▲ ₹${fmt(Math.abs(results.savingEMI))} (Increase)`
                      : `▼ ₹${fmt(results.savingEMI)}/mo`
                  }
                  greenValue={results.savingEMI > 0}
                />
                <ResultRow
                  label="Total Old Interest"
                  value={`₹${fmt(results.totalOldInterest)}`}
                />
                <ResultRow
                  label="Total New Interest"
                  value={`₹${fmt(results.totalNewInterest)}`}
                />
                <ResultRow
                  label="Processing Fees"
                  value={`₹${fmt(results.processingFees)}`}
                />
                <ResultRow
                  label="Break-Even Period"
                  value={results.breakEvenMonths !== null ? (results.breakEvenMonths === 0 ? 'Immediate' : `${results.breakEvenMonths} Months`) : 'N/A'}
                  highlight={results.breakEvenMonths !== null && results.breakEvenMonths <= 12}
                />
              </div>

              {/* Share Results Button */}
              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white text-[13px] font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Share2 size={16} /> Share Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
