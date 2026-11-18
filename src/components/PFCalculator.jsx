import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, RotateCcw, Share2, Info, ArrowRight, Vault } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumericInput, parseFormattedNumber, formatCurrency } from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const InputRow = ({ label, field, symbol, placeholder, isNumeric = true, formData, setFormData }) => (
  <div className="flex items-center justify-between gap-3 mb-4">
    <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 w-28 flex-shrink-0 leading-[1.3]">
      {label}
    </label>
    <div className="flex-1 relative">
      <input
        type={isNumeric ? 'text' : 'number'}
        inputMode={isNumeric ? 'decimal' : undefined}
        className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 focus:border-blue-500 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-all pr-12 text-right"
        placeholder={placeholder}
        value={isNumeric ? formatNumericInput(formData[field]) : formData[field]}
        onChange={(e) => {
          const val = isNumeric ? parseFormattedNumber(e.target.value) : e.target.value;
          setFormData(prev => ({ ...prev, [field]: val }));
        }}
      />
      {symbol && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">
          {symbol}
        </span>
      )}
    </div>
  </div>
);

const PFCalculator = ({ onBack }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const [formData, setFormData] = useState({
    salary: '50000',
    empContribution: '12',
    currentBalance: '0',
    interestRate: '8.25',
    age: '25',
    retirementAge: '58'
  });

  const [results, setResults] = useState(null);

  const calculatePF = () => {
    const salary = parseFloat(formData.salary);
    const empRate = parseFloat(formData.empContribution) / 100;
    const employerRate = 0.0367; // Fixed 3.67%
    const interestRate = parseFloat(formData.interestRate) / 100;
    const currentAge = parseInt(formData.age);
    const retirementAge = parseInt(formData.retirementAge);
    let balance = parseFloat(formData.currentBalance);

    if (isNaN(salary) || isNaN(interestRate) || isNaN(currentAge) || isNaN(retirementAge)) return;

    const yearsToRetire = retirementAge - currentAge;
    if (yearsToRetire <= 0) return;

    let totalEmpContribution = 0;
    let totalEmployerContribution = 0;
    let totalInterest = 0;

    const monthlyEmpCont = salary * empRate;
    const monthlyEmployerCont = salary * employerRate;
    const totalMonthlyCont = monthlyEmpCont + monthlyEmployerCont;

    for (let year = 1; year <= yearsToRetire; year++) {
      let openingBalance = balance;
      let yearlyContribution = totalMonthlyCont * 12;
      
      // EPF Interest is calculated on the monthly opening balance
      // Simplified: Interest on opening balance + Interest on contributions (average 6 months)
      let yearlyInterest = (openingBalance * interestRate) + (yearlyContribution * (interestRate / 2));
      
      balance += yearlyContribution + yearlyInterest;
      totalEmpContribution += monthlyEmpCont * 12;
      totalEmployerContribution += monthlyEmployerCont * 12;
      totalInterest += yearlyInterest;
    }

    setResults({
      totalCorpus: balance,
      totalEmpContribution,
      totalEmployerContribution,
      totalInterest
    });
  };

  useEffect(() => {
    calculatePF();
  }, [formData]);

  const handleReset = () => {
    setFormData({
      salary: '50000',
      empContribution: '12',
      currentBalance: '0',
      interestRate: '8.25',
      age: '25',
      retirementAge: '58'
    });
    setResults(null);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `PF (EPF) Calculation Details:\n\n` +
                 `Monthly Salary: ${formatCurrency(formData.salary)}\n` +
                 `Age: ${formData.age} | Retirement: ${formData.retirementAge}\n` +
                 `Total Corpus at Retirement: ${formatCurrency(results.totalCorpus)}\n` +
                 `Total Interest: ${formatCurrency(results.totalInterest)}\n` +
                 `Total Employee Contribution: ${formatCurrency(results.totalEmpContribution)}\n` +
                 `Total Employer Contribution: ${formatCurrency(results.totalEmployerContribution)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('PF Calculation', text);
  };



  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden h-full relative">
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="PF Calculator"
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
        <div className="bg-blue-50/50 rounded-[2.5rem] p-6 border border-blue-100/50 mb-8">
          <InputRow label="Monthly Salary" field="salary" symbol="₹" formData={formData} setFormData={setFormData} />
          <InputRow label="Employee Share" field="empContribution" symbol="%" formData={formData} setFormData={setFormData} />
          <InputRow label="Employer Share" field="employerFixed" placeholder="3.67%" isNumeric={false} formData={formData} setFormData={setFormData} />
          <div className="h-px bg-blue-100/30 my-4" />
          <InputRow label="Current Balance" field="currentBalance" symbol="₹" formData={formData} setFormData={setFormData} />
          <InputRow label="Interest Rate" field="interestRate" symbol="%" formData={formData} setFormData={setFormData} />
          <div className="grid grid-cols-2 gap-4">
            <InputRow label="Current Age" field="age" symbol="Yr" formData={formData} setFormData={setFormData} />
            <InputRow label="Retire Age" field="retirementAge" symbol="Yr" formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button 
            onClick={handleReset}
            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            onClick={calculatePF}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Calculate <ArrowRight size={16} />
          </button>
        </div>

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-12"
          >
            <div className="text-center bg-gray-900 rounded-[2.5rem] py-8 px-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <Vault size={120} className="absolute -right-8 -bottom-8 rotate-12" />
              </div>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Corpus at Retirement</p>
              <h2 className="text-3xl font-black text-white">{formatCurrency(results.totalCorpus)}</h2>
            </div>

            <div className="bg-white border-2 border-gray-50 rounded-[2rem] overflow-hidden">
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  <tr className="flex justify-between p-5">
                    <td className="text-xs font-bold text-gray-400 uppercase">Employee Cont.</td>
                    <td className="text-sm font-black text-gray-900">{formatCurrency(results.totalEmpContribution)}</td>
                  </tr>
                  <tr className="flex justify-between p-5">
                    <td className="text-xs font-bold text-gray-400 uppercase">Employer Cont.</td>
                    <td className="text-sm font-black text-gray-900">{formatCurrency(results.totalEmployerContribution)}</td>
                  </tr>
                  <tr className="flex justify-between p-5">
                    <td className="text-xs font-bold text-gray-400 uppercase">Interest Earned</td>
                    <td className="text-sm font-black text-emerald-600">{formatCurrency(results.totalInterest)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button 
              onClick={handleShare}
              className="w-full py-5 border-2 border-dashed border-blue-200 rounded-[2rem] text-blue-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:bg-blue-50 transition-all"
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

export default PFCalculator;
