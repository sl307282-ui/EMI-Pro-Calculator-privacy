import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Info, Wallet, TrendingUp, 
  ArrowRight, Landmark, PieChart as PieIcon, 
  Calendar, Percent, HelpCircle, Share2, 
  RotateCcw, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  formatCurrency, 
  formatNumericInput, 
  parseFormattedNumber 
} from '../utils/calculatorLogic';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { shareAsText } from '../utils/exportUtils';

const InputRow = ({ label, field, symbol, isNumeric = true, readOnly = false, badge, formData, setFormData, monthlyInstallment }) => (
  <div className="flex flex-col gap-2 mb-6">
    <div className="flex justify-between items-center px-1">
      <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</label>
      {badge && <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-full uppercase">{badge}</span>}
    </div>
    <div className="relative">
      <input
        type={isNumeric ? 'text' : 'number'}
        inputMode={isNumeric ? 'decimal' : undefined}
        readOnly={readOnly}
        className={`w-full ${readOnly ? 'bg-gray-100/50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-405' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500/20 dark:focus:border-blue-500/10'} border-2 border-transparent rounded-2xl py-4 px-5 text-lg font-black transition-all outline-none shadow-sm`}
        value={isNumeric ? (readOnly ? formatCurrency(formData[field] || monthlyInstallment) : formatNumericInput(formData[field])) : formData[field]}
        onChange={(e) => {
          if (readOnly) return;
          const val = isNumeric ? parseFormattedNumber(e.target.value) : e.target.value;
          setFormData(prev => ({ ...prev, [field]: val }));
        }}
      />
      {symbol && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold text-lg">{symbol}</span>}
      {isNumeric && !readOnly && symbol === '₹' && (
        <style dangerouslySetInnerHTML={{ __html: `input { padding-left: 2.5rem; }` }} />
      )}
    </div>
  </div>
);

const ChitCalculator = ({ onBack }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [formData, setFormData] = useState({
    totalAmount: '100000',
    members: '20',
    bidAmount: '30000',
    commissionType: '%', // '%' or '₹'
    commissionValue: '5'
  });

  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const monthlyInstallment = parseFloat(parseFormattedNumber(formData.totalAmount)) / (parseInt(formData.members) || 1);

  const calculateChit = () => {
    const total = parseFloat(parseFormattedNumber(formData.totalAmount));
    const members = parseInt(formData.members) || 1;
    const bid = parseFloat(parseFormattedNumber(formData.bidAmount));
    const commVal = parseFloat(formData.commissionValue);
    
    if (!total || !members || isNaN(bid)) return;

    let commissionInRupees = 0;
    if (formData.commissionType === '%') {
      commissionInRupees = (total * commVal) / 100;
    } else {
      commissionInRupees = commVal;
    }

    const totalDividend = bid - commissionInRupees;
    const dividendPerMember = totalDividend / members;
    const nextInstallment = monthlyInstallment - dividendPerMember;
    const prizeAmount = total - bid;

    setResults({
      commissionInRupees,
      totalDividend,
      dividendPerMember,
      nextInstallment,
      prizeAmount,
      total,
      monthlyInstallment
    });
    setShowResults(true);
  };

  useEffect(() => {
    if (showResults) calculateChit();
  }, [formData]);

  const handleReset = () => {
    setFormData({
      totalAmount: '100000',
      members: '20',
      bidAmount: '30000',
      commissionType: '%',
      commissionValue: '5'
    });
    setShowResults(false);
    setResults(null);
  };

  const handleShare = () => {
    if (!results) return;
    const text = `Chit Fund Calculation Result:\n\n` +
                 `Total Amount: ${formatCurrency(results.total)}\n` +
                 `Next Installment: ${formatCurrency(results.nextInstallment)}\n` +
                 `Prize Amount: ${formatCurrency(results.prizeAmount)}\n` +
                 `Dividend/Member: ${formatCurrency(results.dividendPerMember)}\n` +
                 `Foreman Comm: ${formatCurrency(results.commissionInRupees)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Chit Fund Calculation', text);
  };



  const handleBackClick = () => {
    if (showResults) {
      setShowResults(false);
    } else {
      onBack();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full relative">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Chit Fund Calculator"
          onBack={handleBackClick}
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

        <div className="p-6">
        {!showResults ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-soft border border-gray-100/50 dark:border-gray-800 mb-8">
              <InputRow label="Total Chit Amount" field="totalAmount" symbol="₹" formData={formData} setFormData={setFormData} monthlyInstallment={monthlyInstallment} />
              <InputRow label="Total Members" field="members" formData={formData} setFormData={setFormData} monthlyInstallment={monthlyInstallment} />
              <InputRow label="Monthly Installment" field="monthlyInstallment" readOnly={true} badge="Auto" formData={formData} setFormData={setFormData} monthlyInstallment={monthlyInstallment} />
              <InputRow label="Current Bid / Discount" field="bidAmount" symbol="₹" formData={formData} setFormData={setFormData} monthlyInstallment={monthlyInstallment} />
              
              {/* Commission Row */}
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Foreman Commission</label>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg overflow-hidden border border-transparent dark:border-gray-700">
                    <button 
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, commissionType: '%', commissionValue: '5' }))}
                      className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${formData.commissionType === '%' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                    >%</button>
                    <button 
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, commissionType: '₹', commissionValue: '5000' }))}
                      className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${formData.commissionType === '₹' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                    >₹</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode={formData.commissionType === '%' ? 'decimal' : undefined}
                      className="w-full bg-white dark:bg-gray-800 border-2 border-transparent focus:border-blue-500/20 dark:focus:border-blue-500/10 rounded-2xl py-4 px-5 text-lg font-black text-gray-900 dark:text-white transition-all outline-none shadow-sm"
                      value={formData.commissionType === '₹' ? formatNumericInput(formData.commissionValue) : formData.commissionValue}
                      onChange={(e) => {
                        let rawVal = e.target.value;
                        if (formData.commissionType === '%') {
                          let val = rawVal.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          if (parts.length > 2) {
                            val = parts[0] + '.' + parts.slice(1).join('');
                          }
                          const numVal = parseFloat(val);
                          if (!isNaN(numVal) && numVal > 100) {
                            val = '100';
                          }
                          setFormData(prev => ({ ...prev, commissionValue: val }));
                        } else {
                          const val = parseFormattedNumber(rawVal);
                          setFormData(prev => ({ ...prev, commissionValue: val }));
                        }
                      }}
                      onBlur={() => {
                        if (formData.commissionType === '%') {
                          let val = formData.commissionValue;
                          if (val === '' || isNaN(parseFloat(val))) {
                            val = '0';
                          } else {
                            val = parseFloat(val).toString();
                          }
                          setFormData(prev => ({ ...prev, commissionValue: val }));
                        }
                      }}
                    />
                    {formData.commissionType === '₹' && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold text-lg">₹</span>}
                  </div>
                  {formData.commissionType === '%' && (
                    <div className="flex items-center gap-4 px-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.commissionValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                        className="flex-1 accent-blue-600 dark:accent-blue-550 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400 w-10 text-right">{formData.commissionValue}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button 
                type="button"
                onClick={handleReset}
                className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} className="pointer-events-none" /> Reset
              </button>
              <button 
                type="button"
                onClick={calculateChit}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Calculate <ChevronRight size={16} className="pointer-events-none" />
              </button>
            </div>
          </>
        ) : (
          results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-24"
            >
              {/* Highlight Card */}
              <div className="bg-blue-600 dark:bg-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Next Installment (Net Payable)</p>
                <h2 className="text-4xl font-black">{formatCurrency(results.nextInstallment)}</h2>
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <Wallet size={160} className="rotate-12" />
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm transition-colors duration-300">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {[
                      { label: 'Total Chit Amount', value: results.total },
                      { label: 'Monthly Installment', value: results.monthlyInstallment },
                      { label: 'Foreman Commission (₹)', value: results.commissionInRupees },
                      { label: 'Total Dividend', value: results.totalDividend },
                      { label: 'Dividend Per Member', value: results.dividendPerMember, color: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Prize Amount (Winner Gets)', value: results.prizeAmount, color: 'text-blue-600 dark:text-blue-450' }
                    ].map((row, i) => (
                      <tr key={i} className="flex justify-between items-center p-5">
                        <td className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{row.label}</td>
                        <td className={`text-sm font-black ${row.color || 'text-gray-900 dark:text-white'}`}>{formatCurrency(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button 
                type="button"
                onClick={handleShare}
                className="w-full py-5 border-2 border-dashed border-blue-200 dark:border-blue-800/80 rounded-[2.5rem] text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:bg-blue-50 dark:active:bg-blue-900/10 transition-all"
              >
                <Share2 size={18} className="pointer-events-none" /> Share Calculation Result
              </button>

              {/* Bottom Back Button */}
              <button 
                type="button"
                onClick={() => setShowResults(false)}
                className="w-full py-5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-gray-205 dark:border-gray-750"
              >
                <ChevronLeft size={16} className="pointer-events-none" /> Back to Edit Inputs
              </button>
            </motion.div>
          )
        )}
        </div>
      </div>
    </div>
  );
};

export default ChitCalculator;
