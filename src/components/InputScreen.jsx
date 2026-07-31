import React, { useState, useEffect } from 'react';
import { ChevronLeft, History, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateEMI, formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';
import VoiceInput from './VoiceInput';

const InputScreen = ({ onBack, onCalculate, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    amount: '',
    interest: '',
    period: '',
    isMonths: false,
    processingFee: '0',
  });
  
  const [emi, setEmi] = useState(0);

  useEffect(() => {
    const amount = parseFormattedNumber(formData.amount);
    const interest = parseFormattedNumber(formData.interest);
    const period = parseFormattedNumber(formData.period);

    if (amount && interest && period) {
      const calculatedEmi = calculateEMI(
        amount,
        interest,
        period,
        formData.isMonths
      );
      setEmi(calculatedEmi);
    } else {
      setEmi(0);
    }
  }, [formData]);

  const handleReset = () => {
    setFormData({
      amount: '',
      interest: '',
      period: '',
      isMonths: false,
      processingFee: '0',
    });
  };

  const handleCalculate = () => {
    if (formData.amount && formData.interest && formData.period) {
      onCalculate(formData);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-800 dark:text-gray-200 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">EMI Calculator</h1>
        </div>
        <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 active:scale-90 transition-transform">
          <History size={20} />
        </button>
      </header>

      {/* Form */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loan Amount</label>
            <VoiceInput label="Amount" onResult={(val) => setFormData(p => ({ ...p, amount: val }))} />
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 5,00,000"
            className="input-pill"
            value={formatNumericInput(formData.amount)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              if (val.length <= 9) {
                setFormData({ ...formData, amount: val });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Interest %</label>
            <VoiceInput label="Interest" onResult={(val) => setFormData(p => ({ ...p, interest: val }))} />
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 8.5"
            className="input-pill"
            value={formatNumericInput(formData.interest)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              if (val === '' || parseFloat(val) <= 50) {
                setFormData({ ...formData, interest: val });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Period</label>
              <VoiceInput label="Period" onResult={(val) => setFormData(p => ({ ...p, period: val }))} />
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl transition-colors duration-300">
              <button
                onClick={() => {
                  if (formData.isMonths) {
                    const currentPeriod = parseFloat(formData.period) || 0;
                    setFormData({ 
                      ...formData, 
                      isMonths: false, 
                      period: String(Math.round(currentPeriod / 12)) 
                    });
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !formData.isMonths ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-gray-500'
                }`}
              >
                Years
              </button>
              <button
                onClick={() => {
                  if (!formData.isMonths) {
                    const currentPeriod = parseFloat(formData.period) || 0;
                    setFormData({ 
                      ...formData, 
                      isMonths: true, 
                      period: String(currentPeriod * 12) 
                    });
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formData.isMonths ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-gray-500'
                }`}
              >
                Months
              </button>
            </div>
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder={formData.isMonths ? "e.g. 12" : "e.g. 5"}
            className="input-pill"
            value={formatNumericInput(formData.period)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              const max = formData.isMonths ? 960 : 80;
              if (val === '' || parseFloat(val) <= max) {
                setFormData({ ...formData, period: val });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-1">Monthly EMI</label>
          <div className="input-pill bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 font-bold flex items-center transition-colors duration-300">
            {emi > 0 ? `₹ ${Math.round(emi).toLocaleString()}` : 'Auto-calculated'}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-1">Processing Fee %</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            className="input-pill"
            value={formatNumericInput(formData.processingFee)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.target.value);
              if (val === '' || parseFloat(val) <= 100) {
                setFormData({ ...formData, processingFee: val });
              }
            }}
          />
        </div>

        {/* Action Buttons inside scrollable container */}
        <div className="flex gap-4 pt-4 pb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCalculate}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            Calculate
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default InputScreen;
