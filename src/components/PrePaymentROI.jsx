import React, { useState } from 'react';
import { ChevronLeft, RotateCcw, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  formatNumericInput, 
  parseFormattedNumber 
} from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const PrePaymentROI = ({ onBack }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [mode, setMode] = useState('prepayment'); // 'prepayment' or 'roi'
  const [formData, setFormData] = useState({
    outstanding: '1000000',
    rate: '10',
    emi: '21247',
    prepayment: '100000',
    revisedRate: '11',
  });

  const [results, setResults] = useState(null);

  const calculateResults = () => {
    const P = parseFloat(formData.outstanding);
    const annualRate = parseFloat(formData.rate);
    const r = annualRate / 12 / 100;
    const EMI = parseFloat(formData.emi);

    if (!P || !annualRate || !EMI || EMI <= P * r) {
      alert("Invalid input or EMI too low to cover interest.");
      return;
    }

    // 1. Reverse calculate remaining tenure
    const n = Math.log(EMI / (EMI - P * r)) / Math.log(1 + r);
    const oldInterestTotal = (EMI * n) - P;

    let P_new = P;
    let r_new = r;
    let annualRateNew = annualRate;

    if (mode === 'prepayment') {
      const prepayAmt = parseFloat(formData.prepayment) || 0;
      P_new = Math.max(0, P - prepayAmt);
    } else {
      annualRateNew = parseFloat(formData.revisedRate);
      r_new = annualRateNew / 12 / 100;
    }

    // Outcome 1: Change EMI (Fixed Tenure)
    const emi_new = (P_new * r_new * Math.pow(1 + r_new, n)) / (Math.pow(1 + r_new, n) - 1);
    const interest_emi_change = (emi_new * n) - P_new;

    // Outcome 2: Change Tenure (Fixed EMI)
    let n_new = n;
    let interest_tenure_change = oldInterestTotal;
    
    if (EMI > P_new * r_new) {
      n_new = Math.log(EMI / (EMI - P_new * r_new)) / Math.log(1 + r_new);
      interest_tenure_change = (EMI * n_new) - P_new;
    } else {
      // In ROI change, EMI might become less than interest.
      n_new = n * 2; // Arbitrary fallback if invalid
      interest_tenure_change = 0;
    }

    setResults({
      old: { emi: EMI, months: n, interest: oldInterestTotal },
      emiChange: { emi: emi_new, interest: interest_emi_change },
      tenureChange: { months: n_new, interest: interest_tenure_change }
    });
  };

  const handleReset = () => {
    setFormData({
      outstanding: '1000000',
      rate: '10',
      emi: '21247',
      prepayment: '100000',
      revisedRate: '11',
    });
    setResults(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  const handleShare = () => {
    const text = `📊 Revised EMI & Tenure (${mode === 'prepayment' ? 'Pre-Payment' : 'Revised ROI'})\n` +
                 `─────────────────────────\n` +
                 `Outstanding Loan: ₹${formatCurrency(parseFormattedNumber(formData.outstanding) || 1000000)}\n` +
                 `Current Rate: ${formData.rate}%\n` +
                 `Current EMI: ₹${formatCurrency(parseFormattedNumber(formData.emi) || 21247)}\n` +
                 (mode === 'prepayment' 
                   ? `Prepayment: ₹${formatCurrency(parseFormattedNumber(formData.prepayment) || 100000)}\n` 
                   : `Revised Rate: ${formData.revisedRate}%\n`) +
                 `─────────────────────────\n` +
                 `Calculated with EMI Pro`;
    shareAsText('Revised EMI & Tenure', text);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full relative">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Revised EMI & Tenure"
          onBack={onBack}
          rightActions={
            <button 
              type="button"
              onClick={handleShare}
              aria-label="Share Calculation"
              title="Share"
              className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
            >
              <Share2 size={20} strokeWidth={2} />
            </button>
          }
        />

        <div className="p-6 space-y-6">
        {/* Top Toggle */}
        <div className="flex justify-center">
          <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-full w-full max-w-[280px] border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => { setMode('prepayment'); setResults(null); }}
              className={`flex-1 py-2 px-4 rounded-full text-[12.5px] font-bold transition-all ${
                mode === 'prepayment' ? 'bg-white dark:bg-gray-700 text-primary dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 font-semibold'
              }`}
            >
              Pre Payment
            </button>
            <button
              onClick={() => { setMode('roi'); setResults(null); }}
              className={`flex-1 py-2 px-4 rounded-full text-[12.5px] font-bold transition-all ${
                mode === 'roi' ? 'bg-white dark:bg-gray-700 text-primary dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 font-semibold'
              }`}
            >
              ROI Change
            </button>
          </div>
        </div>

        {/* Form Container */}
        <section className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-5">
          <div className="flex items-center gap-4">
            <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] w-32">Outstanding Amt.</label>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold pointer-events-none">₹</span>
              <input
                type="text"
                inputMode="decimal"
                className="input-pill pl-10 text-right font-semibold"
                value={formatNumericInput(formData.outstanding)}
                onChange={(e) => setFormData({ ...formData, outstanding: parseFormattedNumber(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] w-32">Current Rate %</label>
            <div className="flex-1 relative">
              <input
                type="number"
                step="any"
                placeholder="max: 50% per annum"
                className="input-pill pr-10 text-right font-semibold"
                value={formData.rate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) <= 100) {
                    setFormData({ ...formData, rate: val });
                  }
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold pointer-events-none">%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] w-32">Current EMI</label>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold pointer-events-none">₹</span>
              <input
                type="text"
                inputMode="decimal"
                className="input-pill pl-10 text-right font-semibold"
                value={formatNumericInput(formData.emi)}
                onChange={(e) => setFormData({ ...formData, emi: parseFormattedNumber(e.target.value) })}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'prepayment' ? (
              <motion.div
                key="prepay-field"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4"
              >
                <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] w-32">Pre-Payment Amt.</label>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold pointer-events-none">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-pill pl-10 text-right font-semibold text-primary"
                    value={formatNumericInput(formData.prepayment)}
                    onChange={(e) => setFormData({ ...formData, prepayment: parseFormattedNumber(e.target.value) })}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="roi-field"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4"
              >
                <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] w-32">Revised Rate %</label>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="any"
                    className="input-pill pr-10 text-right font-semibold text-primary"
                    value={formData.revisedRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) <= 100) {
                        setFormData({ ...formData, revisedRate: val });
                      }
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold pointer-events-none">%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleReset}
            className="btn-secondary flex-1 h-[56px] rounded-full"
          >
            <RotateCcw size={20} />
            Reset
          </button>
          <button
            onClick={calculateResults}
            className="btn-primary flex-1 h-[56px] rounded-full"
          >
            Calculate
          </button>
        </div>

        {/* Results Display Section */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Result Card 1: Change EMI */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100">
                <div className="bg-primary py-3 flex justify-center items-center">
                  <span className="text-white font-bold text-sm tracking-wide">If you want to change EMI then</span>
                </div>
                <div className="p-4 grid grid-cols-3 border-b border-gray-50">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New EMI</p>
                    <p className="text-sm font-bold text-green-700">₹ {formatCurrency(results.emiChange.emi)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old EMI</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.emi)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Difference</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(Math.abs(results.emiChange.emi - results.old.emi))}</p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New Int.</p>
                    <p className="text-sm font-bold text-green-700">₹ {formatCurrency(results.emiChange.interest)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old Int.</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Saving</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest - results.emiChange.interest)}</p>
                  </div>
                </div>
              </div>

              {/* Result Card 2: Change Tenure */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100">
                <div className="bg-primary py-3 flex justify-center items-center">
                  <span className="text-white font-bold text-sm tracking-wide">If you want to change Tenure then</span>
                </div>
                <div className="p-4 grid grid-cols-3 border-b border-gray-50">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New Months</p>
                    <p className="text-sm font-bold text-green-700">{Math.round(results.tenureChange.months)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old Months</p>
                    <p className="text-sm font-bold text-blue-600">{Math.round(results.old.months)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Difference</p>
                    <p className="text-sm font-bold text-blue-600">
                      {Math.round(results.tenureChange.months - results.old.months)} Months
                    </p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New Int.</p>
                    <p className="text-sm font-bold text-green-700">₹ {formatCurrency(results.tenureChange.interest)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old Int.</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Saving</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest - results.tenureChange.interest)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PrePaymentROI;
