import React from 'react';
import { ChevronLeft, Share2, ListTree } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { calculateEMI, formatCurrency } from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import { shareAsImage, shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const ResultsScreen = ({ data, onBack, onDetails }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const { currency } = useSettings();
  const p = parseFloat(data.amount);
  const r = parseFloat(data.interest);
  const n = data.isMonths ? parseInt(data.period) : parseInt(data.period) * 12;
  const emi = calculateEMI(p, r, data.period, data.isMonths);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - p;
  const processingFeeAmount = (p * parseFloat(data.processingFee)) / 100;
  const grandTotal = totalPayment + processingFeeAmount;

  const chartData = [
    { name: 'Principal', value: p, color: '#F97316' },
    { name: 'Interest', value: totalInterest, color: '#22C55E' },
    { name: 'Processing Fee', value: processingFeeAmount, color: '#D1D5DB' },
  ];

  const handleShare = () => {
    const text = `Loan Calculation Results:\n\n` +
                 `Loan Amount: ${formatCurrency(p)}\n` +
                 `Monthly EMI: ${formatCurrency(emi)}\n` +
                 `Total Interest: ${formatCurrency(totalInterest)}\n` +
                 `Total Payment: ${formatCurrency(grandTotal)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('EMI Calculation', text);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 overflow-hidden relative">
      <div 
        id="result-capture" 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 transition-colors duration-300"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Calculation Results"
          onBack={onBack}
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

        <div className="px-6 pb-24">
        {/* Summary Card */}
        <div className="glass-card p-6 mb-8 bg-blue-600 text-white shadow-premium border-none">
          <p className="text-blue-100 text-sm font-medium mb-1">Monthly EMI</p>
          <h2 className="text-4xl font-bold mb-6">{formatCurrency(emi, currency)}</h2>
          
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-blue-400/30">
            <div>
              <p className="text-blue-200 text-xs mb-1">Processing Fee</p>
              <p className="text-lg font-bold">{formatCurrency(processingFeeAmount, currency)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs mb-1">Total Payment</p>
              <p className="text-lg font-bold">{formatCurrency(grandTotal, currency)}</p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="glass-card p-6 mb-8 flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 w-full">Breakdown</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  layout="horizontal"
                  iconType="circle"
                  formatter={(value, entry) => {
                    const percentage = ((entry.payload.value / (p + totalInterest + processingFeeAmount)) * 100).toFixed(1);
                    return <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">{value} ({percentage}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={handleShare}
            className="btn-secondary flex-1"
          >
            <Share2 size={20} />
            Share
          </button>
          <button onClick={onDetails} className="btn-primary flex-1">
            <ListTree size={20} />
            Details
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default ResultsScreen;
