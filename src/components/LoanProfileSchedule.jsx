import React, { useMemo } from 'react';
import { ChevronLeft, Share2 } from 'lucide-react';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { 
  generateAmortizationSchedule, 
  formatCurrency, 
  formatDate,
  getEmiDateForMonth
} from '../utils/calculatorLogic';

const LoanProfileSchedule = ({ loan, onBack }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const scheduleData = useMemo(() => {
    const amount = parseFloat(loan.amount);
    const monthlySchedule = generateAmortizationSchedule(amount, loan.interest, loan.tenure, true, loan, loan.firstEmiDate, loan.emi);

    const rows = [];
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;

    monthlySchedule.forEach((item, index) => {
      const emiDate = item.emiDate || getEmiDateForMonth(loan.firstEmiDate, index + 1);
      
      rows.push({
        ...item,
        displayDate: formatDate(emiDate, 'MMM-YYYY'),
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
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300 relative">
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Loan Schedule"
          onBack={onBack}
          rightActions={
            <button 
              type="button"
              onClick={handleShare}
              className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
              title="Share"
              aria-label="Share"
            >
              <Share2 size={20} strokeWidth={2} />
            </button>
          }
        />

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
