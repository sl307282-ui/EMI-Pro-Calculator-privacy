import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight,
  Trash2, X, Plus, Calendar, TrendingUp, Sparkles, PlusCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';

const InputRow = ({ label, field, placeholder, symbol, value, onChange, isNumeric = true }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1 leading-snug">{label}</label>
    <div className="relative flex items-center flex-[1.5]">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={isNumeric ? formatNumericInput(value) : value}
        onChange={(e) => onChange(field, isNumeric ? parseFormattedNumber(e.target.value) : e.target.value)}
        className="w-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right pr-10 animate-fade-in"
      />
      <span className="absolute right-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{symbol}</span>
    </div>
  </div>
);

const SIPCalculator = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('SIP'); // 'SIP' | 'Lumpsum' | 'Step-Up'
  const [formData, setFormData] = useState({
    sipAmount: '0',
    lumpsumAmount: '0',
    stepUpBaseAmount: '0',
    returnRate: '0',
    periodValue: '0',
    periodType: 'Years',
    stepUpFreq: 'Monthly', // 'Monthly' | 'Quarterly' | 'Yearly'
    stepUpInterval: 'Every 1 Year', // 'Every 6 Months' | 'Every 1 Year'
    stepUpIncType: '%', // '%' | '₹'
    stepUpIncValue: '0'
  });

  const [results, setResults] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsViewType, setDetailsViewType] = useState('year'); // 'year' | 'month'

  // History state
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sip_calculator_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleInputChange = (field, value) => {
    let val = value;
    if (field === 'sipAmount' || field === 'lumpsumAmount' || field === 'stepUpBaseAmount') {
      if (val.length > 9) return;
    }
    if (field === 'returnRate') {
      if (val !== '' && parseFloat(val) > 50) return;
    }
    if (field === 'periodValue') {
      const max = formData.periodType === 'Months' ? 960 : 80;
      if (val !== '' && parseFloat(val) > max) return;
    }
    if (field === 'stepUpIncValue' && formData.stepUpIncType === '%') {
      if (val !== '' && parseFloat(val) > 50) return;
    }
    if (field === 'stepUpIncType' && value === '%') {
      const currentVal = parseFloat(formData.stepUpIncValue) || 0;
      if (currentVal > 50) {
        setFormData(prev => ({ ...prev, stepUpIncType: '%', stepUpIncValue: '50' }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // Auto-compounding mathematical loop/formulas
  const calculateResults = (isSavingToHistory = false) => {
    const rate = Math.min(parseFloat(formData.returnRate) || 0, 50);
    const period = parseFloat(formData.periodValue) || 0;

    // Total months calculation
    const totalMonths = formData.periodType === 'Years'
      ? Math.round(period * 12)
      : Math.round(period);

    if (totalMonths <= 0) return;

    let totalInvested = 0;
    let maturityValue = 0;
    let monthlyDetails = [];

    if (activeTab === 'SIP') {
      const P = parseFloat(formData.sipAmount) || 0;
      const i = (rate / 100) / 12;
      const n = totalMonths;

      totalInvested = P * n;

      if (i === 0) {
        maturityValue = totalInvested;
      } else {
        maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      }

      // Generate schedule using the progressive loop
      let closing = 0;
      for (let m = 1; m <= n; m++) {
        const opening = closing;
        const interest = (opening + P) * i;
        closing = opening + P + interest;
        monthlyDetails.push({
          month: m,
          openingBalance: opening,
          investment: P,
          interest: interest,
          closingBalance: closing
        });
      }
    }
    else if (activeTab === 'Lumpsum') {
      const P = parseFloat(formData.lumpsumAmount) || 0;
      const r = rate / 100;
      const t = totalMonths / 12;

      totalInvested = P;
      maturityValue = P * Math.pow(1 + r, t);

      // Equivalent monthly rate to match annual compounding: (1 + r)^(1/12) - 1
      const i_eq = Math.pow(1 + r, 1 / 12) - 1;
      let closing = 0;
      for (let m = 1; m <= totalMonths; m++) {
        const opening = m === 1 ? 0 : closing;
        const investment = m === 1 ? P : 0;
        const interest = (opening + investment) * i_eq;
        closing = opening + investment + interest;
        monthlyDetails.push({
          month: m,
          openingBalance: opening,
          investment,
          interest,
          closingBalance: closing
        });
      }
    }
    else if (activeTab === 'Step-Up') {
      const baseSip = parseFloat(formData.stepUpBaseAmount) || 0;
      const i = (rate / 100) / 12;
      const stepUpFreqMonths = formData.stepUpInterval === 'Every 6 Months' ? 6 : 12;
      let incVal = parseFloat(formData.stepUpIncValue) || 0;
      if (formData.stepUpIncType === '%') {
        incVal = Math.min(incVal, 50);
      }

      let currentSip = baseSip;
      let closing = 0;

      for (let m = 1; m <= totalMonths; m++) {
        // Apply Step Up triggers
        if (m > 1 && (m - 1) % stepUpFreqMonths === 0) {
          if (formData.stepUpIncType === '%') {
            currentSip = currentSip * (1 + incVal / 100);
          } else {
            currentSip = currentSip + incVal;
          }
        }

        // Determine investment this month based on frequency
        let investmentThisMonth = 0;
        let isInvestmentMonth = false;

        if (formData.stepUpFreq === 'Monthly') {
          investmentThisMonth = currentSip;
          isInvestmentMonth = true;
        } else if (formData.stepUpFreq === 'Quarterly') {
          if ((m - 1) % 3 === 0) {
            investmentThisMonth = currentSip * 3;
            isInvestmentMonth = true;
          }
        } else if (formData.stepUpFreq === 'Yearly') {
          if ((m - 1) % 12 === 0) {
            investmentThisMonth = currentSip * 12;
            isInvestmentMonth = true;
          }
        }

        const opening = closing;
        const interest = (opening + investmentThisMonth) * i;
        closing = opening + investmentThisMonth + interest;

        totalInvested += investmentThisMonth;

        monthlyDetails.push({
          month: m,
          openingBalance: opening,
          investment: investmentThisMonth,
          interest,
          closingBalance: closing
        });
      }

      maturityValue = closing;
    }

    const estimatedReturns = maturityValue - totalInvested;

    const computedResults = {
      totalInvested,
      maturityValue,
      estimatedReturns,
      monthlyDetails,
      chartData: [
        { name: 'Total Invested', value: Math.max(0, totalInvested), color: '#F97316' },
        { name: 'Estimated Returns', value: Math.max(0, estimatedReturns), color: '#22C55E' }
      ]
    };

    setResults(computedResults);

    // Save to history list if manually calculated
    if (isSavingToHistory) {
      const displayAmount = activeTab === 'SIP'
        ? formData.sipAmount
        : activeTab === 'Lumpsum'
          ? formData.lumpsumAmount
          : formData.stepUpBaseAmount;

      const newHistoryItem = {
        id: Date.now(),
        tab: activeTab,
        summary: `${activeTab} Plan: ₹${parseFloat(displayAmount).toLocaleString('en-IN')} @ ${rate}% for ${formData.periodValue} ${formData.periodType}`,
        formData: { ...formData, returnRate: String(rate) }, // Save clamped rate
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => {
        const updated = [newHistoryItem, ...prev.filter(x => x.summary !== newHistoryItem.summary)].slice(0, 5);
        localStorage.setItem('sip_calculator_history', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Convert Period Years <-> Months
  const handlePeriodTypeToggle = () => {
    setFormData(prev => {
      const currentVal = parseFloat(prev.periodValue) || 0;
      if (prev.periodType === 'Years') {
        return {
          ...prev,
          periodType: 'Months',
          periodValue: String(Math.round(currentVal * 12))
        };
      } else {
        return {
          ...prev,
          periodType: 'Years',
          periodValue: String(Math.round((currentVal / 12) * 100) / 100)
        };
      }
    });
  };

  // Format final value into lakhs/crores parentheses
  const formatLakhsCrores = (num) => {
    if (num >= 10000000) {
      return `(${(num / 10000000).toFixed(2)} Crores)`;
    } else if (num >= 100000) {
      return `(${(num / 100000).toFixed(2)} Lakhs)`;
    }
    return '';
  };

  // Trigger initial calculation
  useEffect(() => {
    calculateResults(false);
  }, [activeTab]);

  const handleReset = () => {
    setFormData({
      sipAmount: '0',
      lumpsumAmount: '0',
      stepUpBaseAmount: '0',
      returnRate: '0',
      periodValue: '0',
      periodType: 'Years',
      stepUpFreq: 'Monthly',
      stepUpInterval: 'Every 1 Year',
      stepUpIncType: '%',
      stepUpIncValue: '0'
    });
    setResults(null);
  };

  // Native share text builder
  const handleShare = () => {
    if (!results) return;
    const text = `SIP Growth Calculations:\n\n` +
      `Type: ${activeTab}\n` +
      `Period: ${formData.periodValue} ${formData.periodType}\n` +
      `Rate of Return: ${formData.returnRate}%\n` +
      `Total Invested: ${formatCurrency(results.totalInvested)}\n` +
      `Estimated Returns: ${formatCurrency(results.estimatedReturns)}\n` +
      `Maturity Value: ${formatCurrency(results.maturityValue)} ${formatLakhsCrores(results.maturityValue)}\n\n` +
      `Plan smart, grow wealthy! Saved via EMI Pro.`;
    shareAsText('SIP Wealth Growth Plan', text);
  };

  // Aggregate yearly breakdown for the details modal
  const getYearlySchedule = () => {
    if (!results || !results.monthlyDetails) return [];

    const yearly = [];
    let yearNum = 1;
    let accumulatedInvest = 0;
    let accumulatedInterest = 0;
    let startOpening = 0;

    results.monthlyDetails.forEach((monthData, idx) => {
      if (idx % 12 === 0) {
        startOpening = monthData.openingBalance;
        accumulatedInvest = 0;
        accumulatedInterest = 0;
      }

      accumulatedInvest += monthData.investment;
      accumulatedInterest += monthData.interest;

      if ((idx + 1) % 12 === 0 || idx === results.monthlyDetails.length - 1) {
        yearly.push({
          year: yearNum,
          openingBalance: startOpening,
          investment: accumulatedInvest,
          interest: accumulatedInterest,
          closingBalance: monthData.closingBalance
        });
        yearNum++;
      }
    });

    return yearly;
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(x => x.id !== id);
      localStorage.setItem('sip_calculator_history', JSON.stringify(updated));
      return updated;
    });
  };

  const restoreHistory = (item) => {
    setActiveTab(item.tab);
    setFormData(item.formData);
    setIsHistoryOpen(false);
  };
  const growthMultiplier = results
    ? (results.maturityValue / results.totalInvested || 1).toFixed(1)
    : '1.0';

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300 relative">
      {/* Header Bar */}
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-black text-gray-900 dark:text-white">SIP Calculator</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
          >
            <History size={18} />
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-36 bg-transparent">

        {/* 3-way Segmented Navigation pill */}
        <div className="bg-gray-100 dark:bg-gray-850 p-1.5 rounded-[2rem] flex gap-1 mb-8 shadow-inner transition-colors duration-300">
          {['SIP', 'Lumpsum', 'Step-Up'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 rounded-[1.7rem] text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl p-2 mb-8 shadow-inner border border-white/50 dark:border-gray-800/50">
          <div className="p-4">

            {/* TAB 1: SIP */}
            {activeTab === 'SIP' && (
              <InputRow label="Monthly Investment" field="sipAmount" placeholder="e.g. 25,000" symbol="₹" value={formData.sipAmount} onChange={handleInputChange} />
            )}

            {/* TAB 2: Lumpsum */}
            {activeTab === 'Lumpsum' && (
              <InputRow label="Total Investment" field="lumpsumAmount" placeholder="e.g. 1,00,000" symbol="₹" value={formData.lumpsumAmount} onChange={handleInputChange} />
            )}

            {/* TAB 3: Step-Up SIP */}
            {activeTab === 'Step-Up' && (
              <>
                <InputRow label="Base Monthly SIP" field="stepUpBaseAmount" placeholder="e.g. 25,000" symbol="₹" value={formData.stepUpBaseAmount} onChange={handleInputChange} />

                {/* Dropdown for SIP frequency */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">
                    SIP Frequency
                  </label>
                  <div className="relative flex items-center flex-[1.5]">
                    <select
                      value={formData.stepUpFreq}
                      onChange={(e) => handleInputChange('stepUpFreq', e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-850 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right pr-4 appearance-none cursor-pointer"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Segmented control for Step Up frequency */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">
                    Step-Up Frequency
                  </label>
                  <div className="flex-[1.5] flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
                    {['Every 6 Months', 'Every 1 Year'].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => handleInputChange('stepUpInterval', interval)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${formData.stepUpInterval === interval
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                      >
                        {interval === 'Every 6 Months' ? '6 Mos' : '1 Yr'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step Up increment rate/amount with currency/percent switcher */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">
                    Step-Up Increment
                  </label>
                  <div className="flex-[1.5] flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={formData.stepUpIncType === '%' ? '10' : 'e.g. 5,000'}
                        value={formData.stepUpIncType === '%' ? formData.stepUpIncValue : formatNumericInput(formData.stepUpIncValue)}
                        onChange={(e) => {
                          const val = formData.stepUpIncType === '%'
                            ? e.target.value.replace(/[^0-9.]/g, '')
                            : parseFormattedNumber(e.target.value);
                          handleInputChange('stepUpIncValue', val);
                        }}
                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right pr-4"
                      />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm flex border border-gray-100 dark:border-gray-700/50">
                      <button
                        type="button"
                        onClick={() => handleInputChange('stepUpIncType', '%')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${formData.stepUpIncType === '%' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}
                      >%</button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('stepUpIncType', '₹')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${formData.stepUpIncType === '₹' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}
                      >₹</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Expected returns rate - applies to all tabs */}
            <InputRow label="Expected Return %" field="returnRate" placeholder="e.g. 12" symbol="%" value={formData.returnRate} onChange={handleInputChange} />

            {/* Period Input with inline capsule toggle */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">Period</label>
              <div className="flex-[1.5] flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={formData.periodType === 'Years' ? "e.g. 10" : "e.g. 120"}
                    value={formatNumericInput(formData.periodValue)}
                    onChange={(e) => handleInputChange('periodValue', parseFormattedNumber(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right pr-4"
                  />
                </div>
                <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm flex border border-gray-100 dark:border-gray-700/50">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.periodType === 'Months') {
                        const currentPeriod = parseFloat(formData.periodValue) || 0;
                        setFormData(p => ({
                          ...p,
                          periodType: 'Years',
                          periodValue: String(Math.round(currentPeriod / 12))
                        }));
                      }
                    }}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${formData.periodType === 'Years' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}
                  >Yrs</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.periodType === 'Years') {
                        const currentPeriod = parseFloat(formData.periodValue) || 0;
                        setFormData(p => ({
                          ...p,
                          periodType: 'Months',
                          periodValue: String(currentPeriod * 12)
                        }));
                      }
                    }}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${formData.periodType === 'Months' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}
                  >Mos</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calculate & Reset Actions */}
        <div className="flex gap-3 mb-8">
          <button onClick={handleReset} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={() => calculateResults(true)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-2">
            Calculate <ArrowRight size={16} />
          </button>
        </div>

        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
            <div className="bg-white dark:bg-gray-800/80 border-2 border-gray-50 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-sm transition-all duration-300">
              {/* Simple & Standard Wealth Summary Panel */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 space-y-4 shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Wealth Summary</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-450">
                    Calculated
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Row 1: Total Investment */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Investment</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(results.totalInvested)}</span>
                  </div>

                  {/* Row 2: Est. Returns */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Estimated Returns</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{formatCurrency(results.estimatedReturns)}</span>
                  </div>

                  {/* Divider line */}
                  <div className="border-t border-slate-200/80 dark:border-slate-800 my-1" />

                  {/* Row 3: Maturity Value */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Maturity Value</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">{formatLakhsCrores(results.maturityValue)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">{formatCurrency(results.maturityValue)}</span>
                      <span className="text-[9px] font-extrabold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded mt-1">
                        Multiplier: {growthMultiplier}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie/Gauge visual indicator (Shown BELOW Wealth Summary) */}
              <div className="grid grid-cols-2 gap-4 items-center mt-6">
                <div className="h-32 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="investedGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                        <linearGradient id="returnsGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={results.chartData}
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={48}
                        outerRadius={64}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {results.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "url(#investedGrad)" : "url(#returnsGrad)"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black text-slate-455 dark:text-gray-500 uppercase tracking-widest leading-none mb-0.5">Growth</span>
                    <span className="text-sm font-black text-emerald-500">
                      +{((results.estimatedReturns / results.maturityValue) * 100 || 0).toFixed(0)}%
                    </span>
                    <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                      {growthMultiplier}x Val
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-gray-150/40 dark:border-gray-800/40 rounded-2xl p-3 flex flex-col justify-center shadow-sm">
                    <span className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1.5">Invested</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-gray-700 dark:text-gray-200 leading-none">
                        {((results.totalInvested / results.maturityValue) * 100 || 0).toFixed(0)}%
                      </span>
                      <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                        Capital
                      </span>
                    </div>
                  </div>
                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/20 dark:border-emerald-900/20 rounded-2xl p-3 flex flex-col justify-center shadow-sm">
                    <span className="block text-[8px] font-black text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest leading-none mb-1.5">Returns</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-emerald-600 leading-none">
                        {((results.estimatedReturns / results.maturityValue) * 100 || 0).toFixed(0)}%
                      </span>
                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        Gains
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row action buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setDetailsViewType('year');
                  setIsDetailsOpen(true);
                }}
                className="flex-1 py-4 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all text-center bg-transparent"
              >
                Details
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={14} /> Share Plan
              </button>
            </div>
          </motion.div>
        )}
    </div>

      {/* DETAIL SCHEDULE MODAL (Tabular Breakdown Bottom Sheet) */ }
  <AnimatePresence>
    {isDetailsOpen && results && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-[80] flex flex-col justify-end"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="bg-white dark:bg-gray-800 rounded-t-[3rem] shadow-2xl h-[85%] flex flex-col overflow-hidden transition-colors duration-300"
        >
          {/* Bottom Sheet Header */}
          <div className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-gray-55 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Growth Breakdown</h2>
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">SIP progressive schedule</p>
            </div>

            {/* View switcher toggle pill */}
            <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setDetailsViewType('year')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${detailsViewType === 'year' ? 'bg-blue-600 text-white' : 'text-gray-400 dark:text-gray-500'}`}
              >
                Year
              </button>
              <button
                onClick={() => setDetailsViewType('month')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${detailsViewType === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 dark:text-gray-500'}`}
              >
                Month
              </button>
            </div>

            <button
              onClick={() => setIsDetailsOpen(false)}
              className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-400 dark:text-gray-300 active:scale-90 transition-transform"
            >
              <X size={18} />
            </button>
          </div>

          {/* Amortization Schedule Table */}
          <div
            className="flex-1 overflow-y-auto max-h-[calc(100%-80px)] px-6 py-4 overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 pb-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  <th className="py-3 pr-2">{detailsViewType === 'year' ? 'Year' : 'Month'}</th>
                  <th className="py-3 px-2 text-right">Invested</th>
                  <th className="py-3 px-2 text-right">Earned</th>
                  <th className="py-3 pl-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {detailsViewType === 'year' ? (
                  getYearlySchedule().map((row) => (
                    <tr key={row.year} className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 font-black text-gray-900 dark:text-white pr-2">Yr {row.year}</td>
                      <td className="py-4 px-2 text-right">{formatCurrency(row.investment)}</td>
                      <td className="py-4 px-2 text-right text-green-500">+{formatCurrency(row.interest)}</td>
                      <td className="py-4 pl-2 text-right font-black text-blue-600 dark:text-blue-400">{formatCurrency(row.closingBalance)}</td>
                    </tr>
                  ))
                ) : (
                  results.monthlyDetails.map((row) => (
                    <tr key={row.month} className="text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3.5 font-black text-gray-900 dark:text-white pr-2">Mo {row.month}</td>
                      <td className="py-3.5 px-2 text-right">{formatCurrency(row.investment)}</td>
                      <td className="py-3.5 px-2 text-right text-green-500">+{formatCurrency(row.interest)}</td>
                      <td className="py-3.5 pl-2 text-right font-black text-blue-600 dark:text-blue-400">{formatCurrency(row.closingBalance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* LOCAL CALCULATIONS HISTORY DRAWER */ }
  <AnimatePresence>
    {isHistoryOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-[80] flex flex-col justify-end"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-white dark:bg-gray-800 rounded-t-[3rem] shadow-2xl max-h-[70%] flex flex-col overflow-hidden transition-colors duration-300"
        >
          <div className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-gray-50 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Recent Calculations</h2>
              <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Load past SIP plans</p>
            </div>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-400 dark:text-gray-300 active:scale-90 transition-transform"
            >
              <X size={18} />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto max-h-[calc(100%-80px)] px-6 py-6 space-y-3.5 overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {history.length > 0 ? (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => restoreHistory(item)}
                  className="bg-gray-50 dark:bg-gray-900 rounded-[1.7rem] p-5 flex items-center justify-between border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900/50 cursor-pointer active:scale-[0.99] transition-all group"
                >
                  <div className="flex-1 pr-3">
                    <span className="block text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1.5">{item.tab} Plan</span>
                    <p className="text-xs font-black text-gray-800 dark:text-gray-250 leading-normal">{item.summary}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{item.timestamp}</span>
                    <button
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="p-2 text-gray-300 hover:text-red-500 active:scale-90 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400">
                <History size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-black">No past calculations</p>
                <p className="text-xs mt-1">Calculated results will show up here</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
    </div >
  );
};

export default SIPCalculator;
