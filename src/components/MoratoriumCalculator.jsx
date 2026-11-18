import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, RotateCcw, Share2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  calculateEMI, 
  formatNumericInput, 
  parseFormattedNumber, 
  calculateTenure 
} from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const MoratoriumCalculator = ({ onBack }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [formData, setFormData] = useState({
    amount: '1000000',
    interest: '8.5',
    interestType: 'reducing', // 'reducing' or 'flat'
    period: '5',
    isMonths: false,
    moratoriumType: 'full', // 'full', 'interestOnly', 'partial'
    partialAmount: '5000',
    moratoriumStart: '12',
    moratoriumDuration: '6',
    adjustmentOption: 'emi' // 'emi' (Increase EMI) or 'tenure' (Increase Tenure)
  });

  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const calculateMoratoriumImpact = () => {
    const P = parseFloat(formData.amount);
    const annualRate = parseFloat(formData.interest);
    const r = annualRate / 12 / 100;
    const originalTenureMonths = formData.isMonths ? parseInt(formData.period) : parseInt(formData.period) * 12;
    
    // 1. Without Moratorium (Standard)
    const standardEmi = calculateEMI(P, annualRate, formData.period, formData.isMonths);
    const standardTotalPayment = standardEmi * originalTenureMonths;
    const standardTotalInterest = standardTotalPayment - P;

    // 2. With Moratorium
    const mStart = parseInt(formData.moratoriumStart);
    const mDuration = parseInt(formData.moratoriumDuration);
    
    // Phase 1: Before Moratorium (mStart months)
    let currentPrincipal = P;
    let interestPaidBefore = 0;
    let principalPaidBefore = 0;

    for (let i = 0; i < mStart; i++) {
      const interestForMonth = currentPrincipal * r;
      const principalForMonth = standardEmi - interestForMonth;
      interestPaidBefore += interestForMonth;
      principalPaidBefore += principalForMonth;
      currentPrincipal -= principalForMonth;
    }

    // Phase 2: During Moratorium (mDuration months)
    let moratoriumInterestAccrued = 0;
    let moratoriumPaymentMade = 0;

    for (let i = 0; i < mDuration; i++) {
      const interestForMonth = currentPrincipal * r;
      moratoriumInterestAccrued += interestForMonth;

      if (formData.moratoriumType === 'interestOnly') {
        moratoriumPaymentMade += interestForMonth;
      } else if (formData.moratoriumType === 'partial') {
        const partial = parseFloat(formData.partialAmount) || 0;
        moratoriumPaymentMade += partial;
        currentPrincipal += (interestForMonth - partial);
      } else {
        // Full Moratorium
        currentPrincipal += interestForMonth;
      }
    }

    // Phase 3: After Moratorium
    let finalEmi = standardEmi;
    let finalTenureMonths = originalTenureMonths + mDuration;

    if (formData.adjustmentOption === 'emi') {
      // Tenure remains same (original end date)
      const remainingMonths = originalTenureMonths - mStart; 
      if (remainingMonths > 0) {
        finalEmi = (currentPrincipal * r * Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1);
        finalTenureMonths = originalTenureMonths + mDuration; 
      }
    } else {
      // EMI remains same, solve for tenure
      if (standardEmi > currentPrincipal * r) {
        const remainingMonths = Math.log(standardEmi / (standardEmi - currentPrincipal * r)) / Math.log(1 + r);
        finalTenureMonths = mStart + mDuration + Math.ceil(remainingMonths);
      } else {
        finalTenureMonths = 999;
      }
    }

    const pausedTotalPayment = (standardEmi * mStart) + moratoriumPaymentMade + (finalEmi * (finalTenureMonths - mStart - mDuration));
    const pausedTotalInterest = pausedTotalPayment - P;

    const capitalizedInterest = Math.max(0, currentPrincipal - (P - principalPaidBefore));
    
    setResults({
      without: {
        principal: P,
        emi: standardEmi,
        tenure: originalTenureMonths,
        interest: standardTotalInterest,
        total: standardTotalPayment
      },
      with: {
        principalPlusAccrued: P + capitalizedInterest, 
        emi: finalEmi,
        tenure: isFinite(finalTenureMonths) ? finalTenureMonths : '∞',
        interest: pausedTotalInterest,
        total: pausedTotalPayment
      }
    });
    setShowResults(true);
  };

  const handleReset = () => {
    setFormData({
      amount: '1000000',
      interest: '8.5',
      interestType: 'reducing',
      period: '5',
      isMonths: false,
      moratoriumType: 'full',
      partialAmount: '5000',
      moratoriumStart: '12',
      moratoriumDuration: '6',
      adjustmentOption: 'emi'
    });
    setShowResults(false);
    setResults(null);
  };

  const handleShare = () => {
    const text = `Moratorium Impact Analysis:\n\n` +
                 `Original Total Payment: ₹${Math.round(results.without.total).toLocaleString()}\n` +
                 `Total Payment with Pause: ₹${Math.round(results.with.total).toLocaleString()}\n` +
                 `Total Increase: ₹${Math.round(results.with.total - results.without.total).toLocaleString()}\n` +
                 `New Monthly EMI: ₹${Math.round(results.with.emi).toLocaleString()}\n` +
                 `New Total Tenure: ${results.with.tenure} Months\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Moratorium Impact Report', text);
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
          title="Moratorium Calculator"
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
        {/* Section 1: Loan Details */}
        <section className="bg-white rounded-3xl p-6 shadow-soft space-y-5">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            Loan Details
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3]">Loan Amount</label>
              <div className="text-primary font-bold">₹ {formatNumericInput(formData.amount)}</div>
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">₹</span>
              <input
                type="text"
                inputMode="decimal"
                className="input-pill pl-10"
                value={formatNumericInput(formData.amount)}
                onChange={(e) => setFormData({ ...formData, amount: parseFormattedNumber(e.target.value) })}
              />
            </div>
            <input
              type="range"
              min="100000"
              max="10000000"
              step="50000"
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] px-1">Interest %</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  className="input-pill pr-10"
                  value={formData.interest}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) <= 100) {
                      setFormData({ ...formData, interest: val });
                    }
                  }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] px-1">Rate Type</label>
              <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl h-[56px] border border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => setFormData({ ...formData, interestType: 'reducing' })}
                  className={`flex-1 rounded-xl text-[12px] font-bold transition-all ${
                    formData.interestType === 'reducing' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 font-semibold'
                  }`}
                >
                  Reducing
                </button>
                <button
                  onClick={() => setFormData({ ...formData, interestType: 'flat' })}
                  className={`flex-1 rounded-xl text-[12px] font-bold transition-all ${
                    formData.interestType === 'flat' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 font-semibold'
                  }`}
                >
                  Flat
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3]">Period</label>
              <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => {
                    if (formData.isMonths) {
                      const currentPeriod = parseFloat(formData.period) || 0;
                      setFormData({ 
                        ...formData, 
                        isMonths: false, 
                        period: String(Math.round(currentPeriod / 12)) 
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    !formData.isMonths ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Years
                </button>
                <button
                  onClick={() => {
                    if (!formData.isMonths) {
                      const currentPeriod = parseFloat(formData.period) || 0;
                      setFormData({ 
                        ...formData, 
                        isMonths: true, 
                        period: String(currentPeriod * 12) 
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    formData.isMonths ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Months
                </button>
              </div>
            </div>
            <input
              type="text"
              inputMode="decimal"
              className="input-pill"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            />
            <input
              type="range"
              min="1"
              max={formData.isMonths ? "960" : "80"}
              step="1"
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            />
          </div>
        </section>

        {/* Section 2: Moratorium Settings */}
        <section className="bg-white rounded-3xl p-6 shadow-soft space-y-5">
          <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
            Moratorium Settings
          </h2>

          <div className="space-y-3">
            <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3]">Moratorium Type</label>
            <div className="space-y-2">
              {[
                { id: 'full', label: 'Full Moratorium', sub: 'No Payment' },
                { id: 'interestOnly', label: 'Interest Only', sub: 'Pay Interest' },
                { id: 'partial', label: 'Partial EMI', sub: 'Pay Partial EMI' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, moratoriumType: type.id })}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    formData.moratoriumType === type.id 
                    ? 'border-primary bg-blue-50/50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/50'
                  }`}
                >
                  <div className="text-left">
                    <div className={`font-bold ${formData.moratoriumType === type.id ? 'text-primary dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {type.label}
                    </div>
                    <div className={`text-[11px] ${formData.moratoriumType === type.id ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>{type.sub}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.moratoriumType === type.id ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {formData.moratoriumType === type.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {formData.moratoriumType === 'partial' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2"
              >
                <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] px-1">Partial Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-pill pl-10"
                    value={formatNumericInput(formData.partialAmount)}
                    onChange={(e) => setFormData({ ...formData, partialAmount: parseFormattedNumber(e.target.value) })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] px-1">Moratorium Start</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-bold">After</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-pill pl-14 pr-14"
                  value={formData.moratoriumStart}
                  onChange={(e) => setFormData({ ...formData, moratoriumStart: e.target.value })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-bold">Months</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] px-1">Duration</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-pill pr-14"
                  value={formData.moratoriumDuration}
                  onChange={(e) => setFormData({ ...formData, moratoriumDuration: e.target.value })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-bold">Months</span>
              </div>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="1"
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            value={formData.moratoriumDuration}
            onChange={(e) => setFormData({ ...formData, moratoriumDuration: e.target.value })}
          />
        </section>

        {/* Section 3: EMI Adjustment Option */}
        <section className="bg-white rounded-3xl p-6 shadow-soft space-y-5">
          <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
            EMI Adjustment Option
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'emi', label: 'Increase EMI', sub: 'Tenure Same' },
              { id: 'tenure', label: 'Increase Tenure', sub: 'EMI Same' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFormData({ ...formData, adjustmentOption: opt.id })}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  formData.adjustmentOption === opt.id 
                  ? 'border-primary bg-blue-50/50 dark:bg-blue-950/20' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800/50'
                }`}
              >
                <div className={`font-bold text-[13px] ${formData.adjustmentOption === opt.id ? 'text-primary dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {opt.label}
                </div>
                <div className={`text-[11px] ${formData.adjustmentOption === opt.id ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={handleReset}
            className="btn-secondary flex-1 h-[64px]"
          >
            <RotateCcw size={20} />
            Reset
          </button>
          <button
            onClick={calculateMoratoriumImpact}
            className="btn-primary flex-1 h-[64px]"
          >
            Calculate
          </button>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && results && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-4 pb-12"
            >
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Info size={16} className="text-primary" />
                  <h2 className="font-bold text-gray-800">Impact Comparison</h2>
                </div>
                
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-4 border-b border-gray-50">Metric</th>
                      <th className="px-4 py-4 border-b border-gray-50 text-center">Without</th>
                      <th className="px-5 py-4 border-b border-gray-50 bg-blue-50 text-primary text-center">With Pause</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { 
                        label: 'Total Principal', 
                        key: 'principalPlusAccrued', 
                        format: 'currency',
                        highlight: (w, wo) => w > wo
                      },
                      { 
                        label: 'Monthly EMI', 
                        key: 'emi', 
                        format: 'currency',
                        highlight: (w, wo) => Math.round(w) > Math.round(wo)
                      },
                      { 
                        label: 'Tenure (Months)', 
                        key: 'tenure', 
                        format: 'number',
                        highlight: (w, wo) => w > wo
                      },
                      { 
                        label: 'Total Interest', 
                        key: 'interest', 
                        format: 'currency',
                        highlight: (w, wo) => w > wo
                      },
                      { 
                        label: 'Total Payment', 
                        key: 'total', 
                        format: 'currency',
                        highlight: (w, wo) => w > wo
                      }
                    ].map((row) => {
                      const valWithout = results.without[row.key === 'principalPlusAccrued' ? 'principal' : row.key];
                      const valWith = results.with[row.key];
                      const isChanged = row.highlight(valWith, valWithout);

                      return (
                        <tr key={row.label} className="border-b border-gray-50 last:border-0 group">
                          <td className="px-5 py-4 text-xs font-semibold text-gray-500">{row.label}</td>
                          <td className="px-4 py-4 text-center font-medium text-gray-700">
                            {row.format === 'currency' ? `₹${Math.round(valWithout).toLocaleString()}` : valWithout}
                          </td>
                          <td className={`px-5 py-4 text-center bg-blue-50/30 ${isChanged ? 'text-primary font-bold' : 'text-gray-700 font-medium'}`}>
                            {row.format === 'currency' ? `₹${Math.round(valWith).toLocaleString()}` : valWith}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-600/5 p-5 rounded-2xl border border-blue-100">
                <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                  <span className="font-bold">Note:</span> Choosing a moratorium increases your total interest by 
                  <span className="font-bold"> ₹{Math.round(results.with.interest - results.without.interest).toLocaleString()}</span>. 
                  This pause is technically an extension of your liability.
                </p>
              </div>

              <button
                onClick={handleShare}
                className="w-full btn-primary h-[64px] rounded-full"
              >
                <Share2 size={20} />
                Share Analysis
              </button>
            </motion.section>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MoratoriumCalculator;
