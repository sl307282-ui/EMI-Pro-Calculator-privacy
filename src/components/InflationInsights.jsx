import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, TrendingUp, AlertCircle, Percent, Info, AlertTriangle, ChevronDown } from 'lucide-react';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import VoiceInput from './VoiceInput';

// Strictly populated hardcoded CPI inflation rates for India from 1980 to 2030
const inflationData = {
  1980: 11.3, 1981: 12.7, 1982: 7.7, 1983: 12.6, 1984: 6.5,
  1985: 6.3, 1986: 8.9, 1987: 9.1, 1988: 7.2, 1989: 4.6,
  1990: 11.2, 1991: 13.5, 1992: 9.9, 1993: 7.3, 1994: 10.3,
  1995: 10.0, 1996: 9.4, 1997: 6.8, 1998: 13.1, 1999: 3.4,
  2000: 3.8, 2001: 4.4, 2002: 5.0, 2003: 4.1, 2004: 4.0,
  2005: 3.7, 2006: 6.7, 2007: 5.9, 2008: 9.2, 2009: 10.6,
  2010: 9.4, 2011: 8.1, 2012: 10.0, 2013: 9.8, 2014: 5.9,
  2015: 4.9, 2016: 4.5, 2017: 3.6, 2018: 3.4, 2019: 4.8,
  2020: 6.2, 2021: 5.5, 2022: 6.6, 2023: 5.4, 2024: 4.6,
  2025: 2.1, 2026: 4.7, 2027: 4.0, 2028: 4.0, 2029: 4.0, 2030: 4.0
};

const InflationInsights = ({ onBack }) => {
  const [amount, setAmount] = useState('');
  const [startYear, setStartYear] = useState(2018);
  const [endYear, setEndYear] = useState(2023);
  const [validationError, setValidationError] = useState('');
  const [results, setResults] = useState(null);

  // Auto-generate years array from 1980 to 2030
  const years = Array.from({ length: 2030 - 1980 + 1 }, (_, i) => 1980 + i);

  // Validate start and end years whenever they change
  useEffect(() => {
    if (endYear < startYear) {
      setValidationError('End Year cannot be earlier than Start Year');
    } else {
      setValidationError('');
    }
  }, [startYear, endYear]);

  const handleReset = () => {
    setAmount('');
    setStartYear(2018);
    setEndYear(2023);
    setValidationError('');
    setResults(null);
  };

  const handleCalculate = () => {
    // If validation fails, block calculation
    if (endYear < startYear) {
      setValidationError('End Year cannot be earlier than Start Year');
      return;
    }

    const rawAmountStr = parseFormattedNumber(amount);
    const A = parseFloat(rawAmountStr);

    if (isNaN(A) || A <= 0) {
      setValidationError('Please enter a valid amount greater than 0');
      return;
    }

    setValidationError('');

    const Ys = startYear;
    const Ye = endYear;

    // 1. Multiplier (M)
    let M = 1;
    if (Ys !== Ye) {
      for (let year = Ys; year < Ye; year++) {
        const rate = inflationData[year] !== undefined ? inflationData[year] : 0;
        M *= (1 + (rate / 100));
      }
    }

    // 2. Inflation Adjusted Value (V)
    const V = A * M;

    // 3. Value Difference
    const valDiff = V - A;

    // 4. Total Inflation %
    const totalInflationPct = ((V - A) / A) * 100;

    // 5. Purchasing Power Loss
    // If kept in cash, buying power is A / M. Loss is A - (A / M)
    const buyingPower = A / M;
    const powerLoss = A - buyingPower;

    // 6. Average Inflation Rate (CAGR)
    let cagr = 0;
    if (Ys !== Ye && M > 0) {
      cagr = (Math.pow(M, 1 / (Ye - Ys)) - 1) * 100;
    }

    setResults({
      multiplier: M,
      adjustedValue: V,
      valueDifference: valDiff,
      totalInflationPct: totalInflationPct,
      purchasingPowerLoss: powerLoss,
      cagr: cagr,
      amount: A,
      startYear: Ys,
      endYear: Ye
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-950 overflow-hidden h-full transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-800 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-850 rounded-full active:scale-95 transition-all"
            id="btn_inflation_back"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Inflation Insights</h1>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">India CPI Projections</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-500 dark:text-orange-400 shadow-inner">
          <TrendingUp size={20} strokeWidth={2.5} />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">

        {/* Quick Intro Banner - Compact Breathtaking Royal Blue AI Glassmorphic Banner */}
        {!results && (
          <div 
            className="relative overflow-hidden rounded-[1.75rem] p-4 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
            style={{ 
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Glowing AI-inspired mesh blur elements for 3D depth */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-blue-400/20 rounded-full blur-lg pointer-events-none" />
            
            <div className="relative z-10 space-y-3">
              <div className="flex items-start gap-3">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 border border-white/10"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <TrendingUp size={16} strokeWidth={2.5} style={{ color: '#ffffff' }} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#ffffff' }}>
                    Purchasing Power Calculator
                    <span 
                      className="text-[8px] font-black px-1.5 py-0.5 rounded-full select-none tracking-widest uppercase shadow-sm"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' }}
                    >
                      CPI
                    </span>
                  </h4>
                  <p className="text-[10px] font-bold leading-relaxed" style={{ color: 'rgba(239, 246, 255, 0.95)' }}>
                    Understand how the rate of inflation in India changes the purchasing power of your money over time. Values are computed using verified CPI index numbers from 1980–2024 and forecasts up to 2030.
                  </p>
                </div>
              </div>

              {/* Mini Sparkline demonstrating India's CPI index growth */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2.5 select-none">
                <span className="text-[8px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Live India CPI Trend
                </span>
                <svg className="w-20 h-4 opacity-90" viewBox="0 0 100 30" fill="none">
                  {/* Soft glowing trend line */}
                  <path 
                    d="M0,25 Q15,22 30,12 T60,18 T90,2 T100,5" 
                    stroke="url(#sparklineGradient)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <defs>
                    <linearGradient id="sparklineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Input Card Container */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-soft border border-slate-50 dark:border-gray-800 transition-colors duration-300 space-y-5">

          {/* Amount Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Initial Amount (₹)</label>
              <VoiceInput label="Amount" onResult={(val) => setAmount(val)} />
            </div>
            <div className="flex bg-slate-100 dark:bg-gray-800 rounded-2xl items-center focus-within:ring-2 focus-within:ring-blue-500/30 dark:focus-within:ring-blue-500/20 border border-transparent focus-within:border-blue-500/30 transition-all overflow-hidden shadow-inner">
              <div className="pl-5 pr-3 py-4 flex items-center gap-2 border-r border-slate-200/60 dark:border-gray-700/60 shrink-0 select-none bg-slate-50 dark:bg-gray-850">
                <span className="text-sm font-black text-slate-700 dark:text-gray-300">₹</span>
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 px-2 py-0.5 rounded-md uppercase tracking-wider">INR</span>
              </div>
              <input
                id="input_inflation_amount"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1,00,000"
                className="w-full bg-transparent border-none py-4 px-4 outline-none font-black text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                value={formatNumericInput(amount)}
                onChange={(e) => {
                  const val = parseFormattedNumber(e.target.value);
                  // Strict 9-digit restriction as per other modules
                  if (val === '' || (val.length <= 9 && !isNaN(val))) {
                    setAmount(val);
                  }
                }}
              />
            </div>
          </div>

          {/* Start and End Years Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Year */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">Start Year</label>
              <div className="relative">
                <select
                  id="select_start_year"
                  value={startYear}
                  onChange={(e) => setStartYear(parseInt(e.target.value))}
                  className="input-pill w-full font-bold appearance-none cursor-pointer pr-10 text-sm"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                >
                  {years.map(y => (
                    <option key={y} value={y} className="bg-white dark:bg-gray-950 text-slate-900 dark:text-white">
                      {y}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-slate-400">
                  <ChevronDown size={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* End Year */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">End Year</label>
              <div className="relative">
                <select
                  id="select_end_year"
                  value={endYear}
                  onChange={(e) => setEndYear(parseInt(e.target.value))}
                  className={`input-pill w-full font-bold appearance-none cursor-pointer pr-10 text-sm ${validationError && endYear < startYear ? 'ring-2 ring-red-500/50' : ''
                    }`}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                >
                  {years.map(y => (
                    <option key={y} value={y} className="bg-white dark:bg-gray-950 text-slate-900 dark:text-white">
                      {y}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-slate-400">
                  <ChevronDown size={16} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Validation Alert */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex items-center gap-3 overflow-hidden"
              >
                <AlertTriangle size={18} className="text-red-500 dark:text-red-400 shrink-0" />
                <span className="text-[11px] font-bold text-red-700 dark:text-red-400">
                  {validationError}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={handleReset}
              className="btn-secondary flex-1 py-4 font-black text-xs uppercase tracking-widest"
              id="btn_inflation_reset"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              Reset
            </button>
            <button
              onClick={handleCalculate}
              disabled={!!validationError}
              className={`btn-primary flex-1 py-4 font-black text-xs uppercase tracking-widest ${validationError ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              id="btn_inflation_calculate"
            >
              Calculate
            </button>
          </div>
        </div>

        {/* Results Card */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="space-y-4 pb-12"
            >
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-2xl border border-slate-50 dark:border-gray-800 transition-colors duration-300">
                {/* Highlight Section */}
                <div className="text-center pb-6 border-b border-slate-100 dark:border-gray-800">
                  <span className="block text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                    To have the same buying power in {results.endYear}, you would need:
                  </span>
                  <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight transition-all duration-300">
                    {formatCurrency(results.adjustedValue)}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 mt-2">
                    Originally {formatCurrency(results.amount)} in {results.startYear}
                  </p>
                </div>

                {/* 2-Column Detailed Grid */}
                <div className="grid grid-cols-2 mt-6 gap-0.5 bg-slate-100 dark:bg-gray-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-gray-800">

                  {/* Value Difference */}
                  <div className="bg-white dark:bg-gray-900 p-5 flex flex-col justify-center transition-colors">
                    <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                      Value Difference
                    </span>
                    <span className="text-base font-black text-orange-500 dark:text-orange-400 tracking-tight">
                      + {formatCurrency(results.valueDifference)}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 dark:text-gray-500 mt-0.5">
                      Extra nominal cost
                    </span>
                  </div>

                  {/* Total Inflation % */}
                  <div className="bg-white dark:bg-gray-900 p-5 flex flex-col justify-center transition-colors">
                    <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                      Total Inflation
                    </span>
                    <span className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                      {results.totalInflationPct.toFixed(2)}%
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 dark:text-gray-500 mt-0.5">
                      Cumulative change
                    </span>
                  </div>

                  {/* Average Inflation CAGR */}
                  <div className="bg-white dark:bg-gray-900 p-5 flex flex-col justify-center transition-colors">
                    <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                      Avg. Inflation Rate
                    </span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                      {results.cagr.toFixed(2)}% p.a.
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 dark:text-gray-500 mt-0.5">
                      Compounded annually
                    </span>
                  </div>

                  {/* Purchasing Power Loss */}
                  <div className="bg-white dark:bg-gray-900 p-5 flex flex-col justify-center transition-colors">
                    <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                      Power Loss
                    </span>
                    <span className="text-base font-black text-red-500 dark:text-red-400 tracking-tight">
                      {formatCurrency(results.purchasingPowerLoss)}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 dark:text-gray-500 mt-0.5">
                      Cash value drop
                    </span>
                  </div>

                </div>

                {/* Additional Insight Banner - Breathtaking Cobalt Blue Highlight Card */}
                <div 
                  className="mt-6 relative overflow-hidden rounded-[2rem] p-5 shadow-xl border border-blue-400/20 border-l-4 border-l-amber-400"
                  style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)'
                  }}
                >
                  {/* Decorative modern radial glow mesh */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute top-0 right-12 w-16 h-16 bg-blue-400/10 rounded-full blur-lg pointer-events-none" />
                  
                  <div className="relative z-10 flex gap-4 items-start">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-amber-300/30"
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                    >
                      <AlertCircle size={16} strokeWidth={2.5} className="text-amber-300 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/15 border border-amber-300/25 px-2 py-0.5 rounded-full">
                          Buying Power Alert
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed text-blue-50">
                        Due to inflation, a cash note of{' '}
                        <span className="inline-block bg-white/10 px-1.5 py-0.5 rounded-md text-white font-black border border-white/5 shadow-sm">
                          ₹{results.amount.toLocaleString('en-IN')}
                        </span>{' '}
                        kept in <span className="font-black text-white">{results.startYear}</span> loses{' '}
                        <span className="inline-block bg-rose-500/20 px-1.5 py-0.5 rounded-md text-rose-200 font-black border border-rose-500/20">
                          {((results.purchasingPowerLoss / results.amount) * 100).toFixed(1)}%
                        </span>{' '}
                        of its buying power, making it worth only{' '}
                        <span className="inline-block bg-emerald-500/20 px-1.5 py-0.5 rounded-md text-emerald-300 font-black border border-emerald-500/20 shadow-sm">
                          ₹{Math.round(results.amount - results.purchasingPowerLoss).toLocaleString('en-IN')}
                        </span>{' '}
                        in <span className="font-black text-white">{results.endYear}</span> terms.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default InflationInsights;
