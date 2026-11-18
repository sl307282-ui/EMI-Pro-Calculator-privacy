import React, { useState } from 'react';
import { ChevronLeft, Share2, RefreshCcw, Calculator, Wallet, Landmark, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLoanAmount, formatCurrency, formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const InputRow = ({ label, field, placeholder, symbol, value, onChange }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 flex-1 leading-[1.3]">{label}</label>
    <div className="relative flex items-center flex-[1.5]">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={formatNumericInput(value)}
        onChange={(e) => onChange(field, parseFormattedNumber(e.target.value))}
        className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3.5 shadow-sm text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right pr-10"
      />
      <span className="absolute right-4 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">{symbol}</span>
    </div>
  </div>
);

const LoanAffordability = ({ onBack }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [formData, setFormData] = useState({
    downPayment: '',
    grossIncome: '',
    interest: '',
    period: '',
    otherEmis: ''
  });
  const [results, setResults] = useState(null);

  const handleInputChange = (field, value) => {
    let val = value;
    if (field === 'downPayment' || field === 'grossIncome' || field === 'otherEmis') {
      if (val.length > 9) return;
    }
    if (field === 'interest') {
      if (val !== '' && parseFloat(val) > 50) return;
    }
    if (field === 'period') {
      if (val !== '' && parseFloat(val) > 80) return;
    }
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleReset = () => {
    setFormData({
      downPayment: '',
      grossIncome: '',
      interest: '',
      period: '',
      otherEmis: ''
    });
    setResults(null);
  };

  const handleCalculate = () => {
    const downPayment = parseFloat(parseFormattedNumber(formData.downPayment)) || 0;
    const grossIncome = parseFloat(parseFormattedNumber(formData.grossIncome)) || 0;
    const interest = parseFloat(parseFormattedNumber(formData.interest)) || 0;
    const period = parseFloat(parseFormattedNumber(formData.period)) || 0;
    const otherEmis = parseFloat(parseFormattedNumber(formData.otherEmis)) || 0;

    if (!grossIncome || !interest || !period) {
        return;
    }

    const foir = 0.45;
    const allowedEmi = grossIncome * foir;
    const availableEmi = allowedEmi - otherEmis;

    let eligibleLoanAmount = 0;
    if (availableEmi > 0) {
        eligibleLoanAmount = calculateLoanAmount(availableEmi, interest, period, false);
    }

    const propertyCost = eligibleLoanAmount + downPayment;

    setResults({
      eligibleLoanAmount,
      propertyCost
    });
  };

  const handleShare = () => {
    if (!results) return;
    const text = `Loan Affordability Details:\n\n` +
                 `Gross Monthly Income: ${formatCurrency(parseFormattedNumber(formData.grossIncome))}\n` +
                 `Eligible Loan Amount: ${formatCurrency(results.eligibleLoanAmount)}\n` +
                 `Property Cost Affordability: ${formatCurrency(results.propertyCost)}\n` +
                 `Down Payment: ${formatCurrency(parseFormattedNumber(formData.downPayment))}\n` +
                 `Interest Rate: ${formData.interest}%\n` +
                 `Tenure: ${formData.period} Years\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Loan Affordability', text);
  };

  const inputFields = [
    { label: 'Down Payment', key: 'downPayment', placeholder: 'e.g. 5,00,000', symbol: '₹' },
    { label: 'Gross Income (Monthly)', key: 'grossIncome', placeholder: 'e.g. 1,00,000', symbol: '₹' },
    { label: 'Interest %', key: 'interest', placeholder: 'e.g. 8.5', symbol: '%' },
    { label: 'Period (Years)', key: 'period', placeholder: 'e.g. 20', symbol: 'Yr' },
    { label: 'Other EMIs (Monthly)', key: 'otherEmis', placeholder: 'e.g. 10,000', symbol: '₹' },
  ];

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
          title="Loan Affordability"
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

        <div className="px-6 py-6">
        {/* Input Form */}
        <div className="space-y-5 mb-8">
          {inputFields.map((field) => (
            <InputRow 
              key={field.key}
              label={field.label}
              field={field.key}
              placeholder={field.placeholder}
              symbol={field.symbol}
              value={formData[field.key]}
              onChange={handleInputChange}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-10">
          <button 
            type="button"
            onClick={handleReset}
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-4 px-6 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} className="pointer-events-none" /> Reset
          </button>
          <button 
            type="button"
            onClick={handleCalculate}
            className="flex-[2] btn-primary flex items-center justify-center gap-2"
          >
            <Calculator size={18} className="pointer-events-none" /> Calculate
          </button>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {results && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Main Highlight Card - Maximum Property Budget */}
              <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-100 dark:shadow-none relative overflow-hidden">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-blue-200" />
                  Maximum Property Budget
                </p>
                <h2 className="text-3xl font-black mb-1">{formatCurrency(results.propertyCost)}</h2>
                <p className="text-blue-200 text-xs font-medium">Affordable property cost based on your inputs</p>
                <div className="absolute -right-6 -bottom-6 opacity-15">
                  <Landmark size={120} className="rotate-12 pointer-events-none text-white" />
                </div>
              </div>

              {/* Breakdown Rows */}
              <div className="bg-white dark:bg-gray-800/40 border-2 border-gray-50 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="flex justify-between items-center p-5 border-b border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Wallet size={16} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Eligible Loan Amount</span>
                  </div>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400">{formatCurrency(results.eligibleLoanAmount)}</span>
                </div>

                <div className="flex justify-between items-center p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Landmark size={16} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-wider">Down Payment Contribution</span>
                  </div>
                  <span className="text-base font-black text-gray-900 dark:text-white">{formatCurrency(parseFloat(parseFormattedNumber(formData.downPayment)) || 0)}</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleShare}
                className="w-full btn-primary bg-primary text-white py-4 rounded-full font-bold shadow-premium flex items-center justify-center gap-2"
              >
                <Share2 size={18} className="pointer-events-none" /> Share Results
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoanAffordability;
