import React, { useState } from 'react';
import { ChevronLeft, Share2, RefreshCcw, Calculator, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';

const InputRow = ({ label, field, placeholder, symbol, min, max, value, onChange, isNumeric = true }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex-1">{label}</label>
    <div className="relative flex items-center flex-[1.5]">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={isNumeric ? formatNumericInput(value) : value}
        onChange={(e) => onChange(field, isNumeric ? parseFormattedNumber(e.target.value) : e.target.value)}
        className="w-full bg-white dark:bg-gray-805 border-none rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right pr-10"
      />
      <span className="absolute right-4 text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">{symbol}</span>
    </div>
  </div>
);

const LoanEligibility = ({ onBack }) => {
  const [formData, setFormData] = useState({
    income: '',
    foir: '35',
    monthlyEmis: '',
    interest: '',
    period: '',
    isMonths: false
  });
  const [results, setResults] = useState(null);

  const handleInputChange = (field, value) => {
    let val = value;
    if (field === 'income' || field === 'monthlyEmis') {
      if (val.length > 9) return;
    }
    if (field === 'foir') {
      if (val !== '' && parseFloat(val) > 100) return;
    }
    if (field === 'interest') {
      if (val !== '' && parseFloat(val) > 50) return;
    }
    if (field === 'period') {
      const max = formData.isMonths ? 960 : 80;
      if (val !== '' && parseFloat(val) > max) return;
    }
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    setFormData({
      income: '',
      foir: '35',
      monthlyEmis: '',
      interest: '',
      period: '',
      isMonths: false
    });
    setResults(null);
  };

  const handleCalculate = () => {
    const income = parseFloat(formData.income) || 0;
    const foir = parseFloat(formData.foir) || 35;
    const monthlyEmis = parseFloat(formData.monthlyEmis) || 0;
    const interest = parseFloat(formData.interest) || 0;
    const period = parseFloat(formData.period) || 0;

    if (!income || !interest || !period) return;

    const maxAllowedEmi = income * (foir / 100);
    const eligibleEmi = Math.max(0, maxAllowedEmi - monthlyEmis);

    const r = (interest / 12) / 100;
    const n = formData.isMonths ? period : period * 12;

    let eligibleLoanAmount = 0;
    if (eligibleEmi > 0 && r > 0 && n > 0) {
      eligibleLoanAmount = eligibleEmi * ((1 - Math.pow(1 + r, -n)) / r);
    }

    setResults({
      eligibleEmi,
      eligibleLoanAmount
    });
  };

  const handleShare = () => {
    if (!results) return;
    const text = `Loan Eligibility Details:\n\n` +
                 `Gross Monthly Income: ${formatCurrency(parseFormattedNumber(formData.income))}\n` +
                 `Eligible Monthly EMI: ${formatCurrency(results.eligibleEmi)}\n` +
                 `Eligible Loan Amount: ${formatCurrency(results.eligibleLoanAmount)}\n` +
                 `Interest Rate: ${formData.interest}%\n` +
                 `Tenure: ${formData.period} ${formData.isMonths ? 'Months' : 'Years'}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Loan Eligibility', text);
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-300 overflow-hidden h-full">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center bg-transparent sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-200 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="ml-4 text-xl font-bold text-gray-900 dark:text-white animate-fade-in">Loan Eligible Calculator</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
        {/* Form Container */}
        <div className="bg-white/40 dark:bg-gray-800/20 backdrop-blur-sm rounded-3xl p-2 mb-8 shadow-inner border border-white/50 dark:border-gray-800 transition-colors duration-300">
          <div className="p-4">
            <InputRow label="Gross Monthly Income" field="income" placeholder="e.g. 50,000" symbol="₹" value={formData.income} onChange={handleInputChange} />
            <InputRow label="FOIR (Max. % Of Salary)" field="foir" placeholder="35" symbol="%" value={formData.foir} onChange={handleInputChange} />
            <InputRow label="Total Monthly EMI's" field="monthlyEmis" placeholder="e.g. 5,000" symbol="₹" value={formData.monthlyEmis} onChange={handleInputChange} />
            <InputRow label="Interest %" field="interest" placeholder="e.g. 8.5" symbol="%" value={formData.interest} onChange={handleInputChange} />
            
            {/* Period Input with Toggle */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-20 flex-shrink-0">Period</label>
              <div className="flex-grow flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 20"
                    value={formatNumericInput(formData.period)}
                    onChange={(e) => handleInputChange('period', parseFormattedNumber(e.target.value))}
                    className="w-full bg-white dark:bg-gray-855 border-none rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right pr-4"
                  />
                </div>
                <div className="bg-white dark:bg-gray-805 p-1 rounded-xl shadow-sm flex border border-transparent dark:border-gray-700">
                  <button 
                    onClick={() => {
                      if (formData.isMonths) {
                        const currentPeriod = parseFloat(formData.period) || 0;
                        setFormData(p => ({
                          ...p, 
                          isMonths: false, 
                          period: String(Math.round(currentPeriod / 12))
                        }));
                      }
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${!formData.isMonths ? 'bg-primary dark:bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400'}`}
                  >Yrs</button>
                  <button 
                    onClick={() => {
                      if (!formData.isMonths) {
                        const currentPeriod = parseFloat(formData.period) || 0;
                        setFormData(p => ({
                          ...p, 
                          isMonths: true, 
                          period: String(currentPeriod * 12)
                        }));
                      }
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${formData.isMonths ? 'bg-primary dark:bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400'}`}
                  >Mos</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-10">
          <button 
            onClick={handleReset}
            className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-4 px-6 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} /> Reset
          </button>
          <button 
            onClick={handleCalculate}
            className="flex-[2] btn-primary"
          >
            <Calculator size={18} /> Calculate
          </button>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {results && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-soft transition-colors duration-300">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-50 dark:border-gray-850">
                      <td className="px-6 py-6 text-sm font-medium text-gray-500 dark:text-gray-400">Eligible EMI</td>
                      <td className="px-6 py-6 text-lg font-black text-gray-900 dark:text-white text-right">{formatCurrency(results.eligibleEmi)}</td>
                    </tr>
                    <tr className="bg-blue-50/20 dark:bg-blue-900/10">
                      <td className="px-6 py-6 text-sm font-medium text-gray-500 dark:text-gray-400">Eligible Loan Amount</td>
                      <td className="px-6 py-6 text-xl font-black text-primary dark:text-blue-400 text-right">{formatCurrency(results.eligibleLoanAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button 
                onClick={handleShare}
                className="w-full btn-primary py-4 rounded-2xl font-bold shadow-premium flex items-center justify-center gap-2"
              >
                <Share2 size={18} /> Share Results
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoanEligibility;
