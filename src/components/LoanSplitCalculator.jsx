import React, { useState, useMemo } from 'react';
import {
  Layers, RotateCcw, Share2, Home, Car, Sparkles,
  ArrowRight, ShieldCheck, ChevronDown, ChevronUp, Check,
  AlertCircle, TrendingUp, Info, PieChart, Coins
} from 'lucide-react';
import AppHeader from './AppHeader';
import CollapsingTabs from './CollapsingTabs';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { useSettings } from '../context/SettingsContext';
import { shareAsText } from '../utils/exportUtils';
import {
  formatCurrency,
  formatNumericInput,
  parseFormattedNumber,
  calculateReducingLoan,
  calculateGoldLoanRepayment,
  calculateBlendedRate
} from '../utils/calculatorLogic';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function LoanSplitCalculator({ onBack }) {
  const { headerRef, scrollRef, tabsRef, syncScroll } = useHeaderScroll({ threshold: 60, tabsThreshold: 80 });
  const { currency } = useSettings();

  // Active Tab: 'multi' (Multi-Loan Split) or 'bridge' (Asset Down-Payment Split)
  const [activeTab, setActiveTab] = useState('multi');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        syncScroll(scrollRef.current.scrollTop);
      }
    });
  };

  // ---------- TAB 1: MULTI-LOAN SPLIT STATE ----------
  const [homeLoan, setHomeLoan] = useState({
    enabled: true,
    principal: '3500000',
    rate: '8.5',
    tenure: '20',
    isMonths: false,
    expanded: true
  });

  const [carLoan, setCarLoan] = useState({
    enabled: true,
    principal: '800000',
    rate: '9.25',
    tenure: '5',
    isMonths: false,
    expanded: true
  });

  const [goldLoan, setGoldLoan] = useState({
    enabled: true,
    principal: '300000',
    rate: '10.5',
    tenure: '12',
    isMonths: true,
    repaymentMode: 'regular', // 'regular' | 'interest_only' | 'bullet'
    bulletCompounding: 'monthly', // 'monthly' | 'simple'
    expanded: true
  });

  // Smart Avalanche Prepayment extra monthly amount
  const [extraPrepayment, setExtraPrepayment] = useState('5000');

  // ---------- TAB 2: ASSET DOWN-PAYMENT SPLIT STATE ----------
  const [assetType, setAssetType] = useState('home'); // 'home' | 'car'
  const [assetCost, setAssetCost] = useState('5000000');
  const [downPayment, setDownPayment] = useState('1000000');
  const [splitRatio, setSplitRatio] = useState(80); // % Primary loan, remaining % is Gold loan
  const [primaryRate, setPrimaryRate] = useState('8.5');
  const [primaryTenureYrs, setPrimaryTenureYrs] = useState('20');
  const [goldBridgeRate, setGoldBridgeRate] = useState('9.5');
  const [goldBridgeMonths, setGoldBridgeMonths] = useState('24'); // 2 yrs bridge

  // ==========================================
  // TAB 1 CALCULATIONS (SYNCHRONOUS USEMEMO)
  // ==========================================
  const multiLoanResults = useMemo(() => {
    // 1. Home Loan
    const homeP = homeLoan.enabled ? parseFloat(homeLoan.principal) || 0 : 0;
    const homeR = parseFloat(homeLoan.rate) || 0;
    const homeMonths = homeLoan.isMonths
      ? parseInt(homeLoan.tenure) || 1
      : (parseInt(homeLoan.tenure) || 1) * 12;
    const homeRes = homeLoan.enabled
      ? calculateReducingLoan(homeP, homeR, homeMonths)
      : { emi: 0, monthlyOutflow: 0, totalPayable: 0, totalInterest: 0 };

    // 2. Car Loan
    const carP = carLoan.enabled ? parseFloat(carLoan.principal) || 0 : 0;
    const carR = parseFloat(carLoan.rate) || 0;
    const carMonths = carLoan.isMonths
      ? parseInt(carLoan.tenure) || 1
      : (parseInt(carLoan.tenure) || 1) * 12;
    const carRes = carLoan.enabled
      ? calculateReducingLoan(carP, carR, carMonths)
      : { emi: 0, monthlyOutflow: 0, totalPayable: 0, totalInterest: 0 };

    // 3. Gold Loan
    const goldP = goldLoan.enabled ? parseFloat(goldLoan.principal) || 0 : 0;
    const goldR = parseFloat(goldLoan.rate) || 0;
    const goldMonths = goldLoan.isMonths
      ? parseInt(goldLoan.tenure) || 1
      : (parseInt(goldLoan.tenure) || 1) * 12;
    const goldRes = goldLoan.enabled
      ? calculateGoldLoanRepayment(
          goldP,
          goldR,
          goldMonths,
          goldLoan.repaymentMode,
          goldLoan.bulletCompounding
        )
      : { monthlyOutflow: 0, totalPayable: 0, totalInterest: 0, principalBullet: 0 };

    // Aggregates
    const totalPrincipal = homeP + carP + goldP;
    const totalMonthlyOutflow =
      homeRes.monthlyOutflow + carRes.monthlyOutflow + goldRes.monthlyOutflow;
    const totalInterest =
      homeRes.totalInterest + carRes.totalInterest + goldRes.totalInterest;
    const grandTotal = totalPrincipal + totalInterest;

    // Weighted Blended Rate
    const activeLoansList = [
      { principal: homeP, rate: homeR, enabled: homeLoan.enabled },
      { principal: carP, rate: carR, enabled: carLoan.enabled },
      { principal: goldP, rate: goldR, enabled: goldLoan.enabled }
    ];
    const blendedRate = calculateBlendedRate(activeLoansList);

    // Shares
    const homePrincipalShare = totalPrincipal > 0 ? (homeP / totalPrincipal) * 100 : 0;
    const carPrincipalShare = totalPrincipal > 0 ? (carP / totalPrincipal) * 100 : 0;
    const goldPrincipalShare = totalPrincipal > 0 ? (goldP / totalPrincipal) * 100 : 0;

    const homeInterestShare = totalInterest > 0 ? (homeRes.totalInterest / totalInterest) * 100 : 0;
    const carInterestShare = totalInterest > 0 ? (carRes.totalInterest / totalInterest) * 100 : 0;
    const goldInterestShare = totalInterest > 0 ? (goldRes.totalInterest / totalInterest) * 100 : 0;

    // Smart Avalanche Prepayment Recommendation
    // Find active loan with highest interest rate
    const candidates = [
      { id: 'gold', name: 'Gold Loan', p: goldP, rate: goldR, months: goldMonths, res: goldRes, enabled: goldLoan.enabled },
      { id: 'car', name: 'Car Loan', p: carP, rate: carR, months: carMonths, res: carRes, enabled: carLoan.enabled },
      { id: 'home', name: 'Home Loan', p: homeP, rate: homeR, months: homeMonths, res: homeRes, enabled: homeLoan.enabled }
    ].filter((c) => c.enabled && c.p > 0);

    // Sort descending by rate
    candidates.sort((a, b) => b.rate - a.rate);
    const targetLoan = candidates[0] || null;

    let avalancheSavings = 0;
    let avalancheMonthsSaved = 0;
    const extraP = parseFloat(extraPrepayment) || 0;

    if (targetLoan && extraP > 0) {
      // Simulate prepayment on target loan
      const r = targetLoan.rate / 12 / 100;
      const emiBase = targetLoan.res.monthlyOutflow || (targetLoan.p * r);
      const acceleratedPayment = emiBase + extraP;

      let bal = targetLoan.p;
      let newTotalInterest = 0;
      let newMonths = 0;

      while (bal > 0 && newMonths < targetLoan.months * 2) {
        newMonths++;
        const interestM = bal * r;
        newTotalInterest += interestM;
        const princPaid = Math.min(bal, acceleratedPayment - interestM);
        bal -= princPaid;
        if (bal <= 0) break;
      }

      avalancheSavings = Math.max(0, targetLoan.res.totalInterest - newTotalInterest);
      avalancheMonthsSaved = Math.max(0, targetLoan.months - newMonths);
    }

    return {
      homeRes,
      carRes,
      goldRes,
      totalPrincipal,
      totalMonthlyOutflow,
      totalInterest,
      grandTotal,
      blendedRate,
      homePrincipalShare,
      carPrincipalShare,
      goldPrincipalShare,
      homeInterestShare,
      carInterestShare,
      goldInterestShare,
      targetLoan,
      avalancheSavings,
      avalancheMonthsSaved
    };
  }, [homeLoan, carLoan, goldLoan, extraPrepayment]);

  // ==========================================
  // TAB 2 CALCULATIONS (ASSET DOWN-PAYMENT SPLIT)
  // ==========================================
  const bridgeResults = useMemo(() => {
    const cost = parseFloat(assetCost) || 0;
    const dp = Math.min(cost, parseFloat(downPayment) || 0);
    const totalLoanNeeded = Math.max(0, cost - dp);

    const primaryRatio = splitRatio / 100;
    const goldRatio = (100 - splitRatio) / 100;

    const primaryP = totalLoanNeeded * primaryRatio;
    const goldBridgeP = totalLoanNeeded * goldRatio;

    const primR = parseFloat(primaryRate) || 0;
    const primMonths = (parseInt(primaryTenureYrs) || 1) * 12;

    const goldR = parseFloat(goldBridgeRate) || 0;
    const goldM = parseInt(goldBridgeMonths) || 1;

    // Option A: 100% Single Primary Loan
    const optASingle = calculateReducingLoan(totalLoanNeeded, primR, primMonths);

    // Option B: Split (Primary Loan + Gold Bridge)
    const optBPrimary = calculateReducingLoan(primaryP, primR, primMonths);
    const optBGold = calculateReducingLoan(goldBridgeP, goldR, goldM);

    const optBYear1Monthly = optBPrimary.emi + optBGold.emi;
    const optBYear2PlusMonthly = optBPrimary.emi; // Once gold loan is paid off!

    const optBTotalInterest = optBPrimary.totalInterest + optBGold.totalInterest;
    const optBGrandTotal = totalLoanNeeded + optBTotalInterest;

    const interestDifference = optASingle.totalInterest - optBTotalInterest;
    // Positive means Option B saved interest! Negative means Option B cost slightly more in interest for liquidity.

    const year1SingleOutflow = optASingle.emi * Math.min(12, primMonths);
    const year1SplitOutflow = optBPrimary.emi * 12 + optBGold.emi * Math.min(12, goldM);

    return {
      totalLoanNeeded,
      primaryP,
      goldBridgeP,
      optASingle,
      optBPrimary,
      optBGold,
      optBYear1Monthly,
      optBYear2PlusMonthly,
      optBTotalInterest,
      optBGrandTotal,
      interestDifference,
      year1SingleOutflow,
      year1SplitOutflow
    };
  }, [assetCost, downPayment, splitRatio, primaryRate, primaryTenureYrs, goldBridgeRate, goldBridgeMonths]);

  // ---------- RESET HANDLERS ----------
  const handleResetMulti = () => {
    setHomeLoan({
      enabled: true,
      principal: '3500000',
      rate: '8.5',
      tenure: '20',
      isMonths: false,
      expanded: true
    });
    setCarLoan({
      enabled: true,
      principal: '800000',
      rate: '9.25',
      tenure: '5',
      isMonths: false,
      expanded: true
    });
    setGoldLoan({
      enabled: true,
      principal: '300000',
      rate: '10.5',
      tenure: '12',
      isMonths: true,
      repaymentMode: 'regular',
      bulletCompounding: 'monthly',
      expanded: true
    });
    setExtraPrepayment('5000');
  };

  const handleResetBridge = () => {
    setAssetType('home');
    setAssetCost('5000000');
    setDownPayment('1000000');
    setSplitRatio(80);
    setPrimaryRate('8.5');
    setPrimaryTenureYrs('20');
    setGoldBridgeRate('9.5');
    setGoldBridgeMonths('24');
  };

  const handleShare = () => {
    if (activeTab === 'multi') {
      const text = `📊 Loan Split Summary (EMI Pro)
----------------------------------
Combined Monthly EMI: ₹${fmt(multiLoanResults.totalMonthlyOutflow)}
Total Principal: ₹${fmt(multiLoanResults.totalPrincipal)}
Total Interest: ₹${fmt(multiLoanResults.totalInterest)}
Grand Total Payable: ₹${fmt(multiLoanResults.grandTotal)}
Blended Borrowing Rate: ${multiLoanResults.blendedRate.toFixed(2)}% p.a.

Active Loans:
• Home: ₹${fmt(homeLoan.principal)} @ ${homeLoan.rate}% (${multiLoanResults.homePrincipalShare.toFixed(1)}% share)
• Car: ₹${fmt(carLoan.principal)} @ ${carLoan.rate}% (${multiLoanResults.carPrincipalShare.toFixed(1)}% share)
• Gold: ₹${fmt(goldLoan.principal)} @ ${goldLoan.rate}% (${multiLoanResults.goldPrincipalShare.toFixed(1)}% share)

Calculated via EMI Pro.`;
      shareAsText('Loan Split Breakdown', text);
    } else {
      const text = `🏡 Asset Down-Payment Split (EMI Pro)
----------------------------------
Total Asset Cost: ₹${fmt(assetCost)}
Down Payment: ₹${fmt(downPayment)}
Loan Needed: ₹${fmt(bridgeResults.totalLoanNeeded)}

Option A (100% Primary Loan):
Monthly EMI: ₹${fmt(bridgeResults.optASingle.emi)}
Total Interest: ₹${fmt(bridgeResults.optASingle.totalInterest)}

Option B (Split: ${splitRatio}% Primary + ${100 - splitRatio}% Gold Bridge):
Yr 1 Monthly Outflow: ₹${fmt(bridgeResults.optBYear1Monthly)}
Yr 2+ Monthly EMI: ₹${fmt(bridgeResults.optBYear2PlusMonthly)} (Once Gold is cleared!)
Total Interest: ₹${fmt(bridgeResults.optBTotalInterest)}

Calculated via EMI Pro.`;
      shareAsText('Asset Down-Payment Split', text);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-none overflow-hidden relative"
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'opacity, transform'
      }}
    >
      {/* Scrollable Container with Sticky AppHeader */}
      <div
        ref={scrollRef}
        onScroll={(e) => syncScroll(e.currentTarget.scrollTop)}
        className="flex-1 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y min-h-0"
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 24px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Loan Split"
          onBack={onBack}
          rightActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={activeTab === 'multi' ? handleResetMulti : handleResetBridge}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Reset values"
                aria-label="Reset"
              >
                <RotateCcw size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center"
                title="Share calculation"
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
            { id: 'multi', label: 'Multi-Loan Split', icon: Layers },
            { id: 'bridge', label: 'Down-Payment Split', icon: PieChart },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="px-5 pt-3 pb-10 max-w-lg mx-auto space-y-4">
          {/* ======================================================== */}
          {/* MODE 1: MULTI-LOAN SPLIT (HOME + CAR + GOLD) */}
          {/* ======================================================== */}
          {activeTab === 'multi' && (
            <>
              {/* Summary Hero Card */}
              <div className="rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] text-white p-5 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      Combined Monthly Outflow
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Blended: {multiLoanResults.blendedRate.toFixed(2)}% p.a.
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-3xl font-black tracking-tight text-white">
                      ₹{fmt(multiLoanResults.totalMonthlyOutflow)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/month</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-800/80">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Loan
                      </p>
                      <p className="text-xs font-black text-slate-200 mt-0.5">
                        ₹{fmt(multiLoanResults.totalPrincipal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Interest
                      </p>
                      <p className="text-xs font-black text-amber-400 mt-0.5">
                        ₹{fmt(multiLoanResults.totalInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Grand Total
                      </p>
                      <p className="text-xs font-black text-white mt-0.5">
                        ₹{fmt(multiLoanResults.grandTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Split Breakdown Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                    Principal Allocation Split
                  </h3>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    3 Active Buckets
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden flex shadow-inner">
                  {multiLoanResults.homePrincipalShare > 0 && (
                    <div
                      style={{ width: `${multiLoanResults.homePrincipalShare}%` }}
                      className="bg-blue-600 transition-all duration-300"
                      title={`Home Loan: ${multiLoanResults.homePrincipalShare.toFixed(1)}%`}
                    />
                  )}
                  {multiLoanResults.carPrincipalShare > 0 && (
                    <div
                      style={{ width: `${multiLoanResults.carPrincipalShare}%` }}
                      className="bg-purple-600 transition-all duration-300"
                      title={`Car Loan: ${multiLoanResults.carPrincipalShare.toFixed(1)}%`}
                    />
                  )}
                  {multiLoanResults.goldPrincipalShare > 0 && (
                    <div
                      style={{ width: `${multiLoanResults.goldPrincipalShare}%` }}
                      className="bg-amber-500 transition-all duration-300"
                      title={`Gold Loan: ${multiLoanResults.goldPrincipalShare.toFixed(1)}%`}
                    />
                  )}
                </div>

                {/* Legend & Breakdown Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                      <span className="text-[11px] font-black text-blue-900 dark:text-blue-300">
                        Home
                      </span>
                    </div>
                    <p className="text-xs font-black text-blue-700 dark:text-blue-400">
                      {multiLoanResults.homePrincipalShare.toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      ₹{fmt(multiLoanResults.homeRes.monthlyOutflow)}/m
                    </p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100/60 dark:border-purple-900/30">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                      <span className="text-[11px] font-black text-purple-900 dark:text-purple-300">
                        Car
                      </span>
                    </div>
                    <p className="text-xs font-black text-purple-700 dark:text-purple-400">
                      {multiLoanResults.carPrincipalShare.toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      ₹{fmt(multiLoanResults.carRes.monthlyOutflow)}/m
                    </p>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span className="text-[11px] font-black text-amber-900 dark:text-amber-300">
                        Gold
                      </span>
                    </div>
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                      {multiLoanResults.goldPrincipalShare.toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      ₹{fmt(multiLoanResults.goldRes.monthlyOutflow)}/m
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Card 1: Home Loan */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                      <Home size={18} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                        Home Loan
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Reducing EMI • Long Tenure
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={homeLoan.enabled}
                      onChange={(e) =>
                        setHomeLoan((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {homeLoan.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {homeLoan.enabled && (
                  <div className="pt-2 space-y-3.5 border-t border-gray-100 dark:border-gray-800">
                    {/* Amount */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Loan Amount
                        </span>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumericInput(homeLoan.principal)}
                            onChange={(e) =>
                              setHomeLoan((prev) => ({
                                ...prev,
                                principal: parseFormattedNumber(e.target.value)
                              }))
                            }
                            className="w-24 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="100000"
                        max="20000000"
                        step="50000"
                        value={homeLoan.principal || 0}
                        onChange={(e) =>
                          setHomeLoan((prev) => ({ ...prev, principal: e.target.value }))
                        }
                        className="w-full accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Rate & Tenure Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Rate (% p.a.)
                          </span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                            {homeLoan.rate}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="20"
                          step="0.05"
                          value={homeLoan.rate || 0}
                          onChange={(e) =>
                            setHomeLoan((prev) => ({ ...prev, rate: e.target.value }))
                          }
                          className="w-full accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Tenure ({homeLoan.isMonths ? 'Mos' : 'Yrs'})
                          </span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                            {homeLoan.tenure} {homeLoan.isMonths ? 'm' : 'y'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max={homeLoan.isMonths ? 360 : 30}
                          step="1"
                          value={homeLoan.tenure || 1}
                          onChange={(e) =>
                            setHomeLoan((prev) => ({ ...prev, tenure: e.target.value }))
                          }
                          className="w-full accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-900 dark:text-blue-300">
                        Home EMI
                      </span>
                      <span className="font-black text-blue-700 dark:text-blue-400">
                        ₹{fmt(multiLoanResults.homeRes.emi)} / mo
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Card 2: Car Loan */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                      <Car size={18} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                        Car Loan
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Vehicle Financing • Medium Tenure
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={carLoan.enabled}
                      onChange={(e) =>
                        setCarLoan((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {carLoan.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {carLoan.enabled && (
                  <div className="pt-2 space-y-3.5 border-t border-gray-100 dark:border-gray-800">
                    {/* Amount */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Loan Amount
                        </span>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumericInput(carLoan.principal)}
                            onChange={(e) =>
                              setCarLoan((prev) => ({
                                ...prev,
                                principal: parseFormattedNumber(e.target.value)
                              }))
                            }
                            className="w-24 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="50000"
                        max="5000000"
                        step="25000"
                        value={carLoan.principal || 0}
                        onChange={(e) =>
                          setCarLoan((prev) => ({ ...prev, principal: e.target.value }))
                        }
                        className="w-full accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Rate & Tenure */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Rate (% p.a.)
                          </span>
                          <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                            {carLoan.rate}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="7"
                          max="25"
                          step="0.05"
                          value={carLoan.rate || 0}
                          onChange={(e) =>
                            setCarLoan((prev) => ({ ...prev, rate: e.target.value }))
                          }
                          className="w-full accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Tenure ({carLoan.isMonths ? 'Mos' : 'Yrs'})
                          </span>
                          <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                            {carLoan.tenure} {carLoan.isMonths ? 'm' : 'y'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max={carLoan.isMonths ? 84 : 7}
                          step="1"
                          value={carLoan.tenure || 1}
                          onChange={(e) =>
                            setCarLoan((prev) => ({ ...prev, tenure: e.target.value }))
                          }
                          className="w-full accent-purple-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-900 dark:text-purple-300">
                        Car EMI
                      </span>
                      <span className="font-black text-purple-700 dark:text-purple-400">
                        ₹{fmt(multiLoanResults.carRes.emi)} / mo
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Card 3: Gold Loan */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                      <Coins size={18} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                        Gold Loan
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Flexible Repayment • Bridge Capital
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={goldLoan.enabled}
                      onChange={(e) =>
                        setGoldLoan((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {goldLoan.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {goldLoan.enabled && (
                  <div className="pt-2 space-y-3.5 border-t border-gray-100 dark:border-gray-800">
                    {/* Repayment Mode Selector */}
                    <div>
                      <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        Repayment Mode
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-2xl text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() =>
                            setGoldLoan((prev) => ({ ...prev, repaymentMode: 'regular' }))
                          }
                          className={`py-2 px-1 rounded-xl transition-all ${
                            goldLoan.repaymentMode === 'regular'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          Regular EMI
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setGoldLoan((prev) => ({ ...prev, repaymentMode: 'interest_only' }))
                          }
                          className={`py-2 px-1 rounded-xl transition-all ${
                            goldLoan.repaymentMode === 'interest_only'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          Interest Only
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setGoldLoan((prev) => ({ ...prev, repaymentMode: 'bullet' }))
                          }
                          className={`py-2 px-1 rounded-xl transition-all ${
                            goldLoan.repaymentMode === 'bullet'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          Bullet Repay
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1 px-1">
                        {goldLoan.repaymentMode === 'regular' &&
                          'Standard reducing balance principal + interest EMI.'}
                        {goldLoan.repaymentMode === 'interest_only' &&
                          'Pay only monthly interest; full principal is repaid at end of tenure.'}
                        {goldLoan.repaymentMode === 'bullet' &&
                          'Zero monthly outflow; entire principal + interest paid at maturity.'}
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Loan Amount
                        </span>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumericInput(goldLoan.principal)}
                            onChange={(e) =>
                              setGoldLoan((prev) => ({
                                ...prev,
                                principal: parseFormattedNumber(e.target.value)
                              }))
                            }
                            className="w-24 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        min="25000"
                        max="2500000"
                        step="10000"
                        value={goldLoan.principal || 0}
                        onChange={(e) =>
                          setGoldLoan((prev) => ({ ...prev, principal: e.target.value }))
                        }
                        className="w-full accent-amber-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Rate & Tenure */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Rate (% p.a.)
                          </span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {goldLoan.rate}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="7"
                          max="28"
                          step="0.1"
                          value={goldLoan.rate || 0}
                          onChange={(e) =>
                            setGoldLoan((prev) => ({ ...prev, rate: e.target.value }))
                          }
                          className="w-full accent-amber-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Tenure ({goldLoan.isMonths ? 'Mos' : 'Yrs'})
                          </span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {goldLoan.tenure} {goldLoan.isMonths ? 'm' : 'y'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max={goldLoan.isMonths ? 36 : 3}
                          step="1"
                          value={goldLoan.tenure || 1}
                          onChange={(e) =>
                            setGoldLoan((prev) => ({ ...prev, tenure: e.target.value }))
                          }
                          className="w-full accent-amber-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        {goldLoan.repaymentMode === 'bullet'
                          ? 'Maturity Payable'
                          : 'Monthly Outflow'}
                      </span>
                      <span className="font-black text-amber-700 dark:text-amber-400">
                        ₹
                        {fmt(
                          goldLoan.repaymentMode === 'bullet'
                            ? multiLoanResults.goldRes.principalBullet
                            : multiLoanResults.goldRes.monthlyOutflow
                        )}{' '}
                        {goldLoan.repaymentMode !== 'bullet' && '/ mo'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Smart Avalanche Prepayment Insight */}
              {multiLoanResults.targetLoan && (
                <div className="rounded-3xl p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <TrendingUp size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wide">
                        Debt Avalanche Strategy
                      </h4>
                      <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Target Highest Rate First: {multiLoanResults.targetLoan.name} (
                        {multiLoanResults.targetLoan.rate}% p.a.)
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    By directing an extra prepayment toward your{' '}
                    <strong className="text-gray-900 dark:text-white">
                      {multiLoanResults.targetLoan.name}
                    </strong>
                    , you eliminate high compounding interest faster and lower your blended
                    borrowing rate.
                  </p>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Extra Monthly Prepayment
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₹{fmt(extraPrepayment)}/m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      step="1000"
                      value={extraPrepayment}
                      onChange={(e) => setExtraPrepayment(e.target.value)}
                      className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-900/40">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Interest Saved
                      </p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        ₹{fmt(multiLoanResults.avalancheSavings)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-emerald-100 dark:border-emerald-900/40">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Tenure Cut
                      </p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {multiLoanResults.avalancheMonthsSaved} Months
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* MODE 2: ASSET DOWN-PAYMENT SPLIT (HOME/CAR + GOLD BRIDGE) */}
          {/* ======================================================== */}
          {activeTab === 'bridge' && (
            <>
              {/* Asset Configuration Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <PieChart size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Asset Purchase Need
                      </h3>
                      <p className="text-[10px] text-gray-400 font-semibold">
                        Bridge down payment shortfall via Gold Loan
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-gray-100 dark:bg-gray-700/60 p-0.5 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setAssetType('home');
                        setAssetCost('5000000');
                        setDownPayment('1000000');
                        setPrimaryRate('8.5');
                        setPrimaryTenureYrs('20');
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        assetType === 'home'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-xs'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssetType('car');
                        setAssetCost('1500000');
                        setDownPayment('300000');
                        setPrimaryRate('9.25');
                        setPrimaryTenureYrs('5');
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        assetType === 'car'
                          ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-xs'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      Car
                    </button>
                  </div>
                </div>

                {/* Total Asset Cost */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Total Asset Value
                    </span>
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumericInput(assetCost)}
                        onChange={(e) =>
                          setAssetCost(parseFormattedNumber(e.target.value))
                        }
                        className="w-24 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max={assetType === 'home' ? '20000000' : '5000000'}
                    step="50000"
                    value={assetCost}
                    onChange={(e) => setAssetCost(e.target.value)}
                    className="w-full accent-amber-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Cash Down Payment */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Cash in Hand (Down Payment)
                    </span>
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-gray-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumericInput(downPayment)}
                        onChange={(e) =>
                          setDownPayment(parseFormattedNumber(e.target.value))
                        }
                        className="w-24 text-right text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={assetCost || 1000000}
                    step="25000"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    className="w-full accent-amber-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Total Loan Required Banner */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-gray-700/50 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Remaining Loan Needed:
                  </span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    ₹{fmt(bridgeResults.totalLoanNeeded)}
                  </span>
                </div>

                {/* Split Ratio Slider */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1 text-xs font-bold">
                    <span className="text-blue-600 dark:text-blue-400">
                      Primary ({splitRatio}% = ₹{fmt(bridgeResults.primaryP)})
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      Gold ({100 - splitRatio}% = ₹{fmt(bridgeResults.goldBridgeP)})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={splitRatio}
                    onChange={(e) => setSplitRatio(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-gradient-to-r from-blue-500 via-amber-400 to-amber-500 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Side-by-Side Comparison Matrix */}
              <div className="grid grid-cols-2 gap-3">
                {/* Option A Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                      Option A
                    </span>
                    <h4 className="text-xs font-black text-gray-900 dark:text-white mt-1.5 leading-snug">
                      100% Primary Loan
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-3">
                      {primaryRate}% for {primaryTenureYrs} yrs
                    </p>

                    <div className="space-y-2 border-t border-gray-100 dark:border-gray-700/60 pt-2.5">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">
                          Monthly EMI
                        </p>
                        <p className="text-xs font-black text-gray-900 dark:text-white">
                          ₹{fmt(bridgeResults.optASingle.emi)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">
                          Total Interest
                        </p>
                        <p className="text-xs font-black text-red-500 dark:text-red-400">
                          ₹{fmt(bridgeResults.optASingle.totalInterest)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">
                          Year 1 Outflow
                        </p>
                        <p className="text-xs font-black text-gray-700 dark:text-gray-300">
                          ₹{fmt(bridgeResults.year1SingleOutflow)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[10px] font-semibold text-gray-500">
                    Standard fixed monthly cash flow.
                  </div>
                </div>

                {/* Option B Card */}
                <div className="bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/20 dark:via-gray-800 dark:to-gray-800 rounded-3xl p-3.5 shadow-sm border border-amber-200/60 dark:border-amber-800/40 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white uppercase">
                      Option B (Split)
                    </span>
                    <h4 className="text-xs font-black text-amber-950 dark:text-amber-300 mt-1.5 leading-snug">
                      Primary + Gold Bridge
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-3">
                      Gold cleared in {goldBridgeMonths} mos
                    </p>

                    <div className="space-y-2 border-t border-amber-100 dark:border-amber-900/30 pt-2.5">
                      <div>
                        <p className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase">
                          Yr 1 Outflow / mo
                        </p>
                        <p className="text-xs font-black text-amber-700 dark:text-amber-300">
                          ₹{fmt(bridgeResults.optBYear1Monthly)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                          Yr 2+ Outflow / mo
                        </p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ₹{fmt(bridgeResults.optBYear2PlusMonthly)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">
                          Total Interest
                        </p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          ₹{fmt(bridgeResults.optBTotalInterest)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-amber-100 dark:border-amber-900/30 text-[10px] font-bold text-amber-800 dark:text-amber-400">
                    {bridgeResults.interestDifference >= 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Saves ₹{fmt(bridgeResults.interestDifference)} interest!
                      </span>
                    ) : (
                      <span>
                        ₹{fmt(Math.abs(bridgeResults.interestDifference))} premium for liquidity.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Explanatory Advisory Callout */}
              <div className="p-4 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-blue-950 dark:text-blue-200">
                  <p className="font-bold mb-1">Bridge Loan Advantages:</p>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    Splitting allows you to keep your long-term primary loan smaller, which
                    reduces overall lifetime interest. Once the short-term Gold loan is settled in{' '}
                    {goldBridgeMonths} months, your monthly burden drops immediately to{' '}
                    <strong>₹{fmt(bridgeResults.optBYear2PlusMonthly)}/month</strong>.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
