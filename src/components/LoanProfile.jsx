import React, { useState } from 'react';
import { ChevronLeft, Plus, Wallet, CreditCard, Banknote, History, Trash2, AlertTriangle, X, Edit3, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  formatCurrency, 
  generateAmortizationSchedule, 
  getMonthsDifference,
  t
} from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';

const LoanProfile = ({ loans, onBack, onAdd, onViewDetails, onDelete, onEdit }) => {
  const { currency: currentCurrency, language } = useSettings();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const calculateAggregatedTotals = () => {
    let totalLoanAmount = 0;
    let totalEmi = 0;
    let totalAmountPaid = 0;
    let totalOutstanding = 0;

    loans.forEach(loan => {
      const amount = parseFloat(loan.amount) || 0;
      const emi = parseFloat(loan.emi) || 0;
      totalLoanAmount += amount;
      totalEmi += emi;

      // Passing prepayment data, start date and the saved EMI to schedule generator
      const schedule = generateAmortizationSchedule(amount, loan.interest, loan.tenure, true, loan, loan.firstEmiDate, loan.emi);
      const monthsPassed = getMonthsDifference(loan.firstEmiDate);
      
      const paidSchedule = schedule.slice(0, Math.min(monthsPassed, schedule.length));
      const paidPrincipal = paidSchedule.reduce((acc, curr) => acc + curr.principal, 0);
      const paidInterest = paidSchedule.reduce((acc, curr) => acc + curr.interest, 0);
      
      totalAmountPaid += (paidPrincipal + paidInterest);
      
      const lastEntry = paidSchedule.length > 0 ? paidSchedule[paidSchedule.length - 1] : { balance: amount };
      totalOutstanding += lastEntry.balance;
    });

    return { totalLoanAmount, totalEmi, totalAmountPaid, totalOutstanding };
  };

  const { totalLoanAmount, totalEmi, totalAmountPaid, totalOutstanding } = calculateAggregatedTotals();

  const loanToDelete = loans.find(l => l.id === confirmDeleteId);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('my_loan_profile', language)}</h1>
        </div>
        <button 
          onClick={onAdd}
          className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10 dark:bg-gray-900">
        {loans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <History size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 font-bold">{t('no_record', language)}</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs font-medium mt-1">Tap + to add your first loan</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet size={14} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('loan_amount', language)}</span>
                  </div>
                  <p className="text-lg font-black text-red-500">{formatCurrency(totalLoanAmount, currentCurrency)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={14} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('emi', language)}</span>
                  </div>
                  <p className="text-lg font-black text-red-500">{formatCurrency(totalEmi, currentCurrency)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote size={14} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('amount_paid', language)}</span>
                  </div>
                  <p className="text-lg font-black text-red-500">{formatCurrency(totalAmountPaid, currentCurrency)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <History size={14} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('outstanding', language)}</span>
                  </div>
                  <p className="text-lg font-black text-red-500">{formatCurrency(totalOutstanding, currentCurrency)}</p>
                </div>
              </div>
            </div>

            {/* Loan List */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('saved_loans', language)}</h2>
            <div className="space-y-4">
              {loans.map((loan) => (
                <motion.div
                  key={loan.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  {/* Blue header bar with loan name + delete button */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 px-4 py-3 border-b border-blue-100 dark:border-blue-900/20 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex-1">
                      {loan.name} ({loan.accountNo})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(loan);
                        }}
                        className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/10 text-blue-400 hover:bg-blue-100 hover:text-blue-600 active:scale-90 transition-all"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(loan.id);
                        }}
                        className="p-1.5 rounded-full bg-red-50 dark:bg-red-900/10 text-red-400 hover:bg-red-100 hover:text-red-600 active:scale-90 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Non-clickable card body */}
                  <div className="w-full p-4 space-y-3.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-0.5 tracking-wider">{t('loan_amount', language)}</p>
                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200 tabular-nums">{formatCurrency(loan.amount, currentCurrency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase mb-0.5 tracking-wider">{t('emi', language)}</p>
                        <p className="text-sm font-extrabold text-rose-500 dark:text-rose-400 tabular-nums">{formatCurrency(loan.emi, currentCurrency)}</p>
                      </div>
                    </div>

                    {/* Centered 'See Details' Button - The ONLY clickable target to open details */}
                    <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/50 flex justify-center items-center">
                      <button
                        onClick={() => onViewDetails(loan)}
                        className="px-4 py-1.5 rounded-xl text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/10 active:scale-95 transition-all"
                      >
                        See Details
                        <ChevronRight size={12} strokeWidth={3} className="text-blue-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && loanToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white dark:bg-gray-800 rounded-t-[2rem] p-6 pb-10 shadow-2xl"
            >
              {/* Close pill */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 flex-shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-gray-900 dark:text-white">Delete Loan?</h3>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="ml-auto p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Loan preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3 mb-6 border border-gray-100 dark:border-gray-800">
                <p className="text-[12px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                  {loanToDelete.name}
                </p>
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                    {loanToDelete.bankName || 'Bank'}
                  </span>
                  <span className="text-[12px] font-black text-gray-800 dark:text-gray-200">
                    {formatCurrency(loanToDelete.amount, currentCurrency)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[13px] font-black active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-[13px] font-black shadow-lg shadow-red-100 dark:shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoanProfile;
