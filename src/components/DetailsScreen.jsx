import React, { useState } from 'react';
import { ChevronLeft, Share2 } from 'lucide-react';
import { 
  calculateEMI, 
  generateAmortizationSchedule, 
  aggregateScheduleByYear,
  formatCurrency 
} from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const DetailsScreen = ({ data, onBack }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const { currency } = useSettings();
  const [view, setView] = useState('year'); // 'year' or 'month'
  
  const p = parseFloat(data.amount);
  const r = parseFloat(data.interest);
  const nMonths = data.isMonths ? parseInt(data.period) : parseInt(data.period) * 12;
  const emi = calculateEMI(p, r, data.period, data.isMonths);
  const totalPayment = emi * nMonths;
  const totalInterest = totalPayment - p;
  const processingFee = (p * parseFloat(data.processingFee)) / 100;
  const grandTotal = totalPayment + processingFee;

  const monthlySchedule = generateAmortizationSchedule(p, r, data.period, data.isMonths);
  const yearlySchedule = aggregateScheduleByYear(monthlySchedule);

  const scheduleData = view === 'year' ? yearlySchedule : monthlySchedule;

  const handleShare = () => {
    const text = `Amortization Schedule Details:\n\n` +
                 `Loan Amount: ${formatCurrency(p, currency)}\n` +
                 `Interest Rate: ${r}%\n` +
                 `Tenure: ${nMonths} Months\n` +
                 `Monthly EMI: ${formatCurrency(emi, currency)}\n` +
                 `Total Interest: ${formatCurrency(totalInterest, currency)}\n` +
                 `Processing Fee: ${formatCurrency(processingFee, currency)}\n` +
                 `Total Payment: ${formatCurrency(grandTotal, currency)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Amortization Schedule', text);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden relative">
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Amortization Schedule"
          onBack={onBack}
          rightActions={
            <button 
              type="button"
              onClick={handleShare}
              className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
              title="Share Amortization Details"
              aria-label="Share"
            >
              <Share2 size={20} strokeWidth={2} />
            </button>
          }
        />
        {/* Summary Table */}
        <section className="px-6 py-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 space-y-4 border border-gray-100 dark:border-gray-700/50">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Loan Amount</span>
              <span className="text-right font-bold text-gray-900 dark:text-white">{formatCurrency(p, currency)}</span>
              
              <span className="text-gray-500 dark:text-gray-400">Interest %</span>
              <span className="text-right font-bold text-gray-900 dark:text-white">{r}%</span>
              
              <span className="text-gray-500 dark:text-gray-400">Total Tenure</span>
              <span className="text-right font-bold text-gray-900 dark:text-white">{nMonths} Months</span>
              
              <span className="text-gray-500 dark:text-gray-400">Monthly EMI</span>
              <span className="text-right font-bold text-primary dark:text-blue-400">{formatCurrency(emi, currency)}</span>
              
              <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 my-1"></div>
              
              <span className="text-gray-500 dark:text-gray-400">Total Interest</span>
              <span className="text-right font-bold text-gray-900 dark:text-white">{formatCurrency(totalInterest, currency)}</span>
              
              <span className="text-gray-500 dark:text-gray-400">Processing Fee</span>
              <span className="text-right font-bold text-gray-900 dark:text-white">{formatCurrency(processingFee, currency)}</span>
              
              <span className="text-gray-900 dark:text-white font-bold">Total Payment</span>
              <span className="text-right font-bold text-lg text-primary dark:text-blue-400">{formatCurrency(grandTotal, currency)}</span>
            </div>
          </div>
        </section>

        {/* View Toggle */}
        <div className="px-6 mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setView('year')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                view === 'year' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Yearly View
            </button>
            <button
              onClick={() => setView('month')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                view === 'month' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Monthly View
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="px-6 pb-20">
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-primary dark:bg-blue-600 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 font-bold whitespace-nowrap">{view === 'year' ? 'Year' : 'Month'}</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap text-right">Principal</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap text-right">Interest</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {scheduleData.length > 0 ? (
                  scheduleData.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-blue-50/30 dark:bg-blue-900/10'}>
                      <td className="px-4 py-4 font-semibold text-gray-700 dark:text-gray-300">
                        {view === 'year' ? row.year : row.month}
                      </td>
                      <td className="px-4 py-4 text-gray-600 dark:text-gray-400 text-right tabular-nums">{formatCurrency(row.principal, currency)}</td>
                      <td className="px-4 py-4 text-gray-600 dark:text-gray-400 text-right tabular-nums">{formatCurrency(row.interest, currency)}</td>
                      <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-200 text-right tabular-nums">{formatCurrency(row.balance, currency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-gray-400 italic">No schedule data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsScreen;
