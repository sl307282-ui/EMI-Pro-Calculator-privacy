import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Plus, Wallet, CreditCard, Banknote, History, Trash2, AlertTriangle, X, Edit3, ChevronRight, CirclePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  formatCurrency, 
  calculateLoanCurrentStatus,
  formatNumericInput,
  parseFormattedNumber,
  parseLocalDate,
  t
} from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const getTodayLocalDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LoanProfile = ({ loans, onBack, onAdd, onViewDetails, onDelete, onEdit, onUpdatePrepayments }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const scrollContainerRef = useRef(null);
  const { currency: currentCurrency, currencySymbol, language } = useSettings();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Synchronous state initialization to eliminate first-frame empty flash
  const [localLoans, setLocalLoans] = useState(() => {
    if (Array.isArray(loans) && loans.length > 0) return loans;
    try {
      const saved = localStorage.getItem('emi_loan_profiles');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return Array.isArray(loans) ? loans : [];
    }
  });

  useEffect(() => {
    if (Array.isArray(loans)) {
      setLocalLoans(loans);
    }
  }, [loans]);

  const effectiveLoans = useMemo(() => {
    if (Array.isArray(loans) && loans.length > 0) return loans;
    if (Array.isArray(localLoans) && localLoans.length > 0) return localLoans;
    try {
      const saved = localStorage.getItem('emi_loan_profiles');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [loans, localLoans]);

  // Reset scroll and header collapse synchronously before paint
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (headerRef.current) {
      headerRef.current.style.setProperty('--scroll-progress', '0.000');
    }
  }, []);

  // Ensure unmounting cleans up any stuck pointer-events, overflow, or active focus
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.style.overflow = '';
          rootEl.style.pointerEvents = '';
        }
      }
    };
  }, []);

  // Add Prepayment modal state for quick prepayment from loan card
  const [activePrepaymentLoanId, setActivePrepaymentLoanId] = useState(null);
  const [newPrepaymentAmount, setNewPrepaymentAmount] = useState('');
  const [newPrepaymentDate, setNewPrepaymentDate] = useState(getTodayLocalDateStr());
  const [newPrepaymentEffect, setNewPrepaymentEffect] = useState('Tenure Reduction');
  const [prepaymentError, setPrepaymentError] = useState('');

  const activePrepaymentLoan = effectiveLoans.find(l => l.id === activePrepaymentLoanId);

  const openAddPrepaymentForLoan = (loan) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActivePrepaymentLoanId(loan.id);
    setNewPrepaymentAmount('');
    setNewPrepaymentDate(getTodayLocalDateStr());
    setNewPrepaymentEffect('Tenure Reduction');
    setPrepaymentError('');
  };

  const closeAddPrepaymentModal = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActivePrepaymentLoanId(null);
    setPrepaymentError('');
  };

  const handleSavePrepayment = async () => {
    if (!activePrepaymentLoan) return;

    const rawVal = parseFormattedNumber(newPrepaymentAmount);
    const numAmount = parseFloat(rawVal) || 0;
    if (!rawVal || numAmount <= 0) {
      setPrepaymentError('Please enter a valid amount');
      return;
    }

    const newDate = newPrepaymentDate || getTodayLocalDateStr();
    const newEntry = {
      amount: numAmount.toString(),
      date: newDate,
      effect: newPrepaymentEffect || 'Tenure Reduction'
    };

    let updatedPrepayments = [...(activePrepaymentLoan.prepayments || []), newEntry];
    updatedPrepayments.sort((a, b) => {
      const dateA = parseLocalDate(a.date);
      const dateB = parseLocalDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    if (onUpdatePrepayments) {
      await onUpdatePrepayments(activePrepaymentLoan.id, updatedPrepayments);
    }

    try {
      const raw = localStorage.getItem('emi_loan_profiles');
      if (raw) {
        const list = JSON.parse(raw);
        const updatedList = list.map(l => l.id === activePrepaymentLoan.id ? { ...l, prepayments: updatedPrepayments } : l);
        localStorage.setItem('emi_loan_profiles', JSON.stringify(updatedList));
        setLocalLoans(updatedList);
      }
    } catch (e) {
      console.error('Error saving updated loan profiles to localStorage:', e);
    }

    closeAddPrepaymentModal();
  };

  // Memoized aggregated totals to prevent recalculations on scroll / re-render
  const { totalLoanAmount, totalEmi, totalAmountPaid, totalOutstanding } = useMemo(() => {
    let totalLoanAmount = 0;
    let totalEmi = 0;
    let totalAmountPaid = 0;
    let totalOutstanding = 0;

    effectiveLoans.forEach(loan => {
      const amount = parseFloat(loan.amount) || 0;
      const emi = parseFloat(loan.emi) || 0;
      totalLoanAmount += amount;
      totalEmi += emi;

      const status = calculateLoanCurrentStatus(loan);
      if (status) {
        totalAmountPaid += status.totalPaid;
        totalOutstanding += status.outstandingPrincipal;
      } else {
        totalOutstanding += amount;
      }
    });

    return { totalLoanAmount, totalEmi, totalAmountPaid, totalOutstanding };
  }, [effectiveLoans]);

  // Precomputed and memoized card metrics for instant first-frame render
  const loanMetrics = useMemo(() => {
    return effectiveLoans.map(loan => {
      const status = calculateLoanCurrentStatus(loan);
      const loanAmountNum = parseFloat(loan.amount) || 0;
      const outstandingAmount = status ? status.outstandingPrincipal : loanAmountNum;
      const principalPaid = status ? status.principalPaid : 0;
      const percentPaid = loanAmountNum > 0 
        ? Math.min(100, Math.max(0, Math.round((principalPaid / loanAmountNum) * 100))) 
        : 0;

      const remainingEmis = status ? Math.max(0, status.newTenure - status.passedEmiCount) : (parseInt(loan.tenure) || 0);
      const remainingText = remainingEmis > 0 
        ? `${remainingEmis} EMIs left` 
        : (status?.passedEmiCount > 0 ? 'Fully Paid' : `${loan.tenure || 0} Months`);

      return {
        loan,
        status,
        loanAmountNum,
        outstandingAmount,
        principalPaid,
        percentPaid,
        remainingText
      };
    });
  }, [effectiveLoans]);

  const loanToDelete = effectiveLoans.find(l => l.id === confirmDeleteId);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full relative">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar dark:bg-gray-900"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 88px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title={t('my_loan_profile', language)}
          onBack={onBack}
          rightActions={
            <button 
              type="button"
              onClick={onAdd}
              aria-label="Add loan"
              title="Add loan"
              className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
            >
              <Plus size={20} strokeWidth={2} />
            </button>
          }
        />
        {effectiveLoans.length === 0 ? (
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
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft border border-gray-100 dark:border-gray-700 mb-8">
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
              {loanMetrics.map(({ loan, outstandingAmount, percentPaid, remainingText }) => {
                return (
                  <div
                    key={loan.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700/80 border-l-4 border-l-[#2563EB] dark:border-l-[#3B82F6]"
                  >
                    {/* Top Header Row: Loan Name on Left + [Edit Pen] & [+ Add Prepayment] on Right */}
                    <div className="bg-slate-50/60 dark:bg-slate-900/30 px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
                      <h3 className="text-[16px] font-bold text-gray-900 dark:text-white truncate flex-1 min-w-0 leading-tight">
                        {loan.name || 'Personal Loan'}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(loan);
                          }}
                          aria-label="Edit Loan"
                          title="Edit Loan"
                          className="w-[34px] h-[34px] min-w-[34px] min-h-[34px] rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 inline-flex items-center justify-center active:scale-90 transition-all shadow-sm border border-blue-200/60 dark:border-blue-800/50"
                        >
                          <Edit3 size={16} strokeWidth={2.2} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddPrepaymentForLoan(loan);
                          }}
                          aria-label="Add Prepayment"
                          title="Add Prepayment"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399] hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95 transition-all shadow-sm border border-emerald-200/60 dark:border-emerald-800/50 text-[12px] font-semibold whitespace-nowrap"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                          <span>Add Prepayment</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle Financial Metrics & Repayment Progress Bar */}
                    <div className="w-full px-4 py-3.5 space-y-3">
                      {/* 3-Column Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                            {t('loan_amount', language)}
                          </p>
                          <p className="text-[14px] sm:text-[15px] font-bold text-gray-800 dark:text-gray-100 tabular-nums truncate">
                            {formatCurrency(loan.amount, currentCurrency)}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-[10px] font-black text-amber-600/90 dark:text-amber-400/90 uppercase tracking-wider mb-0.5">
                            {t('outstanding', language)}
                          </p>
                          <p className="text-[14px] sm:text-[15px] font-bold text-amber-600 dark:text-amber-400 tabular-nums truncate">
                            {formatCurrency(outstandingAmount, currentCurrency)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                            {t('emi', language)}
                          </p>
                          <p className="text-[14px] sm:text-[15px] font-bold text-rose-500 dark:text-rose-400 tabular-nums truncate">
                            {formatCurrency(loan.emi, currentCurrency)}
                          </p>
                        </div>
                      </div>

                      {/* Repayment Progress Bar */}
                      <div className="pt-0.5">
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/70 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {percentPaid}% Paid
                          </span>
                          <span>
                            {remainingText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Footer Row: [Delete Pill] on Left, [Schedule & Details Pill] on Right */}
                    <div className="px-3.5 py-2.5 border-t border-slate-900/[0.06] dark:border-white/[0.06] bg-slate-50/70 dark:bg-slate-900/35 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(loan.id);
                        }}
                        aria-label="Delete Loan"
                        title="Delete Loan"
                        className="inline-flex items-center gap-[5px] px-[11px] py-[6px] rounded-[10px] bg-red-500/[0.08] dark:bg-red-500/[0.14] text-[#DC2626] dark:text-[#F87171] border border-red-500/[0.16] dark:border-red-500/[0.24] hover:bg-red-500/[0.12] dark:hover:bg-red-500/[0.2] active:scale-[0.96] transition-all text-[12px] font-semibold"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                        <span>Delete</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewDetails(loan)}
                        className="inline-flex items-center gap-[5px] px-3 py-[6px] rounded-[10px] bg-blue-600/[0.09] dark:bg-blue-500/[0.16] text-[#2563EB] dark:text-[#60A5FA] border border-blue-600/[0.18] dark:border-blue-500/[0.28] hover:bg-blue-600/[0.14] dark:hover:bg-blue-500/[0.22] active:scale-[0.96] transition-all text-[12px] font-semibold"
                      >
                        <span>Schedule & Details</span>
                        <ChevronRight size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Rendered via React Portal directly into document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {confirmDeleteId && loanToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-0 flex items-end justify-center"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.48)',
                zIndex: 99999,
                willChange: 'opacity',
              }}
              onClick={() => setConfirmDeleteId(null)}
            >
              <motion.div
                initial={{ transform: 'translate3d(0, 100%, 0)' }}
                animate={{ transform: 'translate3d(0, 0, 0)' }}
                exit={{ transform: 'translate3d(0, 100%, 0)' }}
                transition={{ duration: 0.22, ease: [0.2, 0.0, 0.0, 1.0] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-[2.5rem] p-6 shadow-2xl border-t border-gray-100 dark:border-gray-700/60 relative overflow-y-auto no-scrollbar"
                style={{
                  zIndex: 100000,
                  maxHeight: 'calc(100dvh - env(safe-area-inset-top, 24px) - 24px)',
                  paddingBottom: 'max(calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 24px), 36px)',
                  willChange: 'transform',
                }}
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
                    className="ml-auto p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform"
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
        </AnimatePresence>,
        document.body
      )}

      {/* Quick Add Prepayment Modal for Specific Loan (Rendered via React Portal directly into document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activePrepaymentLoanId && activePrepaymentLoan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-0 flex items-end justify-center"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.48)',
                zIndex: 99999,
                willChange: 'opacity',
              }}
              onClick={closeAddPrepaymentModal}
            >
              <motion.div
                initial={{ transform: 'translate3d(0, 100%, 0)' }}
                animate={{ transform: 'translate3d(0, 0, 0)' }}
                exit={{ transform: 'translate3d(0, 100%, 0)' }}
                transition={{ duration: 0.22, ease: [0.2, 0.0, 0.0, 1.0] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-[2.5rem] p-6 shadow-2xl border-t border-gray-100 dark:border-gray-700/60 relative overflow-y-auto no-scrollbar"
                style={{
                  zIndex: 100000,
                  maxHeight: 'calc(100dvh - env(safe-area-inset-top, 24px) - 24px)',
                  paddingBottom: 'max(calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 24px), 36px)',
                  willChange: 'transform',
                }}
              >
                {/* Drag handle / Close pill */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>

                {/* Header with Title and Loan Name Badge */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <CirclePlus size={22} strokeWidth={2.3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-black text-gray-900 dark:text-white">Add Prepayment</h3>
                    <p className="text-[12px] font-bold text-blue-600 dark:text-blue-400 truncate mt-0.5">
                      {activePrepaymentLoan.name} {activePrepaymentLoan.accountNo ? `(${activePrepaymentLoan.accountNo})` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddPrepaymentModal}
                    className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 mb-6">
                  {/* Amount Field */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300 block mb-1.5 uppercase tracking-wider">
                      Prepayment Amount
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={formatNumericInput(newPrepaymentAmount)}
                        onChange={(e) => {
                          const val = parseFormattedNumber(e.target.value);
                          if (val.replace(/[^0-9]/g, '').length > 9) return;
                          setNewPrepaymentAmount(val);
                          if (prepaymentError) setPrepaymentError('');
                        }}
                        className="w-full bg-[#F8FAFC] dark:bg-gray-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right pr-10"
                      />
                      <span className="absolute right-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {currencySymbol}
                      </span>
                    </div>
                    {prepaymentError && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1 text-right">{prepaymentError}</p>
                    )}
                  </div>

                  {/* Prepayment Date Field */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300 block mb-1.5 uppercase tracking-wider">
                      Prepayment Date
                    </label>
                    <input
                      type="date"
                      value={newPrepaymentDate}
                      onChange={(e) => setNewPrepaymentDate(e.target.value)}
                      className="w-full bg-[#F8FAFC] dark:bg-gray-900 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                    />
                  </div>

                  {/* Effect On Field */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300 block mb-1.5 uppercase tracking-wider">
                      Effect On
                    </label>
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      {['Tenure Reduction', 'EMI Reduction'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setNewPrepaymentEffect(option)}
                          className={`flex-1 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                            newPrepaymentEffect === option 
                              ? 'bg-white dark:bg-gray-800 text-primary dark:text-blue-400 font-bold shadow-sm' 
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeAddPrepaymentModal}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[13px] font-black active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePrepayment}
                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-[13px] font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Save Prepayment
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default LoanProfile;
