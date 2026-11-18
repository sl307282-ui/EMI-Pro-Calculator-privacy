import React, { useState, useMemo } from 'react';
import {
  RotateCcw, Share2, Receipt, Building2, CheckCircle2,
  AlertCircle, Sparkles, Percent, ArrowRight, ShieldCheck, DollarSign,
  ChevronDown, ChevronUp, Info, HelpCircle
} from 'lucide-react';
import {
  formatNumericInput,
  parseFormattedNumber,
  formatCurrency,
  calculateIncomeTax,
  calculateInHandSalary,
  calculateGST,
  SECTION_80G_CATEGORIES,
  AGE_GROUPS,
  EMPLOYER_TYPES
} from '../utils/calculatorLogic';
import { shareAsText } from '../utils/exportUtils';
import AppHeader from './AppHeader';
import CollapsingTabs from './CollapsingTabs';
import useHeaderScroll from '../hooks/useHeaderScroll';

const fmtCompact = (num) => {
  const val = Math.abs(num);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

// Subtle badge indicating deduction only applies in Old Regime
const OldRegimeBadge = () => (
  <span className="text-[9px] font-bold tracking-wide uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40 shrink-0">
    Old regime only
  </span>
);

// High-contrast pill displaying statutory allowed deduction
const AllowedPill = ({ label = 'Allowed', amount }) => (
  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
    {label}: ₹{typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount}
  </span>
);

export default function TaxSalaryCalculator({ onBack }) {
  const { headerRef, scrollRef, tabsRef, handleScroll, syncScroll } = useHeaderScroll({ threshold: 60, tabsThreshold: 80 });
  const [activeTab, setActiveTab] = useState('INCOME_TAX'); // 'INCOME_TAX' | 'IN_HAND' | 'GST'

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        syncScroll(scrollRef.current.scrollTop);
      }
    });
  };

  // -------------------------------------------------------------
  // TAB 1: INCOME TAX STATE
  // -------------------------------------------------------------
  const [grossSalary, setGrossSalary] = useState('1500000');
  const [ageGroup, setAgeGroup] = useState('BELOW_60'); // 'BELOW_60' | 'SENIOR' | 'SUPER_SENIOR'
  const [sec80C, setSec80C] = useState('150000');
  const [sec80D, setSec80D] = useState('25000');
  const [hraExemption, setHraExemption] = useState('0');
  const [homeLoan24b, setHomeLoan24b] = useState('0'); // Self-occupied interest

  // Accordion 1: Retirement (NPS)
  const [npsOwn80CCD1B, setNpsOwn80CCD1B] = useState('0');
  const [employerType, setEmployerType] = useState('PRIVATE'); // 'PRIVATE' | 'GOVT'
  const [basicPlusDA, setBasicPlusDA] = useState(''); // empty = auto 40% of gross
  const [employerNps80CCD2, setEmployerNps80CCD2] = useState('0');

  // Accordion 2: Loans & Donations
  const [educationLoan80E, setEducationLoan80E] = useState('0');
  const [donation80G, setDonation80G] = useState('0');
  const [donation80GCategory, setDonation80GCategory] = useState('100_NO_LIMIT');
  const [donationPaidCashOver2k, setDonationPaidCashOver2k] = useState(false);

  // Accordion 3: Interest Income
  const [savingsInterest, setSavingsInterest] = useState('0');

  // Accordion 4: House Property (Let-Out)
  const [letOutRent, setLetOutRent] = useState('0');
  const [letOutMunicipalTaxes, setLetOutMunicipalTaxes] = useState('0');
  const [letOutLoanInterest, setLetOutLoanInterest] = useState('0');

  // Accordion toggle states
  const [openSections, setOpenSections] = useState({
    nps: false,
    loans: false,
    interest: false,
    house: false
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // -------------------------------------------------------------
  // TAB 2: IN-HAND CTC STATE
  // -------------------------------------------------------------
  const [annualCTC, setAnnualCTC] = useState('1200000');
  const [basicPct, setBasicPct] = useState('40');
  const [epfMode, setEpfMode] = useState('standard'); // 'standard' | 'statutory_cap_1800'
  const [annualBonus, setAnnualBonus] = useState('0');
  const [monthlyPT, setMonthlyPT] = useState('200');

  // -------------------------------------------------------------
  // TAB 3: GST STATE
  // -------------------------------------------------------------
  const [gstAmount, setGstAmount] = useState('10000');
  const [gstRate, setGstRate] = useState(18);
  const [gstMode, setGstMode] = useState('EXCLUSIVE'); // 'EXCLUSIVE' | 'INCLUSIVE'

  // -------------------------------------------------------------
  // MEMOIZED COMPUTATIONS
  // -------------------------------------------------------------
  const taxResults = useMemo(() => {
    return calculateIncomeTax({
      grossSalary,
      ageGroup,
      sec80C,
      sec80D,
      hraExemption,
      homeLoanInterest24b: homeLoan24b,
      npsOwn80CCD1B,
      employerNps80CCD2,
      basicPlusDA: basicPlusDA === '' ? null : basicPlusDA,
      employerType,
      educationLoan80E,
      donation80G,
      donation80GCategory,
      donationPaidCashOver2k,
      savingsInterest,
      letOutRent,
      letOutMunicipalTaxes,
      letOutLoanInterest
    });
  }, [
    grossSalary,
    ageGroup,
    sec80C,
    sec80D,
    hraExemption,
    homeLoan24b,
    npsOwn80CCD1B,
    employerNps80CCD2,
    basicPlusDA,
    employerType,
    educationLoan80E,
    donation80G,
    donation80GCategory,
    donationPaidCashOver2k,
    savingsInterest,
    letOutRent,
    letOutMunicipalTaxes,
    letOutLoanInterest
  ]);

  const inHandResults = useMemo(() => {
    return calculateInHandSalary({
      annualCTC,
      basicSalaryPct: basicPct,
      epfMode,
      annualBonus,
      monthlyProfTax: monthlyPT
    });
  }, [annualCTC, basicPct, epfMode, annualBonus, monthlyPT]);

  const gstResults = useMemo(() => {
    return calculateGST({
      amount: gstAmount,
      rate: gstRate,
      mode: gstMode
    });
  }, [gstAmount, gstRate, gstMode]);

  // -------------------------------------------------------------
  // RESET HANDLER
  // -------------------------------------------------------------
  const handleReset = () => {
    if (activeTab === 'INCOME_TAX') {
      setGrossSalary('1500000');
      setAgeGroup('BELOW_60');
      setSec80C('150000');
      setSec80D('25000');
      setHraExemption('0');
      setHomeLoan24b('0');
      setNpsOwn80CCD1B('0');
      setEmployerType('PRIVATE');
      setBasicPlusDA('');
      setEmployerNps80CCD2('0');
      setEducationLoan80E('0');
      setDonation80G('0');
      setDonation80GCategory('100_NO_LIMIT');
      setDonationPaidCashOver2k(false);
      setSavingsInterest('0');
      setLetOutRent('0');
      setLetOutMunicipalTaxes('0');
      setLetOutLoanInterest('0');
    } else if (activeTab === 'IN_HAND') {
      setAnnualCTC('1200000');
      setBasicPct('40');
      setEpfMode('standard');
      setAnnualBonus('0');
      setMonthlyPT('200');
    } else {
      setGstAmount('10000');
      setGstRate(18);
      setGstMode('EXCLUSIVE');
    }
  };

  // -------------------------------------------------------------
  // SHARE SUMMARY
  // -------------------------------------------------------------
  const handleShare = () => {
    if (activeTab === 'INCOME_TAX') {
      const winnerText = taxResults.winner === 'NEW'
        ? `🌟 New Regime saves ₹${taxResults.taxDiff.toLocaleString('en-IN')}!`
        : taxResults.winner === 'OLD'
        ? `🌟 Old Regime saves ₹${taxResults.taxDiff.toLocaleString('en-IN')}!`
        : `Both regimes yield equal tax.`;
      const text = `📋 Income Tax Comparator (FY 2025-26)\n` +
        `• Gross Income: ₹${parseFloat(grossSalary).toLocaleString('en-IN')}\n` +
        `• Age Category: ${ageGroup === 'BELOW_60' ? 'Below 60' : ageGroup === 'SENIOR' ? 'Senior (60-79)' : 'Super Senior (80+)'}\n` +
        `• Total Deductions (Old): ₹${taxResults.totalDeductionsOld.toLocaleString('en-IN')}\n` +
        `• Total Deductions (New): ₹${taxResults.totalDeductionsNew.toLocaleString('en-IN')}\n` +
        `• New Regime Tax: ₹${taxResults.totalTaxNew.toLocaleString('en-IN')} (${taxResults.effectiveRateNew}% effective)\n` +
        `• Old Regime Tax: ₹${taxResults.totalTaxOld.toLocaleString('en-IN')} (${taxResults.effectiveRateOld}% effective)\n` +
        `• Recommendation: ${winnerText}\n\n` +
        `Calculated via EMI Pro Tax & Salary`;
      shareAsText('Income Tax Comparison', text);
    } else if (activeTab === 'IN_HAND') {
      const text = `💼 In-Hand Salary Breakdown\n` +
        `• Annual CTC: ₹${parseFloat(annualCTC).toLocaleString('en-IN')}\n` +
        `• Monthly Take-Home: ₹${inHandResults.monthlyInHand.toLocaleString('en-IN')}/month\n` +
        `• Annual In-Hand: ₹${inHandResults.annualInHand.toLocaleString('en-IN')}\n` +
        `• Employee PF: ₹${inHandResults.employeePFMonthly.toLocaleString('en-IN')}/mo\n` +
        `• Estimated Monthly TDS: ₹${inHandResults.monthlyTDS.toLocaleString('en-IN')}/mo\n\n` +
        `Calculated via EMI Pro Tax & Salary`;
      shareAsText('Take-Home Pay Breakdown', text);
    } else {
      const text = `🧾 GST Tax Splitter\n` +
        `• Input Amount: ₹${parseFloat(gstAmount).toLocaleString('en-IN')} (${gstMode})\n` +
        `• GST Rate: ${gstRate}%\n` +
        `• Net Base: ₹${gstResults.netBase.toLocaleString('en-IN')}\n` +
        `• CGST (50%): ₹${gstResults.cgst.toLocaleString('en-IN')}\n` +
        `• SGST (50%): ₹${gstResults.sgst.toLocaleString('en-IN')}\n` +
        `• Total GST: ₹${gstResults.gstAmount.toLocaleString('en-IN')}\n` +
        `• Final Gross: ₹${gstResults.grossTotal.toLocaleString('en-IN')}\n\n` +
        `Calculated via EMI Pro Tax & Salary`;
      shareAsText('GST Tax Split', text);
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
          title="Tax & Salary"
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

        {/* Sticky Collapsing Tab Switcher */}
        <CollapsingTabs
          ref={tabsRef}
          tabs={[
            { id: 'INCOME_TAX', label: 'Income Tax' },
            { id: 'IN_HAND', label: 'In-Hand CTC' },
            { id: 'GST', label: 'GST' },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="px-5 pt-3 pb-10 max-w-lg mx-auto">

          {/* ========================================================= */}
          {/* TAB 1: INCOME TAX (Old vs. New Regime)                    */}
          {/* ========================================================= */}
          {activeTab === 'INCOME_TAX' && (
            <div className="space-y-6">
              {/* Regime Recommendation Winner Banner */}
              <div className={`rounded-3xl p-5 text-white shadow-lg ${
                taxResults.winner === 'NEW'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20'
                  : taxResults.winner === 'OLD'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-slate-700 to-slate-900'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-blue-100">
                    Optimal Tax Choice (FY 2025–26)
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-semibold">
                    {taxResults.winner === 'NEW' ? 'New Regime Wins' : taxResults.winner === 'OLD' ? 'Old Regime Wins' : 'Equal Tax'}
                  </span>
                </div>
                <div className="text-2xl font-black mb-1">
                  {taxResults.winner === 'NEW' ? (
                    <>Save ₹{taxResults.taxDiff.toLocaleString('en-IN')} in New Regime</>
                  ) : taxResults.winner === 'OLD' ? (
                    <>Save ₹{taxResults.taxDiff.toLocaleString('en-IN')} in Old Regime</>
                  ) : (
                    <>Both Regimes Produce Identical Tax</>
                  )}
                </div>
                <p className="text-xs text-white/80">
                  {taxResults.winner === 'NEW'
                    ? 'New Regime gives ₹75k standard deduction and ₹12L rebate threshold.'
                    : 'Your high itemized deductions (80C, 80D, HRA) make Old Regime more beneficial.'}
                </p>
              </div>

              {/* Side-by-Side Comparison Matrix */}
              <div className="grid grid-cols-2 gap-3">
                {/* New Regime Card */}
                <div className={`p-4 rounded-3xl border transition-all ${
                  taxResults.winner === 'NEW'
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">New Regime</span>
                    {taxResults.winner === 'NEW' && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mb-1">
                    ₹{taxResults.totalTaxNew.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    Effective Rate: <span className="font-bold text-slate-700 dark:text-slate-200">{taxResults.effectiveRateNew}%</span>
                  </div>
                  <div className="text-[11px] space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Deductions:</span>
                      <span className="font-semibold">{fmtCompact(taxResults.totalDeductionsNew)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Taxable Income:</span>
                      <span className="font-semibold">{fmtCompact(taxResults.taxableNew)}</span>
                    </div>
                  </div>
                </div>

                {/* Old Regime Card */}
                <div className={`p-4 rounded-3xl border transition-all ${
                  taxResults.winner === 'OLD'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Old Regime</span>
                    {taxResults.winner === 'OLD' && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mb-1">
                    ₹{taxResults.totalTaxOld.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    Effective Rate: <span className="font-bold text-slate-700 dark:text-slate-200">{taxResults.effectiveRateOld}%</span>
                  </div>
                  <div className="text-[11px] space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Deductions:</span>
                      <span className="font-semibold">{fmtCompact(taxResults.totalDeductionsOld)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Taxable Income:</span>
                      <span className="font-semibold">{fmtCompact(taxResults.taxableOld)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Annual Gross Salary */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Annual Gross Salary / Income
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(grossSalary)}
                        onChange={(e) => setGrossSalary(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="300000"
                    max="10000000"
                    step="50000"
                    value={parseFloat(grossSalary) || 0}
                    onChange={(e) => setGrossSalary(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹3 Lakh</span>
                    <span>₹50 Lakh</span>
                    <span>₹1 Crore</span>
                  </div>
                </div>

                {/* Age Category Selector */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Taxpayer Age Category
                    </label>
                    <span className="text-[10px] text-slate-400">Old Regime slabs</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-gray-700/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAgeGroup('BELOW_60')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ageGroup === 'BELOW_60'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      Below 60
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeGroup('SENIOR')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ageGroup === 'SENIOR'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      60–79 (Sr)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeGroup('SUPER_SENIOR')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ageGroup === 'SUPER_SENIOR'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      80+ (Super Sr)
                    </button>
                  </div>
                </div>

                {/* Section 80C */}
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Section 80C Deductions
                        </label>
                        <OldRegimeBadge />
                      </div>
                      <div className="text-[10px] text-slate-400">EPF, PPF, ELSS, Life Ins. (Max ₹1.5L)</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(sec80C)}
                        onChange={(e) => setSec80C(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150000"
                    step="5000"
                    value={Math.min(150000, parseFloat(sec80C) || 0)}
                    onChange={(e) => setSec80C(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="mt-1">
                    <AllowedPill amount={taxResults.allowed80C} />
                  </div>
                </div>

                {/* Section 80D */}
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Section 80D Health Insurance
                        </label>
                        <OldRegimeBadge />
                      </div>
                      <div className="text-[10px] text-slate-400">Self, Family & Parents</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(sec80D)}
                        onChange={(e) => setSec80D(parseFormattedNumber(e.target.value))}
                        className="w-24 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={Math.min(100000, parseFloat(sec80D) || 0)}
                    onChange={(e) => setSec80D(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="mt-1">
                    <AllowedPill amount={taxResults.allowed80D} />
                  </div>
                </div>

                {/* HRA & 24b Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        HRA Exemption (₹)
                      </label>
                      <OldRegimeBadge />
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatNumericInput(hraExemption)}
                      onChange={(e) => setHraExemption(parseFormattedNumber(e.target.value))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                    <div className="mt-1">
                      <AllowedPill amount={taxResults.dedHRA} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        Self-Occupied Int 24(b) (₹)
                      </label>
                      <OldRegimeBadge />
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatNumericInput(homeLoan24b)}
                      onChange={(e) => setHomeLoan24b(parseFormattedNumber(e.target.value))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      placeholder="Max 2,00,000"
                    />
                    <div className="mt-1">
                      <AllowedPill amount={taxResults.selfOccupiedInterest} />
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* ACCORDION 1: RETIREMENT (NPS)                             */}
                {/* ========================================================= */}
                <div className="border border-slate-200/80 dark:border-gray-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-gray-800/60">
                  <button
                    type="button"
                    onClick={() => toggleSection('nps')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        Retirement (NPS)
                      </span>
                      {(parseFloat(npsOwn80CCD1B) > 0 || parseFloat(employerNps80CCD2) > 0) && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <span className="text-[10px] font-bold">{openSections.nps ? 'Hide' : 'Expand'}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${openSections.nps ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {openSections.nps && (
                    <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-gray-700 space-y-4">
                      {/* Own NPS 80CCD(1B) */}
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Own NPS – Section 80CCD(1B)
                              </label>
                              <OldRegimeBadge />
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Extra deduction outside ₹1.5L 80C limit (Capped at ₹50,000)
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumericInput(npsOwn80CCD1B)}
                              onChange={(e) => setNpsOwn80CCD1B(parseFormattedNumber(e.target.value))}
                              className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50000"
                          step="1000"
                          value={Math.min(50000, parseFloat(npsOwn80CCD1B) || 0)}
                          onChange={(e) => setNpsOwn80CCD1B(e.target.value)}
                          className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <AllowedPill amount={taxResults.allowedOwnNps80CCD1B} />
                          {parseFloat(npsOwn80CCD1B) > 50000 && (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              Capped at max ₹50,000
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Employer NPS 80CCD(2) */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Employer NPS – Section 80CCD(2)
                              </label>
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                                Both Regimes
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Cap: 14% New Regime; 10% Private / 14% Govt in Old Regime
                            </div>
                          </div>
                        </div>

                        {/* Employer Type Toggle */}
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700/50 p-2 rounded-xl border border-slate-200/80 dark:border-gray-600">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Employer Sector:</span>
                          <div className="flex gap-1 bg-slate-100 dark:bg-gray-800 p-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setEmployerType('PRIVATE')}
                              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                                employerType === 'PRIVATE'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Private (10% Old)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEmployerType('GOVT')}
                              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                                employerType === 'GOVT'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Govt (14% Old)
                            </button>
                          </div>
                        </div>

                        {/* Basic + DA input */}
                        <div className="flex justify-between items-center">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Basic + DA (annual)
                            </label>
                            <div className="text-[10px] text-slate-400">
                              {basicPlusDA === '' ? `Default 40% of gross (₹${taxResults.basicDA.toLocaleString('en-IN')})` : 'Custom Basic + DA used for cap'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder={taxResults.basicDA.toString()}
                              value={basicPlusDA === '' ? '' : formatNumericInput(basicPlusDA)}
                              onChange={(e) => setBasicPlusDA(parseFormattedNumber(e.target.value))}
                              className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Employer NPS Contribution amount */}
                        <div className="flex justify-between items-center">
                          <div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Employer NPS Contribution (₹)
                            </label>
                            <div className="text-[10px] text-slate-400">
                              Annual amount deposited by employer
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumericInput(employerNps80CCD2)}
                              onChange={(e) => setEmployerNps80CCD2(parseFormattedNumber(e.target.value))}
                              className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <AllowedPill label="Allowed in Old" amount={taxResults.allowedEmpNpsOld} />
                            <AllowedPill label="Allowed in New" amount={taxResults.allowedEmpNpsNew} />
                          </div>
                          {(taxResults.empNpsExceedsOld || taxResults.empNpsExceedsNew) && (
                            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                              <AlertCircle size={12} className="shrink-0" />
                              <span>Exceeds statutory cap; allowed deduction is capped.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* ACCORDION 2: LOANS & DONATIONS                            */}
                {/* ========================================================= */}
                <div className="border border-slate-200/80 dark:border-gray-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-gray-800/60">
                  <button
                    type="button"
                    onClick={() => toggleSection('loans')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        Loans & Donations
                      </span>
                      {(parseFloat(educationLoan80E) > 0 || parseFloat(donation80G) > 0) && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <span className="text-[10px] font-bold">{openSections.loans ? 'Hide' : 'Expand'}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${openSections.loans ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {openSections.loans && (
                    <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-gray-700 space-y-4">
                      {/* Education Loan Interest 80E */}
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Education Loan Interest – Section 80E
                              </label>
                              <OldRegimeBadge />
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Higher education loan interest (No upper limit, up to 8 years)
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumericInput(educationLoan80E)}
                              onChange={(e) => setEducationLoan80E(parseFormattedNumber(e.target.value))}
                              className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <AllowedPill amount={taxResults.allowed80E} />
                      </div>

                      {/* Section 80G Donations */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-gray-700 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Donations – Section 80G
                              </label>
                              <OldRegimeBadge />
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Eligible donations to approved funds/charities
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumericInput(donation80G)}
                              onChange={(e) => setDonation80G(parseFormattedNumber(e.target.value))}
                              className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Donation Category Dropdown */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Donation Category
                          </label>
                          <select
                            value={donation80GCategory}
                            onChange={(e) => setDonation80GCategory(e.target.value)}
                            className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-gray-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          >
                            {Object.values(SECTION_80G_CATEGORIES).map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Paid by Cash > 2000 Toggle */}
                        <div className="flex items-center justify-between bg-white dark:bg-gray-700/50 p-2 rounded-xl border border-slate-200/80 dark:border-gray-600">
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                              Paid by cash &gt; ₹2,000?
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Cash donations over ₹2k are ineligible
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDonationPaidCashOver2k(!donationPaidCashOver2k)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              donationPaidCashOver2k
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {donationPaidCashOver2k ? 'Yes (Cash > 2k)' : 'No (Online/Cheque)'}
                          </button>
                        </div>

                        <div>
                          <AllowedPill amount={taxResults.allowed80G} />
                          {taxResults.stepByStep80G && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                              {taxResults.stepByStep80G}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* ACCORDION 3: INTEREST INCOME                             */}
                {/* ========================================================= */}
                <div className="border border-slate-200/80 dark:border-gray-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-gray-800/60">
                  <button
                    type="button"
                    onClick={() => toggleSection('interest')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        Interest Income
                      </span>
                      {parseFloat(savingsInterest) > 0 && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <span className="text-[10px] font-bold">{openSections.interest ? 'Hide' : 'Expand'}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${openSections.interest ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {openSections.interest && (
                    <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-gray-700 space-y-3">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                Savings / Deposit Interest (₹)
                              </label>
                              <OldRegimeBadge />
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ageGroup === 'BELOW_60'
                                ? 'Section 80TTA: Up to ₹10k deduction on savings account interest'
                                : 'Section 80TTB: Up to ₹50k deduction on savings, FD & RD interest for seniors'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formatNumericInput(savingsInterest)}
                              onChange={(e) => setSavingsInterest(parseFormattedNumber(e.target.value))}
                              className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <AllowedPill
                          label={ageGroup === 'BELOW_60' ? 'Allowed (80TTA)' : 'Allowed (80TTB)'}
                          amount={taxResults.allowedInterestDedOld}
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          Added to gross income in both regimes; deducted in Old regime only.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* ACCORDION 4: HOUSE PROPERTY – LET OUT                     */}
                {/* ========================================================= */}
                <div className="border border-slate-200/80 dark:border-gray-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-gray-800/60">
                  <button
                    type="button"
                    onClick={() => toggleSection('house')}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        House Property – Let Out
                      </span>
                      {(parseFloat(letOutRent) > 0 || parseFloat(letOutLoanInterest) > 0) && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <span className="text-[10px] font-bold">{openSections.house ? 'Hide' : 'Expand'}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${openSections.house ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {openSections.house && (
                    <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-gray-700 space-y-3">
                      {/* Rent Received */}
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Annual Rent Received (₹)
                          </label>
                          <div className="text-[10px] text-slate-400">Gross rent from let-out property</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumericInput(letOutRent)}
                            onChange={(e) => setLetOutRent(parseFormattedNumber(e.target.value))}
                            className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Municipal Taxes */}
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Municipal Taxes Paid (₹)
                          </label>
                          <div className="text-[10px] text-slate-400">Paid by owner during the FY</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumericInput(letOutMunicipalTaxes)}
                            onChange={(e) => setLetOutMunicipalTaxes(parseFormattedNumber(e.target.value))}
                            className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Loan Interest on Let-out */}
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Let-Out Home Loan Interest (₹)
                          </label>
                          <div className="text-[10px] text-slate-400">Section 24(b) interest for let-out property</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumericInput(letOutLoanInterest)}
                            onChange={(e) => setLetOutLoanInterest(parseFormattedNumber(e.target.value))}
                            className="w-24 text-right text-xs font-bold px-2 py-1 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Calculation Breakdown Card */}
                      <div className="bg-white dark:bg-gray-750 p-3 rounded-xl border border-slate-200/80 dark:border-gray-600 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Net Annual Value (NAV):</span>
                          <span className="font-bold">₹{taxResults.nav.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>Standard Deduction (30% of NAV):</span>
                          <span className="font-bold">₹{taxResults.letOutStdDed.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-gray-700">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Net House Property:</span>
                          <span className={`font-black ${taxResults.netLetOutIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {taxResults.netLetOutIncome >= 0
                              ? `+₹${taxResults.netLetOutIncome.toLocaleString('en-IN')} (Income)`
                              : `-₹${Math.abs(taxResults.netLetOutIncome).toLocaleString('en-IN')} (Loss)`}
                          </span>
                        </div>
                        {taxResults.netLetOutIncome < 0 && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-gray-700 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                            <div>
                              • Old regime set-off: <span className="font-bold text-slate-700 dark:text-slate-200">₹{taxResults.allowedHouseLossSetOff.toLocaleString('en-IN')}</span> (Max ₹2L combined)
                            </div>
                            <div>
                              • New regime set-off: <span className="font-bold text-slate-700 dark:text-slate-200">₹0</span> (Loss cannot offset salary)
                            </div>
                            {taxResults.carryForwardLoss > 0 && (
                              <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <AlertCircle size={12} className="shrink-0" />
                                <span>Carry forward loss: ₹{taxResults.carryForwardLoss.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visible Footer Note */}
                <div className="text-center pt-3 pb-1">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">
                    Figures are estimates for planning purposes; tax slabs and limits are as of FY 2025-26.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: IN-HAND CTC SALARY BREAKDOWN                       */}
          {/* ========================================================= */}
          {activeTab === 'IN_HAND' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-700 dark:to-purple-900 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-indigo-100 uppercase">
                    Monthly Take-Home Pay
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    In-Hand Salary
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  ₹{inHandResults.monthlyInHand.toLocaleString('en-IN')}
                  <span className="text-xs font-medium text-indigo-200 ml-1.5">/ month</span>
                </div>
                <p className="text-xs text-indigo-100 mb-5">
                  Annual In-Hand Net: <span className="font-bold text-white">₹{inHandResults.annualInHand.toLocaleString('en-IN')}</span>
                </p>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-indigo-100 font-medium">Monthly CTC</div>
                    <div className="text-xs font-bold mt-0.5">{fmtCompact(inHandResults.monthlyCTC)}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-indigo-100 font-medium">EPF (Emp + Co)</div>
                    <div className="text-xs font-bold mt-0.5">₹{(inHandResults.employeePFMonthly * 2).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-indigo-100 font-medium">Est. Monthly TDS</div>
                    <div className="text-xs font-bold mt-0.5">₹{inHandResults.monthlyTDS.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Itemized Deductions Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3">
                  Monthly Deductions Breakdown
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-gray-700">
                    <span className="text-slate-600 dark:text-slate-300">Employee EPF (12% Basic):</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{inHandResults.employeePFMonthly.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-gray-700">
                    <span className="text-slate-600 dark:text-slate-300">Employer EPF (in CTC):</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{inHandResults.employerPFMonthly.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-gray-700">
                    <span className="text-slate-600 dark:text-slate-300">Professional Tax (PT):</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{inHandResults.monthlyProfTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-gray-700">
                    <span className="text-slate-600 dark:text-slate-300">Estimated Income Tax (TDS):</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{inHandResults.monthlyTDS.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-slate-900 dark:text-white">
                    <span>Total Monthly Deductions:</span>
                    <span className="text-rose-600 dark:text-rose-400">₹{inHandResults.totalMonthlyDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Annual CTC */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Annual Cost to Company (CTC)
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(annualCTC)}
                        onChange={(e) => setAnnualCTC(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="300000"
                    max="10000000"
                    step="50000"
                    value={parseFloat(annualCTC) || 0}
                    onChange={(e) => setAnnualCTC(e.target.value)}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹3 Lakh</span>
                    <span>₹50 Lakh</span>
                    <span>₹1 Crore</span>
                  </div>
                </div>

                {/* Basic Salary % */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Basic Salary (% of CTC)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={basicPct}
                        onChange={(e) => setBasicPct(e.target.value)}
                        className="w-16 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="1"
                    value={parseFloat(basicPct) || 40}
                    onChange={(e) => setBasicPct(e.target.value)}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* EPF Mode Switcher */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">
                    Employer EPF Contribution Scheme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEpfMode('standard')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        epfMode === 'standard'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Full 12% of Basic
                    </button>
                    <button
                      type="button"
                      onClick={() => setEpfMode('statutory_cap_1800')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        epfMode === 'statutory_cap_1800'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Capped at ₹1,800/mo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: GST CALCULATOR                                     */}
          {/* ========================================================= */}
          {activeTab === 'GST' && (
            <div className="space-y-6">
              {/* Primary Results Hero Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/15">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wide text-blue-100 uppercase">
                    Total GST Amount ({gstRate}%)
                  </span>
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium">
                    {gstMode === 'EXCLUSIVE' ? '+ GST Added' : '- GST Included'}
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">
                  ₹{gstResults.gstAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-blue-100 mb-5">
                  Gross Total: <span className="font-bold text-white">₹{gstResults.grossTotal.toLocaleString('en-IN')}</span> • Net Base: <span className="font-bold text-white">₹{gstResults.netBase.toLocaleString('en-IN')}</span>
                </p>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15">
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-blue-100 font-medium">CGST (50%)</div>
                    <div className="text-xs font-bold mt-0.5">₹{gstResults.cgst.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-blue-100 font-medium">SGST (50%)</div>
                    <div className="text-xs font-bold mt-0.5">₹{gstResults.sgst.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-2.5 text-center">
                    <div className="text-[10px] text-blue-100 font-medium">IGST (100%)</div>
                    <div className="text-xs font-bold mt-0.5">₹{gstResults.igst.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Input Form Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-gray-800 space-y-5">
                {/* Mode Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">
                    Calculation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGstMode('EXCLUSIVE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        gstMode === 'EXCLUSIVE'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      GST Exclusive (+ Tax)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstMode('INCLUSIVE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        gstMode === 'INCLUSIVE'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      GST Inclusive (- Tax)
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Amount
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumericInput(gstAmount)}
                        onChange={(e) => setGstAmount(parseFormattedNumber(e.target.value))}
                        className="w-28 text-right text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000000"
                    step="100"
                    value={parseFloat(gstAmount) || 0}
                    onChange={(e) => setGstAmount(e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rate Pills */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">
                    GST Rate
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[3, 5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setGstRate(rate)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          gstRate === rate
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
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
