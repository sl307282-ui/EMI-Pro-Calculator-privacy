import React, { useMemo } from 'react';
import { ChevronLeft, Share2, Calendar, Table as TableIcon } from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  generateAmortizationSchedule, 
  getMonthsDifference 
} from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import { shareAsText } from '../utils/exportUtils';

const LoanProfileDetails = ({ loan, onBack, onViewSchedule }) => {
  const { currency } = useSettings();
  const stats = useMemo(() => {
    const amount = parseFloat(loan.amount);
    const schedule = generateAmortizationSchedule(amount, loan.interest, loan.tenure, true, loan, loan.firstEmiDate, loan.emi);
    const monthsPassed = getMonthsDifference(loan.firstEmiDate);
    
    const paidSchedule = schedule.slice(0, Math.min(monthsPassed, schedule.length));
    const principalPaid = paidSchedule.reduce((acc, curr) => acc + curr.principal, 0);
    const interestPaid = paidSchedule.reduce((acc, curr) => acc + curr.interest, 0);
    const totalPaid = principalPaid + interestPaid;
    const totalPrepaymentPaid = paidSchedule.reduce((acc, curr) => acc + (curr.prepayment || 0), 0);
    
    const lastEntry = paidSchedule.length > 0 ? paidSchedule[paidSchedule.length - 1] : { balance: amount };
    const outstandingPrincipal = lastEntry.balance;
    
    const remainingSchedule = schedule.slice(Math.min(monthsPassed, schedule.length));
    const outstandingInterest = remainingSchedule.reduce((acc, curr) => acc + curr.interest, 0);
    const totalInterest = schedule.reduce((acc, curr) => acc + curr.interest, 0);

    // Calculate original total interest without prepayment for savings comparison
    const originalSchedule = generateAmortizationSchedule(amount, loan.interest, loan.tenure, true);
    const originalTotalInterest = originalSchedule.reduce((acc, curr) => acc + curr.interest, 0);
    const interestSaved = Math.max(0, originalTotalInterest - totalInterest);

    // Calculate Last EMI Date based on actual schedule length
    const firstDate = new Date(loan.firstEmiDate);
    const actualMonths = schedule.length;
    const totalPayable = amount + totalInterest;
    const lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + actualMonths - 1, firstDate.getDate());

    // Calculate Total Prepayment Planned (Sum of all in the array)
    const totalPrepaymentPlanned = loan.prepayments?.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) || 0;

    // Detect Revised EMI
    const lastMonthEmi = schedule[schedule.length - 1]?.actualEmi;
    const originalEmi = parseFloat(loan.emi);
    const revisedEmi = lastMonthEmi && Math.abs(lastMonthEmi - originalEmi) > 1 ? lastMonthEmi : null;

    return {
      principalPaid,
      interestPaid,
      totalPaid,
      totalPrepaymentPaid,
      totalPrepaymentPlanned,
      newTenure: actualMonths,
      revisedEmi,
      outstandingPrincipal,
      outstandingInterest,
      outstandingTotal: outstandingPrincipal + outstandingInterest,
      totalInterest,
      interestSaved,
      totalPayable,
      lastEmiDate: formatDate(lastDate, 'DD-MM-YYYY')
    };
  }, [loan]);

  const handleShare = () => {
    const text = `Loan Profile Details - ${loan.name}\n\n` +
                 `Bank: ${loan.bankName}\n` +
                 `A/C No: ${loan.accountNo}\n` +
                 `Loan Amount: ${formatCurrency(loan.amount, currency)}\n` +
                 `EMI: ${formatCurrency(loan.emi, currency)}\n` +
                 `Outstanding Principal: ${formatCurrency(stats.outstandingPrincipal, currency)}\n` +
                 `Last EMI Date: ${stats.lastEmiDate}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Loan Profile Details', text);
  };

  const detailRows = [
    { label: 'Loan A/C No', value: loan.accountNo },
    { label: 'Bank Name', value: loan.bankName },
    { label: 'Loan Amount', value: formatCurrency(loan.amount, currency) },
    { label: 'Interest Rate %', value: `${loan.interest}%` },
    { label: 'Tenure (In Month)', value: loan.tenure },
    ...(loan.prepayments?.some(p => p.effect === 'Tenure Reduction') && stats.newTenure < parseInt(loan.tenure) ? [
      { label: 'Revised Tenure (due to Prepayment)', value: `${stats.newTenure} Months`, isHighlight: true, color: 'text-red-500' }
    ] : []),
    { label: 'EMI', value: formatCurrency(loan.emi, currency) },
    ...(stats.revisedEmi ? [{ label: 'Revised EMI', value: formatCurrency(stats.revisedEmi, currency), color: 'text-primary', isBold: true }] : []),
    { label: 'Processing Fees', value: formatCurrency(loan.processingFees, currency) },
    { label: 'Loan Date', value: formatDate(loan.loanDate) },
    { label: 'First EMI Date', value: formatDate(loan.firstEmiDate) },
    { label: 'Last EMI Date', value: stats.lastEmiDate, isHighlight: true },
    { label: 'Interest Paid', value: formatCurrency(stats.interestPaid, currency), color: 'text-red-500' },
    { label: 'Principal Paid', value: formatCurrency(stats.principalPaid, currency), color: 'text-green-500' },
    { label: 'Total Prepayment', value: formatCurrency(stats.totalPrepaymentPlanned, currency), color: 'text-blue-500' },
    { label: 'Total Paid', value: formatCurrency(stats.totalPaid, currency), isBold: true },
    { label: 'Outstanding Interest', value: formatCurrency(stats.outstandingInterest, currency) },
    { label: 'Outstanding Principal', value: formatCurrency(stats.outstandingPrincipal, currency) },
    { label: 'Outstanding Total', value: formatCurrency(stats.outstandingTotal, currency), isHighlight: true },
    { label: 'Total Interest', value: formatCurrency(stats.totalInterest, currency) },
    { label: 'Interest Saved', value: formatCurrency(stats.interestSaved, currency), color: 'text-green-600', isBold: true },
    { label: 'Total Payable', value: formatCurrency(stats.totalPayable, currency), isHighlight: true, isBold: true },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Loan Details</h1>
        </div>
        <button 
          onClick={handleShare}
          className="p-2 text-gray-600 active:scale-90 transition-transform"
        >
          <Share2 size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 pb-24">
        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-soft border border-gray-100 dark:border-gray-700">
          <div className="bg-gray-900 dark:bg-black px-6 py-4 text-center">
            <h2 className="text-white font-black uppercase tracking-widest">{loan.name}</h2>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              {detailRows.map((row, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-gray-50 dark:border-gray-700 last:border-0 ${row.isHighlight ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-1/2">
                    {row.label}
                  </td>
                  <td className={`px-6 py-4 text-sm text-right ${row.isBold ? 'font-black' : 'font-bold'} ${row.color || 'text-gray-800 dark:text-gray-200'}`}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Multiple Prepayments List */}
        {loan.prepayments?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">Prepayment History</h3>
            <div className="space-y-2">
              {loan.prepayments.map((pre, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Prepayment {idx + 1}</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(pre.amount, currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{formatDate(pre.date)}</p>
                    <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 mt-1">{pre.effect}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4 absolute bottom-0 left-0 right-0 transition-colors duration-300">
        <button 
          onClick={onViewSchedule}
          className="flex-1 btn-primary"
        >
          <TableIcon size={18} /> Schedule
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 btn-primary bg-primary/10 text-primary shadow-none active:bg-primary/20"
        >
          <Share2 size={18} /> Share
        </button>
      </div>
    </div>
  );
};

export default LoanProfileDetails;
