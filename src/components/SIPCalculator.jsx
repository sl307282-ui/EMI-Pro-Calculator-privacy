import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight,
  Trash2, X, Plus, Calendar, TrendingUp, Sparkles, PlusCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import CollapsingTabs from './CollapsingTabs';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useSettings } from '../context/SettingsContext';

const InputRow = ({ label, field, placeholder, symbol, value, onChange, onFocus, isNumeric = true }) => {
  const handleFocus = (e) => {
    const el = e.currentTarget;
    el.select();
    requestAnimationFrame(() => {
      try {
        el.select();
      } catch {}
    });
    if (onFocus) onFocus(e);
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 flex-1 leading-[1.3]">{label}</label>
      <div className="relative flex items-center flex-[1.5]">
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={isNumeric ? formatNumericInput(value) : value}
          onChange={(e) => onChange(field, isNumeric ? parseFormattedNumber(e.target.value) : e.target.value)}
          onFocus={handleFocus}
          className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3.5 shadow-sm text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right pr-10"
        />
        <span className="absolute right-4 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">{symbol}</span>
      </div>
    </div>
  );
};

export const SIP_DEFAULTS = {
  sipAmount: '5000',
  lumpsumAmount: '100000',
  stepUpBaseAmount: '5000',
  returnRate: '12',
  periodValue: '10',
  periodType: 'Years',
  stepUpFreq: 'Monthly', // 'Monthly' | 'Quarterly' | 'Yearly'
  stepUpInterval: 'Every 1 Year', // 'Every 6 Months' | 'Every 1 Year'
  stepUpIncType: '%', // '%' | '₹'
  stepUpIncValue: '10'
};

const validateSIPForm = (data, tab) => {
  let amount = 0;
  let label = 'Monthly Investment';
  if (tab === 'SIP') {
    amount = parseFloat(data.sipAmount);
    label = 'Monthly Investment';
  } else if (tab === 'Lumpsum') {
    amount = parseFloat(data.lumpsumAmount);
    label = 'Investment Amount';
  } else if (tab === 'Step-Up') {
    amount = parseFloat(data.stepUpBaseAmount);
    label = 'Monthly Investment';
  }

  if (isNaN(amount) || amount === 0 || !amount) {
    return `Please enter a valid ${label.toLowerCase()}.`;
  }
  if (amount < 100) {
    return `${label} must be at least ₹100.`;
  }

  const rate = parseFloat(data.returnRate);
  if (isNaN(rate) || rate === 0 || !rate) {
    return 'Please enter Expected Return % (1 to 50).';
  }
  if (rate < 1 || rate > 50) {
    return 'Expected Return must be between 1% and 50%.';
  }

  const period = parseFloat(data.periodValue);
  if (isNaN(period) || period === 0 || !period) {
    return 'Please enter an investment period.';
  }
  if (data.periodType === 'Years') {
    if (period < 1 || period > 50) {
      return 'Period must be between 1 and 50 years.';
    }
  } else {
    if (period < 1 || period > 600) {
      return 'Period must be between 1 and 600 months.';
    }
  }

  if (tab === 'Step-Up') {
    const stepVal = parseFloat(data.stepUpIncValue);
    if (isNaN(stepVal) || stepVal === 0 || !stepVal) {
      return 'Please enter a valid annual step-up increment.';
    }
    if (data.stepUpIncType === '%' && (stepVal < 1 || stepVal > 50)) {
      return 'Step-up percentage must be between 1% and 50%.';
    }
    if (data.stepUpIncType === '₹' && stepVal < 100) {
      return 'Step-up increment must be at least ₹100.';
    }
  }

  return null;
};

const computeSIPResults = (data, tab) => {
  const rate = Math.min(parseFloat(data.returnRate) || 0, 50);
  const period = parseFloat(data.periodValue) || 0;

  const totalMonths = data.periodType === 'Years'
    ? Math.round(period * 12)
    : Math.round(period);

  if (totalMonths <= 0) return null;

  let totalInvested = 0;
  let maturityValue = 0;
  let monthlyDetails = [];

  if (tab === 'SIP') {
    const P = parseFloat(data.sipAmount) || 0;
    const i = (rate / 100) / 12;
    const n = totalMonths;

    totalInvested = P * n;

    if (i === 0) {
      maturityValue = totalInvested;
    } else {
      maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }

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
  else if (tab === 'Lumpsum') {
    const P = parseFloat(data.lumpsumAmount) || 0;
    const r = rate / 100;
    const t = totalMonths / 12;

    totalInvested = P;
    maturityValue = P * Math.pow(1 + r, t);

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
  else if (tab === 'Step-Up') {
    const baseSip = parseFloat(data.stepUpBaseAmount) || 0;
    const i = (rate / 100) / 12;
    const stepUpFreqMonths = data.stepUpInterval === 'Every 6 Months' ? 6 : 12;
    let incVal = parseFloat(data.stepUpIncValue) || 0;
    if (data.stepUpIncType === '%') {
      incVal = Math.min(incVal, 50);
    }

    let currentSip = baseSip;
    let closing = 0;

    for (let m = 1; m <= totalMonths; m++) {
      if (m > 1 && (m - 1) % stepUpFreqMonths === 0) {
        if (data.stepUpIncType === '%') {
          currentSip = currentSip * (1 + incVal / 100);
        } else {
          currentSip = currentSip + incVal;
        }
      }

      let investmentThisMonth = 0;
      if (data.stepUpFreq === 'Monthly') {
        investmentThisMonth = currentSip;
      } else if (data.stepUpFreq === 'Quarterly') {
        if ((m - 1) % 3 === 0) {
          investmentThisMonth = currentSip * 3;
        }
      } else if (data.stepUpFreq === 'Yearly') {
        if ((m - 1) % 12 === 0) {
          investmentThisMonth = currentSip * 12;
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

  return {
    totalInvested,
    maturityValue,
    estimatedReturns,
    monthlyDetails,
    chartData: [
      { name: 'Total Invested', value: Math.max(0, totalInvested), color: '#F97316' },
      { name: 'Estimated Returns', value: Math.max(0, estimatedReturns), color: '#22C55E' }
    ]
  };
};

const SIPCalculator = ({ onBack, hasBottomNav = false }) => {
  const { theme } = useSettings();
  const { headerRef, scrollRef, tabsRef, handleScroll, syncScroll } = useHeaderScroll({ threshold: 60, tabsThreshold: 64 });

  useEffect(() => {
    const isDark = theme === 'dark';
    try {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch (err) {}
  }, [theme]);

  const [activeTab, setActiveTab] = useState('SIP'); // 'SIP' | 'Lumpsum' | 'Step-Up'
  const [formData, setFormData] = useState(() => ({ ...SIP_DEFAULTS }));
  const [results, setResults] = useState(() => computeSIPResults(SIP_DEFAULTS, 'SIP'));
  const [hasCalculated, setHasCalculated] = useState(true);
  const [validationError, setValidationError] = useState(null);
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

  const handleInputFocus = (e) => {
    const el = e.currentTarget;
    el.select();
    requestAnimationFrame(() => {
      try {
        el.select();
      } catch {}
    });
  };

  const handleInputChange = (field, value) => {
    let val = value;
    if (field === 'sipAmount' || field === 'lumpsumAmount' || field === 'stepUpBaseAmount') {
      if (val.length > 9) return;
    }
    if (field === 'returnRate') {
      if (val !== '' && parseFloat(val) > 50) return;
    }
    if (field === 'periodValue') {
      const max = formData.periodType === 'Months' ? 600 : 50;
      if (val !== '' && parseFloat(val) > max) return;
    }
    if (field === 'stepUpIncValue' && formData.stepUpIncType === '%') {
      if (val !== '' && parseFloat(val) > 50) return;
    }
    if (field === 'stepUpIncType' && value === '%') {
      const currentVal = parseFloat(formData.stepUpIncValue) || 0;
      if (currentVal > 50) {
        setFormData(prev => ({ ...prev, stepUpIncType: '%', stepUpIncValue: '50' }));
        setValidationError(null);
        return;
      }
    }
    setValidationError(null);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const calculateResults = (isSavingToHistory = false, currentData = formData, currentTab = activeTab) => {
    const error = validateSIPForm(currentData, currentTab);
    if (error) {
      setValidationError(error);
      setResults(null);
      setHasCalculated(false);
      return;
    }
    setValidationError(null);
    const computedResults = computeSIPResults(currentData, currentTab);
    setResults(computedResults);
    setHasCalculated(true);

    // Save to history list if manually calculated
    if (isSavingToHistory && computedResults) {
      const displayAmount = currentTab === 'SIP'
        ? currentData.sipAmount
        : currentTab === 'Lumpsum'
          ? currentData.lumpsumAmount
          : currentData.stepUpBaseAmount;

      const rate = Math.min(parseFloat(currentData.returnRate) || 0, 50);
      const newHistoryItem = {
        id: Date.now(),
        tab: currentTab,
        amount: parseFloat(displayAmount) || 0,
        rate: rate,
        periodValue: currentData.periodValue,
        periodType: currentData.periodType,
        totalInvested: computedResults.totalInvested,
        estimatedReturns: computedResults.estimatedReturns,
        maturityValue: computedResults.maturityValue,
        summary: `${currentTab}: ₹${parseFloat(displayAmount || 0).toLocaleString('en-IN')}${currentTab !== 'Lumpsum' ? '/mo' : ''} @ ${rate}% for ${currentData.periodValue} ${currentData.periodType}`,
        formData: { ...currentData, returnRate: String(rate) },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => {
        const updated = [newHistoryItem, ...prev.filter(x => x.summary !== newHistoryItem.summary)].slice(0, 20);
        try {
          localStorage.setItem('sip_calculator_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  // Convert Period Years <-> Months
  const handlePeriodToggle = (targetUnit) => {
    if (formData.periodType === targetUnit) return;
    const currentPeriod = parseFloat(formData.periodValue);
    let newPeriodValue = '';
    if (!isNaN(currentPeriod) && currentPeriod > 0) {
      newPeriodValue = targetUnit === 'Months'
        ? String(Math.min(600, Math.round(currentPeriod * 12)))
        : String(Math.min(50, Math.max(1, Math.round(currentPeriod / 12))));
    }

    const nextFormData = {
      ...formData,
      periodType: targetUnit,
      periodValue: newPeriodValue
    };
    setFormData(nextFormData);
    if (hasCalculated && results) {
      const err = validateSIPForm(nextFormData, activeTab);
      if (!err) {
        setValidationError(null);
        setResults(computeSIPResults(nextFormData, activeTab));
      } else {
        setValidationError(err);
        setResults(null);
        setHasCalculated(false);
      }
    }
  };

  const handlePeriodTypeToggle = () => {
    handlePeriodToggle(formData.periodType === 'Years' ? 'Months' : 'Years');
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setValidationError(null);

    requestAnimationFrame(() => {
      if (scrollRef.current) {
        syncScroll(scrollRef.current.scrollTop);
      }
    });

    // If screen is in reset/uncalculated state, preserve cleared inputs and keep results null
    if (!hasCalculated || !results) {
      return;
    }

    const err = validateSIPForm(formData, newTab);
    if (!err) {
      setResults(computeSIPResults(formData, newTab));
    } else {
      setResults(null);
      setHasCalculated(false);
    }
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

  const handleReset = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    // Blur any active input so formatted display values re-render cleanly
    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
      try {
        document.activeElement.blur();
      } catch {}
    }

    setFormData({
      sipAmount: '',
      lumpsumAmount: '',
      stepUpBaseAmount: '',
      returnRate: '',
      periodValue: '',
      periodType: 'Years',
      stepUpFreq: 'Monthly',
      stepUpInterval: 'Every 1 Year',
      stepUpIncType: '%',
      stepUpIncValue: ''
    });

    setHasCalculated(false);
    setResults(null);
    setValidationError(null);
  };

  // Native share text builder
  const handleShare = async () => {
    const currentResults = results || computeSIPResults(formData, activeTab);
    if (!currentResults) return;

    const displayAmount = activeTab === 'SIP'
      ? formData.sipAmount
      : activeTab === 'Lumpsum'
        ? formData.lumpsumAmount
        : formData.stepUpBaseAmount;

    const formattedSummary = `SIP Calculation Summary\n\n` +
      `Plan Mode: ${activeTab}\n` +
      `Investment Amount: ₹${parseFloat(displayAmount || 0).toLocaleString('en-IN')}${activeTab !== 'Lumpsum' ? ' / month' : ''}\n` +
      `Expected Return: ${formData.returnRate}% p.a.\n` +
      `Period: ${formData.periodValue} ${formData.periodType}\n` +
      `${activeTab === 'Step-Up' ? `Step-Up Rate: ${formData.stepUpIncValue}${formData.stepUpIncType === '%' ? '%' : ' ₹'} / year\n` : ''}` +
      `Total Investment: ${formatCurrency(currentResults.totalInvested)}\n` +
      `Estimated Returns: ${formatCurrency(currentResults.estimatedReturns)}\n` +
      `Maturity Value: ${formatCurrency(currentResults.maturityValue)} (${formatLakhsCrores(currentResults.maturityValue)})\n\n` +
      `Plan smart, grow wealthy! Calculated via EMI Pro.`;

    await shareAsText('SIP Calculation Summary', formattedSummary);
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
    setValidationError(null);
    setHasCalculated(true);
    setResults(computeSIPResults(item.formData, item.tab));
    setIsHistoryOpen(false);
  };
  const growthMultiplier = results
    ? (results.maturityValue / results.totalInvested || 1).toFixed(1)
    : '1.0';

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden h-full relative">
      {/* Main Content Area with Sticky Header */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar bg-transparent"
        style={{
          paddingBottom: `calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + ${hasBottomNav ? '88px' : '28px'})`
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="SIP Calculator"
          variant="soft-blue"
          onBack={onBack}
          rightActions={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                aria-label="Calculation History"
                title="History"
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
              >
                <History size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share Calculation"
                title="Share"
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
              >
                <Share2 size={20} strokeWidth={2} />
              </button>
            </div>
          }
        />

        {/* Sticky Collapsing Tab Switcher */}
        <CollapsingTabs
          ref={tabsRef}
          tabs={[
            { id: 'SIP', label: 'SIP' },
            { id: 'Lumpsum', label: 'Lumpsum' },
            { id: 'Step-Up', label: 'Step-Up' },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="px-6 pt-4">

        {/* Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-2 mb-8 shadow-sm border border-gray-100 dark:border-gray-800">
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
                  <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 flex-1 leading-[1.3]">
                    SIP Frequency
                  </label>
                  <div className="relative flex items-center flex-[1.5]">
                    <select
                      value={formData.stepUpFreq}
                      onChange={(e) => handleInputChange('stepUpFreq', e.target.value)}
                      className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3.5 shadow-sm text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right pr-4 appearance-none cursor-pointer"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Segmented control for Step Up frequency */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 flex-1 leading-[1.3]">
                    Step-Up Frequency
                  </label>
                  <div className="flex-[1.5] flex bg-[#F8FAFC] dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
                    {['Every 6 Months', 'Every 1 Year'].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => handleInputChange('stepUpInterval', interval)}
                        className={`flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${formData.stepUpInterval === interval
                          ? 'bg-primary text-white font-bold shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
                          }`}
                      >
                        {interval === 'Every 6 Months' ? '6 Mos' : '1 Yr'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step Up increment rate/amount with currency/percent switcher */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 flex-1 leading-[1.3]">
                    Step-Up Increment
                  </label>
                  <div className="flex-[1.5] flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={formData.stepUpIncType === '%' ? '10' : 'e.g. 5,000'}
                        value={formData.stepUpIncType === '%' ? formData.stepUpIncValue : formatNumericInput(formData.stepUpIncValue)}
                        onFocus={handleInputFocus}
                        onChange={(e) => {
                          const val = formData.stepUpIncType === '%'
                            ? e.target.value.replace(/[^0-9.]/g, '')
                            : parseFormattedNumber(e.target.value);
                          handleInputChange('stepUpIncValue', val);
                        }}
                        className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3.5 shadow-sm text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right pr-4"
                      />
                    </div>
                    <div className="bg-[#F8FAFC] dark:bg-gray-800 p-1 rounded-xl shadow-sm flex border border-slate-200 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleInputChange('stepUpIncType', '%')}
                        className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all ${formData.stepUpIncType === '%' ? 'bg-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
                      >%</button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('stepUpIncType', '₹')}
                        className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all ${formData.stepUpIncType === '₹' ? 'bg-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
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
              <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 flex-1 leading-[1.3]">Period</label>
              <div className="flex-[1.5] flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={formData.periodType === 'Years' ? "e.g. 10" : "e.g. 120"}
                    value={formatNumericInput(formData.periodValue)}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleInputChange('periodValue', parseFormattedNumber(e.target.value))}
                    className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3.5 shadow-sm text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right pr-4"
                  />
                </div>
                <div className="bg-[#F8FAFC] dark:bg-gray-800 p-1 rounded-xl shadow-sm flex border border-slate-200 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle('Years')}
                    className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all ${formData.periodType === 'Years' ? 'bg-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
                  >Yrs</button>
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle('Months')}
                    className={`px-3 py-1 text-[12px] font-semibold rounded-lg transition-all ${formData.periodType === 'Months' ? 'bg-primary text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
                  >Mos</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Friendly Inline Validation Message */}
        {validationError && (
          <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center gap-2.5 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Calculate & Reset Actions */}
        <div className="flex gap-3 mb-8 relative z-10">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            type="button"
            onClick={() => calculateResults(true)}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            Calculate <ArrowRight size={16} />
          </button>
        </div>

        {hasCalculated && results && (
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
                      +{Math.round(results.totalInvested > 0 ? (results.estimatedReturns / results.totalInvested) * 100 : 0)}%
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
    </div>

      {/* DETAIL SCHEDULE MODAL (Tabular Breakdown Bottom Sheet) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isDetailsOpen && results && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex flex-col justify-end"
              style={{ zIndex: 9999 }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="bg-white dark:bg-gray-800 rounded-t-[3rem] shadow-2xl h-[85%] flex flex-col overflow-hidden transition-colors duration-300 z-[10000]"
                style={{
                  zIndex: 10000,
                  paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 20px)',
                }}
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
        </AnimatePresence>,
        document.body
      )}

      {/* LOCAL CALCULATIONS HISTORY DRAWER */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex flex-col justify-end"
              style={{ zIndex: 9999 }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-white dark:bg-gray-800 rounded-t-[3rem] shadow-2xl max-h-[75%] flex flex-col overflow-hidden transition-colors duration-300 z-[10000]"
                style={{
                  zIndex: 10000,
                  paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 20px)',
                }}
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
        </AnimatePresence>,
        document.body
      )}
    </div >
  );
};

export default SIPCalculator;
