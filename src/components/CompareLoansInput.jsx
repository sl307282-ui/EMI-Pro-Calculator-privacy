import React, { useState } from 'react';
import { ChevronLeft, RotateCcw, ArrowRightLeft, Plus, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateEMI, formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';

const defaultLoan = () => ({ amount: '', interest: '', period: '' });

const InputField = ({ label, placeholder, value, onChange, id }) => (
  <div className="flex-1">
    <input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={formatNumericInput(value)}
      onChange={(e) => onChange(parseFormattedNumber(e.target.value))}
      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 shadow-sm transition-colors duration-300"
    />
  </div>
);

const IconDivider = ({ targetId }) => (
  <div 
    className="flex items-center justify-center px-1 cursor-pointer active:scale-95 transition-transform"
    onClick={() => document.getElementById(targetId)?.focus()}
  >
    <div className="p-1 bg-blue-50 dark:bg-gray-800 rounded-md border border-blue-200 dark:border-gray-700 transition-colors duration-300">
      <ChevronsRight size={14} className="text-blue-500 dark:text-blue-400" />
    </div>
  </div>
);

const CompareLoansInput = ({ onBack, onCompare, onDetails }) => {
  const [loans, setLoans] = useState([defaultLoan(), defaultLoan()]);

  const updateLoan = (idx, field, value) => {
    let val = value;
    if (field === 'interest') {
      if (val !== '' && parseFloat(val) > 100) return;
    }
    if (field === 'period') {
      if (val !== '' && parseFloat(val) > 960) return;
    }
    setLoans(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const [results, setResults] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleCalculate = () => {
    const filled = loans.every(l => l.amount && l.interest && l.period);
    if (!filled) return;

    const calculatedResults = loans.map((l, i) => {
      const amount = parseFloat(l.amount);
      const interest = parseFloat(l.interest);
      const period = parseInt(l.period);
      const emi = calculateEMI(amount, interest, period, true);
      const totalPayment = emi * period;
      const totalInterest = totalPayment - amount;
      return {
        ...l,
        label: `Loan ${i + 1}`,
        emi,
        totalPayment,
        totalInterest,
      };
    });

    setResults(calculatedResults);
    setIsCalculated(true);
  };

  const handleReset = () => {
    setLoans([defaultLoan(), defaultLoan()]);
    setIsCalculated(false);
    setResults(null);
  };

  const allFilled = loans.every(l => l.amount && l.interest && l.period);

  return (
    <div className="flex-1 flex flex-col bg-[#F0F9FF] dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center justify-between bg-transparent sticky top-0 z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-800 dark:text-gray-200 border border-transparent dark:border-gray-700 transition-all"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">Compare Loans</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onCompare(results || [])}
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-800 dark:text-gray-200 border border-transparent dark:border-gray-700 transition-all"
        >
          <Plus size={24} />
        </motion.button>
      </header>

      {/* Input Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
        <div className="flex justify-between px-4 mb-6">
          <span className="text-sm font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Loan 1</span>
          <span className="text-sm font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Loan 2</span>
        </div>

        <div className="space-y-4 mb-8">
          {/* Amount Row */}
          <div className="flex items-center gap-2">
            <InputField
              id="amount-0"
              placeholder="Loan Amount 1"
              value={loans[0].amount}
              onChange={val => updateLoan(0, 'amount', val)}
            />
            <IconDivider targetId="amount-1" />
            <InputField
              id="amount-1"
              placeholder="Loan Amount 2"
              value={loans[1].amount}
              onChange={val => updateLoan(1, 'amount', val)}
            />
          </div>

          {/* Interest Row */}
          <div className="flex items-center gap-2">
            <InputField
              id="interest-0"
              placeholder="Interest %"
              value={loans[0].interest}
              onChange={val => updateLoan(0, 'interest', val)}
            />
            <IconDivider targetId="interest-1" />
            <InputField
              id="interest-1"
              placeholder="Interest %"
              value={loans[1].interest}
              onChange={val => updateLoan(1, 'interest', val)}
            />
          </div>

          {/* Period Row */}
          <div className="flex items-center gap-2">
            <InputField
              id="period-0"
              placeholder="Months"
              value={loans[0].period}
              onChange={val => updateLoan(0, 'period', val)}
            />
            <IconDivider targetId="period-1" />
            <InputField
              id="period-1"
              placeholder="Months"
              value={loans[1].period}
              onChange={val => updateLoan(1, 'period', val)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleReset} 
            className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-3.5 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </motion.button>
          <motion.button
            whileTap={allFilled ? { scale: 0.95 } : {}}
            onClick={handleCalculate}
            disabled={!allFilled}
            className={`flex-1 py-3.5 rounded-2xl font-bold shadow-sm transition-all ${
              allFilled ? 'bg-[#3282B8] text-white' : 'bg-blue-200 dark:bg-blue-900/30 text-blue-50 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            Calculate
          </motion.button>
        </div>

        {/* Results Summary Table (As per Image) */}
        <AnimatePresence>
          {isCalculated && results && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-300">
                {[
                  { label: 'Monthly EMI', key: 'emi' },
                  { label: 'Total Interest', key: 'totalInterest' },
                  { label: 'Total Payment', key: 'totalPayment' }
                ].map((row, idx) => {
                  const diff = Math.abs(results[0][row.key] - results[1][row.key]);
                  return (
                    <div key={row.key} className={`p-4 ${idx !== 2 ? 'border-b border-gray-50 dark:border-gray-750' : ''}`}>
                      <div className="flex justify-between items-center px-4">
                        <span className="text-base font-bold text-gray-800 dark:text-white">{Math.round(results[0][row.key]).toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{row.label}</span>
                        <span className="text-base font-bold text-gray-800 dark:text-white">{Math.round(results[1][row.key]).toLocaleString()}</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-[11px] font-bold text-red-500 dark:text-red-400 animate-pulse">
                          Difference: {Math.round(diff).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compare More Button */}
              <div className="flex justify-center pb-8">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCompare(results)}
                  className="bg-[#3282B8] text-white px-10 py-3.5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  Compare more
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CompareLoansInput;
