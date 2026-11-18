import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Save, Calendar, Bell, ChevronDown, Trash2, AlertTriangle, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateEMI, formatNumericInput, parseFormattedNumber, parseLocalDate } from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import { LocalNotifications } from '@capacitor/local-notifications';
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

const FormRow = ({ label, field, placeholder, type = 'text', symbol, value, onChange, isNumeric = true }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] flex-1">{label}</label>
    <div className="relative flex items-center flex-[1.5]">
      <input
        type={isNumeric ? 'text' : type}
        inputMode={isNumeric ? 'decimal' : undefined}
        placeholder={placeholder}
        value={isNumeric ? formatNumericInput(value) : value}
        onChange={(e) => onChange(field, isNumeric ? parseFormattedNumber(e.target.value) : e.target.value)}
        className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right pr-10 placeholder:text-slate-500"
      />
      {symbol && <span className="absolute right-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{symbol}</span>}
    </div>
  </div>
);

const AddLoanProfile = ({ onBack, onSave, onUpdatePrepayments, onDeletePrepayment, initialData }) => {
  const { headerRef, handleScroll } = useHeaderScroll();
  const { currencySymbol } = useSettings();
  const [prepaymentToDeleteIndex, setPrepaymentToDeleteIndex] = useState(null);
  
  // Add Prepayment modal state
  const [isAddPrepaymentOpen, setIsAddPrepaymentOpen] = useState(false);
  const [newPrepaymentAmount, setNewPrepaymentAmount] = useState('');
  const [newPrepaymentDate, setNewPrepaymentDate] = useState(getTodayLocalDateStr());
  const [newPrepaymentEffect, setNewPrepaymentEffect] = useState('Tenure Reduction');
  const [prepaymentError, setPrepaymentError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    accountNo: '',
    bankName: '',
    amount: '',
    interest: '',
    tenure: '',
    emi: '',
    processingFees: '0',
    loanDate: '',
    firstEmiDate: '',
    prepayments: [],
    notification: true,
    notificationDuration: '1 Day Before'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        prepayments: initialData.prepayments || [],
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.amount && formData.interest && formData.tenure) {
      const amount = parseFloat(parseFormattedNumber(formData.amount));
      const interest = parseFloat(parseFormattedNumber(formData.interest));
      const tenure = parseFloat(parseFormattedNumber(formData.tenure));
      const calculatedEmi = calculateEMI(amount, interest, tenure, true);
      setFormData(prev => ({ ...prev, emi: Math.round(calculatedEmi).toString() }));
    }
  }, [formData.amount, formData.interest, formData.tenure]);

  const handleInputChange = (field, value) => {
    let val = value;
    // Apply 9-digit cap to all amount-related fields
    const amountFields = ['amount', 'emi', 'processingFees'];
    if (amountFields.includes(field)) {
      if (val.toString().replace(/[^0-9]/g, '').length > 9) return;
    }
    if (field === 'interest') {
      if (val !== '' && parseFloat(val) > 50) return;
    }
    if (field === 'tenure') {
      if (val !== '' && parseFloat(val) > 960) return;
    }
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.amount || !formData.emi) return;
    
    let finalPrepayments = [...(formData.prepayments || [])];

    // Sort prepayments chronologically by date
    finalPrepayments.sort((a, b) => {
      const dateA = parseLocalDate(a.date);
      const dateB = parseLocalDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    onSave({ 
      ...formData, 
      id: initialData?.id || Date.now(),
      prepayments: finalPrepayments,
    });
  };

  const openAddPrepayment = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setNewPrepaymentAmount('');
    setNewPrepaymentDate(getTodayLocalDateStr());
    setNewPrepaymentEffect('Tenure Reduction');
    setPrepaymentError('');
    setIsAddPrepaymentOpen(true);
  };

  const closeAddPrepayment = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsAddPrepaymentOpen(false);
    setPrepaymentError('');
  };

  const handleSaveNewPrepayment = () => {
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

    let updatedPrepayments = [...(formData.prepayments || []), newEntry];
    updatedPrepayments.sort((a, b) => {
      const dateA = parseLocalDate(a.date);
      const dateB = parseLocalDate(b.date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    // 1. Immediately update local form state so it reflects on screen
    setFormData(prev => ({
      ...prev,
      prepayments: updatedPrepayments
    }));

    // 2. If editing a saved loan, immediately commit to persistent storage & recalculate
    if (initialData?.id) {
      const updateFn = onUpdatePrepayments || onDeletePrepayment;
      if (updateFn) {
        updateFn(initialData.id, updatedPrepayments);
      }
      try {
        const raw = localStorage.getItem('emi_loan_profiles');
        if (raw) {
          const list = JSON.parse(raw);
          const updatedList = list.map(l => l.id === initialData.id ? { ...l, prepayments: updatedPrepayments } : l);
          localStorage.setItem('emi_loan_profiles', JSON.stringify(updatedList));
        }
      } catch (e) {
        console.error('Error saving updated loan profiles to localStorage:', e);
      }
    }

    // 3. Close popup
    closeAddPrepayment();
  };

  const selectedPrepayment = prepaymentToDeleteIndex !== null ? formData.prepayments?.[prepaymentToDeleteIndex] : null;

  const confirmDeletePrepayment = () => {
    if (prepaymentToDeleteIndex === null) return;
    const updatedPrepayments = (formData.prepayments || []).filter((_, i) => i !== prepaymentToDeleteIndex);
    
    // 1. Immediately update local form state so the row updates on screen
    setFormData(prev => ({
      ...prev,
      prepayments: updatedPrepayments
    }));

    // 2. If this is an existing saved loan, immediately persist to storage and trigger live app recalculation
    if (initialData?.id) {
      if (onDeletePrepayment) {
        onDeletePrepayment(initialData.id, updatedPrepayments);
      }
      try {
        const raw = localStorage.getItem('emi_loan_profiles');
        if (raw) {
          const list = JSON.parse(raw);
          const updatedList = list.map(l => l.id === initialData.id ? { ...l, prepayments: updatedPrepayments } : l);
          localStorage.setItem('emi_loan_profiles', JSON.stringify(updatedList));
        }
      } catch (e) {
        console.error('Error saving updated loan profiles to localStorage:', e);
      }
    }

    // 3. Dismiss popup
    setPrepaymentToDeleteIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300 relative">
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title={initialData ? 'Edit Loan Profile' : 'Loan Profile'}
          onBack={onBack}
        />

        <div className="px-6 py-6">
        <FormRow label="Loan Name" field="name" placeholder="e.g. Home Loan" value={formData.name} onChange={handleInputChange} isNumeric={false} />
        <FormRow label="Loan A/C No" field="accountNo" placeholder="e.g. 12345" value={formData.accountNo} onChange={handleInputChange} isNumeric={false} />
        <FormRow label="Bank Name" field="bankName" placeholder="e.g. HDFC Bank" value={formData.bankName} onChange={handleInputChange} isNumeric={false} />
        <FormRow label="Amount" field="amount" placeholder="0.00" symbol={currencySymbol} value={formData.amount} onChange={handleInputChange} />
        <FormRow label="Interest Rate %" field="interest" placeholder="0.00" symbol="%" value={formData.interest} onChange={handleInputChange} />
        <FormRow label="Tenure (Month)" field="tenure" placeholder="0" symbol="Mo" value={formData.tenure} onChange={handleInputChange} />
        <FormRow label="EMI" field="emi" placeholder="0.00" symbol={currencySymbol} value={formData.emi} onChange={handleInputChange} />
        <FormRow label="Processing Fees" field="processingFees" placeholder="0" symbol={currencySymbol} value={formData.processingFees} onChange={handleInputChange} />
        
        {/* Date Fields */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] flex-1">Loan Date</label>
          <div className="flex-[1.5]">
            <input
              type="date"
              value={formData.loanDate}
              onChange={(e) => handleInputChange('loanDate', e.target.value)}
              className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-5">
          <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] flex-1">First EMI Date</label>
          <div className="flex-[1.5]">
            <input
              type="date"
              value={formData.firstEmiDate}
              onChange={(e) => handleInputChange('firstEmiDate', e.target.value)}
              className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
            />
          </div>
        </div>

        {/* Add Prepayment Row - Highlighted Action Card */}
        <div 
          onClick={openAddPrepayment}
          className="flex items-center justify-between gap-4 mb-5 p-[12px_14px] rounded-[14px] bg-[#EFF6FF] dark:bg-blue-500/[0.12] border border-blue-500/20 dark:border-blue-400/25 cursor-pointer active:scale-[0.99] transition-all select-none shadow-[0_2px_8px_rgba(37,99,235,0.06)] dark:shadow-none"
        >
          <div>
            <label className="text-[14px] font-bold text-[#1E3A8A] dark:text-[#DBEAFE] leading-[1.3] block cursor-pointer">
              Add Prepayment
            </label>
            <p className="text-[11.5px] text-[#475569] dark:text-[#94A3B8] font-medium mt-0.5">
              Extra payments reduce tenure or EMI
            </p>
          </div>
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAddPrepayment();
              }}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(37,99,235,0.28)] active:scale-[0.92] transition-transform"
              title="Add prepayment"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* List of Existing Prepayments */}
        {formData.prepayments?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Existing Prepayments</h3>
            <div className="space-y-2.5">
              {formData.prepayments.map((pre, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
                  <div>
                    <p className="text-xs font-black text-gray-800 dark:text-white">{currencySymbol}{parseFloat(pre.amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">{pre.date} • {pre.effect || 'Tenure Reduction'}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setPrepaymentToDeleteIndex(idx)}
                    className="w-[34px] h-[34px] min-w-[34px] min-h-[34px] rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center active:scale-90 transition-all shadow-sm"
                    title="Delete prepayment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Toggle */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] flex-1">Notification</label>
          <div className="flex-[1.5] flex justify-end">
            <button 
              onClick={async () => {
                const nextVal = !formData.notification;
                if (nextVal) {
                  try {
                    const status = await LocalNotifications.checkPermissions();
                    if (status.display !== 'granted') {
                      const req = await LocalNotifications.requestPermissions();
                      if (req.display !== 'granted') {
                        alert('Please enable notification permissions in your device settings to receive EMI reminders.');
                      }
                    }
                  } catch (e) {
                    console.warn('LocalNotifications check/request failed:', e);
                  }
                }
                handleInputChange('notification', nextVal);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.notification ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white dark:bg-gray-100 rounded-full transition-all ${formData.notification ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {formData.notification && (
          <div className="flex items-center justify-between gap-4 mb-5">
            <label className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-[1.3] flex-1">Duration</label>
            <div className="relative flex items-center flex-[1.5]">
              <select
                value={formData.notificationDuration}
                onChange={(e) => handleInputChange('notificationDuration', e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-gray-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none text-right pr-10"
              >
                <option value="1 Day Before">1 Day Before</option>
                <option value="2 Days Before">2 Days Before</option>
                <option value="3 Days Before">3 Days Before</option>
                <option value="1 Week Before">1 Week Before</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full btn-primary mt-6 mb-10"
        >
          <Save size={18} /> Save
        </button>
        </div>
      </div>

      {/* Delete Prepayment Confirmation Modal (Rendered via React Portal directly into document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {prepaymentToDeleteIndex !== null && selectedPrepayment && (
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
              onClick={() => setPrepaymentToDeleteIndex(null)}
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

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 flex-shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-gray-900 dark:text-white">Delete Prepayment?</h3>
                    <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">This action cannot be undone.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrepaymentToDeleteIndex(null)}
                    className="ml-auto p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Prepayment Summary Box */}
                <div className="bg-gray-50 dark:bg-gray-900/80 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700/60 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Amount</span>
                    <span className="text-sm font-black text-red-500">
                      {currencySymbol}{parseFloat(selectedPrepayment.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</span>
                    <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200">
                      {selectedPrepayment.date}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Type</span>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {selectedPrepayment.effect || 'Tenure Reduction'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPrepaymentToDeleteIndex(null)}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[13px] font-black active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeletePrepayment}
                    className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-[13px] font-black shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
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

      {/* Add Prepayment Modal (Rendered via React Portal directly into document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isAddPrepaymentOpen && (
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
              onClick={closeAddPrepayment}
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

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Plus size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-gray-900 dark:text-white">Add Prepayment</h3>
                    <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">Record an extra payment towards your loan</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddPrepayment}
                    className="ml-auto p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Fields */}
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

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeAddPrepayment}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[13px] font-black active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewPrepayment}
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

export default AddLoanProfile;
