import React, { useState, useMemo } from 'react';
import { ChevronLeft, Share2, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { shareAsText } from '../utils/exportUtils';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const AdvanceEMIDetails = ({ data, onBack }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const [viewType, setViewType] = useState('month'); // 'year' or 'month'

  const schedule = useMemo(() => {
    if (!data) return [];
    
    const { p, r, n, emiTiming, interestType } = data.raw;
    const emi = data.emi;
    const monthlySchedule = [];
    let balance = p;
    
    if (interestType === 'reducing') {
      if (emiTiming === 'advance') {
        // Month 0: First EMI at t=0
        monthlySchedule.push({
          month: 0,
          principal: emi,
          interest: 0,
          balance: p - emi,
          isAdvance: true
        });
        balance = p - emi;
        
        for (let i = 1; i < n; i++) {
          const interest = balance * r;
          const principal = emi - interest;
          balance -= principal;
          monthlySchedule.push({
            month: i,
            principal,
            interest,
            balance: Math.max(0, balance)
          });
        }
      } else {
        for (let i = 1; i <= n; i++) {
          const interest = balance * r;
          const principal = emi - interest;
          balance -= principal;
          monthlySchedule.push({
            month: i,
            principal,
            interest,
            balance: Math.max(0, balance)
          });
        }
      }
    } else {
      // Flat Rate
      const totalInterest = data.totalInterest;
      const monthlyInterest = totalInterest / n;
      const monthlyPrincipal = p / n;
      
      for (let i = 1; i <= n; i++) {
        balance -= monthlyPrincipal;
        monthlySchedule.push({
          month: i,
          principal: monthlyPrincipal,
          interest: monthlyInterest,
          balance: Math.max(0, balance)
        });
      }
    }
    
    return monthlySchedule;
  }, [data]);

  const yearlyData = useMemo(() => {
    const years = [];
    let currentYear = { year: 1, principal: 0, interest: 0, balance: 0 };
    
    schedule.forEach((m, index) => {
      currentYear.principal += m.principal;
      currentYear.interest += m.interest;
      currentYear.balance = m.balance;
      
      const isEndOfYear = (index + 1) % 12 === 0 || index === schedule.length - 1;
      
      if (isEndOfYear) {
        years.push({ ...currentYear });
        currentYear = { year: years.length + 1, principal: 0, interest: 0, balance: 0 };
      }
    });
    
    return years;
  }, [schedule]);

  const handleShare = () => {
    const text = `Advance EMI Loan Details:\n\n` +
                 `Loan Amount: ₹ ${Math.round(data.raw.p).toLocaleString()}\n` +
                 `Interest Rate: ${data.raw.annualRate}% (${data.raw.interestType})\n` +
                 `Tenure: ${data.raw.n} Months\n` +
                 `Monthly EMI: ₹ ${Math.round(data.emi).toLocaleString()}\n` +
                 `Total Interest: ₹ ${Math.round(data.totalInterest).toLocaleString()}\n` +
                 `Total Payment: ₹ ${Math.round(data.totalPayment).toLocaleString()}\n\n` +
                 `Shared via EMI Pro App`;
    shareAsText('Advance EMI Details', text);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden relative">
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Schedule Details"
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

        {/* Top Summary Table */}
        <section className="p-6">
          <div className="bg-white dark:bg-gray-800/40 rounded-3xl p-6 shadow-soft border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-y-6 gap-x-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Loan Amount</span>
              <p className="font-bold text-gray-800 dark:text-white">₹ {Math.round(data.raw.p).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Interest Rate</span>
              <p className="font-bold text-gray-800 dark:text-white">{data.raw.annualRate}% <span className="text-[10px] text-gray-400 dark:text-gray-500">({data.raw.interestType})</span></p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Tenure</span>
              <p className="font-bold text-gray-800 dark:text-white">{data.raw.n} Months</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Monthly EMI</span>
              <p className="font-bold text-primary dark:text-blue-400">₹ {Math.round(data.emi).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Total Interest</span>
              <p className="font-bold text-green-600 dark:text-emerald-500">₹ {Math.round(data.totalInterest).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Processing Fee</span>
              <p className="font-bold text-orange-500 dark:text-orange-400">₹ {Math.round(data.procFeeAmount).toLocaleString()}</p>
            </div>
            <div className="col-span-2 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-850 dark:text-gray-300">Total Payment</span>
              <span className="text-lg font-black text-gray-900 dark:text-white">₹ {Math.round(data.totalPayment).toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section className="px-6 pb-24">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Calendar size={20} className="text-primary dark:text-blue-400" />
              Loan Schedule
            </h2>
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl w-32 h-[40px] transition-colors duration-300">
              <button
                onClick={() => setViewType('year')}
                className={`flex-1 rounded-xl text-[10px] font-bold transition-all ${
                  viewType === 'year' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400 font-extrabold' : 'text-gray-500 dark:text-gray-450'
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setViewType('month')}
                className={`flex-1 rounded-xl text-[10px] font-bold transition-all ${
                  viewType === 'month' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400 font-extrabold' : 'text-gray-500 dark:text-gray-450'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/40 rounded-3xl overflow-hidden shadow-soft border border-gray-100 dark:border-gray-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary dark:bg-blue-750 text-white">
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">{viewType === 'month' ? 'Month' : 'Year'}</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">Principal</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">Interest</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {viewType === 'month' ? (
                  schedule.map((m, i) => {
                    const isEndOfYear = (i + 1) % 12 === 0 || i === schedule.length - 1;
                    
                    return (
                      <React.Fragment key={i}>
                        <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-4 font-bold text-gray-500 dark:text-gray-400">{m.month === 0 ? 'Adv' : m.month}</td>
                          <td className="px-4 py-4 text-gray-700 dark:text-gray-300">₹{Math.round(m.principal).toLocaleString()}</td>
                          <td className="px-4 py-4 text-gray-700 dark:text-gray-300">₹{Math.round(m.interest).toLocaleString()}</td>
                          <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">₹{Math.round(m.balance).toLocaleString()}</td>
                        </tr>
                        {isEndOfYear && (
                          <tr className="bg-blue-600 dark:bg-blue-800 text-white font-bold">
                            <td className="px-4 py-3 text-xs">Year {Math.ceil((i + 1) / 12)}</td>
                            <td className="px-4 py-3 text-xs">₹{Math.round(yearlyData[Math.floor(i / 12)]?.principal || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs">₹{Math.round(yearlyData[Math.floor(i / 12)]?.interest || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs">₹{Math.round(yearlyData[Math.floor(i / 12)]?.balance || 0).toLocaleString()}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  yearlyData.map((y, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-500 dark:text-gray-400">{y.year}</td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">₹{Math.round(y.principal).toLocaleString()}</td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">₹{Math.round(y.interest).toLocaleString()}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">₹{Math.round(y.balance).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdvanceEMIDetails;
