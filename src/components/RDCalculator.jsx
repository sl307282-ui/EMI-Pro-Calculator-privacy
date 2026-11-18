import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight, PiggyBank } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const InputRow = ({ label, field, symbol, placeholder, isNumeric = true, toggleField, formData, setFormData }) => (
  <div className="flex items-center gap-3 mb-3.5">
    <label className="w-24 flex-shrink-0 text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] text-left">
      {label}
    </label>
    <div className="flex-grow flex gap-2">
      <div className="flex-grow relative">
        <input
          type={isNumeric ? 'text' : 'number'}
          inputMode={isNumeric ? 'decimal' : undefined}
          className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl py-3 px-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-all pr-10 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">
            {symbol}
          </span>
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

const RDCalculator = ({ onBack }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
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
          title="RD Calculator"
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
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-4.5 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
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

            <div className="grid grid-cols-2 gap-4 items-center bg-white dark:bg-gray-805 border-2 border-gray-50 dark:border-gray-800 rounded-[2.5rem] p-6">
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
      </div>
    );
  };

export default RDCalculator;
