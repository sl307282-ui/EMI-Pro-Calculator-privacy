import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight, Landmark, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BottomSheetSelector from './BottomSheetSelector';

const InputRow = ({ label, field, symbol, placeholder, isNumeric = true, onClick, toggleField, formData, setFormData, children }) => (
  <div className="flex items-center gap-3 mb-3.5">
    <label className="w-22 flex-shrink-0 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
      {label}
    </label>
    <div className="flex-grow flex gap-2">
      <div className="flex-grow relative">
        {children ? children : (
          <>
            <input
              readOnly={!!onClick}
              onClick={onClick}
              type={isNumeric ? 'text' : 'text'}
              inputMode={isNumeric && !onClick ? 'decimal' : undefined}
              className={`w-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-xl py-2.5 px-3.5 text-xs font-black text-gray-900 dark:text-white outline-none transition-all pr-10 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${onClick ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-700' : ''}`}
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
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">
                  {symbol}
                </span>
              )}
            </div>
          </>
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
            className={`flex-1 py-1 rounded text-[9px] font-black transition-all ${!formData.isMonths ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
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

const FDCalculator = ({ onBack }) => {
  const [formData, setFormData] = useState({
    amount: '100000',
    interestRate: '7.5',
    period: '1',
    isMonths: false,
    depositType: 'Reinvestment/Cumulative'
  });

  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [results, setResults] = useState(null);

  const depositTypes = [
    { label: 'Reinvestment/Cumulative', value: 'Reinvestment/Cumulative' },
    { label: 'Quarterly Payout', value: 'Quarterly Payout' },
    { label: 'Monthly Payout', value: 'Monthly Payout' },
    { label: 'Short Term', value: 'Short Term' }
  ];

  const calculateFD = () => {
    const P = parseFloat(formData.amount);
    const R = parseFloat(formData.interestRate);
    const periodVal = parseFloat(formData.period) || 0;
    
    const T_in_years = formData.isMonths ? (periodVal / 12) : periodVal;
    const totalDays = Math.round(T_in_years * 365);

    if (isNaN(P) || isNaN(R) || T_in_years <= 0) return;

    let maturityAmount = 0;
    let totalInterest = 0;

    switch (formData.depositType) {
      case 'Reinvestment/Cumulative':
        // Compounded quarterly: A = P * (1 + (R/400))^(4 * T)
        maturityAmount = P * Math.pow(1 + (R / 400), 4 * T_in_years);
        totalInterest = maturityAmount - P;
        break;
      
      case 'Quarterly Payout':
      case 'Monthly Payout':
        // Simple Interest (paid out): Interest = P * (R/100) * T
        totalInterest = P * (R / 100) * T_in_years;
        maturityAmount = P; // Principal is returned as is
        break;

      case 'Short Term':
        // Simple interest on days basis: (P * R * Days) / 36500
        totalInterest = (P * R * totalDays) / 36500;
        maturityAmount = P + totalInterest;
        break;

      default:
        break;
    }

    setResults({
      maturityAmount,
      totalInvestment: P,
      totalInterest,
      chartData: [
        { name: 'Investment', value: P, color: '#F97316' },
        { name: 'Interest', value: totalInterest, color: '#22C55E' }
      ]
    });
  };


  const handleReset = () => {
    setFormData({
      amount: '',
      interestRate: '',
      period: '',
      isMonths: false,
      depositType: 'Reinvestment/Cumulative'
    });
    setResults(null);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `FD Calculation Details:\n\n` +
                 `Type: ${formData.depositType}\n` +
                 `Principal: ${formatCurrency(formData.amount)}\n` +
                 `Interest Rate: ${formData.interestRate}%\n` +
                 `Maturity Amount: ${formatCurrency(results.maturityAmount)}\n` +
                 `Total Interest: ${formatCurrency(results.totalInterest)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('FD Calculation', text);
  };



  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden h-full relative">
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-805 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-205 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-white animate-fade-in">FD Calculator</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-200 active:scale-90 transition-transform">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl p-4.5 shadow-inner border border-white/50 dark:border-gray-800/50 mb-6 transition-colors duration-300">
          <InputRow label="Amount" field="amount" symbol="₹" formData={formData} setFormData={setFormData} />
          <InputRow label="Interest %" field="interestRate" symbol="%" placeholder="(max: 50%)" formData={formData} setFormData={setFormData} />
          <InputRow label="Period" field="period" toggleField="isMonths" formData={formData} setFormData={setFormData} />
          <InputRow label="Deposit Type" field="depositType" onClick={() => setIsTypeSelectorOpen(true)} isNumeric={false} formData={formData} setFormData={setFormData} />
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={handleReset} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={calculateFD} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2">
            Calculate <ArrowRight size={16} />
          </button>
        </div>

        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
            <div className="bg-white dark:bg-gray-805 border-2 border-gray-50 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-sm transition-colors duration-300">
              <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 text-center">Maturity Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 items-center mb-8">
                <div className="h-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={results.chartData}
                        innerRadius={40}
                        outerRadius={60}
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

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Investment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Interest</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-850 border-2 border-gray-50 dark:border-gray-800 rounded-[2rem] overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-805">
                    <tr className="flex justify-between p-5">
                      <td className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Total Investment</td>
                      <td className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(results.totalInvestment)}</td>
                    </tr>
                    <tr className="flex justify-between p-5">
                      <td className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Total Interest</td>
                      <td className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(results.totalInterest)}</td>
                    </tr>
                    <tr className="flex justify-between p-5 bg-blue-50/30 dark:bg-blue-950/20">
                      <td className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase">Maturity Amount</td>
                      <td className="text-base font-black text-blue-700 dark:text-blue-300">{formatCurrency(results.maturityAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button 
              onClick={handleShare}
              className="w-full py-5 bg-blue-600 dark:bg-blue-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 transition-all"
            >
              <Share2 size={16} /> Share Result
            </button>
          </motion.div>
        )}
      </div>

      <BottomSheetSelector 
        isOpen={isTypeSelectorOpen}
        onClose={() => setIsTypeSelectorOpen(false)}
        title="Select Deposit Type"
        options={depositTypes}
        selectedValue={formData.depositType}
        onSelect={(val) => setFormData(p => ({ ...p, depositType: val }))}
      />
    </div>
  );
};

export default FDCalculator;
