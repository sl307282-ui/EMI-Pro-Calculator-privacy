import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight, PiggyBank } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';

const InputRow = ({ label, field, symbol, placeholder, isNumeric = true, toggleField, formData, setFormData }) => (
  <div className="flex items-center gap-3 mb-3.5">
    <label className="w-22 flex-shrink-0 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
      {label}
    </label>
    <div className="flex-grow flex gap-2">
      <div className="flex-grow relative">
        <input
          type={isNumeric ? 'text' : 'number'}
          inputMode={isNumeric ? 'decimal' : undefined}
          className="w-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-xl py-2.5 px-3.5 text-xs font-black text-gray-900 dark:text-white outline-none transition-all pr-10 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          placeholder={placeholder}
          value={isNumeric ? formatNumericInput(formData[field]) : formData[field]}
          onChange={(e) => {
            let val = isNumeric ? parseFormattedNumber(e.target.value) : e.target.value;
            if (isNumeric) {
              if (field === 'monthlyAmount' && val.replace(/[^0-9]/g, '').length > 9) return;
              if (field === 'interestRate' && val !== '' && parseFloat(val) > 100) return;
              if (field === 'period') {
                const maxVal = formData.isMonths ? 480 : 40;
                if (val !== '' && parseFloat(val) > maxVal) return;
              }
            }
            setFormData(prev => ({ ...prev, [field]: val }));
          }}
        />
        {symbol && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 dark:text-gray-505 uppercase">
            {symbol}
          </span>
        )}
      </div>
      {toggleField && (
        <div className="bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg flex w-20 flex-shrink-0 border border-transparent dark:border-gray-700">
          <button
            onClick={() => {
              setFormData(p => {
                const current = parseFloat(p[field]) || 0;
                const converted = p.isMonths ? Math.round(current / 12) : current;
                const capped = Math.min(converted, 40);
                return { ...p, isMonths: false, [field]: p[field] === '' ? '' : String(capped) };
              });
            }}
            className={`flex-1 py-1 rounded text-[9px] font-black transition-all ${!formData.isMonths ? 'bg-white dark:bg-gray-700 text-blue-605 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
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
            className={`flex-1 py-1 rounded text-[9px] font-black transition-all ${formData.isMonths ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
          >
            MO
          </button>
        </div>
      )}
    </div>
  </div>
);

const RDCalculator = ({ onBack }) => {
  const [formData, setFormData] = useState({
    monthlyAmount: '5000',
    interestRate: '7.5',
    period: '5',
    isMonths: false
  });

  const [results, setResults] = useState(null);

  const calculateRD = () => {
    const R = parseFloat(formData.monthlyAmount);
    const annualRate = parseFloat(formData.interestRate);
    const n = formData.isMonths ? parseInt(formData.period) : parseInt(formData.period) * 12;
    
    if (isNaN(R) || isNaN(annualRate) || isNaN(n) || n <= 0) return;

    // Quarterly compounding formula: M = R * [(1+i)^n - 1] / (1 - (1+i)^(-1/3))
    // where i = quarterly interest rate = r / 400
    const i = annualRate / 400;
    const maturityAmount = R * (Math.pow(1 + i, n) - 1) / (1 - Math.pow(1 + i, -1/3));
    
    const totalInvestment = R * n;
    const totalInterest = maturityAmount - totalInvestment;

    setResults({
      maturityAmount,
      totalInvestment,
      totalInterest,
      chartData: [
        { name: 'Investment', value: totalInvestment, color: '#2563EB' },
        { name: 'Interest', value: totalInterest, color: '#10B981' }
      ]
    });
  };


  const handleReset = () => {
    setFormData({
      monthlyAmount: '',
      interestRate: '',
      period: '',
      isMonths: false
    });
    setResults(null);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `RD Calculation Details:\n\n` +
                 `Monthly Deposit: ${formatCurrency(formData.monthlyAmount)}\n` +
                 `Interest Rate: ${formData.interestRate}%\n` +
                 `Period: ${formData.period} ${formData.isMonths ? 'Months' : 'Years'}\n` +
                 `Maturity Amount: ${formatCurrency(results.maturityAmount)}\n` +
                 `Total Investment: ${formatCurrency(results.totalInvestment)}\n` +
                 `Total Interest: ${formatCurrency(results.totalInterest)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('RD Calculation', text);
  };



  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden h-full relative">
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-805 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-205 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-white animate-fade-in">RD Calculator</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-200 active:scale-90 transition-transform">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl p-4.5 shadow-inner border border-white/50 dark:border-gray-800/50 mb-6 transition-colors duration-300">
          <InputRow label="Monthly Amount" field="monthlyAmount" symbol="₹" formData={formData} setFormData={setFormData} />
          <InputRow label="Interest %" field="interestRate" symbol="%" placeholder="max: 30%" formData={formData} setFormData={setFormData} />
          <InputRow label="Period" field="period" toggleField="isMonths" formData={formData} setFormData={setFormData} />
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={handleReset} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={calculateRD} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2">
            Calculate <ArrowRight size={16} />
          </button>
        </div>

        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
            <div className="text-center bg-blue-600 dark:bg-blue-700 rounded-[2.5rem] py-8 px-6 shadow-xl dark:shadow-none relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <PiggyBank size={120} className="absolute -right-8 -bottom-8 rotate-12 text-white" />
              </div>
              <p className="text-blue-205 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Maturity Amount</p>
              <h2 className="text-3xl font-black text-white">{formatCurrency(results.maturityAmount)}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center bg-white dark:bg-gray-805 border-2 border-gray-50 dark:border-gray-800 rounded-[2.5rem] p-6 transition-colors duration-300">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total Investment</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(results.totalInvestment)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total Interest</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(results.totalInterest)}</p>
                </div>
              </div>
              
              <div className="h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={results.chartData}
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {results.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase">Interest</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-450">
                    {((results.totalInterest / results.maturityAmount) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
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
  );
};

export default RDCalculator;
