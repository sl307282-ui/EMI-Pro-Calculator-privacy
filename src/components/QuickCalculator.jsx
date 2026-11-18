import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Share2, ChevronRight } from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { shareAsText } from '../utils/exportUtils';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const { theme, currency: currentCurrency, language } = useSettings();
  const [activeToggle, setActiveToggle] = useState('EMI');
  const touchStartY = useRef(0);
  const [inputs, setInputs] = useState({
    amount: 1000000,
    interest: 8.5,
    period: 20,
    emi: 10000,
    isMonths: false
  });

  const toggles = ['EMI', 'Amount', 'Period', 'Interest'];

  useEffect(() => {
    const isDark = theme === 'dark';
    try {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch (err) {
      console.warn('Capacitor StatusBar failed', err);
    }
  }, [theme]);

  const calculatedValue = useMemo(() => {
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
    return result;
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
    const loanAmount = activeToggle === 'Amount' ? calculatedValue : parseFloat(inputs.amount) || 0;
    const emiValue = activeToggle === 'EMI' ? calculatedValue : parseFloat(inputs.emi) || 0;
    const periodValue = activeToggle === 'Period' ? calculatedValue : parseFloat(inputs.period) || 0;
    
    const n = inputs.isMonths ? periodValue : periodValue * 12;
    const totalPayment = emiValue * n;
    const totalInterest = Math.max(0, totalPayment - loanAmount);

    return [
      { name: 'Principal Amount', value: Math.max(0, loanAmount), color: '#2563EB' },
      { name: 'Total Interest', value: Math.max(0, totalInterest), color: '#F59E0B' }
    ];
  };

  const chartData = getChartData();
  const principalAmount = chartData[0].value;
  const totalInterest = chartData[1].value;
  const totalPayment = principalAmount + totalInterest;
  const interestPercent = totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(1) : '0.0';

  const getResultLabel = () => {
    switch (activeToggle) {
      case 'EMI': return 'Monthly EMI';
      case 'Amount': return 'Loan Amount';
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
      if (months === 0) return `${years} Years`;
      return `${years} Yr ${months} Mo`;
    }
    if (activeToggle === 'Interest') {
      return `${calculatedValue.toFixed(2)}%`;
    }
    return formatCurrency(calculatedValue, currentCurrency);
  };

  const getSpelledOutWords = () => {
    if (activeToggle === 'Interest' || activeToggle === 'Period') return '';
    try {
      const words = numberToWords(Math.round(calculatedValue));
      return words ? `${words} Rupees Only` : '';
    } catch (e) {
      return '';
    }
  };

  const renderInputRow = (label, key, min, max, step, symbol) => {
    return (
      <div className="mb-5 last:mb-0">
        <div className="flex justify-between items-center mb-2">
          <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{label}</label>
          <div className="bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#CBD5E1] dark:border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <input 
              type="text" 
              inputMode="decimal"
              value={formatNumericInput(inputs[key])} 
              onChange={(e) => handleInputChange(key, parseFormattedNumber(e.target.value))}
              onBlur={() => handleInputBlur(key, min, max)}
              className="bg-transparent border-none outline-none text-right font-bold w-28 text-slate-900 dark:text-white text-[13.5px]"
            />
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{symbol}</span>
          </div>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={parseFormattedNumber(inputs[key])} 
          onChange={(e) => handleInputChange(key, e.target.value)}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    );
  };

  const renderTenureRow = () => {
    const min = 1;
    const max = inputs.isMonths ? 960 : 80;
    return (
      <div className="mb-5 last:mb-0">
        <div className="flex justify-between items-center mb-2">
          <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
            {`Tenure (${inputs.isMonths ? 'Months' : 'Years'})`}
          </label>
          <div className="flex items-center gap-2">
            <div className="bg-[#EFF3F8] dark:bg-slate-800 p-0.5 rounded-lg flex border border-slate-200/80 dark:border-slate-700">
              <button 
                type="button"
                onClick={() => {
                  if (inputs.isMonths) {
                    const currentPeriod = parseFloat(inputs.period) || 0;
                    setInputs(p => ({
                      ...p, 
                      isMonths: false, 
                      period: String(Math.max(1, Math.round(currentPeriod / 12)))
                    }));
                  }
                }}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all select-none ${
                  !inputs.isMonths 
                    ? 'bg-[#2563EB] text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                YR
              </button>
              <button 
                type="button"
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
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all select-none ${
                  inputs.isMonths 
                    ? 'bg-[#2563EB] text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                MO
              </button>
            </div>
            <div className="bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#CBD5E1] dark:border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <input 
                type="text" 
                inputMode="decimal"
                value={formatNumericInput(inputs.period)} 
                onChange={(e) => handleInputChange('period', parseFormattedNumber(e.target.value))}
                className="bg-transparent border-none outline-none text-right font-bold w-16 text-slate-900 dark:text-white text-[13.5px]"
              />
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{inputs.isMonths ? 'Mo' : 'Yr'}</span>
            </div>
          </div>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={1} 
          value={inputs.period} 
          onChange={(e) => handleInputChange('period', e.target.value)}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] overflow-hidden h-full relative">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: '12px'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Quick EMI Calculator"
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

        <div className="px-5 py-4 max-w-lg mx-auto w-full">
          {/* Polished 4-Tab Segmented Control */}
          <div 
            style={{
              padding: '4px',
              borderRadius: '14px',
            }}
            className="bg-[#EFF3F8] dark:bg-[#1E293B] border border-blue-100/50 dark:border-slate-700/60 flex mb-4 shadow-2xs"
          >
            {toggles.map((t) => {
              const isActive = activeToggle === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveToggle(t)}
                  style={{
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: isActive ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                  }}
                  className={`flex-1 py-2 text-center transition-all duration-200 select-none ${
                    isActive 
                      ? 'bg-[#2563EB] text-white shadow-sm' 
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Clean Elevated Input Card */}
          <div 
            style={{
              borderRadius: '18px',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: theme === 'dark' ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(15, 23, 42, 0.03)',
              padding: '16px',
            }}
            className="bg-white dark:bg-[#1E293B]"
          >
            {activeToggle !== 'Amount' && renderInputRow(t('loan_amount', language) || 'Loan Amount', 'amount', 50000, 20000000, 50000, currentCurrency.split(' ')[0])}
            {activeToggle !== 'Interest' && renderInputRow(t('interest_rate', language) || 'Interest Rate %', 'interest', 1, 50, 0.1, '%')}
            {activeToggle !== 'Period' && renderTenureRow()}
            {activeToggle !== 'EMI' && renderInputRow(t('emi', language) || 'Monthly EMI', 'emi', 1000, 500000, 500, currentCurrency.split(' ')[0])}
          </div>

          {/* Unified Executive Result & Principal-vs-Interest Breakdown Card */}
          <div 
            style={{
              marginTop: '14px',
              borderRadius: '20px',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(37, 99, 235, 0.14)',
              boxShadow: theme === 'dark' ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(15, 23, 42, 0.04)',
              overflow: 'hidden',
            }}
            className="bg-white dark:bg-[#1E293B]"
          >
            {/* Upgraded Executive Hero Header Strip */}
            <div 
              style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #172554 0%, #1E293B 100%)' 
                  : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                padding: '18px 20px',
                borderBottom: theme === 'dark' 
                  ? '1px solid rgba(96, 165, 250, 0.18)' 
                  : '1px solid rgba(37, 99, 235, 0.14)',
              }}
              className="text-center flex flex-col items-center justify-center"
            >
              <span 
                style={{
                  background: theme === 'dark' ? 'rgba(96, 165, 250, 0.16)' : 'rgba(37, 99, 235, 0.10)',
                  color: theme === 'dark' ? '#93C5FD' : '#1D4ED8',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
                className="uppercase inline-block mb-1"
              >
                {getResultLabel()}
              </span>
              <h2 
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                }}
                className="text-[#0F172A] dark:text-[#F8FAFC] leading-tight tabular-nums"
              >
                {getFormattedResult()}
              </h2>
              {getSpelledOutWords() && (
                <p 
                  style={{ fontSize: '11px' }}
                  className="font-medium text-[#475569] dark:text-[#94A3B8] mt-1 truncate px-2 italic max-w-full"
                >
                  {getSpelledOutWords()}
                </p>
              )}
            </div>

            {/* Structured Principal vs. Interest Split & Donut Section */}
            <div 
              style={{
                padding: '16px',
              }}
              className="bg-white dark:bg-[#1E293B] flex items-center justify-between gap-[14px]"
            >
              {/* Left Breakdown Column */}
              <div className="flex-1 min-w-0 flex flex-col gap-[10px] justify-center">
                {/* Principal Amount Row */}
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '9999px', 
                        backgroundColor: '#2563EB', 
                        flexShrink: 0 
                      }} 
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748B' }} className="font-semibold dark:text-slate-400">
                      Principal Amount
                    </span>
                  </div>
                  <p 
                    style={{ fontSize: '14px', fontWeight: 700 }} 
                    className="text-[#0F172A] dark:text-[#F8FAFC] pl-[14px] tabular-nums"
                  >
                    {formatCurrency(principalAmount, currentCurrency)}
                  </p>
                </div>

                {/* Total Interest Row */}
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '9999px', 
                        backgroundColor: '#F59E0B', 
                        flexShrink: 0 
                      }} 
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748B' }} className="font-semibold dark:text-slate-400">
                      Total Interest
                    </span>
                  </div>
                  <p 
                    style={{ fontSize: '14px', fontWeight: 700 }} 
                    className="text-[#D97706] dark:text-[#FBBF24] pl-[14px] tabular-nums"
                  >
                    {formatCurrency(totalInterest, currentCurrency)}
                  </p>
                </div>

                {/* Total Payment Footer Pill */}
                <div 
                  style={{
                    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.55)' : '#F8FAFC',
                    borderRadius: '10px',
                    padding: '7px 10px',
                  }}
                  className="flex justify-between items-center"
                >
                  <span 
                    style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748B' }} 
                    className="dark:text-slate-400"
                  >
                    Total Payment
                  </span>
                  <span 
                    style={{ fontSize: '13px', fontWeight: 800 }} 
                    className="text-[#0F172A] dark:text-[#F8FAFC] tabular-nums"
                  >
                    {formatCurrency(totalPayment, currentCurrency)}
                  </span>
                </div>
              </div>

              {/* Right Donut Chart */}
              <div className="w-[112px] h-[112px] min-w-[112px] min-h-[112px] relative flex items-center justify-center shrink-0">
                <ResponsiveContainer width={112} height={112}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx={56}
                      cy={56}
                      innerRadius={38}
                      outerRadius={52}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell key="cell-principal" fill="#2563EB" />
                      <Cell key="cell-interest" fill="#F59E0B" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span 
                    style={{ fontSize: '15px', fontWeight: 800 }} 
                    className="text-[#0F172A] dark:text-white leading-tight tabular-nums"
                  >
                    {interestPercent}%
                  </span>
                  <span 
                    style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }} 
                    className="dark:text-slate-400 uppercase tracking-tight"
                  >
                    INTEREST
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* See Detailed Schedule CTA Button */}
          <div 
            style={{
              marginTop: '14px',
              marginBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 20px)',
            }}
            className="flex justify-center"
          >
            <motion.button 
              whileTap={{ scale: 0.96 }}
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
              style={{
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
              }}
              className="w-full hover:bg-blue-700 active:bg-blue-800 font-bold text-[13.5px] tracking-wide shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 select-none transition-all cursor-pointer"
            >
              <span>See Detailed Schedule</span>
              <ChevronRight size={17} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCalculator;
