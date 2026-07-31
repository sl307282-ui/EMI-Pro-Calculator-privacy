import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { 
  ChevronLeft, Share2, 
  PieChart as PieChartIcon, MapPin, 
  IndianRupee, Ruler, Landmark, 
  Percent, Briefcase, Info, ArrowRight,
  History, Trash2, Clock, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { 
  formatNumericInput, 
  parseFormattedNumber,
  formatCurrency,
  calculateEMI
} from '../utils/calculatorLogic';
import { shareAsImage, shareAsText } from '../utils/exportUtils';
import VoiceInput from './VoiceInput';

const LandPurchaseCalculator = ({ onBack }) => {
  const { currency, currencySymbol } = useSettings();
  // State for form inputs
  const [formData, setFormData] = useState({
    area: '1000',
    unit: 'Sq. Ft',
    rate: '2500',
    partA: '2000000',
    partB: '500000',
    loanPercent: '80',
    registryChargePercent: '5',
    brokerFee: '1',
    isBrokerFeePercent: true, // true: %, false: ₹ per area unit
    fundingType: 'no',
    interestRate: '8.5',
    tenure: '20',
  });

  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('land_purchase_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const addToHistory = (currentFormData, calculatedResults) => {
    if (!currentFormData.area || !currentFormData.rate || !calculatedResults) return;

    const newEntry = {
      id: Date.now(),
      formData: { ...currentFormData },
      results: { ...calculatedResults },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => {
      // Prevent duplicate consecutive entries
      if (prev.length > 0) {
        const last = prev[0];
        if (
          last.formData.area === currentFormData.area &&
          last.formData.rate === currentFormData.rate &&
          last.formData.unit === currentFormData.unit &&
          last.formData.brokerFee === currentFormData.brokerFee &&
          last.formData.fundingType === currentFormData.fundingType &&
          last.formData.loanPercent === currentFormData.loanPercent &&
          last.formData.interestRate === currentFormData.interestRate &&
          last.formData.tenure === currentFormData.tenure
        ) {
          return prev;
        }
      }
      const updated = [newEntry, ...prev].slice(0, 5);
      localStorage.setItem('land_purchase_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUnitChange = (newUnit) => {
    const oldUnit = formData.unit;
    if (oldUnit === newUnit) return;

    const factors = {
      'Sq. Ft': 1.0,
      'Sq. Meter': 10.7639104,
      'Sq. Yard': 9.0,
    };

    const oldArea = parseFloat(formData.area || 0);
    const oldRate = parseFloat(formData.rate || 0);
    const oldBrokerFee = parseFloat(formData.brokerFee || 0);

    const oldFactor = factors[oldUnit] || 1.0;
    const newFactor = factors[newUnit] || 1.0;

    // Convert Area
    const areaInSqFt = oldArea * oldFactor;
    const newArea = areaInSqFt / newFactor;

    // Convert Rate
    const rateInSqFt = oldRate / oldFactor;
    const newRate = rateInSqFt * newFactor;

    // Convert Broker Fee if it's per area unit
    let newBrokerFee = formData.brokerFee;
    if (!formData.isBrokerFeePercent) {
      const brokerFeeInSqFt = oldBrokerFee / oldFactor;
      newBrokerFee = (brokerFeeInSqFt * newFactor).toFixed(2);
      newBrokerFee = parseFloat(newBrokerFee).toString();
    }

    const formatValue = (num) => {
      if (isNaN(num) || num === 0) return '0';
      const fixed = num.toFixed(2);
      return parseFloat(fixed).toString();
    };

    const formattedArea = formatValue(newArea);
    const formattedRate = formatValue(newRate);
    const newLandValue = parseFloat(formattedArea) * parseFloat(formattedRate);

    const oldLandValue = oldArea * oldRate;
    let newPartA = formData.partA;
    let newPartB = formData.partB;

    if (oldLandValue > 0) {
      const ratio = newLandValue / oldLandValue;
      newPartA = formatValue(parseFloat(formData.partA || 0) * ratio);
      newPartB = formatValue(newLandValue - parseFloat(newPartA));
    } else {
      newPartA = formatValue(newLandValue);
      newPartB = '0';
    }

    setFormData(prev => ({
      ...prev,
      unit: newUnit,
      area: formattedArea,
      rate: formattedRate,
      brokerFee: newBrokerFee,
      partA: newPartA,
      partB: newPartB,
    }));
  };

  // Auto-calculate Plot/Land Value when area or rate changes
  const landValue = parseFloat(formData.area || 0) * parseFloat(formData.rate || 0);

  // Sync Part A and Part B
  const handlePartAChange = (val) => {
    const a = parseFloat(val || 0);
    const b = landValue - a;
    const formattedB = b < 0 ? '0' : parseFloat(b.toFixed(2)).toString();
    setFormData(prev => ({ ...prev, partA: val, partB: formattedB }));
  };

  const handlePartBChange = (val) => {
    const b = parseFloat(val || 0);
    const a = landValue - b;
    const formattedA = a < 0 ? '0' : parseFloat(a.toFixed(2)).toString();
    setFormData(prev => ({ ...prev, partB: val, partA: formattedA }));
  };

  const handlePercentageChange = (field, val) => {
    if (val === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      if (parsed > 100) {
        setFormData(prev => ({ ...prev, [field]: '100' }));
      } else if (parsed < 0) {
        setFormData(prev => ({ ...prev, [field]: '0' }));
      } else {
        setFormData(prev => ({ ...prev, [field]: val }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleBrokerFeeChange = (val) => {
    if (formData.isBrokerFeePercent) {
      if (val === '') {
        setFormData(prev => ({ ...prev, brokerFee: '' }));
        return;
      }
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        if (parsed > 100) {
          setFormData(prev => ({ ...prev, brokerFee: '100' }));
        } else if (parsed < 0) {
          setFormData(prev => ({ ...prev, brokerFee: '0' }));
        } else {
          setFormData(prev => ({ ...prev, brokerFee: val }));
        }
      } else {
        setFormData(prev => ({ ...prev, brokerFee: val }));
      }
    } else {
      setFormData(prev => ({ ...prev, brokerFee: val }));
    }
  };

  const toggleBrokerFeePercent = (isPercent) => {
    setFormData(prev => {
      let fee = prev.brokerFee;
      if (isPercent) {
        const parsed = parseFloat(fee || 0);
        if (parsed > 100) {
          fee = '100';
        }
      }
      return {
        ...prev,
        isBrokerFeePercent: isPercent,
        brokerFee: fee,
      };
    });
  };

  // Update Part A/B when Land Value changes (to maintain the sum = total)
  useEffect(() => {
    const a = parseFloat(formData.partA || 0);
    const b = landValue - a;
    const formattedB = b < 0 ? '0' : parseFloat(b.toFixed(2)).toString();
    setFormData(prev => ({ ...prev, partB: formattedB }));
  }, [landValue]);

  const handleCalculate = () => {
    const totalLandValue = landValue;
    const partA = parseFloat(formData.partA || 0);
    const registryCharge = partA * (parseFloat(formData.registryChargePercent || 0) / 100);
    
    let brokerFeeAmount = 0;
    if (formData.isBrokerFeePercent) {
      brokerFeeAmount = (totalLandValue * parseFloat(formData.brokerFee || 0)) / 100;
    } else {
      brokerFeeAmount = parseFloat(formData.area || 0) * parseFloat(formData.brokerFee || 0);
    }

    let loanAmount = 0;
    let emi = 0;

    if (formData.fundingType === 'yes') {
      loanAmount = partA * (parseFloat(formData.loanPercent || 0) / 100);
      emi = calculateEMI(loanAmount, parseFloat(formData.interestRate || 8.5), parseFloat(formData.tenure || 20), false);
    }

    const totalAmountPaid = totalLandValue + brokerFeeAmount + registryCharge;

    const chartData = [
      { name: 'Land Amount', value: totalLandValue, color: '#F97316' }, // Orange
      { name: 'Registry Fees', value: registryCharge, color: '#22C55E' }, // Green
      { name: 'Broker Charges', value: brokerFeeAmount, color: '#3B82F6' }, // Blue
    ];

    const calculated = {
      fundingType: formData.fundingType,
      totalLandValue,
      registryCharge,
      brokerFeeAmount,
      loanAmount,
      emi,
      interestRate: formData.interestRate,
      tenure: formData.tenure,
      loanPercent: formData.loanPercent,
      totalAmountPaid,
      chartData: chartData.filter(item => item.value > 0)
    };

    setResults(calculated);
    setShowResults(true);
    addToHistory(formData, calculated);
  };

  const handleReset = () => {
    setFormData({
      area: '0',
      unit: 'Sq. Ft',
      rate: '0',
      partA: '0',
      partB: '0',
      loanPercent: '80',
      registryChargePercent: '0',
      brokerFee: '0',
      isBrokerFeePercent: true,
      fundingType: 'no',
      interestRate: '8.5',
      tenure: '20',
    });
    setResults(null);
    setShowResults(false);
  };

  const handleBackClick = () => {
    if (showResults) {
      setShowResults(false);
    } else {
      onBack();
    }
  };

  const handleShare = () => {
    if (!results) return;
    let text = `Land Purchase Calculation Details:\n\n` +
               `Total Land Value: ${formatCurrency(results.totalLandValue, currency)}\n` +
               `Registry Fees: ${formatCurrency(results.registryCharge, currency)}\n` +
               `Broker Charges: ${formatCurrency(results.brokerFeeAmount, currency)}\n`;
               
    if (results.fundingType === 'yes') {
      text += `\n*Funding Details*\n` +
              `Loan Amount: ${formatCurrency(results.loanAmount, currency)}\n` +
              `Monthly EMI: ${formatCurrency(results.emi, currency)}/month\n`;
    }
    
    text += `\nFinal Purchase Amount: ${formatCurrency(results.totalAmountPaid, currency)}\n`;
    
    if (results.fundingType === 'yes') {
      text += `Initial Amount Payable: ${formatCurrency(results.totalAmountPaid - results.loanAmount, currency)}\n`;
    }
    
    text += `\nShared via EMI Pro App`;
    shareAsText('Land Purchase Calculation', text);
  };

  const partA = parseFloat(formData.partA || 0);
  const loanPercent = parseFloat(formData.loanPercent || 0);
  const calculatedLoanAmount = partA * (loanPercent / 100);

  const interestRate = parseFloat(formData.interestRate || 8.5);
  const tenureYears = parseFloat(formData.tenure || 20);
  const calculatedEmi = calculateEMI(calculatedLoanAmount, interestRate, tenureYears, false);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-20 shadow-sm border-b border-gray-100 dark:border-gray-805 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={handleBackClick} 
            className="p-2 -ml-2 text-gray-800 dark:text-gray-200 active:scale-90 transition-transform"
          >
            <ChevronLeft size={24} className="pointer-events-none" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white animate-fade-in">land purchase calculation</h1>
        </div>
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="text-gray-800 dark:text-gray-200 active:scale-90 transition-transform relative"
        >
          <History size={22} />
          {history.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[8px] font-black text-white w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-gray-900">
              {history.length}
            </span>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-24">
        {!showResults ? (
          <>
            {/* Section 1: Property Details */}
            <section className="bg-white dark:bg-gray-805 rounded-3xl p-4 shadow-soft space-y-3.5 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-blue-600" />
                <h2 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Property Details</h2>
              </div>

              {/* Area Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Area of Land/Plot</label>
                  <div className="flex items-center gap-2">
                    <VoiceInput label="Area" onResult={(val) => setFormData(prev => ({ ...prev, area: val }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-pill flex-1 h-[44px] font-bold text-base px-4 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    value={formatNumericInput(formData.area)}
                    onChange={(e) => setFormData({ ...formData, area: parseFormattedNumber(e.target.value) })}
                  />
                  <select 
                    className="w-28 h-[44px] bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white border border-transparent dark:border-gray-700"
                    value={formData.unit}
                    onChange={(e) => handleUnitChange(e.target.value)}
                  >
                    <option value="Sq. Meter">Sq. Meter</option>
                    <option value="Sq. Ft">Sq. Ft</option>
                    <option value="Sq. Yard">Sq. Yard</option>
                  </select>
                </div>
              </div>

              {/* Rate Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Rate ({currencySymbol} per {formData.unit})</label>
                  <VoiceInput label="Rate" onResult={(val) => setFormData(prev => ({ ...prev, rate: val }))} />
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input-pill h-[44px] font-bold text-base px-4 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                  value={formatNumericInput(formData.rate)}
                  onChange={(e) => setFormData({ ...formData, rate: parseFormattedNumber(e.target.value) })}
                />
              </div>

              {/* Plot/Land Value (Read-only) */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-3 border border-blue-100/50 dark:border-gray-800/40 flex justify-between items-center transition-colors duration-300">
                <div>
                  <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Plot / Land Value</p>
                  <p className="text-lg font-black text-blue-900 dark:text-blue-300 mt-0.5">
                    {formatCurrency(landValue, currency)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                  <span className="text-base font-black">{currencySymbol}</span>
                </div>
              </div>
            </section>

            {/* Section 2: Payment Structure */}
            <section className="bg-white dark:bg-gray-850 rounded-3xl p-5 shadow-soft space-y-5 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={18} className="text-indigo-600 animate-pulse" />
                <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Payment Structure</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Part A (Registry)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-pill h-[52px] font-bold text-base bg-indigo-50/30 dark:bg-indigo-950/20 dark:text-white dark:border-gray-700"
                    value={formatNumericInput(formData.partA)}
                    onChange={(e) => handlePartAChange(parseFormattedNumber(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Part B (Cash)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-pill h-[52px] font-bold text-base bg-emerald-50/30 dark:bg-emerald-950/20 dark:text-white dark:border-gray-700"
                    value={formatNumericInput(formData.partB)}
                    onChange={(e) => handlePartBChange(parseFormattedNumber(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-550 font-medium italic text-center">
                Note: Part A + Part B must equal total Land Value
              </p>
            </section>            {/* Section 3: Financing Options */}
            <section className="bg-white dark:bg-gray-850 rounded-3xl p-5 shadow-soft border border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Landmark size={18} className="text-purple-600" />
                  <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Home Loan Required</h2>
                </div>

                <div className="w-32 h-[40px] flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl relative border border-transparent dark:border-gray-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, fundingType: 'no' }))}
                    className={`flex-1 relative z-10 rounded-lg text-[10px] font-black transition-colors ${formData.fundingType === 'no' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                  >
                    {formData.fundingType === 'no' && (
                      <motion.div layoutId="funding-type" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm -z-10" />
                    )}
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, fundingType: 'yes' }))}
                    className={`flex-1 relative z-10 rounded-lg text-[10px] font-black transition-colors ${formData.fundingType === 'yes' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                  >
                    {formData.fundingType === 'yes' && (
                      <motion.div layoutId="funding-type" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm -z-10" />
                    )}
                    Yes
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {formData.fundingType === 'yes' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden space-y-4"
                  >
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">🏦</span>
                        <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loan Details</h3>
                      </div>

                      {/* Loan Amount (%) */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-[0.7] space-y-0.5">
                          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase leading-tight">Loan Amount (%)</label>
                          <p className="text-[8px] text-gray-400 dark:text-gray-550 font-medium italic leading-tight">On Part A only</p>
                        </div>
                        <div className="flex-[1.3] flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              className="input-pill h-[44px] font-black text-sm px-3 pr-7 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                              value={formData.loanPercent}
                              onChange={(e) => handlePercentageChange('loanPercent', e.target.value)}
                            />
                            <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-550" />
                          </div>
                        </div>
                      </div>

                      {/* Calculated Loan Amount Display */}
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800/40">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase">Loan Amount</span>
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                          {formatCurrency(calculatedLoanAmount, currency)}
                        </span>
                      </div>

                      {/* Interest Rate (%) */}
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase flex-1">Interest Rate (%)</label>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            step="0.1"
                            className="input-pill h-[44px] font-black text-sm px-3 pr-7 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                            value={formData.interestRate}
                            onChange={(e) => handlePercentageChange('interestRate', e.target.value)}
                          />
                          <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-550" />
                        </div>
                      </div>

                      {/* Tenure (Years) */}
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[11px] font-bold text-gray-505 dark:text-gray-400 uppercase flex-1">Tenure (Years)</label>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            className="input-pill h-[44px] font-black text-sm px-3 pr-14 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                            value={formData.tenure}
                            onChange={(e) => setFormData(prev => ({ ...prev, tenure: e.target.value }))}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 dark:text-gray-550 uppercase">Years</span>
                        </div>
                      </div>



                      {/* Calculated Monthly EMI Display */}
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100/50 dark:border-gray-800/40 flex justify-between items-center mt-2">
                        <div>
                          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">EMI</p>
                          <p className="text-base font-black text-blue-900 dark:text-blue-300 mt-0.5">
                            {formatCurrency(calculatedEmi, currency)}/month
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                          <Landmark size={16} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Section 4: Charges & Fees */}
            <section className="bg-white dark:bg-gray-850 rounded-3xl p-5 shadow-soft space-y-5 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Percent size={18} className="text-orange-600" />
                <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Charges & Fees</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 uppercase">Registry Charge (%)</label>
                    <p className="text-[9px] text-gray-400 dark:text-gray-555 font-medium italic">Applied to Part A amount</p>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="0.1"
                      className="input-pill h-[48px] font-bold pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                      value={formData.registryChargePercent}
                      onChange={(e) => handlePercentageChange('registryChargePercent', e.target.value)}
                    />
                    <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-555" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-505 dark:text-gray-400 uppercase">Broker Fees</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input-pill h-[48px] font-bold pr-8 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        value={formData.brokerFee}
                        onChange={(e) => handleBrokerFeeChange(e.target.value)}
                      />
                      {formData.isBrokerFeePercent && <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-555" />}
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl relative w-36 h-[48px] border border-transparent dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => toggleBrokerFeePercent(true)}
                        className={`flex-1 relative z-10 rounded-xl text-[9px] font-black transition-colors ${formData.isBrokerFeePercent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {formData.isBrokerFeePercent && <motion.div layoutId="broker-type" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10" />}
                        % Value
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBrokerFeePercent(false)}
                        className={`flex-1 relative z-10 rounded-xl text-[9px] font-black transition-colors ${!formData.isBrokerFeePercent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {!formData.isBrokerFeePercent && <motion.div layoutId="broker-type" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10" />}
                        {currencySymbol} / {formData.unit.split(' ')[1] || 'Unit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Calculate Button & Reset Button row */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-300 active:scale-95 transition-transform flex items-center justify-center border border-gray-200 dark:border-gray-700 h-[64px]"
                title="Reset All Inputs"
              >
                <RotateCcw size={20} className="pointer-events-none" />
              </button>
              <button
                type="button"
                onClick={handleCalculate}
                className="btn-primary flex-1 h-[64px] rounded-full text-lg font-black shadow-xl shadow-blue-100 dark:shadow-none"
              >
                Calculate Total Cost
              </button>
            </div>
          </>
        ) : (
          results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Cost Breakdown - Renders at the TOP (up side) */}
              <div className="bg-white dark:bg-gray-805 rounded-[2.5rem] overflow-hidden shadow-soft border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <div className="p-6 bg-gray-50/50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <Info size={18} className="text-blue-600 dark:text-blue-400" />
                  <h2 className="font-black text-gray-800 dark:text-white text-sm uppercase tracking-wider">Cost Breakdown</h2>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Total Land/Plot Amount', value: results.totalLandValue },
                    { label: 'Registry Fees', value: results.registryCharge },
                    { label: 'Broker Charges', value: results.brokerFeeAmount },
                    ...(results.fundingType === 'yes' ? [
                    ] : []),
                    { label: 'Final Purchase Amount', value: results.totalAmountPaid, isBold: true, hasBg: true },
                  ].map((row, i) => (
                    <div 
                      key={i} 
                      className={`flex justify-between items-center p-4 rounded-2xl ${
                        row.hasBg ? 'bg-blue-600 dark:bg-blue-700 text-white mt-6 shadow-lg shadow-blue-100 dark:shadow-none' : 'text-gray-600 dark:text-gray-300 border-b border-gray-55 dark:border-gray-800 last:border-0'
                      }`}
                    >
                      <span className={`text-xs ${row.isBold ? 'font-black' : 'font-bold'}`}>{row.label}</span>
                      <span className={`${row.hasBg ? 'text-xl' : 'text-base'} font-black`}>
                        {formatCurrency(row.value, currency)}
                      </span>
                    </div>
                  ))}

                  {/* Monthly EMI Result Block */}
                  {results.fundingType === 'yes' && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-2xl flex justify-between items-center shadow-sm animate-fade-in">
                      <div>
                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">Estimated Monthly EMI</p>
                        <p className="text-base font-black text-purple-900 dark:text-purple-300 mt-0.5">
                          {formatCurrency(results.emi, currency)}/month
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 dark:text-gray-550 font-bold uppercase">
                          {results.interestRate}% Int | {results.tenure} Yr
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Initially Amount Payable Block */}
                  {results.fundingType === 'yes' && (
                    <div className="mt-4 p-4 bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl flex justify-between items-center shadow-lg shadow-emerald-100 dark:shadow-none">
                      <span className="text-xs font-black">Initial Amount Payable</span>
                      <span className="text-xl font-black">
                        {formatCurrency(results.totalAmountPaid - results.loanAmount, currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-white dark:bg-gray-855 rounded-[2.5rem] p-6 shadow-soft border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                <h3 className="text-sm font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <PieChartIcon size={18} className="text-blue-600 dark:text-blue-400" />
                  Visual Analysis
                </h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={results.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {results.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px 20px' }}
                        itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                        formatter={(val) => formatCurrency(val, currency)}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(value, entry) => (
                          <span className="text-[10px] font-black text-gray-500 dark:text-gray-450 uppercase tracking-wider ml-1">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend with percentages */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {results.chartData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter truncate">{item.name}</p>
                        <p className="text-[11px] font-black text-gray-900 dark:text-white">
                          {((item.value / results.totalAmountPaid) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share & Back Buttons flex container */}
              <div className="flex flex-col gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="btn-primary w-full h-[64px] rounded-full text-lg font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-none border-2 border-blue-100 dark:border-blue-900/50 flex items-center justify-center gap-2"
                >
                  <Share2 size={20} className="pointer-events-none" />
                  Share Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowResults(false)}
                  className="w-full h-[64px] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-black text-base active:scale-95 transition-transform flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-750"
                >
                  <ChevronLeft size={18} className="pointer-events-none" />
                  Back to Edit Inputs
                </button>
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* Premium History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-40 cursor-pointer"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-white dark:bg-gray-900 rounded-t-[2.5rem] shadow-premium z-50 flex flex-col overflow-hidden border-t border-slate-100 dark:border-gray-800 transition-colors"
            >
              {/* Pull Bar */}
              <div className="w-12 h-1 bg-slate-200 dark:bg-gray-700 rounded-full mx-auto my-3 shrink-0" />

              {/* Drawer Header */}
              <div className="px-6 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <Clock size={18} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                  <h3 className="text-base font-black text-slate-800 dark:text-white">Calculation History</h3>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('land_purchase_history');
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                )}
              </div>

              {/* Drawer List */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3.5">
                {history.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-300 dark:text-gray-600">
                      <Clock size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">No history found</p>
                      <p className="text-[10px] font-semibold text-slate-300 dark:text-gray-600">Calculated properties will appear here</p>
                    </div>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setFormData(item.formData);
                        setResults(item.results);
                        setShowResults(true);
                        setIsHistoryOpen(false);
                      }}
                      className="w-full text-left bg-slate-50 dark:bg-gray-850 hover:bg-blue-50/40 dark:hover:bg-gray-800/40 border border-slate-100 dark:border-gray-800 rounded-2xl p-4 flex justify-between items-center gap-4 transition-all hover:scale-[1.01] active:scale-99 group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                            {item.formData.area} {item.formData.unit}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-gray-505">
                            {item.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-gray-505 uppercase block leading-tight">Rate</span>
                            <span className="text-xs font-extrabold text-slate-700 dark:text-gray-300">{formatCurrency(parseFloat(item.formData.rate), currency)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-gray-555 uppercase block leading-tight">Total Cost</span>
                            <span className="text-sm font-black text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform block">
                              {formatCurrency(item.results.totalAmountPaid, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandPurchaseCalculator;
