import React, { useState } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  formatNumericInput, 
  parseFormattedNumber 
} from '../utils/calculatorLogic';

const PrePaymentROI = ({ onBack }) => {
  const [mode, setMode] = useState('prepayment'); // 'prepayment' or 'roi'
  const [formData, setFormData] = useState({
    outstanding: '1000000',
    rate: '10',
    emi: '21247',
    prepayment: '100000',
    revisedRate: '11',
  });

  const [results, setResults] = useState(null);

  const calculateResults = () => {
    const P = parseFloat(formData.outstanding);
    const annualRate = parseFloat(formData.rate);
    const r = annualRate / 12 / 100;
    const EMI = parseFloat(formData.emi);

    if (!P || !annualRate || !EMI || EMI <= P * r) {
      alert("Invalid input or EMI too low to cover interest.");
      return;
    }

    // 1. Reverse calculate remaining tenure
    const n = Math.log(EMI / (EMI - P * r)) / Math.log(1 + r);
    const oldInterestTotal = (EMI * n) - P;

    let P_new = P;
    let r_new = r;
    let annualRateNew = annualRate;

    if (mode === 'prepayment') {
      const prepayAmt = parseFloat(formData.prepayment) || 0;
      P_new = Math.max(0, P - prepayAmt);
    } else {
      annualRateNew = parseFloat(formData.revisedRate);
      r_new = annualRateNew / 12 / 100;
    }

    // Outcome 1: Change EMI (Fixed Tenure)
    const emi_new = (P_new * r_new * Math.pow(1 + r_new, n)) / (Math.pow(1 + r_new, n) - 1);
    const interest_emi_change = (emi_new * n) - P_new;

    // Outcome 2: Change Tenure (Fixed EMI)
    let n_new = n;
    let interest_tenure_change = oldInterestTotal;
    
    if (EMI > P_new * r_new) {
      n_new = Math.log(EMI / (EMI - P_new * r_new)) / Math.log(1 + r_new);
      interest_tenure_change = (EMI * n_new) - P_new;
    } else {
      // In ROI change, EMI might become less than interest.
      n_new = n * 2; // Arbitrary fallback if invalid
      interest_tenure_change = 0;
    }

    setResults({
      old: { emi: EMI, months: n, interest: oldInterestTotal },
      emiChange: { emi: emi_new, interest: interest_emi_change },
      tenureChange: { months: n_new, interest: interest_tenure_change }
    });
  };

  const handleReset = () => {
    setFormData({
      outstanding: '1000000',
      rate: '10',
      emi: '21247',
      prepayment: '100000',
      revisedRate: '11',
    });
    setResults(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <header className="px-6 pt-14 pb-4 flex items-center gap-4 bg-white sticky top-0 z-20 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-800 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Revised EMI & Tenure</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-24">
        {/* Top Toggle */}
        <div className="flex justify-center">
          <div className="flex bg-gray-200 p-1 rounded-full w-full max-w-[280px]">
            <button
              onClick={() => { setMode('prepayment'); setResults(null); }}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${
                mode === 'prepayment' ? 'bg-primary text-white shadow-md' : 'text-gray-600'
              }`}
            >
              Pre Payment
            </button>
            <button
              onClick={() => { setMode('roi'); setResults(null); }}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all ${
                mode === 'roi' ? 'bg-primary text-white shadow-md' : 'text-gray-600'
              }`}
            >
              ROI Change
            </button>
          </div>
        </div>

        {/* Form Container */}
        <section className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-5">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-500 w-32">Outstanding Amt.</label>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₹</span>
              <input
                type="text"
                inputMode="decimal"
                className="input-pill pl-10 text-right font-bold"
                value={formatNumericInput(formData.outstanding)}
                onChange={(e) => setFormData({ ...formData, outstanding: parseFormattedNumber(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-500 w-32">Current Rate %</label>
            <div className="flex-1 relative">
              <input
                type="number"
                step="any"
                placeholder="max: 50% per annum"
                className="input-pill pr-10 text-right font-bold"
                value={formData.rate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) <= 100) {
                    setFormData({ ...formData, rate: val });
                  }
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-500 w-32">Current EMI</label>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₹</span>
              <input
                type="text"
                inputMode="decimal"
                className="input-pill pl-10 text-right font-bold"
                value={formatNumericInput(formData.emi)}
                onChange={(e) => setFormData({ ...formData, emi: parseFormattedNumber(e.target.value) })}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'prepayment' ? (
              <motion.div
                key="prepay-field"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4"
              >
                <label className="text-sm font-semibold text-gray-500 w-32">Pre-Payment Amt.</label>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-pill pl-10 text-right font-bold text-primary"
                    value={formatNumericInput(formData.prepayment)}
                    onChange={(e) => setFormData({ ...formData, prepayment: parseFormattedNumber(e.target.value) })}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="roi-field"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4"
              >
                <label className="text-sm font-semibold text-gray-500 w-32">Revised Rate %</label>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="any"
                    className="input-pill pr-10 text-right font-bold text-primary"
                    value={formData.revisedRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) <= 100) {
                        setFormData({ ...formData, revisedRate: val });
                      }
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold pointer-events-none">%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleReset}
            className="btn-secondary flex-1 h-[56px] rounded-full"
          >
            <RotateCcw size={20} />
            Reset
          </button>
          <button
            onClick={calculateResults}
            className="btn-primary flex-1 h-[56px] rounded-full"
          >
            Calculate
          </button>
        </div>

        {/* Results Display Section */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Result Card 1: Change EMI */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100">
                <div className="bg-primary py-3 flex justify-center items-center">
                  <span className="text-white font-bold text-sm tracking-wide">If you want to change EMI then</span>
                </div>
                <div className="p-4 grid grid-cols-3 border-b border-gray-50">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New EMI</p>
                    <p className="text-sm font-bold text-green-700">₹ {formatCurrency(results.emiChange.emi)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old EMI</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.emi)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Difference</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(Math.abs(results.emiChange.emi - results.old.emi))}</p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New Int.</p>
                    <p className="text-sm font-bold text-green-700">₹ {formatCurrency(results.emiChange.interest)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old Int.</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Saving</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest - results.emiChange.interest)}</p>
                  </div>
                </div>
              </div>

              {/* Result Card 2: Change Tenure */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100">
                <div className="bg-primary py-3 flex justify-center items-center">
                  <span className="text-white font-bold text-sm tracking-wide">If you want to change Tenure then</span>
                </div>
                <div className="p-4 grid grid-cols-3 border-b border-gray-50">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New Months</p>
                    <p className="text-sm font-bold text-green-700">{Math.round(results.tenureChange.months)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old Months</p>
                    <p className="text-sm font-bold text-blue-600">{Math.round(results.old.months)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Difference</p>
                    <p className="text-sm font-bold text-blue-600">
                      {Math.round(results.tenureChange.months - results.old.months)} Months
                    </p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3">
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New Int.</p>
                    <p className="text-sm font-bold text-green-700">₹ {formatCurrency(results.tenureChange.interest)}</p>
                  </div>
                  <div className="text-center p-2 border-r border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Old Int.</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest)}</p>
                  </div>
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Saving</p>
                    <p className="text-sm font-bold text-blue-600">₹ {formatCurrency(results.old.interest - results.tenureChange.interest)}</p>
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

export default PrePaymentROI;
