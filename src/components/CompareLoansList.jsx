import React, { useState } from 'react';
import { ChevronLeft, Plus, X, ArrowRightLeft, Trophy, TrendingDown, Info } from 'lucide-react';
import { calculateEMI, formatCurrency } from '../utils/calculatorLogic';

const CARD_COLORS = [
  { bg: 'from-blue-600 to-blue-500',    badge: 'bg-blue-100 text-blue-600',    light: 'text-blue-100',   ring: 'ring-blue-300' },
  { bg: 'from-pink-500 to-rose-500',     badge: 'bg-pink-100 text-pink-600',    light: 'text-pink-100',   ring: 'ring-pink-300' },
  { bg: 'from-violet-600 to-purple-500', badge: 'bg-violet-100 text-violet-600', light: 'text-violet-100', ring: 'ring-violet-300' },
  { bg: 'from-emerald-600 to-teal-500',  badge: 'bg-emerald-100 text-emerald-600',light:'text-emerald-100',ring: 'ring-emerald-300' },
  { bg: 'from-amber-500 to-orange-500',  badge: 'bg-amber-100 text-amber-600',  light: 'text-amber-100',  ring: 'ring-amber-300' },
  { bg: 'from-cyan-600 to-sky-500',      badge: 'bg-cyan-100 text-cyan-600',    light: 'text-cyan-100',   ring: 'ring-cyan-300' },
];

const emptyModal = { amount: '', interest: '', period: '' };

const TableHeader = ({ children }) => (
  <th className="px-2 py-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight text-center border-b border-gray-100 dark:border-gray-800">
    {children}
  </th>
);

const TableCell = ({ children, isBold = false }) => (
  <td className={`px-2 py-4 text-xs ${isBold ? 'font-bold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'} text-center border-b border-gray-50 dark:border-gray-800/80`}>
    {children}
  </td>
);

const CompareLoansList = ({ initialLoans, onBack, onDetails }) => {
  const [loans, setLoans] = useState(initialLoans);
  const [showModal, setShowModal] = useState(false);
  const [modal, setModal] = useState(emptyModal);
  const [modalError, setModalError] = useState('');

  const handleOpenModal = () => {
    setModal(emptyModal);
    setModalError('');
    setShowModal(true);
  };

  const handleAddLoan = () => {
    if (!modal.amount || !modal.interest || !modal.period) {
      setModalError('Please fill in all fields.');
      return;
    }
    const emi = calculateEMI(modal.amount, modal.interest, modal.period, true);
    const totalPayment = emi * parseInt(modal.period);
    const totalInterest = totalPayment - parseFloat(modal.amount);
    const newLoan = {
      ...modal,
      label: `Loan ${loans.length + 1}`,
      emi,
      totalPayment,
      totalInterest,
    };
    setLoans(prev => [...prev, newLoan]);
    setShowModal(false);
  };

  const bestIdx = loans.reduce(
    (best, l, i) => (l.totalPayment < loans[best].totalPayment ? i : best),
    0
  );
  const worstIdx = loans.reduce(
    (worst, l, i) => (l.totalPayment > loans[worst].totalPayment ? i : worst),
    0
  );
  const savings = loans.length > 1
    ? loans[worstIdx].totalPayment - loans[bestIdx].totalPayment
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 relative">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center justify-between bg-[#779BB1] dark:bg-gray-900 border-b border-transparent dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full shadow-sm text-white active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-white">Compare Loans</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Best Pick Summary */}
        {loans.length > 1 && (
          <div className="mx-6 mt-6 mb-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-950 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-yellow-400/20 rounded-xl">
                <Trophy size={20} className="text-yellow-400" />
              </div>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Best Pick Recommendation</span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-white text-lg font-bold">
                  {loans[bestIdx].label} is the most cost-effective
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Lowest total payment of <span className="text-emerald-400 font-bold">{formatCurrency(loans[bestIdx].totalPayment)}</span>
                </p>
              </div>

              {savings > 0 && (
                <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                  <TrendingDown size={16} className="text-emerald-400" />
                  <p className="text-sm text-gray-200">
                    Saves <span className="text-emerald-400 font-black">{formatCurrency(savings)}</span> compared to the highest option.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-6">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Comparison Matrix</p>
          <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/60">
                  <TableHeader>Loan Amount</TableHeader>
                  <TableHeader>%</TableHeader>
                  <TableHeader>Period (Months)</TableHeader>
                  <TableHeader>Monthly EMI</TableHeader>
                  <TableHeader>Total Interest</TableHeader>
                  <TableHeader>Total Payment</TableHeader>
                  <TableHeader>Details</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-55 dark:divide-gray-800">
                {loans.map((loan, i) => (
                  <tr key={i} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors ${i === bestIdx ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                    <TableCell isBold>{Math.round(loan.amount).toLocaleString()}</TableCell>
                    <TableCell>{loan.interest}</TableCell>
                    <TableCell>{loan.period}</TableCell>
                    <TableCell isBold>{Math.round(loan.emi).toLocaleString()}</TableCell>
                    <TableCell>{Math.round(loan.totalInterest).toLocaleString()}</TableCell>
                    <TableCell isBold>{Math.round(loan.totalPayment).toLocaleString()}</TableCell>
                    <TableCell>
                      <button 
                        onClick={() => onDetails(loan)} 
                        className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-90 transition-all"
                      >
                        <Info size={16} />
                      </button>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Add Loan Button */}
      <div className="absolute bottom-8 right-6 z-10">
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-[#3282B8] text-white px-6 py-3.5 rounded-full shadow-xl font-bold text-sm active:scale-95 transition-all"
        >
          <Plus size={20} />
          Add Loan
        </button>
      </div>

      {/* Add Loan Modal (Image 3 Style) */}
      {showModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in border border-transparent dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#3282B8] dark:text-blue-400 mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">Add New Loan</h2>
              
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <label className="w-20 text-sm font-bold text-gray-700 dark:text-gray-300">Amount</label>
                  <input
                    id="modal-amount"
                    type="number"
                    inputMode="decimal"
                    placeholder="Loan Amount"
                    value={modal.amount}
                    onChange={e => setModal({ ...modal, amount: e.target.value })}
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-20 text-sm font-bold text-gray-700 dark:text-gray-300">Interest %</label>
                  <input
                    id="modal-interest"
                    type="number"
                    inputMode="decimal"
                    placeholder="Interest %"
                    value={modal.interest}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) <= 100) {
                        setModal({ ...modal, interest: val });
                      }
                    }}
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-20 text-sm font-bold text-gray-700 dark:text-gray-300">Period</label>
                  <input
                    id="modal-period"
                    type="number"
                    inputMode="decimal"
                    placeholder="Months"
                    value={modal.period}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) <= 960) {
                        setModal({ ...modal, period: val });
                      }
                    }}
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                  />
                </div>

                {modalError && (
                  <p className="text-xs text-red-500 font-semibold text-center">{modalError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-750 text-white dark:text-gray-300 py-2.5 rounded-full font-bold shadow-sm active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button onClick={handleAddLoan} className="flex-1 bg-[#3282B8] text-white py-2.5 rounded-full font-bold shadow-sm active:scale-95 transition-all">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareLoansList;
