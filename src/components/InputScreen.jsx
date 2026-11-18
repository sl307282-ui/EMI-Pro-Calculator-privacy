import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, History, RotateCcw, Share2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateEMI, formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import VoiceInput from './VoiceInput';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const InputScreen = ({ onBack, onCalculate, initialData }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [formData, setFormData] = useState(initialData || {
    amount: '',
    interest: '',
    period: '',
    isMonths: false,
    processingFee: '0',
  });
  
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('emi_calculator_history') || '[]');
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const emi = useMemo(() => {
    const amount = parseFormattedNumber(formData.amount);
    const interest = parseFormattedNumber(formData.interest);
    const period = parseFormattedNumber(formData.period);

    if (amount && interest && period) {
      return calculateEMI(
        amount,
        interest,
        period,
        formData.isMonths
      );
    }
    return 0;
  }, [formData]);

  const handleReset = () => {
    setFormData({
      amount: '',
      interest: '',
      period: '',
      isMonths: false,
      processingFee: '0',
    });
  };

  const handleCalculate = () => {
    if (formData.amount && formData.interest && formData.period) {
      const amountVal = parseFormattedNumber(formData.amount);
      const interestVal = parseFormattedNumber(formData.interest);
      const periodVal = parseFormattedNumber(formData.period);
      const currentEmi = emi || 0;
      
      const newEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: formData.amount,
        interest: formData.interest,
        period: formData.period,
        isMonths: formData.isMonths,
        emi: Math.round(currentEmi),
      };

      setHistory(prev => {
        const filtered = prev.filter(item => 
          !(item.amount === formData.amount && item.interest === formData.interest && item.period === formData.period && item.isMonths === formData.isMonths)
        );
        const updated = [newEntry, ...filtered].slice(0, 20);
        try {
          localStorage.setItem('emi_calculator_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      onCalculate(formData);
    }
  };

  const handleShare = () => {
    const amountVal = parseFormattedNumber(formData.amount) || 1000000;
    const interestVal = parseFormattedNumber(formData.interest) || 8.5;
    const periodVal = parseFormattedNumber(formData.period) || 20;
    const currentEmi = emi || calculateEMI(amountVal, interestVal, periodVal, formData.isMonths);
    const n = (formData.isMonths ? periodVal : periodVal * 12) || 240;
    const totalPayment = currentEmi * n;
    const totalInterest = Math.max(0, totalPayment - amountVal);

    const shareContent = 
      `📊 EMI Calculation Breakdown (EMI Pro)\n` +
      `─────────────────────────\n` +
      `Loan Amount: ₹${Number(amountVal).toLocaleString('en-IN')}\n` +
      `Interest Rate: ${interestVal}%\n` +
      `Tenure: ${periodVal} ${formData.isMonths ? 'Months' : 'Years'}\n` +
      `Monthly EMI: ₹${Number(Math.round(currentEmi)).toLocaleString('en-IN')}\n` +
      `Total Interest: ₹${Number(Math.round(totalInterest)).toLocaleString('en-IN')}\n` +
      `Total Payment: ₹${Number(Math.round(totalPayment)).toLocaleString('en-IN')}\n` +
      `─────────────────────────\n` +
      `Calculated with EMI Pro`;

    shareAsText('EMI Calculation', shareContent);
  };

  const handleSafeBack = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    requestAnimationFrame(() => {
      if (onBack) onBack();
    });
  };

  const restoreHistory = (item) => {
    setFormData({
      amount: item.amount,
      interest: item.interest,
      period: item.period,
      isMonths: !!item.isMonths,
      processingFee: '0',
    });
    setIsHistoryOpen(false);
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('emi_calculator_history', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const clearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('emi_calculator_history');
    } catch (e) {}
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] overflow-hidden relative"
      style={{
        minHeight: '100svh',
        height: '100%',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform'
      }}
    >
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
          title="EMI Calculator"
          onBack={handleSafeBack}
          rightActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                aria-label="Calculation History"
                title="History"
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center relative"
              >
                <History size={20} strokeWidth={2} />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-black text-white w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-gray-900">
                    {history.length}
                  </span>
                )}
              </button>
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
          }
        />

        {/* Form */}
        <div className="px-6 py-4 space-y-6">
        <div 
          className="space-y-2 input-wrapper"
          style={{ scrollMarginTop: '96px', scrollMarginBottom: '120px' }}
        >
          <div className="flex justify-between items-center px-1">
            <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3]">Loan Amount</label>
            <VoiceInput label="Amount" onResult={(val) => setFormData(p => ({ ...p, amount: val }))} />
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 5,00,000"
            className="input-pill"
            value={formatNumericInput(formData.amount)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              if (val.length <= 9) {
                setFormData({ ...formData, amount: val });
              }
            }}
          />
        </div>

        <div 
          className="space-y-2 input-wrapper"
          style={{ scrollMarginTop: '96px', scrollMarginBottom: '120px' }}
        >
          <div className="flex justify-between items-center px-1">
            <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3]">Interest %</label>
            <VoiceInput label="Interest" onResult={(val) => setFormData(p => ({ ...p, interest: val }))} />
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 8.5"
            className="input-pill"
            value={formatNumericInput(formData.interest)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              if (val === '' || parseFloat(val) <= 50) {
                setFormData({ ...formData, interest: val });
              }
            }}
          />
        </div>

        <div 
          className="space-y-2 input-wrapper"
          style={{ scrollMarginTop: '96px', scrollMarginBottom: '120px' }}
        >
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3]">Period</label>
              <VoiceInput label="Period" onResult={(val) => setFormData(p => ({ ...p, period: val }))} />
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
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
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
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
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
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
            placeholder={formData.isMonths ? "e.g. 12" : "e.g. 5"}
            className="input-pill"
            value={formatNumericInput(formData.period)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              const max = formData.isMonths ? 960 : 80;
              if (val === '' || parseFloat(val) <= max) {
                setFormData({ ...formData, period: val });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] px-1">Monthly EMI</label>
          <div className="input-pill bg-slate-100/70 dark:bg-gray-900 text-slate-700 dark:text-slate-200 font-bold flex items-center">
            {emi > 0 ? `₹ ${Math.round(emi).toLocaleString()}` : 'Auto-calculated'}
          </div>
        </div>

        <div 
          className="space-y-2 input-wrapper"
          style={{ scrollMarginTop: '96px', scrollMarginBottom: '120px' }}
        >
          <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] px-1">Processing Fee %</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            className="input-pill"
            value={formatNumericInput(formData.processingFee)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              if (val === '' || parseFloat(val) <= 100) {
                setFormData({ ...formData, processingFee: val });
              }
            }}
          />
        </div>

        {/* Action Buttons inside scrollable container */}
        <div className="flex gap-4 pt-4 pb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCalculate}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            Calculate
          </motion.button>
        </div>
      </div>
    </div>

      {/* LOCAL CALCULATIONS HISTORY DRAWER */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex flex-col justify-end"
              style={{ zIndex: 9999 }}
              onClick={() => setIsHistoryOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-t-[2.5rem] shadow-2xl max-h-[75%] flex flex-col overflow-hidden transition-colors duration-300 z-[10000]"
                style={{
                  zIndex: 10000,
                  paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 20px)',
                }}
              >
                <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Recent Calculations</h2>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Load past EMI calculations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllHistory}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1 rounded active:opacity-60"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsHistoryOpen(false)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 active:scale-90 transition-transform"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto max-h-[calc(100%-80px)] px-6 py-4 space-y-3 overscroll-contain touch-pan-y"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {history.length > 0 ? (
                    history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => restoreHistory(item)}
                        className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer active:scale-[0.99] transition-all"
                      >
                        <div className="flex-1 pr-3">
                          <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wide mb-1">
                            ₹{Number(parseFormattedNumber(item.amount) || 0).toLocaleString('en-IN')} @ {item.interest}% for {item.period} {item.isMonths ? 'Mo' : 'Yr'}
                          </span>
                          <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">
                            EMI: ₹{Number(item.emi || 0).toLocaleString('en-IN')} / mo
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{item.date}</span>
                          <button
                            type="button"
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 active:scale-90 transition-all"
                            aria-label="Delete calculation"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-gray-400">
                      <History size={36} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-bold">No past calculations</p>
                      <p className="text-xs mt-1 text-gray-400">Calculated results will show up here</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default InputScreen;
