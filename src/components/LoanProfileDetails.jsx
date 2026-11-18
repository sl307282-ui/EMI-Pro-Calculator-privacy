import React, { useMemo } from 'react';
import { ChevronLeft, Share2, Calendar, Table as TableIcon } from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  calculateLoanCurrentStatus 
} from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const LoanProfileDetails = ({ loan, onBack, onViewSchedule }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const { currency } = useSettings();
  const stats = useMemo(() => {
    return calculateLoanCurrentStatus(loan) || {};
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
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300 relative">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 32px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Loan Details"
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

        <div className="px-6 py-6">
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

          {/* Natural Scrolling Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3 mt-[18px]">
            <button 
              type="button"
              onClick={onViewSchedule}
              className="h-[46px] rounded-[14px] bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <TableIcon size={18} strokeWidth={2.2} />
              <span>Schedule</span>
            </button>
            <button 
              type="button"
              onClick={handleShare}
              className="h-[46px] rounded-[14px] bg-[#EFF6FF] dark:bg-[#1E293B] hover:bg-blue-100 dark:hover:bg-slate-800 active:scale-[0.98] text-[#2563EB] dark:text-[#93C5FD] border border-[rgba(37,99,235,0.2)] dark:border-[rgba(147,197,253,0.2)] font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 size={18} strokeWidth={2.2} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanProfileDetails;
