import React, { useState, useMemo } from 'react';
import { ChevronLeft, Share2, Printer, Download } from 'lucide-react';
import { 
  generateAmortizationSchedule, 
  aggregateScheduleByYear, 
  formatCurrency 
} from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';

const QuickCalculatorDetails = ({ data, onBack }) => {
  const [viewMode, setViewMode] = useState('year'); // 'year' or 'month'

  const normalizedData = useMemo(() => {
    const { amount, interest, period, emi, isMonths, calculatedValue, activeToggle } = data;
    
    let p = parseFloat(amount) || 0;
    let r = parseFloat(interest) || 0;
    let n = parseFloat(period) || 0;
    let e = parseFloat(emi) || 0;
    const calcVal = parseFloat(calculatedValue) || 0;

    if (activeToggle === 'EMI') e = calcVal;
    if (activeToggle === 'Amount') p = calcVal;
    if (activeToggle === 'Period') n = calcVal;
    if (activeToggle === 'Interest') r = calcVal;

    const monthlySchedule = generateAmortizationSchedule(p, r, n, isMonths);
    const yearlySchedule = aggregateScheduleByYear(monthlySchedule);
    
    const totalMonths = isMonths ? Math.round(n) : Math.round(n * 12);
    const totalPayment = e * totalMonths;
    const totalInterest = totalPayment - p;

    return {
      principal: p,
      interestRate: r,
      tenure: n,
      isMonths,
      emi: e,
      totalInterest,
      totalPayment,
      totalMonths,
      monthlySchedule,
      yearlySchedule
    };
  }, [data]);

  const summaryItems = [
    { label: 'Loan Amount', value: formatCurrency(normalizedData.principal) },
    { label: 'Interest (%)', value: `${normalizedData.interestRate.toFixed(2)}%` },
    { label: 'Total Months', value: normalizedData.totalMonths },
    { label: 'Monthly EMI', value: formatCurrency(normalizedData.emi) },
    { label: 'Total Interest', value: formatCurrency(normalizedData.totalInterest) },
    { label: 'Processing Fee', value: formatCurrency(0) },
    { label: 'Total Payment', value: formatCurrency(normalizedData.totalPayment) },
  ];

  const handleShare = () => {
    const text = `Loan Calculation Details:\n\n` +
                 `Loan Amount: ${formatCurrency(normalizedData.principal)}\n` +
                 `Interest Rate: ${normalizedData.interestRate.toFixed(2)}%\n` +
                 `Tenure: ${normalizedData.tenure} ${normalizedData.isMonths ? 'Months' : 'Years'}\n` +
                 `Monthly EMI: ${formatCurrency(normalizedData.emi)}\n` +
                 `Total Interest: ${formatCurrency(normalizedData.totalInterest)}\n` +
                 `Total Payment: ${formatCurrency(normalizedData.totalPayment)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Loan Calculation', text);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden h-full">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white border-b border-gray-50 sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 active:scale-90 transition-transform">
                <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Details</h1>
        </div>
        <button 
          onClick={handleShare}
          className="p-2 text-gray-600 active:scale-90 transition-transform"
        >
          <Share2 size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        {/* Summary Table */}
        <section className="px-6 py-6">
            <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                {summaryItems.map((item, i) => (
                    <div key={i} className={`flex justify-between items-center p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${i !== summaryItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <span className="text-sm font-medium text-gray-500">{item.label}</span>
                        <span className="text-sm font-bold text-gray-800">{item.value}</span>
                    </div>
                ))}
            </div>
        </section>

        {/* Schedule Section */}
        <section className="px-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Loan Schedule</h2>
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button 
                        onClick={() => setViewMode('year')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'year' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                    >Year</button>
                    <button 
                        onClick={() => setViewMode('month')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                    >Month</button>
                </div>
            </div>

            {/* Table Component */}
            <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-primary text-white sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider">{viewMode === 'year' ? 'Year' : 'Month'}</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider">Principal</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider">Interest</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(viewMode === 'year' ? normalizedData.yearlySchedule : normalizedData.monthlySchedule).map((row, i) => (
                                <tr key={i} className={i % 2 === 1 ? 'bg-blue-50/30' : 'bg-white'}>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-700">{viewMode === 'year' ? row.year : row.month}</td>
                                    <td className="px-4 py-4 text-sm font-medium text-gray-600">{formatCurrency(row.principal)}</td>
                                    <td className="px-4 py-4 text-sm font-medium text-gray-600">{formatCurrency(row.interest)}</td>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-800">{formatCurrency(row.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default QuickCalculatorDetails;
