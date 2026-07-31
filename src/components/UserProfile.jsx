import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Bell, Settings, Edit3, Crown, Phone, Mail, MapPin,
  Wallet, TrendingUp, Calendar,
  ChevronRight, ChevronDown, Shield, Smartphone, HelpCircle,
  Check, Fingerprint, Lock, Key, Moon, Globe,
  DollarSign, AlertCircle, Clock, Sparkles, Camera, MoreVertical
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { t, formatCurrency, generateAmortizationSchedule, getMonthsDifference } from '../utils/calculatorLogic';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  const cleanStr = dateStr.split('T')[0].trim();
  
  // Handle YYYY-MM-DD or DD/MM/YYYY format
  if (cleanStr.includes('/') || cleanStr.includes('-')) {
    const separator = cleanStr.includes('/') ? '/' : '-';
    const parts = cleanStr.split(separator);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day, 0, 0, 0, 0);
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
  }
  
  const d = new Date(cleanStr.replace(/-/g, "/"));
  d.setHours(0, 0, 0, 0);
  return d;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  if (result.getMonth() !== (targetMonth % 12 + 12) % 12) {
    result.setDate(0);
  }
  result.setHours(0, 0, 0, 0);
  return result;
};

/* ─── Modern AI Avatar ─── */
const Avatar = ({ name, image, onClick }) => {
  const initials = (name || 'User')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="relative group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/10 cursor-pointer relative z-10 overflow-hidden"
      >
        <div className="w-full h-full rounded-[1.7rem] bg-white dark:bg-gray-900 overflow-hidden flex items-center justify-center relative">
          {image ? (
            <img src={image} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <span className="text-xl font-black bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {initials}
            </span>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Camera size={18} className="text-white" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Premium Glass Card ─── */
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-[2.5rem] shadow-sm ${className}`}>
    {children}
  </div>
);

/* ─── Premium AI-Inspired Card Wrapper ─── */
const PremiumCard = ({ children, className = "", innerClassName = "", glowColor = "from-purple-500/20 via-cyan-500/20 to-purple-500/20" }) => (
  <div className={`relative group ${className}`}>
    <div className={`absolute -inset-[1px] bg-gradient-to-r ${glowColor} rounded-[2rem] blur-[2px] opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
    <GlassCard className={`relative overflow-hidden !rounded-[2rem] border-white/40 dark:border-white/10 ${innerClassName}`}>
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#4F46E5 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />
      {children}
    </GlassCard>
  </div>
);

/* ─── Overview Card Component ─── */
const OverviewCard = ({ icon: Icon, iconBg, value, label, sub, subColor = 'text-gray-400', onClick }) => {
  const CardBody = (
    <>
      <div className={`w-8 h-8 ${iconBg} rounded-[0.8rem] flex items-center justify-center mb-2 shadow-sm relative z-10 transition-transform duration-500 group-hover:scale-110`}>
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <p className="text-base font-black text-gray-900 dark:text-white leading-tight truncate">{value}</p>
      <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">{label}</p>
      {sub && <p className={`text-[8px] font-black mt-0.5 truncate ${subColor}`}>{sub}</p>}
    </>
  );

  return (
    <PremiumCard 
      className={`flex-1 min-w-0 ${onClick ? 'cursor-pointer select-none' : ''}`} 
      innerClassName="p-3.5"
    >
      {onClick ? (
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClick}
          className="w-full h-full text-left flex flex-col items-start"
        >
          {CardBody}
        </motion.button>
      ) : (
        <div className="w-full h-full">
          {CardBody}
        </div>
      )}
    </PremiumCard>
  );
};

/* ─── Loan Progress Card (Featured) ─── */
const LoanProgressCard = ({ loans = [], currency = '₹ INR' }) => {
  const hasLoans = loans && loans.length > 0;

  const stats = (() => {
    if (!hasLoans) return { total: 0, paid: 0, progress: 0 };

    let totalPrincipal = 0;
    let totalPaidPrincipal = 0;

    loans.forEach(loan => {
      const amount = parseFloat(loan.amount) || 0;
      totalPrincipal += amount;
      
      const schedule = generateAmortizationSchedule(amount, loan.interest, loan.tenure, true, loan, loan.firstEmiDate, loan.emi);
      const monthsPassed = getMonthsDifference(loan.firstEmiDate);
      
      const paidSchedule = schedule.slice(0, Math.min(monthsPassed, schedule.length));
      const principalPaidSoFar = paidSchedule.reduce((acc, curr) => acc + curr.principal, 0);
      
      totalPaidPrincipal += principalPaidSoFar;
    });

    return { 
      total: totalPrincipal, 
      paid: totalPaidPrincipal, 
      progress: totalPrincipal > 0 ? Math.round((totalPaidPrincipal / totalPrincipal) * 100) : 0 
    };
  })();

  const { progress, total: totalAmount, paid: totalPaid } = stats;
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative group mb-8">
      {/* Premium Outer Ambient Glow */}
      <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/30 to-rose-500/30 rounded-[2.5rem] blur-[6px] opacity-40 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/50 dark:border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/10">
        {/* Animated Background Highlights */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/10 blur-[80px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose-400/10 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header Section */}
        <div className="p-6 pb-0 relative z-10 flex justify-between items-center">
          <div>
            <h3 className="text-gray-900 dark:text-white font-black text-sm tracking-tight mb-1 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              Loan Progress
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none">
                {hasLoans ? `${loans.length} Tracking Profiles` : 'System Standby'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Live Active</p>
          </div>
        </div>

        {/* Main Content: Progress Area */}
        <div className="p-6 pt-2 relative z-10">
          <div className="relative w-full flex items-center justify-between gap-4">

            {/* Stacked Metrics on the Left */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              {/* Total Paid Metric */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-left py-3 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/5 shadow-inner"
              >
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Total Paid</p>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none tabular-nums truncate">
                  {currency.split(' ')[0]}{totalPaid.toLocaleString('en-IN')}
                </p>
              </motion.div>

              {/* Remaining Metric */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-left py-3 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/5 shadow-inner"
              >
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Remaining</p>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400 leading-none tabular-nums truncate">
                  {currency.split(' ')[0]}{(totalAmount - totalPaid).toLocaleString('en-IN')}
                </p>
              </motion.div>
            </div>

            {/* Central Progress Circle */}
            <div className="relative flex-shrink-0 flex items-center justify-center p-1">
              <svg width={120} height={120} className="transform -rotate-90 drop-shadow-[0_0_15px_rgba(79,70,229,0.15)] relative z-10">
                <defs>
                  <linearGradient id="premiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#D946EF" />
                    <stop offset="100%" stopColor="#F43F5E" />
                  </linearGradient>
                </defs>
                <circle
                  cx={60}
                  cy={60}
                  r={54}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-white/5"
                  strokeWidth={8}
                />
                <motion.circle
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 54) - (progress / 100) * (2 * Math.PI * 54) }}
                  transition={{ duration: 2, ease: "circOut" }}
                  cx={60}
                  cy={60}
                  r={54}
                  fill="transparent"
                  stroke="url(#premiumGradient)"
                  strokeWidth={8}
                  strokeDasharray={2 * Math.PI * 54}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                <p className="text-gray-400 dark:text-gray-500 text-[7px] uppercase font-black tracking-widest mb-0.5">Repaid</p>
                <motion.h4
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none"
                >
                  {progress}<span className="text-xs ml-0.5 text-indigo-500">%</span>
                </motion.h4>
                <div className="mt-1.5 scale-90">
                  <div className="px-2 py-0.5 bg-indigo-600 rounded-full shadow-md">
                    <p className="text-[8px] font-black text-white leading-none tabular-nums">
                      {currency.split(' ')[0]}{totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserProfile({ onBack, onNotifications, notificationCount = 1, loans = [], onViewLoan, onAdd }) {
  const { theme, setTheme, currency, setCurrency, language, setLanguage } = useSettings();
  const fileInputRef = useRef(null);

  // User Data State
  const [userData, setUserData] = useState(() => {
    try {
      const saved = localStorage.getItem('user_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) { console.error(e); }
    return { name: 'User Name', phone: 'Contact No', email: 'Mail ID', image: null };
  });

  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(userData);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState('');

  // Preference States
  const [emiReminder, setEmiReminder] = useState(true);
  const [dueAlert, setDueAlert] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return showToast('Max 2MB allowed');
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...userData, image: reader.result };
        setUserData(updated);
        localStorage.setItem('user_data', JSON.stringify(updated));
        showToast('Profile picture updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const activeLoanCount = loans?.length || 0;
  const totalMonthlyEMI = loans?.reduce((sum, loan) => sum + (parseFloat(loan.emi) || 0), 0) || 0;

  const upcomingEMI = (() => {
    if (!loans || loans.length === 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let soonest = null;
    loans.forEach(loan => {
      if (!loan.firstEmiDate || !loan.emi) return;
      const firstEmiDate = parseLocalDate(loan.firstEmiDate);
      if (!firstEmiDate || isNaN(firstEmiDate.getTime())) return;
      const tenure = parseInt(loan.tenure) || 12;
      let nextDueDate = null;

      for (let i = 0; i < tenure; i++) {
        const dueDate = addMonths(firstEmiDate, i);
        if (dueDate >= today) {
          nextDueDate = dueDate;
          break;
        }
      }

      if (nextDueDate) {
        if (!soonest || nextDueDate < soonest.date) {
          soonest = { date: nextDueDate, emi: loan.emi, name: loan.name };
        }
      }
    });
    return soonest;
  })();

  const fmtDate = (date) => {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch (e) { return '—'; }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-transparent transition-colors duration-500 overflow-hidden relative">

      {/* Premium Light Background Accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-blue-50/20 dark:from-transparent dark:to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 pb-36">

        {/* Compact Scrolling Header */}
        <header className="pt-14 pb-6">
          <div className="flex justify-end mb-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onNotifications}
              className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white dark:border-gray-700 shadow-sm"
            >
              <Bell size={18} className="text-gray-600 dark:text-gray-300" />
              {notificationCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-gray-800" />}
            </motion.button>
          </div>

          <div className="flex items-center gap-4">
            <Avatar
              name={userData.name}
              image={userData.image}
              onClick={() => fileInputRef.current?.click()}
            />
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight truncate">{userData.name}</h1>
              <div className="mt-1 flex flex-col gap-0.5">
                {[
                  { Icon: Phone, text: userData.phone, bg: "bg-blue-50/50 dark:bg-blue-900/10 text-blue-500" },
                  { Icon: Mail, text: userData.email, bg: "bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-500" },
                ].map(({ Icon, text, bg }) => (
                  <div key={text} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md ${bg} flex items-center justify-center`}>
                      <Icon size={9} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate tracking-tight">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setEditForm(userData); setIsEditing(true); }}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-wider"
            >
              Edit
            </motion.button>
          </div>
        </header>

        {/* ── Financial Overview (Restored) ── */}
        <section className="mb-8">
          <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">Financial Overview</h2>

          <LoanProgressCard loans={loans} currency={currency} />

          <div className="grid grid-cols-2 gap-3">
            <OverviewCard 
              icon={Wallet} 
              iconBg="bg-blue-50 text-blue-600" 
              value={activeLoanCount.toString()} 
              label="Active Loans" 
              sub={`${activeLoanCount} loan${activeLoanCount !== 1 ? 's' : ''}`} 
              onClick={onAdd}
            />
            <OverviewCard icon={TrendingUp} iconBg="bg-indigo-50 text-indigo-600" value={formatCurrency(Math.round(totalMonthlyEMI), currency)} label="Monthly EMI" sub="Total tracked" />
            <div className="col-span-2">
              <PremiumCard innerClassName="p-4 flex items-center justify-between" glowColor="from-rose-500/10 via-rose-500/5 to-rose-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <Calendar size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Upcoming EMI</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                      {upcomingEMI ? formatCurrency(Math.round(upcomingEMI.emi), currency) : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Due Date</p>
                  <p className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                    {upcomingEMI ? fmtDate(upcomingEMI.date) : 'No pending'}
                  </p>
                </div>
              </PremiumCard>
            </div>
          </div>
        </section>

        {/* ── Saved Loan Profiles ── */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Saved Loan Profiles</h2>
          </div>

          {/* Active "Loan Tracker" Direct Entry Card */}
          <PremiumCard 
            className="w-full" 
            innerClassName="p-0 border-dashed border-2 border-indigo-500/20 dark:border-indigo-500/10 cursor-pointer"
            glowColor="from-blue-500/10 via-indigo-500/10 to-blue-500/10"
          >
            <motion.button
              whileHover={{ y: -2, scale: 1.005 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAdd}
              className="w-full p-3 flex items-center gap-3.5 transition-all active:bg-gray-50/50 dark:active:bg-white/5 group relative z-10"
            >
              <div className="w-9 h-9 rounded-[0.8rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/10 group-hover:rotate-6 transition-transform flex-shrink-0">
                <Plus size={16} strokeWidth={3} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">
                  {t('loan_tracker', language)}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate opacity-70 leading-none">
                  {t('loan_tracker_desc', language)}
                </p>
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-indigo-400 dark:text-indigo-500 shadow-sm group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                <ChevronRight size={12} strokeWidth={3} />
              </div>
            </motion.button>
          </PremiumCard>
        </section>
      </div>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative z-10 overflow-hidden">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Edit Intelligence</h3>
              <div className="space-y-4">
                {['name', 'phone', 'email'].map(field => (
                  <div key={field}>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-4 mb-1 block">{field}</label>
                    <input
                      type="text"
                      value={editForm[field]}
                      onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={() => setIsEditing(false)} className="py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-400 font-black text-xs active:scale-95">Discard</button>
                <button onClick={() => { setUserData(editForm); localStorage.setItem('user_data', JSON.stringify(editForm)); setIsEditing(false); showToast('System Updated'); }} className="py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs active:scale-95 shadow-xl">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl text-[11px] font-black shadow-2xl z-[100] flex items-center gap-2">
            <Sparkles size={14} className="text-blue-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
