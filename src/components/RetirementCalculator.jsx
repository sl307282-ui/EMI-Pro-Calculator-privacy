import React, { useState, useMemo } from 'react';
import {
  RotateCcw, Share2, ShieldCheck, Umbrella, CheckCircle2,
  AlertTriangle, Calendar, Award, ArrowRight, DollarSign
} from 'lucide-react';
import {
  formatNumericInput,
  parseFormattedNumber,
  formatCurrency,
  calculateNPS,
  calculateEPF,
  calculateGratuity
} from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const fmtCompact = (num) => {
  const val = Math.abs(num);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function RetirementCalculator({ onBack }) {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [activeTab, setActiveTab] = useState('NPS'); // 'NPS' | 'EPF' | 'GRATUITY'

  // -------------------------------------------------------------
  // TAB 1: NPS STATE
  // -------------------------------------------------------------
  const [npsMonthly, setNpsMonthly] = useState('5000');
  const [npsAge, setNpsAge] = useState('30');
  const [npsRetireAge, setNpsRetireAge] = useState('60');
  const [npsReturnRate, setNpsReturnRate] = useState('10');
  const [npsAnnuityPct, setNpsAnnuityPct] = useState('40');
  const [npsAnnuityRate, setNpsAnnuityRate] = useState('6.5');

  // -------------------------------------------------------------
  // TAB 2: EPF STATE
  // -------------------------------------------------------------
  const [epfAge, setEpfAge] = useState('25');
  const [epfRetireAge, setEpfRetireAge] = useState('58');
  const [epfBasic, setEpfBasic] = useState('30000');
  const [epfEmployeePct, setEpfEmployeePct] = useState('12');
  const [epfEmployerPct, setEpfEmployerPct] = useState('3.67');
  const [epfAnnualInc, setEpfAnnualInc] = useState('5');
  const [epfRate, setEpfRate] = useState('8.25');

  // -------------------------------------------------------------
  // TAB 3: GRATUITY STATE
  // -------------------------------------------------------------
  const [gratuitySalary, setGratuitySalary] = useState('50000');
  const [gratuityYears, setGratuityYears] = useState('7');

  // -------------------------------------------------------------
  // MEMOIZED COMPUTATIONS
  // -------------------------------------------------------------
  const npsResults = useMemo(() => {
    return calculateNPS({
      monthlyContribution: npsMonthly,
      currentAge: npsAge,
      retirementAge: npsRetireAge,
      expectedReturnRate: npsReturnRate,
      annuityPurchasePct: npsAnnuityPct,
      expectedAnnuityRate: npsAnnuityRate
    });
  }, [npsMonthly, npsAge, npsRetireAge, npsReturnRate, npsAnnuityPct, npsAnnuityRate]);

  const epfResults = useMemo(() => {
    return calculateEPF({
      currentAge: epfAge,
      retirementAge: epfRetireAge,
      monthlyBasic: epfBasic,
      employeeContribPct: epfEmployeePct,
      employerSharePct: epfEmployerPct,
      annualSalaryIncrementPct: epfAnnualInc,
      epfInterestRate: epfRate
    });
  }, [epfAge, epfRetireAge, epfBasic, epfEmployeePct, epfEmployerPct, epfAnnualInc, epfRate]);

  const gratuityResults = useMemo(() => {
    return calculateGratuity({
      lastDrawnSalary: gratuitySalary,
      completedYears: gratuityYears
    });
  }, [gratuitySalary, gratuityYears]);

  // -------------------------------------------------------------
  // RESET HANDLER
  // -------------------------------------------------------------
  const handleReset = () => {
    if (activeTab === 'NPS') {
      setNpsMonthly('5000');
      setNpsAge('30');
      setNpsRetireAge('60');
      setNpsReturnRate('10');
      setNpsAnnuityPct('40');
      setNpsAnnuityRate('6.5');
    } else if (activeTab === 'EPF') {
      setEpfAge('25');
      setEpfRetireAge('58');
      setEpfBasic('30000');
      setEpfEmployeePct('12');
      setEpfEmployerPct('3.67');
      setEpfAnnualInc('5');
      setEpfRate('8.25');
    } else {
      setGratuitySalary('50000');
      setGratuityYears('7');
    }
  };

  // -------------------------------------------------------------
  // SHARE SUMMARY
  // -------------------------------------------------------------
  const handleShare = () => {
    if (activeTab === 'NPS') {
      const text = `🛡️ National Pension System (NPS) Summary\n` +
        `• Monthly Contribution: ₹${parseFloat(npsMonthly).toLocaleString('en-IN')}\n` +
        `• Accumulation Period: ${npsAge} to ${npsRetireAge} Yrs (${npsResults.totalYears} Years)\n` +
        `• Total Retirement Corpus: ${fmtCompact(npsResults.totalCorpus)}\n` +
        `• Tax-Free Lump Sum (${npsResults.lumpSumPct}%): ${fmtCompact(npsResults.lumpSumAmount)}\n` +
        `• Annuity Corpus (${npsResults.annuityPurchasePct}%): ${fmtCompact(npsResults.annuityCorpus)}\n` +
        `• Estimated Monthly Pension: ₹${npsResults.monthlyPension.toLocaleString('en-IN')}/month\n\n` +
        `Calculated via EMI Pro Retirement Planner`;
      shareAsText('NPS Retirement Plan', text);
    } else if (activeTab === 'EPF') {
      const text = `🏦 Employee Provident Fund (EPF) Summary\n` +
        `• Starting Basic Salary: ₹${parseFloat(epfBasic).toLocaleString('en-IN')}/mo\n` +
        `• Service Period: Age ${epfAge} to ${epfRetireAge} (${epfResults.totalYears} Years)\n` +
        `• Total Maturity Balance: ${fmtCompact(epfResults.totalMaturity)}\n` +
        `• Total Contributions: ${fmtCompact(epfResults.totalContrib)}\n` +
        `• Total Compound Interest: ${fmtCompact(epfResults.totalInterest)}\n\n` +
        `Calculated via EMI Pro Retirement Planner`;
      shareAsText('EPF Retirement Plan', text);
    } else {
      const text = `🎖️ Service Gratuity Summary\n` +
        `• Last Drawn Basic + DA: ₹${parseFloat(gratuitySalary).toLocaleString('en-IN')}\n` +
        `• Completed Service: ${gratuityYears} Years\n` +
        `• Gratuity Payout: ₹${gratuityResults.gratuityAmount.toLocaleString('en-IN')}\n` +
        `• Tax Exemption: ${gratuityResults.gratuityAmount <= gratuityResults.exemptLimit ? '100% Tax Free' : `Tax Free up to ₹20 Lakhs`}\n\n` +
        `Calculated via EMI Pro Retirement Planner`;
      shareAsText('Gratuity Estimate', text);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-gray-900 overflow-hidden h-full relative" style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar bg-transparent"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Retirement"
          onBack={onBack}
          rightActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Reset"
                aria-label="Reset"
              >
                <RotateCcw size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Share"
                aria-label="Share"
              >
                <Share2 size={20} strokeWidth={2} />
              </button>
            </div>
          }
        />

        <div className="px-5 pt-4 pb-10 max-w-lg mx-auto">
          {/* 3-Tab Segmented Switcher */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex gap-1 mb-6 shadow-inner">
            <button
              onClick={() => setActiveTab('NPS')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'NPS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NPS
            </button>
            <button
              onClick={() => setActiveTab('EPF')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'EPF'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              EPF
            </button>
            <button
              onClick={() => setActiveTab('GRATUITY')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'GRATUITY'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Gratuity
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: NPS (National Pension System)                      */}
          {/* ========================================================= */}
          {activeTab === 'NPS' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-purple-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-purple-100 uppercase">
                    Est. Monthly Pension
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    At Age {npsRetireAge}
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  ₹{npsResults.monthlyPension.toLocaleString('en-IN')}
                  <span className="text-xs font-medium text-purple-200 ml-1.5">/ month</span>
                </div>
                <p className="text-xs text-purple-100 mb-5">
                  Total Corpus: <span className="font-bold text-white">{fmtCompact(npsResults.totalCorpus)}</span> over {npsResults.totalYears} years
                </p>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Lump Sum (60%)</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(npsResults.lumpSumAmount)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Annuity (40%)</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(npsResults.annuityCorpus)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Total Invested</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(npsResults.totalInvested)}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Monthly Contribution */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Monthly Contribution
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(npsMonthly)}
                        onChange={(e) => setNpsMonthly(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="150000"
                    step="500"
                    value={parseFloat(npsMonthly) || 0}
                    onChange={(e) => setNpsMonthly(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Age Inputs Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Current Age (Years)
                    </label>
                    <input
                      type="number"
                      value={npsAge}
                      onChange={(e) => setNpsAge(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Retirement Age (Years)
                    </label>
                    <input
                      type="number"
                      value={npsRetireAge}
                      onChange={(e) => setNpsRetireAge(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Return Rate & Annuity Rate Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Expected Return (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={npsReturnRate}
                      onChange={(e) => setNpsReturnRate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Annuity Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={npsAnnuityRate}
                      onChange={(e) => setNpsAnnuityRate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EPF (Employee Provident Fund)                      */}
          {/* ========================================================= */}
          {activeTab === 'EPF' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-purple-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-purple-100 uppercase">
                    Total Maturity Balance
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    At Age {epfRetireAge} ({epfRate}%)
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  {fmtCompact(epfResults.totalMaturity)}
                </div>
                <p className="text-xs text-purple-100 mb-5">
                  Over {epfResults.totalYears} years of continuous provident fund compounding
                </p>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Your Deposit</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(epfResults.totalEmployeeContrib)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Employer Share</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(epfResults.totalEmployerContrib)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-purple-100 font-medium">Interest Earned</div>
                    <div className="text-xs font-bold mt-0.5 text-emerald-200">+{fmtCompact(epfResults.totalInterest)}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Monthly Basic + DA */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Monthly Basic Salary + DA
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(epfBasic)}
                        onChange={(e) => setEpfBasic(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="500000"
                    step="1000"
                    value={parseFloat(epfBasic) || 0}
                    onChange={(e) => setEpfBasic(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Age Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Current Age (Years)
                    </label>
                    <input
                      type="number"
                      value={epfAge}
                      onChange={(e) => setEpfAge(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Retirement Age (Years)
                    </label>
                    <input
                      type="number"
                      value={epfRetireAge}
                      onChange={(e) => setEpfRetireAge(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Annual Increment & Rate Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Salary Hike (% p.a.)
                    </label>
                    <input
                      type="number"
                      value={epfAnnualInc}
                      onChange={(e) => setEpfAnnualInc(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      EPF Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={epfRate}
                      onChange={(e) => setEpfRate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: GRATUITY (15/26 Formula)                           */}
          {/* ========================================================= */}
          {activeTab === 'GRATUITY' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-purple-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-purple-100 uppercase">
                    Gratuity Payout (15/26 Rule)
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    {gratuityYears} Years Service
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  ₹{gratuityResults.gratuityAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-purple-100 mb-5">
                  Formula: (15 × Last Basic & DA × {gratuityYears} Yrs) / 26
                </p>

                {/* Eligibility Callout Banner */}
                {gratuityResults.isEligible ? (
                  <div className="bg-white/15 border border-white/20 rounded-2xl p-3 flex items-start gap-2.5 backdrop-blur-sm">
                    <CheckCircle2 size={18} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-white">Eligible for Statutory Gratuity</div>
                      <div className="text-[11px] text-purple-100 leading-tight mt-0.5">
                        Completed 5+ years of continuous service. Tax-exempt up to ₹20,00,000 under the Payment of Gratuity Act.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/20 border border-amber-300/30 rounded-2xl p-3 flex items-start gap-2.5 backdrop-blur-sm">
                    <AlertTriangle size={18} className="text-amber-200 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-100">Below 5-Year Threshold</div>
                      <div className="text-[11px] text-amber-200/90 leading-tight mt-0.5">
                        5 continuous years of service are required for mandatory statutory gratuity payout.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Last Drawn Basic */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Last Drawn Monthly Basic + DA
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(gratuitySalary)}
                        onChange={(e) => setGratuitySalary(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="500000"
                    step="1000"
                    value={parseFloat(gratuitySalary) || 0}
                    onChange={(e) => setGratuitySalary(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Years of Service */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Completed Years of Service
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={gratuityYears}
                        onChange={(e) => setGratuityYears(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                      <span className="text-xs font-bold text-slate-400">Yrs</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="45"
                    step="1"
                    value={parseFloat(gratuityYears) || 0}
                    onChange={(e) => setGratuityYears(e.target.value)}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 Yr</span>
                    <span>5 Yrs (Eligible)</span>
                    <span>45 Yrs</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
