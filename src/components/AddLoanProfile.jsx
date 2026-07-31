import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Calendar, Bell, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateEMI, formatNumericInput, parseFormattedNumber } from '../utils/calculatorLogic';
import { useSettings } from '../context/SettingsContext';
import { LocalNotifications } from '@capacitor/local-notifications';


const FormRow = ({ label, field, placeholder, type = 'text', symbol, value, onChange, isNumeric = true }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">{label}</label>
    <div className="relative flex items-center flex-[1.5]">
      <input
        type={isNumeric ? 'text' : type}
        inputMode={isNumeric ? 'decimal' : undefined}
        placeholder={placeholder}
        value={isNumeric ? formatNumericInput(value) : value}
        onChange={(e) => onChange(field, isNumeric ? parseFormattedNumber(e.target.value) : e.target.value)}
        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-right pr-10"
      />
      {symbol && <span className="absolute right-4 text-[10px] font-bold text-gray-400 uppercase">{symbol}</span>}
    </div>
  </div>
);

const AddLoanProfile = ({ onBack, onSave, initialData }) => {
  const { currencySymbol } = useSettings();
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
    isPrepaymentEnabled: false,
    prepaymentAmount: '',
    prepaymentDate: '',
    prepaymentEffect: 'Tenure Reduction',
    prepayments: [],
    notification: true,
    notificationDuration: '1 Day Before'
  });



  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure defaults if fields are missing from older saves
        isPrepaymentEnabled: false, // Reset toggle on edit
        prepaymentAmount: '', // Reset fields on edit
        prepaymentDate: '',
        prepaymentEffect: 'Tenure Reduction',
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
    const amountFields = ['amount', 'emi', 'processingFees', 'prepaymentAmount'];
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
    
    // Add current prepayment if enabled and valid
    if (formData.isPrepaymentEnabled && formData.prepaymentAmount && formData.prepaymentDate) {
      finalPrepayments.push({
        amount: formData.prepaymentAmount,
        date: formData.prepaymentDate,
        effect: formData.prepaymentEffect
      });
    }

    onSave({ 
      ...formData, 
      id: initialData?.id || Date.now(),
      prepayments: finalPrepayments,
      isPrepaymentEnabled: false, // Automatically disable for next time
      prepaymentAmount: '', // Reset fields
      prepaymentDate: '',
    });
  };

  const removePrepayment = (index) => {
    setFormData(prev => ({
      ...prev,
      prepayments: prev.prepayments.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="ml-4 text-xl font-bold text-gray-900 dark:text-white">
          {initialData ? 'Edit Loan Profile' : 'Loan Profile'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
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
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">Loan Date</label>
          <div className="flex-[1.5]">
            <input
              type="date"
              value={formData.loanDate}
              onChange={(e) => handleInputChange('loanDate', e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 text-right"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-5">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">First EMI Date</label>
          <div className="flex-[1.5]">
            <input
              type="date"
              value={formData.firstEmiDate}
              onChange={(e) => handleInputChange('firstEmiDate', e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 text-right"
            />
          </div>
        </div>

        {/* Prepayment Section */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">Enable Prepayment</label>
          <div className="flex-[1.5] flex justify-end">
            <button 
              onClick={() => handleInputChange('isPrepaymentEnabled', !formData.isPrepaymentEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.isPrepaymentEnabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isPrepaymentEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {formData.isPrepaymentEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100/50 dark:border-blue-900/20">
                <FormRow 
                  label="New Prepayment Amount" 
                  field="prepaymentAmount" 
                  placeholder="0.00" 
                  symbol={currencySymbol} 
                  value={formData.prepaymentAmount} 
                  onChange={handleInputChange} 
                />
                
                <div className="flex items-center justify-between gap-4 mb-5">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">Prepayment Date</label>
                  <div className="flex-[1.5]">
                    <input
                      type="date"
                      value={formData.prepaymentDate}
                      onChange={(e) => handleInputChange('prepaymentDate', e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 text-right"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Effect On</label>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {['EMI Reduction', 'Tenure Reduction'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleInputChange('prepaymentEffect', option)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${
                          formData.prepaymentEffect === option 
                            ? 'bg-primary text-white shadow-lg' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List of Existing Prepayments */}
        {formData.prepayments?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Existing Prepayments</h3>
            <div className="space-y-2">
              {formData.prepayments.map((pre, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs font-black text-gray-800 dark:text-white">{currencySymbol}{parseFloat(pre.amount).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-400">{pre.date} • {pre.effect}</p>
                  </div>
                  <button 
                    onClick={() => removePrepayment(idx)}
                    className="text-rose-500 text-[10px] font-black uppercase tracking-wider hover:bg-rose-50 p-2 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Toggle */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">Notification</label>
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
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex-1">Duration</label>
            <div className="relative flex items-center flex-[1.5]">
              <select
                value={formData.notificationDuration}
                onChange={(e) => handleInputChange('notificationDuration', e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3.5 shadow-sm text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-right pr-10"
              >
                <option value="1 Day Before">1 Day Before</option>
                <option value="2 Days Before">2 Days Before</option>
                <option value="3 Days Before">3 Days Before</option>
                <option value="1 Week Before">1 Week Before</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 text-gray-400" />
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
  );
};

export default AddLoanProfile;
