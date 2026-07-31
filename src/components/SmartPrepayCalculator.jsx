import React, { useState, useMemo } from 'react';
import { ChevronLeft, RotateCcw, TrendingUp, Info, Sparkles, Edit3, ArrowLeft } from 'lucide-react';
import { calculateEMI, formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { motion, AnimatePresence } from 'framer-motion';

const FormRow = ({ label, field, placeholder, value, onChange, symbol, isReadOnly = false, type = 'text', inputMode = 'decimal' }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
    <label className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 flex-1">{label}</label>
    <div className="relative flex items-center flex-[1.4] max-w-[170px]">
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        readOnly={isReadOnly}
        value={isReadOnly ? (value > 0 ? formatCurrency(value) : '0.00') : formatNumericInput(value)}
        onChange={(e) => !isReadOnly && onChange(field, parseFormattedNumber(e.target.value))}
        className={`w-full ${isReadOnly ? 'bg-gray-50/50 dark:bg-gray-800/30' : 'bg-white dark:bg-gray-800'} border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-black text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-right pr-9 shadow-sm`}
      />
      {symbol && <span className="absolute right-3.5 text-[9px] font-black text-gray-400 uppercase tracking-tighter">{symbol}</span>}
    </div>
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    <span className="text-[11px] font-black text-gray-700 dark:text-gray-200">{value}</span>
  </div>
);

const SmartPrepayCalculator = ({ onBack }) => {
  const [formData, setFormData] = useState({
    loanAmount: '',
    interestRate: '',
    tenure: '',
    isMonths: false,
    prepayAmount: '',
    prepayMonth: '',
    penaltyPercent: '0',
    strategy: 'Reduce Tenure'
  });

  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (field, value) => {
    if (field === 'loanAmount' && value.length > 9) return;
    if (field === 'interestRate' && parseFloat(value) > 50) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const currentEMI = useMemo(() => {
    const p = parseFloat(parseFormattedNumber(formData.loanAmount)) || 0;
    const r = parseFloat(parseFormattedNumber(formData.interestRate)) || 0;
    const t = parseFloat(parseFormattedNumber(formData.tenure)) || 0;
    if (p && r && t) return calculateEMI(p, r, t, formData.isMonths);
    return 0;
  }, [formData.loanAmount, formData.interestRate, formData.tenure, formData.isMonths]);

  const handleCalculate = () => {
    const P = parseFloat(parseFormattedNumber(formData.loanAmount)) || 0;
    const R_annual = parseFloat(parseFormattedNumber(formData.interestRate)) || 0;
    const R = R_annual / 12 / 100;
    const N_total = formData.isMonths ? parseInt(formData.tenure) : parseInt(formData.tenure) * 12;
    const prepayAmount = parseFloat(parseFormattedNumber(formData.prepayAmount)) || 0;
    const prepayMonth = parseInt(formData.prepayMonth) || 0;
    const penaltyPercent = parseFloat(formData.penaltyPercent) || 0;

    if (!P || !R_annual || !N_total || !prepayAmount || !prepayMonth) return;

    const EMI = currentEMI;
    let balance = P;
    let interestPaidUntilPrepay = 0;
    for (let i = 1; i <= prepayMonth; i++) {
      const interestForMonth = balance * R;
      interestPaidUntilPrepay += interestForMonth;
      const principalForMonth = EMI - interestForMonth;
      balance -= principalForMonth;
      if (balance <= 0) {
          balance = 0;
          break;
      }
    }

    const outstandingBefore = balance;
    const penaltyAmount = prepayAmount * (penaltyPercent / 100);
    const newPrincipal = Math.max(0, outstandingBefore - prepayAmount);
    const remainingMonths = N_total - prepayMonth;

    let interestAfter = 0;
    let newEMIValue = EMI;
    let newRemainingMonths = remainingMonths;

    if (formData.strategy === 'Reduce EMI') {
      if (newPrincipal > 0 && remainingMonths > 0) {
        newEMIValue = (newPrincipal * R * Math.pow(1 + R, remainingMonths)) / (Math.pow(1 + R, remainingMonths) - 1);
        interestAfter = (newEMIValue * remainingMonths) - newPrincipal;
      } else {
        newEMIValue = 0;
        interestAfter = 0;
      }
    } else {
      if (newPrincipal > 0 && EMI > newPrincipal * R) {
        newRemainingMonths = Math.log(EMI / (EMI - newPrincipal * R)) / Math.log(1 + R);
        interestAfter = (EMI * newRemainingMonths) - newPrincipal;
      } else {
        newRemainingMonths = 0;
        interestAfter = 0;
      }
    }

    const oldTotalInterest = (EMI * N_total) - P;
    const totalInterestAfter = interestPaidUntilPrepay + interestAfter;
    const interestSaved = oldTotalInterest - totalInterestAfter;
    const netBenefit = interestSaved - penaltyAmount;

    setResults({
      netBenefit,
      outstandingBefore,
      prepayAmount,
      penaltyAmount,
      oldTotalInterest,
      totalInterestAfter,
      interestSaved,
      newEMI: newEMIValue,
      reducedTenure: newRemainingMonths,
      strategy: formData.strategy
    });
    setShowResults(true);
  };

  const handleReset = () => {
    setFormData({
      loanAmount: '',
      interestRate: '',
      tenure: '',
      isMonths: false,
      prepayAmount: '',
      prepayMonth: '',
      penaltyPercent: '0',
      strategy: 'Reduce Tenure'
    });
    setResults(null);
    setShowResults(false);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300 min-h-0 overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 sticky top-0 z-20">
        <button onClick={showResults ? () => setShowResults(false) : onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
          {showResults ? <ArrowLeft size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h1 className="ml-4 text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-blue-500" />
            {showResults ? 'Savings Analysis' : 'Smart Prepay'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Section 1: Current Loan Details */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
                <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Loan Details</h2>
                <FormRow label="Loan Amount" field="loanAmount" placeholder="e.g. 25,00,000" value={formData.loanAmount} onChange={handleInputChange} symbol="₹" />
                <FormRow label="Interest Rate %" field="interestRate" placeholder="e.g. 8.5" value={formData.interestRate} onChange={handleInputChange} symbol="%" />
                
                <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 dark:border-gray-800/50">
                  <label className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">Tenure</label>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                      {['Y', 'M'].map((unit) => (
                        <button
                          key={unit}
                          onClick={() => {
                            const isMonths = unit === 'M';
                            if (formData.isMonths !== isMonths) {
                              const val = parseFloat(formData.tenure) || 0;
                              setFormData({
                                ...formData,
                                isMonths,
                                tenure: isMonths ? String(val * 12) : String(Math.round(val / 12))
                              });
                            }
                          }}
                          className={`px-4 py-2 rounded-md text-[10px] font-black transition-all ${
                            (unit === 'M' && formData.isMonths) || (unit === 'Y' && !formData.isMonths)
                              ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex items-center max-w-[100px]">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={formatNumericInput(formData.tenure)}
                        onChange={(e) => handleInputChange('tenure', parseFormattedNumber(e.target.value))}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-black text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-right pr-9 shadow-sm"
                      />
                      <span className="absolute right-3 text-[8px] font-black text-gray-400 uppercase">{formData.isMonths ? "MO" : "YR"}</span>
                    </div>
                  </div>
                </div>
                <FormRow label="Current EMI" value={currentEMI} isReadOnly={true} />
              </div>

              {/* Section 2: Prepayment Details */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
                <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Prepayment</h2>
                <FormRow label="Prepayment Amount" field="prepayAmount" placeholder="0.00" value={formData.prepayAmount} onChange={handleInputChange} symbol="₹" />
                <FormRow label="After (Months)" field="prepayMonth" placeholder="e.g. 12" value={formData.prepayMonth} onChange={handleInputChange} symbol="MO" />
                <FormRow label="Penalty %" field="penaltyPercent" placeholder="0" value={formData.penaltyPercent} onChange={handleInputChange} symbol="%" />
              </div>

              {/* Section 3: Adjustment Strategy */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
                <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Strategy</h2>
                <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl mb-3">
                  {['Reduce EMI', 'Reduce Tenure'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFormData({ ...formData, strategy: opt })}
                      className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                        formData.strategy === opt
                          ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400 scale-[1.01]'
                          : 'text-gray-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 font-bold px-1 leading-relaxed flex gap-2">
                  <Info size={12} className="text-blue-500 flex-shrink-0" />
                  {formData.strategy === 'Reduce EMI' 
                    ? 'Reduce EMI, same tenure.' 
                    : 'Keep EMI, reduce tenure.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 pb-8"
            >
              {/* Input Summary Card (Shifted Up Side) */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-50 dark:border-gray-800">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Your Input Details</h2>
                    <button onClick={() => setShowResults(false)} className="text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase flex items-center gap-1">
                        <Edit3 size={10} /> Edit
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-1">
                    <SummaryItem label="Loan Amount" value={formatCurrency(parseFormattedNumber(formData.loanAmount))} />
                    <SummaryItem label="Interest Rate" value={`${formData.interestRate}%`} />
                    <SummaryItem label="Tenure" value={`${formData.tenure} ${formData.isMonths ? 'Months' : 'Years'}`} />
                    <SummaryItem label="Prepayment" value={formatCurrency(parseFormattedNumber(formData.prepayAmount))} />
                    <SummaryItem label="Month Paid" value={`Month ${formData.prepayMonth}`} />
                    <SummaryItem label="Strategy" value={formData.strategy} />
                 </div>
              </div>

              {/* Main Results Card (Savings Analysis) */}
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-100/70 block mb-2">Total Net Benefit</span>
                  <h3 className="text-4xl font-black text-white tracking-tight">
                    {formatCurrency(results.netBenefit)}
                  </h3>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                    <TrendingUp size={12} /> Savings Analysis
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Interest Saved</span>
                      <span className="text-sm font-black text-emerald-600">{formatCurrency(results.interestSaved)}</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Penalty Paid</span>
                      <span className="text-sm font-black text-rose-500">{formatCurrency(results.penaltyAmount)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 px-1">
                    <SummaryItem label="Outstanding Balance" value={formatCurrency(results.outstandingBefore)} />
                    <SummaryItem label="Prepayment Made" value={formatCurrency(results.prepayAmount)} />
                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                    <SummaryItem label="Interest (Original)" value={formatCurrency(results.oldTotalInterest)} />
                    <SummaryItem label="Interest (Reduced)" value={formatCurrency(results.totalInterestAfter)} />
                  </div>

                  <div className="mt-4 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex justify-between items-center shadow-sm">
                    <div>
                      <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
                        {results.strategy === 'Reduce EMI' ? 'New Monthly EMI' : 'Remaining Tenure'}
                      </span>
                      <span className="text-lg font-black text-blue-900 dark:text-blue-100">
                        {results.strategy === 'Reduce EMI' ? formatCurrency(results.newEMI) : `${Math.ceil(results.reducedTenure)} Months`}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <TrendingUp size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4 sticky bottom-0 z-20">
        {!showResults ? (
          <>
            <button onClick={handleReset} className="btn-secondary flex-1">
              <RotateCcw size={18} /> Reset
            </button>
            <button onClick={handleCalculate} className="btn-primary flex-1 shadow-lg shadow-blue-500/20">
              Calculate Savings
            </button>
          </>
        ) : (
          <button onClick={() => setShowResults(false)} className="btn-primary w-full shadow-lg shadow-blue-500/20">
            <ArrowLeft size={18} /> Back
          </button>
        )}
      </footer>
    </div>
  );
};

export default SmartPrepayCalculator;
