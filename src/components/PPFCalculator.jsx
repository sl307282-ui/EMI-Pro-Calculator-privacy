import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BottomSheetSelector from './BottomSheetSelector';

const InputRow = ({ label, field, symbol, placeholder, isNumeric = true, onClick, formData, setFormData }) => (
  <div className="flex items-center gap-3 mb-3.5">
    <label className="w-28 flex-shrink-0 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
      {label}
    </label>
    <div className="flex-grow relative">
      <input
        readOnly={!!onClick}
        onClick={onClick}
        type={isNumeric ? 'text' : 'text'}
        inputMode={isNumeric && !onClick ? 'decimal' : undefined}
        className={`w-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-xl py-2.5 px-3.5 text-xs font-black text-gray-900 dark:text-white outline-none transition-all pr-10 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${onClick ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-700' : ''}`}
        placeholder={placeholder}
        value={isNumeric ? formatNumericInput(formData[field]) : formData[field]}
        onChange={(e) => {
          if (onClick) return;
          const val = isNumeric ? parseFormattedNumber(e.target.value) : e.target.value;
          if (isNumeric) {
            if (field === 'amount' && val.replace(/[^0-9]/g, '').length > 9) return;
            if (field === 'interestRate' && val !== '' && parseFloat(val) > 100) return;
            if (field === 'period' && val !== '' && parseFloat(val) > 40) return;
          }
          setFormData(prev => ({ ...prev, [field]: val }));
        }}
      />
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
        {onClick && <ChevronDown size={14} className="text-gray-450" />}
        {symbol && (
          <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">
            {symbol}
          </span>
        )}
      </div>
    </div>
  </div>
);

const PPFCalculator = ({ onBack }) => {
  const [formData, setFormData] = useState({
    frequency: 'Yearly',
    amount: '150000',
    interestRate: '7.1',
    period: '15'
  });

  const [isFreqSelectorOpen, setIsFreqSelectorOpen] = useState(false);
  const [results, setResults] = useState(null);

  const frequencies = [
    { label: 'Yearly', value: 'Yearly' },
    { label: 'Half Yearly', value: 'Half Yearly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Monthly', value: 'Monthly' }
  ];

  const calculatePPF = () => {
    const P = parseFloat(formData.amount);
    const r = parseFloat(formData.interestRate) / 100;
    const n = parseInt(formData.period);
    const freq = formData.frequency;

    if (isNaN(P) || isNaN(r) || isNaN(n) || n <= 0) return;

    let balance = 0;
    let totalInvestment = 0;
    let totalInterest = 0;

    // Monthly frequency map
    const frequencyMonths = {
      'Yearly': 12,
      'Half Yearly': 6,
      'Quarterly': 3,
      'Monthly': 1
    };
    const monthsPerDeposit = frequencyMonths[freq];

    for (let year = 1; year <= n; year++) {
      let yearlyInterest = 0;
      let monthlyBalances = [];

      for (let month = 1; month <= 12; month++) {
        // Add deposit if it's the correct month for the frequency
        if ((month - 1) % monthsPerDeposit === 0) {
          balance += P;
          totalInvestment += P;
        }
        
        // PPF interest is calculated on the minimum balance between 5th and end of month
        // We assume deposit is made before 5th for maximum interest
        monthlyBalances.push(balance);
      }

      // PPF interest is credited annually: (sum of monthly balances * r) / 12
      yearlyInterest = (monthlyBalances.reduce((a, b) => a + b, 0) * r) / 12;
      balance += yearlyInterest;
      totalInterest += yearlyInterest;
    }

    setResults({
      maturityAmount: balance,
      totalInvestment,
      totalInterest
    });
  };


  const handleReset = () => {
    setFormData({
      frequency: 'Yearly',
      amount: '',
      interestRate: '',
      period: ''
    });
    setResults(null);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `PPF Calculation Details:\n\n` +
                 `Frequency: ${formData.frequency}\n` +
                 `Investment Amount: ${formatCurrency(formData.amount)}\n` +
                 `Interest Rate: ${formData.interestRate}%\n` +
                 `Period: ${formData.period} Years\n` +
                 `Maturity Amount: ${formatCurrency(results.maturityAmount)}\n` +
                 `Total Investment: ${formatCurrency(results.totalInvestment)}\n` +
                 `Total Interest: ${formatCurrency(results.totalInterest)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('PPF Calculation', text);
  };



  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden h-full relative">
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-805 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-25 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-white animate-fade-in">PPF Calculator</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-200 active:scale-90 transition-transform">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl p-4.5 shadow-inner border border-white/50 dark:border-gray-800/50 mb-6 transition-colors duration-300">
          <InputRow label="Frequency" field="frequency" onClick={() => setIsFreqSelectorOpen(true)} isNumeric={false} formData={formData} setFormData={setFormData} />
          <InputRow label="Invest Amt" field="amount" symbol="₹" formData={formData} setFormData={setFormData} />
          <InputRow label="Interest %" field="interestRate" symbol="%" formData={formData} setFormData={setFormData} />
          <InputRow label="Period" field="period" symbol="Yr" formData={formData} setFormData={setFormData} />
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={handleReset} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={calculatePPF} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2">
            Calculate <ArrowRight size={16} />
          </button>
        </div>

        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
            <div className="text-center bg-gray-800 dark:bg-gray-805 rounded-[2.5rem] py-8 px-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <ShieldCheck size={120} className="absolute -right-8 -bottom-8 rotate-12 text-white" />
              </div>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Maturity Amount</p>
              <h2 className="text-3xl font-black text-white">{formatCurrency(results.maturityAmount)}</h2>
            </div>

            <div className="bg-white dark:bg-gray-805 border-2 border-gray-50 dark:border-gray-800 rounded-[2rem] overflow-hidden transition-colors duration-300">
              <table className="w-full">
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  <tr className="flex justify-between p-5">
                    <td className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Total Investment</td>
                    <td className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(results.totalInvestment)}</td>
                  </tr>
                  <tr className="flex justify-between p-5">
                    <td className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Total Interest</td>
                    <td className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(results.totalInterest)}</td>
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

      <BottomSheetSelector 
        isOpen={isFreqSelectorOpen}
        onClose={() => setIsFreqSelectorOpen(false)}
        title="Select Frequency"
        options={frequencies}
        selectedValue={formData.frequency}
        onSelect={(val) => setFormData(p => ({ ...p, frequency: val }))}
      />
    </div>
  );
};

export default PPFCalculator;
