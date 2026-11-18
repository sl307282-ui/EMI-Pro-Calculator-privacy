import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight, Percent, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BottomSheetSelector from './BottomSheetSelector';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';


const InputRow = ({ label, field, symbol, placeholder, isNumeric = true, onClick, type = 'text', toggleField, formData, setFormData, children }) => (
  <div className="flex items-center gap-3 mb-3.5">
    <label className="w-24 flex-shrink-0 text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] text-left">
      {label}
    </label>
    <div className="flex-grow flex gap-2">
      <div className="flex-grow relative">
        {children ? children : (
          <>
            <input
              readOnly={!!onClick}
              onClick={onClick}
              type={onClick ? 'text' : (isNumeric ? 'text' : type)}
              inputMode={isNumeric && !onClick ? 'decimal' : undefined}
              className={`w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl py-3 px-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-all pr-10 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${onClick ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-700' : ''}`}
              placeholder={placeholder}
              value={isNumeric && !onClick ? formatNumericInput(formData[field]) : formData[field]}
              onChange={(e) => {
                if (onClick) return;
                let val = isNumeric ? parseFormattedNumber(e.target.value) : e.target.value;
                if (isNumeric) {
                  if (field === 'amount' && val.replace(/[^0-9]/g, '').length > 9) return;
                  if (field === 'interestRate' && val !== '' && parseFloat(val) > 100) return;
                  if (field === 'period') {
                    const maxVal = formData.isMonths ? 480 : 40;
                    if (val !== '' && parseFloat(val) > maxVal) return;
                  }
                }
                setFormData(prev => ({ ...prev, [field]: val }));
              }}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              {onClick && <ChevronDown size={14} className="text-gray-450" />}
              {symbol && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                  {symbol}
                </span>
              )}
            </div>
          </>
        )}
      </div>
      {toggleField && (
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex w-24 flex-shrink-0 border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => {
              setFormData(p => {
                const current = parseFloat(p[field]) || 0;
                const converted = p.isMonths ? Math.round(current / 12) : current;
                const capped = Math.min(converted, 40);
                return { ...p, isMonths: false, [field]: p[field] === '' ? '' : String(capped) };
              });
            }}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${!formData.isMonths ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
          >
            YR
          </button>
          <button
            onClick={() => {
              setFormData(p => {
                const current = parseFloat(p[field]) || 0;
                const converted = !p.isMonths ? current * 12 : current;
                const capped = Math.min(converted, 480);
                return { ...p, isMonths: true, [field]: p[field] === '' ? '' : String(capped) };
              });
            }}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${formData.isMonths ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
          >
            MO
          </button>
        </div>
      )}
    </div>
  </div>
);

const InterestCalculator = ({ onBack }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [mode, setMode] = useState('Period'); // 'Period' or 'Date'
  const [formData, setFormData] = useState({
    amount: '100000',
    interestRate: '10',
    compoundInterval: 'None',
    // Period Mode
    period: '1',
    isMonths: false,
    // Date Mode
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });



  const [isIntervalSelectorOpen, setIsIntervalSelectorOpen] = useState(false);
  const [results, setResults] = useState(null);

  const intervals = [
    { label: 'None (Simple Interest)', value: 'None' },
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Half Yearly', value: 'Half Yearly' },
    { label: 'Yearly', value: 'Yearly' }
  ];

  const calculateInterest = () => {
    const P = parseFloat(formData.amount);
    const R = parseFloat(formData.interestRate);
    let T = 0; // Time in years

    if (mode === 'Period') {
      const periodVal = parseFloat(formData.period) || 0;
      T = formData.isMonths ? (periodVal / 12) : periodVal;
    } else {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      T = diffDays / 365;
    }

    if (isNaN(P) || isNaN(R) || T <= 0) return;

    let interestEarned = 0;
    let totalAmount = 0;

    if (formData.compoundInterval === 'None') {
      // Simple Interest: (P * R * T) / 100
      interestEarned = (P * R * T) / 100;
      totalAmount = P + interestEarned;
    } else {
      // Compound Interest: A = P(1 + r/n)^(nt)
      const r = R / 100;
      const nMap = { 'Monthly': 12, 'Quarterly': 4, 'Half Yearly': 2, 'Yearly': 1 };
      const n = nMap[formData.compoundInterval];
      totalAmount = P * Math.pow(1 + r / n, n * T);
      interestEarned = totalAmount - P;
    }

    setResults({
      interestEarned,
      totalAmount,
      timeInDays: Math.round(T * 365)
    });
  };


  const handleReset = () => {
    setFormData({
      amount: '',
      interestRate: '',
      compoundInterval: 'None',
      period: '',
      isMonths: false,
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });
    setResults(null);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `Interest Calculation Details:\n\n` +
                 `Principal Amount: ${formatCurrency(formData.amount)}\n` +
                 `Interest Rate: ${formData.interestRate}%\n` +
                 `Compound Interval: ${formData.compoundInterval}\n` +
                 `Duration: ${results.timeInDays} Days\n` +
                 `Interest Earned: ${formatCurrency(results.interestEarned)}\n` +
                 `Total Amount: ${formatCurrency(results.totalAmount)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Interest Calculation', text);
  };



  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden h-full relative">
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
          title="Interest Calculator"
          onBack={onBack}
          rightActions={
            <div className="flex items-center gap-2">
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

        <div className="px-6 py-6">
        {/* Toggle Mode */}
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-[2rem] flex mb-6 border border-slate-200 dark:border-slate-700/60">
          {['Period', 'Date'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 rounded-3xl text-[12.5px] font-semibold transition-all ${
                mode === m 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-4.5 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
          <InputRow label="Amount" field="amount" symbol="₹" formData={formData} setFormData={setFormData} />
          <InputRow label="Interest %" field="interestRate" symbol="%" formData={formData} setFormData={setFormData} />
          {mode === 'Period' ? (
            <InputRow label="Period" field="period" toggleField="isMonths" formData={formData} setFormData={setFormData} />
          ) : (
            <InputRow label="Interval" field="compoundInterval" onClick={() => setIsIntervalSelectorOpen(true)} isNumeric={false} formData={formData} setFormData={setFormData} />
          )}
          {mode === 'Period' && (
            <InputRow label="Interval" field="compoundInterval" onClick={() => setIsIntervalSelectorOpen(true)} isNumeric={false} formData={formData} setFormData={setFormData} />
          )}
          
          {mode === 'Date' && (
            <>
              <InputRow label="From Date">
                <input
                  type="date"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-xl py-2.5 px-3.5 text-xs font-black text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 color-scheme-dark"
                  value={formData.fromDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </InputRow>
              <InputRow label="To Date">
                <input
                  type="date"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-xl py-2.5 px-3.5 text-xs font-black text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 color-scheme-dark"
                  value={formData.toDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </InputRow>
            </>
          )}
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={handleReset} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={calculateInterest} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2">
            Calculate <ArrowRight size={16} />
          </button>
        </div>

        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
            <div className="text-center bg-blue-600 dark:bg-blue-700 rounded-[2.5rem] py-8 px-6 shadow-xl dark:shadow-none relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <Percent size={120} className="absolute -right-8 -bottom-8 rotate-12 text-white" />
              </div>
              <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Interest Earned</p>
              <h2 className="text-3xl font-black text-white">{formatCurrency(results.interestEarned)}</h2>
            </div>

            <div className="bg-white dark:bg-gray-805 border-2 border-gray-50 dark:border-gray-800 rounded-[2rem] overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  <tr className="flex justify-between p-5">
                    <td className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Duration</td>
                    <td className="text-sm font-black text-gray-900 dark:text-white">{results.timeInDays} Days</td>
                  </tr>
                  <tr className="flex justify-between p-5">
                    <td className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Total Amount</td>
                    <td className="text-sm font-black text-blue-600 dark:text-blue-400">{formatCurrency(results.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button 
              onClick={handleShare}
              className="w-full py-5 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-[2rem] text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:bg-blue-50 dark:active:bg-blue-900/10 transition-all"
            >
              <Share2 size={16} /> Share Calculation
            </button>
          </motion.div>
        )}
        </div>
      </div>

      <BottomSheetSelector 
        isOpen={isIntervalSelectorOpen}
        onClose={() => setIsIntervalSelectorOpen(false)}
        title="Select Interval"
        options={intervals}
        selectedValue={formData.compoundInterval}
        onSelect={(val) => setFormData(p => ({ ...p, compoundInterval: val }))}
      />
    </div>
  );
};

export default InterestCalculator;
