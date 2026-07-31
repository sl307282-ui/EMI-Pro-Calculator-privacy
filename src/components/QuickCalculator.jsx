import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Info } from 'lucide-react';
import { shareAsText } from '../utils/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Text } from 'recharts';
import { 
  calculateEMI, 
  calculateLoanAmount, 
  calculateTenure, 
  calculateInterestRate, 
  formatCurrency, 
  numberToWords,
  formatNumericInput,
  parseFormattedNumber,
  t
} from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';

const QuickCalculator = ({ onBack, onDetails }) => {
  const { theme, currency: currentCurrency, language } = useSettings();
  const [activeToggle, setActiveToggle] = useState('EMI');
  const touchStartY = React.useRef(0);
  const [inputs, setInputs] = useState({
    amount: 1000000,
    interest: 8.5,
    period: 20,
    emi: 10000,
    isMonths: false
  });
  const [calculatedValue, setCalculatedValue] = useState(0);

  const toggles = ['EMI', 'Amount', 'Period', 'Interest'];

  useEffect(() => {
    let result = 0;
    switch (activeToggle) {
      case 'EMI':
        result = calculateEMI(parseFloat(inputs.amount), parseFloat(inputs.interest), parseFloat(inputs.period), inputs.isMonths);
        break;
      case 'Amount':
        result = calculateLoanAmount(parseFloat(inputs.emi), parseFloat(inputs.interest), parseFloat(inputs.period), inputs.isMonths);
        break;
      case 'Period':
        result = calculateTenure(parseFloat(inputs.amount), parseFloat(inputs.interest), parseFloat(inputs.emi), inputs.isMonths);
        break;
      case 'Interest':
        result = calculateInterestRate(parseFloat(inputs.amount), parseFloat(inputs.period), parseFloat(inputs.emi), inputs.isMonths);
        break;
      default:
        break;
    }
    setCalculatedValue(result);
  }, [activeToggle, inputs]);

  const handleShare = () => {
    const text = `Quick Loan Calculation:\n\n` +
                 `Type: ${activeToggle}\n` +
                 `Result: ${getFormattedResult()}\n\n` +
                 `Details:\n` +
                 `${activeToggle !== 'Amount' ? 'Loan Amount: ' + formatCurrency(inputs.amount, currentCurrency) + '\n' : ''}` +
                 `${activeToggle !== 'Interest' ? 'Interest Rate: ' + inputs.interest + '%\n' : ''}` +
                 `${activeToggle !== 'Period' ? 'Tenure: ' + inputs.period + (inputs.isMonths ? ' Months' : ' Years') + '\n' : ''}` +
                 `${activeToggle !== 'EMI' ? 'Monthly EMI: ' + formatCurrency(inputs.emi, currentCurrency) + '\n' : ''}` +
                 `\nShared via EMI Pro App`;
    shareAsText('Quick Loan Calculation', text);
  };

  const handleInputChange = (key, value) => {
    let val = value;
    if (key === 'amount') {
      if (parseFloat(val) > 20000000) return;
    }
    if (key === 'amount' || key === 'emi') {
      if (String(val).length > 9) return;
    }
    if (key === 'interest') {
      if (parseFloat(val) > 50) return;
    }
    if (key === 'period') {
      const max = inputs.isMonths ? 960 : 80;
      if (parseFloat(val) > max) return;
    }
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleInputBlur = (key, min, max) => {
    if (key === 'amount') {
      let val = parseFloat(inputs[key]);
      if (isNaN(val) || val < min) {
        setInputs(prev => ({ ...prev, [key]: min }));
      } else if (val > max) {
        setInputs(prev => ({ ...prev, [key]: max }));
      }
    }
  };

  const getChartData = () => {
    const loanAmount = activeToggle === 'Amount' ? calculatedValue : parseFloat(inputs.amount);
    const emiValue = activeToggle === 'EMI' ? calculatedValue : parseFloat(inputs.emi);
    const periodValue = activeToggle === 'Period' ? calculatedValue : parseFloat(inputs.period);
    const interestRate = activeToggle === 'Interest' ? calculatedValue : parseFloat(inputs.interest);
    
    const n = inputs.isMonths ? periodValue : periodValue * 12;
    const totalPayment = emiValue * n;
    const totalInterest = totalPayment - loanAmount;

    return [
      { name: 'Loan Amount', value: Math.max(0, loanAmount), color: '#F59E0B' },
      { name: 'Interest', value: Math.max(0, totalInterest), color: '#10B981' }
    ];
  };

  const chartData = getChartData();
  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const interestPercent = totalValue > 0 ? ((chartData[1].value / totalValue) * 100).toFixed(1) : 0;

  const renderInputRow = (label, key, min, max, step, symbol) => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</label>
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full flex items-center gap-2 transition-colors duration-300">
            <input 
              type="text" 
              inputMode="decimal"
              value={formatNumericInput(inputs[key])} 
              onChange={(e) => handleInputChange(key, parseFormattedNumber(e.target.value))}
              onBlur={() => handleInputBlur(key, min, max)}
              className="bg-transparent border-none outline-none text-right font-bold w-40 text-gray-800 dark:text-white"
            />
            <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">{symbol}</span>
          </div>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={parseFormattedNumber(inputs[key])} 
          onChange={(e) => handleInputChange(key, e.target.value)}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    );
  };

  const getResultLabel = () => {
    switch (activeToggle) {
      case 'EMI': return t('emi', language);
      case 'Amount': return t('loan_amount', language);
      case 'Period': return 'Loan Period';
      case 'Interest': return 'Interest Rate';
      default: return '';
    }
  };

  const getFormattedResult = () => {
    if (activeToggle === 'Period') {
      const val = calculatedValue;
      if (inputs.isMonths) return `${Math.round(val)} Months`;
      const years = Math.floor(val);
      const months = Math.round((val - years) * 12);
      return `${years} Yr ${months} Mo`;
    }
    if (activeToggle === 'Interest') {
      return `${calculatedValue.toFixed(2)}%`;
    }
    return formatCurrency(calculatedValue, currentCurrency);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 transition-colors duration-300 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('quick_emi_calculator', language)}</h1>
        </div>
        <button 
          onClick={handleShare}
          className="p-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
        >
          <Share2 size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
        {/* Toggle Bar */}
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex mb-8 transition-colors duration-300">
          {toggles.map((t) => (
            <button
              key={t}
              onClick={() => setActiveToggle(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeToggle === t 
                  ? 'bg-white dark:bg-gray-700 text-primary dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dynamic Inputs - Shifted Up */}
        <div className="space-y-2 mb-8">
          {activeToggle !== 'Amount' && renderInputRow(t('loan_amount', language), 'amount', 50000, 20000000, 50000, currentCurrency.split(' ')[0])}
          {activeToggle !== 'Interest' && renderInputRow(t('interest_rate', language), 'interest', 1, 50, 0.1, '%')}
          {activeToggle !== 'Period' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('tenure', language)}</label>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex transition-colors duration-300">
                        <button 
                            onClick={() => {
                                if (inputs.isMonths) {
                                    const currentPeriod = parseFloat(inputs.period) || 0;
                                    setInputs(p => ({
                                        ...p, 
                                        isMonths: false, 
                                        period: String(Math.round(currentPeriod / 12))
                                    }));
                                }
                            }}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md ${!inputs.isMonths ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-gray-500'}`}
                        >YR</button>
                        <button 
                            onClick={() => {
                                if (!inputs.isMonths) {
                                    const currentPeriod = parseFloat(inputs.period) || 0;
                                    setInputs(p => ({
                                        ...p, 
                                        isMonths: true, 
                                        period: String(currentPeriod * 12)
                                    }));
                                }
                            }}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md ${inputs.isMonths ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-gray-500'}`}
                        >MO</button>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full flex items-center gap-2 transition-colors duration-300">
                        <input 
                        type="text" 
                        inputMode="decimal"
                        value={formatNumericInput(inputs.period)} 
                        onChange={(e) => handleInputChange('period', parseFormattedNumber(e.target.value))}
                        className="bg-transparent border-none outline-none text-right font-bold w-24 text-gray-800 dark:text-white"
                        />
                        <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">{inputs.isMonths ? 'Mo' : 'Yr'}</span>
                    </div>
                </div>
              </div>
              <input 
                type="range" 
                min={1} 
                max={inputs.isMonths ? 960 : 80} 
                step={1} 
                value={inputs.period} 
                onChange={(e) => handleInputChange('period', e.target.value)}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          )}
          {activeToggle !== 'EMI' && renderInputRow(t('emi', language), 'emi', 1000, 500000, 500, currentCurrency.split(' ')[0])}
        </div>

        {/* View Details Button - Shifted Below Inputs */}
        <div className="flex justify-center mb-8">
          <button 
            onTouchStart={(e) => {
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const touchEndY = e.changedTouches[0].clientY;
              const diff = Math.abs(touchEndY - touchStartY.current);
              if (diff < 10) {
                e.preventDefault();
                onDetails({ ...inputs, calculatedValue, activeToggle });
              }
            }}
            onClick={() => onDetails({ ...inputs, calculatedValue, activeToggle })}
            className="px-12 py-3.5 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            {t('see_all', language)}
          </button>
        </div>

        {/* Highlighted Value - Shifted Above Results */}
        <div className="text-center mb-8 bg-blue-50/50 dark:bg-blue-900/10 py-4.5 px-6 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{getResultLabel()}</p>
          <h2 className="text-[26px] font-black text-gray-900 dark:text-white">{getFormattedResult()}</h2>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 px-6 italic leading-normal">
            {activeToggle !== 'Interest' && activeToggle !== 'Period' ? numberToWords(calculatedValue) + ' Rupees Only' : ''}
          </p>
        </div>

        {/* Results Section - Shifted to Bottom */}
        <div className="grid grid-cols-2 gap-4 mb-8 items-center">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Total Interest</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatCurrency(chartData[1].value, currentCurrency)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Total Payment</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatCurrency(totalValue, currentCurrency)}</p>
            </div>
          </div>
          
          <div className="h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Interest</span>
              <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400">{interestPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCalculator;
