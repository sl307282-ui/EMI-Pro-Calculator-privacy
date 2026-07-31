import React, { useMemo } from 'react';
import { ChevronLeft, Share2 } from 'lucide-react';
import { shareAsText } from '../utils/exportUtils';
import { 
  generateAmortizationSchedule, 
  formatCurrency, 
  formatDate 
} from '../utils/calculatorLogic';

const LoanProfileSchedule = ({ loan, onBack }) => {
  const scheduleData = useMemo(() => {
    const amount = parseFloat(loan.amount);
    const monthlySchedule = generateAmortizationSchedule(amount, loan.interest, loan.tenure, true, loan, loan.firstEmiDate, loan.emi);
    const startDate = new Date(loan.firstEmiDate);

    const rows = [];
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;

    monthlySchedule.forEach((item, index) => {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + index);
      
      rows.push({
        ...item,
        displayDate: formatDate(currentDate, 'MMM-YYYY'),
        type: 'monthly'
      });

      yearlyPrincipal += item.principal;
      yearlyInterest += item.interest;

      // Add sub-total every 12 months or at the end
      if ((index + 1) % 12 === 0 || index === monthlySchedule.length - 1) {
        rows.push({
          principal: yearlyPrincipal,
          interest: yearlyInterest,
          balance: item.balance,
          displayDate: 'Total',
          type: 'yearly'
        });
        yearlyPrincipal = 0;
        yearlyInterest = 0;
      }
    });

    return rows;
  }, [loan]);

  const handleShare = () => {
    const text = `Loan Schedule - ${loan.name}\n\n` +
                 `Loan Amount: ${formatCurrency(loan.amount)}\n` +
                 `Interest Rate: ${loan.interest}%\n` +
                 `Tenure: ${loan.tenure} Months\n` +
                 `Monthly EMI: ${formatCurrency(loan.emi)}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Loan Schedule', text);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden h-full">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white border-b border-gray-50 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Loan Schedule</h1>
        </div>
        <button 
          onClick={handleShare}
          className="p-2 text-gray-600 active:scale-90 transition-transform"
        >
          <Share2 size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-primary text-white sticky top-0 z-10">
            <tr>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">Month</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Principal</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Interest</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {scheduleData.map((row, i) => (
              <tr 
                key={i} 
                className={
                  row.type === 'yearly' 
                    ? 'bg-blue-600 text-white font-bold' 
                    : i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                }
              >
                <td className={`px-4 py-4 text-xs ${row.type === 'yearly' ? 'font-black' : 'font-bold text-gray-500'}`}>
                  {row.displayDate}
                </td>
                <td className="px-4 py-4 text-xs text-right font-medium">
                  {formatCurrency(row.principal)}
                </td>
                <td className="px-4 py-4 text-xs text-right font-medium">
                  {formatCurrency(row.interest)}
                </td>
                <td className={`px-4 py-4 text-xs text-right ${row.type === 'yearly' ? 'font-black' : 'font-bold text-gray-800'}`}>
                  {formatCurrency(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanProfileSchedule;
