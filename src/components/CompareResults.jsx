import React from 'react';
import { ChevronLeft, TrendingDown, TrendingUp, Minus, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '../utils/calculatorLogic';

const StatRow = ({ label, value, accent }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-bold ${accent}`}>{value}</span>
  </div>
);

const CompareResults = ({ loans, onBack, onCompareMore }) => {
  const loan1 = loans[0];
  const loan2 = loans[1];

  const emiDiff = Math.abs(loan1.emi - loan2.emi);
  const totalPayDiff = Math.abs(loan1.totalPayment - loan2.totalPayment);
  const totalIntDiff = Math.abs(loan1.totalInterest - loan2.totalInterest);

  const betterIdx = loan1.totalPayment <= loan2.totalPayment ? 0 : 1;
  const betterLabel = `Loan ${betterIdx + 1}`;
  const worseLabel = `Loan ${betterIdx === 0 ? 2 : 1}`;

  const LoanCard = ({ loan, idx }) => {
    const isBetter = idx === betterIdx;
    return (
      <div
        className={`flex-1 rounded-3xl p-5 relative overflow-hidden ${
          isBetter
            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-premium'
            : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 shadow-soft transition-colors duration-300'
        }`}
      >
        {isBetter && (
          <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-[10px] font-black text-white tracking-wide">BEST</span>
          </div>
        )}

        <div
          className={`text-xs font-bold uppercase tracking-widest mb-3 ${
            isBetter ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {loan.label}
        </div>

        {/* Principal */}
        <div className={`text-[11px] font-semibold mb-1 ${isBetter ? 'text-blue-200' : 'text-gray-400'}`}>
          Principal
        </div>
        <div className={`text-lg font-black mb-4 ${isBetter ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {formatCurrency(parseFloat(loan.amount))}
        </div>

        <div className="space-y-0">
          <StatRow
            label="Monthly EMI"
            value={formatCurrency(loan.emi)}
            accent={isBetter ? 'text-white' : 'text-blue-600 dark:text-blue-450'}
          />
          <StatRow
            label="Total Interest"
            value={formatCurrency(loan.totalInterest)}
            accent={isBetter ? 'text-blue-100' : 'text-red-500 dark:text-red-400'}
          />
          <StatRow
            label="Total Payment"
            value={formatCurrency(loan.totalPayment)}
            accent={isBetter ? 'text-white' : 'text-gray-800 dark:text-white'}
          />
          <StatRow
            label="Rate"
            value={`${loan.interest}%`}
            accent={isBetter ? 'text-blue-100' : 'text-gray-500 dark:text-gray-450'}
          />
          <StatRow
            label="Period"
            value={`${loan.period} mo`}
            accent={isBetter ? 'text-blue-100' : 'text-gray-500 dark:text-gray-450'}
          />
        </div>
      </div>
    );
  };

  // Difference row helper
  const DiffItem = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${color} flex-shrink-0`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-bold text-gray-800 dark:text-white">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center gap-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-800 dark:text-gray-200 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
            <ArrowRightLeft size={18} className="text-pink-500 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Comparison</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">2 loans compared</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-5">
        {/* Side-by-side loan cards */}
        <div className="flex gap-3">
          <LoanCard loan={loan1} idx={0} />
          <LoanCard loan={loan2} idx={1} />
        </div>

        {/* Difference Highlight Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-950 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Difference Summary</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <DiffItem
              label="Monthly EMI difference"
              value={`${formatCurrency(emiDiff)} / month`}
              icon={emiDiff === 0 ? Minus : loan1.emi < loan2.emi ? TrendingDown : TrendingUp}
              color="bg-blue-500/20 text-blue-300"
            />
            <DiffItem
              label="Total Interest difference"
              value={formatCurrency(totalIntDiff)}
              icon={totalIntDiff === 0 ? Minus : loan1.totalInterest < loan2.totalInterest ? TrendingDown : TrendingUp}
              color="bg-emerald-500/20 text-emerald-300"
            />
            <DiffItem
              label="Total Payment difference"
              value={formatCurrency(totalPayDiff)}
              icon={totalPayDiff === 0 ? Minus : loan1.totalPayment < loan2.totalPayment ? TrendingDown : TrendingUp}
              color="bg-amber-500/20 text-amber-300"
            />
          </div>

          {/* Verdict */}
          {totalPayDiff > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-200 leading-relaxed">
                🏆 <span className="text-white font-bold">{betterLabel}</span> saves you{' '}
                <span className="text-emerald-400 font-bold">{formatCurrency(totalIntDiff)}</span> in total interest
                compared to <span className="text-white font-bold">{worseLabel}</span>.
              </p>
            </div>
          )}
          {totalPayDiff === 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-200">🤝 Both loans have identical total cost.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <button onClick={onCompareMore} className="btn-primary w-full shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
          <ArrowRightLeft size={18} />
          Compare More Loans
        </button>
      </div>
    </div>
  );
};

export default CompareResults;
