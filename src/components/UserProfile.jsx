import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Settings, Edit3, Crown, Phone, Mail, MapPin,
  Wallet, TrendingUp, Calendar,
  ChevronRight, ChevronDown, Shield, Smartphone, HelpCircle,
  Check, Fingerprint, Lock, Key, Moon, Globe,
  DollarSign, AlertCircle, Clock, Sparkles, Camera, MoreVertical,
  ChevronLeft, Sun, User
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { StatusBar, Style } from '@capacitor/status-bar';
import BackButton from './BackButton';
import { t, formatCurrency, calculateLoanCurrentStatus } from '../utils/calculatorLogic';

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

/* ─── Modern Circular Avatar Badge ─── */
const Avatar = ({ name, image, onClick, theme }) => {
  const initials = (name || 'User Name')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'UN';

  return (
    <div
      onClick={onClick}
      style={{
        width: '48px',
        height: '48px',
        minWidth: '48px',
        minHeight: '48px',
        backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
        border: theme === 'dark' ? '2px solid #60A5FA' : '2px solid #3B82F6',
      }}
      className="rounded-full shrink-0 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm relative group active:scale-95 transition-transform"
      title="Change Profile Picture"
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span
          style={{
            color: theme === 'dark' ? '#93C5FD' : '#1D4ED8',
          }}
          className="text-[16px] font-bold tracking-tight select-none leading-none"
        >
          {initials}
        </span>
      )}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera size={14} className="text-white" />
      </div>
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
      
      const status = calculateLoanCurrentStatus(loan);
      if (status) {
        totalPaidPrincipal += status.principalPaid;
      }
    });

    return { 
      total: totalPrincipal, 
      paid: totalPaidPrincipal, 
      progress: totalPrincipal > 0 ? Math.round((totalPaidPrincipal / totalPrincipal) * 100) : 0 
    };
  })();

  const { progress, total: totalAmount, paid: totalPaid } = stats;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (progress / 100) * circumference;

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
              <div className="text-left py-3 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/5 shadow-inner">
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Total Paid</p>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none tabular-nums truncate">
                  {currency.split(' ')[0]}{totalPaid.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Remaining Metric */}
              <div className="text-left py-3 px-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/5 shadow-inner">
                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Remaining</p>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400 leading-none tabular-nums truncate">
                  {currency.split(' ')[0]}{(totalAmount - totalPaid).toLocaleString('en-IN')}
                </p>
              </div>
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
                <circle
                  cx={60}
                  cy={60}
                  r={54}
                  fill="transparent"
                  stroke="url(#premiumGradient)"
                  strokeWidth={8}
                  strokeDasharray={circumference}
                  strokeDashoffset={targetOffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.6s cubic-bezier(0.2, 0.0, 0.0, 1.0)',
                  }}
                />
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                <p className="text-gray-400 dark:text-gray-500 text-[7px] uppercase font-black tracking-widest mb-0.5">Repaid</p>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                  {progress}<span className="text-xs ml-0.5 text-indigo-500">%</span>
                </h4>
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
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef(null);
  const editFileInputRef = useRef(null);

  useEffect(() => {
    setIsScrolled(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (!isScrolled && scrollTop > 40) {
      setIsScrolled(true);
    } else if (isScrolled && scrollTop < 10) {
      setIsScrolled(false);
    }
  };

  // Preference States
  useEffect(() => {
    const isDark = theme === 'dark';
    try {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch (err) {}
  }, [theme]);

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

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return showToast('Max 2MB allowed');
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, image: reader.result }));
        showToast('Photo selected');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setUserData(editForm);
    try {
      localStorage.setItem('user_data', JSON.stringify(editForm));
    } catch (e) {
      console.error(e);
    }
    setIsEditing(false);
    showToast('Profile updated successfully');
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
    <div 
      className="flex-1 flex flex-col transition-colors duration-200 overflow-hidden relative"
      style={{
        backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
      }}
    >

      {/* Premium Light Background Accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-blue-50/20 dark:from-transparent dark:to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Fixed Full-Width Profile Header */}
      <header 
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(180deg, #172554 0%, #1E293B 100%)' 
            : 'linear-gradient(180deg, #DBEAFE 0%, #E0EFFE 100%)',
          paddingTop: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px), 38px) + 12px)',
          paddingBottom: '14px',
          paddingLeft: '16px',
          paddingRight: '16px',
          borderBottom: theme === 'dark' 
            ? '1px solid rgba(96, 165, 250, 0.18)' 
            : '1px solid rgba(37, 99, 235, 0.18)',
          boxShadow: isScrolled
            ? (theme === 'dark' ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)' : '0 4px 16px -2px rgba(15, 23, 42, 0.05)')
            : 'none',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-[14px]"
      >
        {/* Left Avatar Badge */}
        <Avatar
          name={userData.name}
          image={userData.image}
          onClick={() => fileInputRef.current?.click()}
          theme={theme}
        />
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        {/* Center Identity Column */}
        <div 
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '3px',
          }}
        >
          <h1
            style={{
              fontSize: '17px',
              fontWeight: 700,
              lineHeight: 1.2,
              color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
            }}
            className="truncate m-0"
          >
            {userData.name}
          </h1>

          <div className="flex flex-col gap-[3px]">
            {userData.phone && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Phone
                  size={12}
                  style={{ color: theme === 'dark' ? '#60A5FA' : '#2563EB' }}
                  className="shrink-0"
                />
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: theme === 'dark' ? '#94A3B8' : '#334155',
                  }}
                  className="truncate"
                >
                  {userData.phone}
                </span>
              </div>
            )}
            {userData.email && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail
                  size={12}
                  style={{ color: theme === 'dark' ? '#60A5FA' : '#2563EB' }}
                  className="shrink-0"
                />
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    color: theme === 'dark' ? '#94A3B8' : '#334155',
                  }}
                  className="truncate"
                >
                  {userData.email}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right EDIT Pill Button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => { setEditForm(userData); setIsEditing(true); }}
          style={{
            height: '32px',
            padding: '0 14px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            backgroundColor: theme === 'dark' ? '#3B82F6' : '#0F172A',
            color: '#FFFFFF',
          }}
          className="shrink-0 inline-flex items-center justify-center uppercase select-none transition-transform active:scale-95 shadow-sm"
        >
          Edit
        </motion.button>
      </header>

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar relative z-10"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 88px)'
        }}
      >
        {/* Static Flow Spacer: Decoupled layout height ensuring scrollHeight never shifts mid-scroll */}
        <div 
          style={{
            height: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px), 38px) + 94px)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />

        <div className="px-6 pt-3">
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
      </div>

      {/* ── Full-Screen Edit Profile Sub-View (Smooth GPU Slide Transition) ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isEditing && (
            <motion.div
              key="edit-profile-subview"
              initial={{ transform: 'translate3d(100%, 0, 0)' }}
              animate={{ transform: 'translate3d(0%, 0, 0)' }}
              exit={{ transform: 'translate3d(100%, 0, 0)' }}
              transition={{
                duration: 0.24,
                ease: [0.2, 0.0, 0.0, 1.0],
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                willChange: 'transform',
                contain: 'layout paint',
              }}
            >
              {/* Standardized Upper Header */}
              <header
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(180deg, #172554 0%, #1E293B 100%)'
                    : 'linear-gradient(180deg, #DBEAFE 0%, #E0EFFE 100%)',
                  paddingTop: 'calc(max(var(--safe-top, 0px), env(safe-area-inset-top, 0px), 38px) + 12px)',
                  paddingBottom: '14px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  borderBottom: theme === 'dark'
                    ? '1px solid rgba(96, 165, 250, 0.18)'
                    : '1px solid rgba(37, 99, 235, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexShrink: 0,
                  boxShadow: theme === 'dark'
                    ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                    : '0 4px 16px rgba(15, 23, 42, 0.05)',
                }}
              >
                {/* Circular < Back Button */}
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '9999px',
                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                    border: theme === 'dark'
                      ? '1px solid rgba(96, 165, 250, 0.2)'
                      : '1px solid rgba(37, 99, 235, 0.2)',
                    boxShadow: theme === 'dark'
                      ? '0 2px 6px rgba(0, 0, 0, 0.25)'
                      : '0 2px 6px rgba(30, 58, 138, 0.08)',
                    color: theme === 'dark' ? '#60A5FA' : '#1D4ED8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  className="active:scale-95 transition-transform"
                  aria-label="Back to Profile"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>

                {/* Header Title */}
                <h1
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                    margin: 0,
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  Edit Profile
                </h1>

                {/* Header Save Button */}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  style={{
                    height: '34px',
                    padding: '0 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  className="active:scale-95 transition-transform"
                >
                  Save
                </button>
              </header>

              {/* Scrollable Form Content */}
              <div
                className="flex-1 overflow-y-auto no-scrollbar"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehaviorY: 'contain',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '20px',
                  paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 36px)',
                }}
              >
                {/* Avatar Preview with Camera Overlay */}
                <div className="flex flex-col items-center justify-center mb-6">
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="relative cursor-pointer group active:scale-95 transition-transform"
                    title="Change photo"
                  >
                    <div
                      style={{
                        width: '88px',
                        height: '88px',
                        backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                        border: theme === 'dark' ? '3px solid #60A5FA' : '3px solid #2563EB',
                        boxShadow: '0 4px 16px rgba(37, 99, 235, 0.16)',
                      }}
                      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    >
                      {editForm.image ? (
                        <img src={editForm.image} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span
                          style={{ color: theme === 'dark' ? '#93C5FD' : '#1D4ED8' }}
                          className="text-2xl font-bold select-none"
                        >
                          {(editForm.name || 'User')
                            .split(' ')
                            .filter(Boolean)
                            .map(w => w[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'UN'}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        border: theme === 'dark' ? '2.5px solid #0F172A' : '2.5px solid #FFFFFF',
                      }}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                    >
                      <Camera size={14} strokeWidth={2.5} />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2.5 active:opacity-70"
                  >
                    Change Profile Photo
                  </button>
                </div>

                {/* Personal Information Card */}
                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                    Personal Information
                  </p>
                  <div className="bg-white dark:bg-gray-800/90 rounded-[1.8rem] p-5 border border-gray-200/60 dark:border-gray-700/60 shadow-sm space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5 px-1">
                        Full Name
                      </label>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/80 rounded-2xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 focus-within:border-blue-500 transition-colors">
                        <User size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                          className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5 px-1">
                        Contact Number
                      </label>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/80 rounded-2xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 focus-within:border-blue-500 transition-colors">
                        <Phone size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <input
                          type="tel"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
                          className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Email ID */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5 px-1">
                        Email Address
                      </label>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/80 rounded-2xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 focus-within:border-blue-500 transition-colors">
                        <Mail size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                          className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences Card */}
                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                    App Preferences
                  </p>
                  <div className="bg-white dark:bg-gray-800/90 rounded-[1.8rem] p-5 border border-gray-200/60 dark:border-gray-700/60 shadow-sm space-y-4">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Theme Mode</p>
                          <p className="text-[11px] text-gray-400">{theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}</p>
                        </div>
                      </div>
                      <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            theme === 'light'
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            theme === 'dark'
                              ? 'bg-gray-800 text-blue-400 shadow-sm'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>

                    {/* Currency Selector */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Currency</p>
                          <p className="text-[11px] text-gray-400">Current: {currency}</p>
                        </div>
                      </div>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-xs rounded-xl px-3 py-2 border border-gray-200/50 dark:border-gray-700/50 outline-none"
                      >
                        <option value="₹ INR">₹ INR (₹)</option>
                        <option value="$ USD">$ USD ($)</option>
                        <option value="€ EUR">€ EUR (€)</option>
                        <option value="£ GBP">£ GBP (£)</option>
                        <option value="¥ JPY">¥ JPY (¥)</option>
                        <option value="C$ CAD">C$ CAD (C$)</option>
                        <option value="A$ AUD">A$ AUD (A$)</option>
                        <option value="د.إ AED">د.إ AED (AED)</option>
                      </select>
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Globe size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Language</p>
                          <p className="text-[11px] text-gray-400">Current: {language === 'hi' ? 'हिंदी (Hindi)' : 'English'}</p>
                        </div>
                      </div>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-xs rounded-xl px-3 py-2 border border-gray-200/50 dark:border-gray-700/50 outline-none"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
                      color: theme === 'dark' ? '#94A3B8' : '#64748B',
                    }}
                    className="py-3.5 rounded-2xl font-bold text-xs active:scale-95 transition-transform"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    }}
                    className="py-3.5 rounded-2xl font-bold text-xs active:scale-95 transition-transform shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

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
