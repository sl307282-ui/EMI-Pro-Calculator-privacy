import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, History, RotateCcw, Share2, 
  Info, ArrowRight, PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
  formatNumericInput, 
  parseFormattedNumber 
} from '../utils/calculatorLogic';
import { shareAsImage, shareAsText } from '../utils/exportUtils';
import VoiceInput from './VoiceInput';

const SegmentedControl = ({ options, activeId, onChange, layoutId, className }) => {
  return (
    <div className={`flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl relative h-[44px] flex-shrink-0 transition-colors duration-300 ${className || 'w-28'}`}>
      <LayoutGroup id={layoutId}>
        {options.map((option) => (
          <button
            key={String(option.id)}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex-1 relative z-10 rounded-xl text-[10px] font-bold transition-colors ${
              activeId === option.id ? 'text-primary dark:text-blue-400 font-extrabold' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {activeId === option.id && (
              <motion.div
                layoutId={`${layoutId}-bg`}
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-xl shadow-sm -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {option.label}
          </button>
        ))}
      </LayoutGroup>
    </div>
  );
};

const AdvanceEMICalculator = ({ onBack, onDetails }) => {
  const [formData, setFormData] = useState({
    amount: '',
    interest: '',
    interestType: 'reducing', 
    period: '',
    isMonths: false,
    procFee: '',
    isProcFeePercent: true, 
    gstOnInterest: '0',
    emiTiming: 'arrears', 
  });

  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const calculateAdvanceEMI = () => {
    const P = parseFloat(formData.amount);
    const annualRate = parseFloat(formData.interest);
    const r = annualRate / 12 / 100;
    const n = formData.isMonths ? parseInt(formData.period) : parseInt(formData.period) * 12;
    
    if (!P || !annualRate || !n) return;

    let emi = 0;
    let totalInterest = 0;

    if (formData.interestType === 'reducing') {
      if (formData.emiTiming === 'arrears') {
        emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      } else {
        emi = (P * r * Math.pow(1 + r, n - 1)) / (Math.pow(1 + r, n) - 1);
      }
      
      let balance = P;
      let totalInt = 0;
      if (formData.emiTiming === 'advance') {
        balance -= emi; 
      }
      for (let i = 1; i <= n; i++) {
        const interest = balance * r;
        totalInt += interest;
        const principal = emi - interest;
        balance -= principal;
      }
      totalInterest = totalInt;
    } else {
      const T = n / 12;
      totalInterest = P * (annualRate / 100) * T;
      emi = (P + totalInterest) / n;
    }

    const procFeeVal = parseFloat(formData.procFee) || 0;
    const procFeeAmount = formData.isProcFeePercent 
      ? P * (procFeeVal / 100) 
      : procFeeVal;
    
    const gstOnProcFee = procFeeAmount * 0.18;
    const gstOnInterestVal = totalInterest * (parseFloat(formData.gstOnInterest) / 100);
    
    const totalPayment = P + totalInterest + procFeeAmount + gstOnProcFee + gstOnInterestVal;

    const data = [
      { name: 'Principal', value: P, color: '#F97316' }, 
      { name: 'Interest', value: totalInterest, color: '#22C55E' }, 
    ];

    setResults({
      emi,
      totalInterest,
      procFeeAmount,
      gstOnInterest: gstOnInterestVal,
      gstOnProcFee,
      totalPayment,
      chartData: data,
      raw: { ...formData, n, r, p: P, annualRate }
    });
    setShowResults(true);
  };

  const handleReset = () => {
    setFormData({
      amount: '',
      interest: '',
      interestType: 'reducing',
      period: '',
      isMonths: false,
      procFee: '',
      isProcFeePercent: true,
      gstOnInterest: '0',
      emiTiming: 'arrears',
    });
    setShowResults(false);
    setResults(null);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `Advance EMI Calculation Details:\n\n` +
                 `Loan Amount: ₹${Math.round(results.raw.p).toLocaleString()}\n` +
                 `Monthly EMI: ₹${Math.round(results.emi).toLocaleString()}\n` +
                 `Total Interest: ₹${Math.round(results.totalInterest).toLocaleString()}\n` +
                 `Total Payment: ₹${Math.round(results.totalPayment).toLocaleString()}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Advance EMI Calculation', text);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-800 dark:text-gray-200 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Advance EMI</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 active:scale-90 transition-transform"
          >
            <Share2 size={20} />
          </button>
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 active:scale-90 transition-transform">
            <History size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <section className="bg-white dark:bg-gray-800/40 rounded-3xl p-5 shadow-soft space-y-6 border border-gray-100 dark:border-gray-800">
          {/* Loan Amount */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="loanAmount" className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer">Loan Amount</label>
              <VoiceInput label="Amount" onResult={(val) => setFormData(p => ({ ...p, amount: val }))} />
            </div>
            <div className="flex-1 relative">
              <input
                id="loanAmount"
                type="text"
                inputMode="decimal"
                className="input-pill text-left font-bold bg-gray-100/50 dark:bg-gray-800 dark:text-white h-[48px] px-4"
                value={formatNumericInput(formData.amount)}
                onChange={(e) => {
                  const val = parseFormattedNumber(e.target.value);
                  if (val.length <= 9) {
                    setFormData({ ...formData, amount: val });
                  }
                }}
              />
            </div>
          </div>

          {/* Interest % */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="interestRate" className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer">Interest %</label>
              <VoiceInput label="Interest" onResult={(val) => setFormData(p => ({ ...p, interest: val }))} />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                id="interestRate"
                type="number"
                step="any"
                className="input-pill flex-1 text-left font-bold bg-gray-100/50 dark:bg-gray-800 dark:text-white h-[48px] px-4 min-w-[60px]"
                value={formData.interest}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) <= 50) {
                    setFormData({ ...formData, interest: val });
                  }
                }}
              />
              <SegmentedControl 
                layoutId="interestType"
                options={[{id: 'reducing', label: 'Reducing'}, {id: 'flat', label: 'Flat'}]}
                activeId={formData.interestType}
                onChange={(id) => setFormData({ ...formData, interestType: id })}
              />
            </div>
          </div>

          {/* Period */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="loanPeriod" className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer">Period</label>
              <VoiceInput label="Period" onResult={(val) => setFormData(p => ({ ...p, period: val }))} />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                id="loanPeriod"
                type="text"
                inputMode="numeric"
                className="input-pill flex-1 text-left font-bold bg-gray-100/50 dark:bg-gray-800 dark:text-white h-[48px] px-4 min-w-[60px]"
                value={formatNumericInput(formData.period)}
                onChange={(e) => {
                  const val = parseFormattedNumber(e.target.value);
                  const max = formData.isMonths ? 960 : 80;
                  if (val === '' || parseFloat(val) <= max) {
                    setFormData({ ...formData, period: val });
                  }
                }}
              />
              <SegmentedControl 
                layoutId="periodType"
                options={[{id: false, label: 'Years'}, {id: true, label: 'Months'}]}
                activeId={formData.isMonths}
                onChange={(id) => {
                  const currentPeriod = parseFloat(formData.period) || 0;
                  let newPeriod = currentPeriod;
                  if (id === true && !formData.isMonths) {
                    newPeriod = currentPeriod * 12;
                  } else if (id === false && formData.isMonths) {
                    newPeriod = Math.round(currentPeriod / 12);
                  }
                  setFormData({ ...formData, isMonths: id, period: String(newPeriod) });
                }}
              />
            </div>
          </div>

          {/* Processing Fee */}
          <div className="flex items-center gap-3">
            <label htmlFor="procFee" className="text-xs font-bold text-gray-500 dark:text-gray-400 w-20 flex-shrink-0 cursor-pointer">
              Processing<br />Fees
            </label>
            <div className="flex-1 flex gap-2">
              <input
                id="procFee"
                type="text"
                inputMode="decimal"
                className="input-pill flex-1 text-left font-bold bg-gray-100/50 dark:bg-gray-800 dark:text-white h-[48px] px-3 min-w-[80px]"
                value={formatNumericInput(formData.procFee)}
                onChange={(e) => {
                  const val = parseFormattedNumber(e.target.value);
                  if (val === '') {
                    setFormData({ ...formData, procFee: '' });
                  } else {
                    const isValid = formData.isProcFeePercent 
                      ? parseFloat(val) <= 100 
                      : val.replace(/[^0-9]/g, '').length <= 6;
                    if (isValid) {
                      setFormData({ ...formData, procFee: val });
                    }
                  }
                }}
              />
              <SegmentedControl 
                layoutId="procFeeType"
                options={[{id: true, label: '%'}, {id: false, label: '₹'}]}
                activeId={formData.isProcFeePercent}
                onChange={(id) => {
                  let val = formData.procFee;
                  if (id === true && parseFloat(val) > 100) {
                    val = '100';
                  }
                  setFormData({ ...formData, isProcFeePercent: id, procFee: val });
                }}
                className="w-20"
              />
            </div>
          </div>

          {/* GST on Interest */}
          <div className="flex items-center gap-3">
            <label htmlFor="gstInterest" className="text-xs font-bold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0 cursor-pointer leading-tight">GST on Int.(%)</label>
            <div className="flex-1 relative">
              <input
                id="gstInterest"
                type="text"
                inputMode="decimal"
                className="input-pill text-left font-bold bg-gray-100/50 dark:bg-gray-800 dark:text-white h-[48px] px-4"
                value={formatNumericInput(formData.gstOnInterest)}
                onChange={(e) => {
                  const val = parseFormattedNumber(e.target.value);
                  if (val === '' || parseFloat(val) <= 100) {
                    setFormData({ ...formData, gstOnInterest: val });
                  }
                }}
              />
            </div>
          </div>

          {/* Radio Options */}
          <div className="pt-2 flex justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer group flex-1">
              <div 
                onClick={() => setFormData({ ...formData, emiTiming: 'arrears' })}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  formData.emiTiming === 'arrears' ? 'border-primary' : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                {formData.emiTiming === 'arrears' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <span className={`text-[12px] font-bold whitespace-nowrap ${formData.emiTiming === 'arrears' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                EMI In Arrears
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group flex-1">
              <div 
                onClick={() => setFormData({ ...formData, emiTiming: 'advance' })}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  formData.emiTiming === 'advance' ? 'border-primary' : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                {formData.emiTiming === 'advance' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
              </div>
              <span className={`text-[12px] font-bold whitespace-nowrap ${formData.emiTiming === 'advance' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                EMI In Advance
              </span>
            </label>
          </div>
        </section>

        <div className="flex gap-4">
          <button
            onClick={handleReset}
            className="btn-secondary flex-1 h-[56px] rounded-full bg-slate-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Reset
          </button>
          <button
            onClick={calculateAdvanceEMI}
            className="btn-primary flex-1 h-[56px] rounded-full font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/40"
          >
            Calculate
          </button>
        </div>

        <AnimatePresence>
          {showResults && results && (
            <motion.div
              id="advance-result-capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
            >
              <div className="bg-white dark:bg-gray-800/40 rounded-3xl overflow-hidden shadow-soft border border-gray-100 dark:border-gray-800">
                <div className="p-5 bg-gray-50/50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <Info size={18} className="text-primary dark:text-blue-400" />
                  <h2 className="font-bold text-gray-800 dark:text-white text-sm">Summary Analysis</h2>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Monthly EMI', value: results.emi, isBold: true, color: 'text-primary dark:text-blue-400' },
                    { label: 'Total Interest', value: results.totalInterest },
                    { label: 'Processing Fees', value: results.procFeeAmount },
                    { label: 'GST On Interest', value: results.gstOnInterest },
                    { label: 'GST On Proc Fees', value: results.gstOnProcFee },
                    { label: 'Total Payment', value: results.totalPayment, isBold: true, hasBg: true },
                  ].map((row, i) => (
                    <div 
                      key={i} 
                      className={`flex justify-between items-center p-3 rounded-2xl ${
                        row.hasBg ? 'bg-blue-600 dark:bg-blue-700 text-white mt-4' : 'text-gray-600 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800 last:border-0'
                      }`}
                    >
                      <span className={`text-sm ${row.isBold ? 'font-bold' : 'font-medium'}`}>{row.label}</span>
                      <span className={`text-base font-bold ${row.color || ''}`}>
                        ₹ {Math.round(row.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/40 rounded-3xl p-6 shadow-soft border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-orange-500" />
                  Distribution Breakdown
                </h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={results.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {results.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(val) => `₹ ${Math.round(val).toLocaleString()}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleShare}
                  className="btn-primary flex-1 h-[64px] rounded-full"
                >
                  <Share2 size={20} />
                  Share
                </button>
                <button
                  onClick={() => onDetails(results)}
                  className="btn-primary flex-1 h-[64px] rounded-full"
                >
                  Details
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvanceEMICalculator;
