import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, RotateCcw, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shareAsText } from '../utils/exportUtils';
import { formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';

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
    <span className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0 w-[44%] leading-tight">
      {label}
    </span>
    <div className="flex items-center gap-2 flex-1 justify-end">
      <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 shadow-sm focus-within:border-blue-400 transition-colors min-w-0">
        {prefix && <span className="text-gray-400 dark:text-gray-500 text-sm font-bold mr-1">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full text-right text-[13px] font-bold text-gray-900 dark:text-white outline-none bg-transparent min-w-0"
          inputMode="decimal"
        />
      </div>
      {children}
    </div>
  </div>
);

// ---------- Period toggle ----------
const PeriodToggle = ({ mode, setMode }) => (
  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 text-[10px] font-black flex-shrink-0">
    {['Yrs', 'Mos'].map((t) => (
      <button
        key={t}
        onClick={() => setMode(t)}
        className={`px-2.5 py-1.5 rounded-[10px] transition-all ${
          mode === t ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-450'
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

// ---------- Fee toggle ----------
const FeeToggle = ({ mode, setMode }) => (
  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 text-[10px] font-black flex-shrink-0">
    {['%', '₹'].map((t) => (
      <button
        key={t}
        onClick={() => setMode(t)}
        className={`px-2.5 py-1.5 rounded-[10px] transition-all ${
          mode === t ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-450'
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
  // --- Existing loan ---
  const [oldPrincipal, setOldPrincipal] = useState('');
  const [oldRate, setOldRate] = useState('');
  const [oldPeriod, setOldPeriod] = useState('');
  const [oldPeriodMode, setOldPeriodMode] = useState('Yrs');

  // --- New loan ---
  const [newRate, setNewRate] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newPeriodMode, setNewPeriodMode] = useState('Yrs');
  const [feeValue, setFeeValue] = useState('');
  const [feeMode, setFeeMode] = useState('%');

  const [results, setResults] = useState(null);

  const handleAmountChange = (val, setter) => {
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

  const handleOldPeriodModeChange = (newMode) => {
    if (oldPeriodMode === newMode) return;
    setOldPeriodMode(newMode);
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

  const reset = () => {
    setOldPrincipal(''); setOldRate(''); setOldPeriod('');
    setNewRate(''); setNewPeriod(''); setFeeValue('');
    setOldPeriodMode('Yrs'); setNewPeriodMode('Yrs'); setFeeMode('%');
    setResults(null);
  };

  const calculate = () => {
    const P = parseFloat(oldPrincipal) || 0;
    const oldR = parseFloat(oldRate) || 0;
    const newR = parseFloat(newRate) || 0;
    const oldMos = oldPeriodMode === 'Yrs' ? (parseFloat(oldPeriod) || 0) * 12 : (parseFloat(oldPeriod) || 0);
    const newMos = newPeriodMode === 'Yrs' ? (parseFloat(newPeriod) || 0) * 12 : (parseFloat(newPeriod) || 0);

    const oldEMI = calcEMI(P, oldR, oldMos);
    const newEMI = calcEMI(P, newR, newMos);
    const savingEMI = oldEMI - newEMI;
    const totalOldInterest = oldEMI * oldMos - P;
    const totalNewInterest = newEMI * newMos - P;
    const totalSaving = oldEMI * oldMos - newEMI * newMos;

    const rawFee = parseFloat(feeValue) || 0;
    const processingFees = feeMode === '%' ? (P * rawFee) / 100 : rawFee;
    const netSaving = totalSaving - processingFees;

    setResults({
      oldEMI, newEMI, savingEMI,
      totalOldInterest, totalNewInterest,
      totalSaving, processingFees, netSaving,
    });
  };

  const handleShare = () => {
    if (!results) return;
    const text =
      `🏦 Loan Refinance Analysis\n` +
      `──────────────────────────\n` +
      `Existing EMI       : ₹${fmt(results.oldEMI)}\n` +
      `Proposed EMI       : ₹${fmt(results.newEMI)}\n` +
      `Saving in EMI      : ₹${fmt(Math.abs(results.savingEMI))}${results.savingEMI < 0 ? ' (Increase)' : ''}\n` +
      `Total Old Interest : ₹${fmt(results.totalOldInterest)}\n` +
      `Total New Interest : ₹${fmt(results.totalNewInterest)}\n` +
      `Saving in Outflow  : ₹${fmt(results.totalSaving)}\n` +
      `Processing Fees    : ₹${fmt(results.processingFees)}\n` +
      `Net Saving         : ₹${fmt(results.netSaving)}\n` +
      `──────────────────────────\n` +
      `Calculated with EMI Pro`;
    shareAsText('Loan Refinance Analysis', text);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="px-5 pt-14 pb-4 flex items-center gap-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 transition-colors duration-300">
        <button
          onClick={onBack}
          className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-200 active:scale-90 transition-all animate-fade-in"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-black text-gray-900 dark:text-white leading-tight">Loan Refinance</h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-550 font-semibold mt-0.5">Compare old & new loan terms</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <RefreshCw size={20} strokeWidth={2.5} />
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-28">

        {/* Section 1 */}
        <div className="bg-white dark:bg-gray-800/40 rounded-[1.75rem] border border-gray-100 dark:border-gray-800 shadow-sm mb-4 overflow-hidden transition-colors duration-300">
          <div className="px-5 pt-5 pb-1">
            <h2 className="text-[13px] font-black text-gray-850 dark:text-white uppercase tracking-wider mb-1">
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
              placeholder="5,00,000"
            />
            <InputRow
              label="Interest %"
              type="number"
              value={oldRate}
              onChange={(e) => handleRateChange(e.target.value, setOldRate)}
              placeholder="10.5"
            />
            <InputRow
              label="Period"
              value={oldPeriod}
              onChange={(e) => setOldPeriod(e.target.value)}
              placeholder={oldPeriodMode === 'Yrs' ? '10' : '120'}
            >
              <PeriodToggle mode={oldPeriodMode} setMode={handleOldPeriodModeChange} />
            </InputRow>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white dark:bg-gray-800/40 rounded-[1.75rem] border border-gray-100 dark:border-gray-800 shadow-sm mb-5 overflow-hidden transition-colors duration-300">
          <div className="px-5 pt-5 pb-1">
            <h2 className="text-[13px] font-black text-gray-850 dark:text-white uppercase tracking-wider mb-1">
              🆕 New Loan
            </h2>
          </div>
          <div className="px-5 pb-3">
            <InputRow
              label="Interest %"
              type="number"
              value={newRate}
              onChange={(e) => handleRateChange(e.target.value, setNewRate)}
              placeholder="8.5"
            />
            <InputRow
              label="Period"
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              placeholder={newPeriodMode === 'Yrs' ? '10' : '120'}
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
                  setFeeValue(e.target.value);
                }
              }}
              placeholder={feeMode === '%' ? '1' : '5,000'}
            >
              <FeeToggle mode={feeMode} setMode={setFeeMode} />
            </InputRow>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[13px] font-black active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={calculate}
            className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white text-[13px] font-black shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all"
          >
            <RefreshCw size={15} /> Calculate
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Summary highlight card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.75rem] p-5 mb-4 shadow-lg shadow-blue-200 dark:shadow-none">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">
                  Refinance Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/15 rounded-2xl p-3.5">
                    <span className="block text-[9px] font-black text-blue-200 uppercase tracking-wider mb-1">
                      Total Saving in Outflow
                    </span>
                    <span className={`text-[17px] font-black ${results.totalSaving >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      ₹{fmt(Math.abs(results.totalSaving))}
                    </span>
                    {results.totalSaving < 0 && (
                      <span className="block text-[9px] text-red-300 font-bold mt-0.5">Extra Outflow</span>
                    )}
                  </div>
                  <div className="bg-white/15 rounded-2xl p-3.5">
                    <span className="block text-[9px] font-black text-blue-200 uppercase tracking-wider mb-1">
                      Net Saving (After Fees)
                    </span>
                    <span className={`text-[17px] font-black ${results.netSaving >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      ₹{fmt(Math.abs(results.netSaving))}
                    </span>
                    {results.netSaving < 0 && (
                      <span className="block text-[9px] text-red-300 font-bold mt-0.5">Net Loss</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail table */}
              <div className="bg-white dark:bg-gray-800/40 rounded-[1.75rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-5 transition-colors duration-300">
                <div className="px-4 pt-4 pb-1">
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
                  value={`₹${fmt(results.oldEMI)}`}
                />
                <ResultRow
                  label="Proposed EMI"
                  value={`₹${fmt(results.newEMI)}`}
                />
                <ResultRow
                  label="Saving in EMI"
                  value={
                    results.savingEMI < 0
                      ? `▲ ₹${fmt(Math.abs(results.savingEMI))} (Increase)`
                      : `▼ ₹${fmt(results.savingEMI)}`
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
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white text-[13px] font-black shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all mb-2"
              >
                <Share2 size={16} /> Share Results
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
