import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ArrowUpDown, ChevronLeft, History, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';

const UNIT_DATA = {
  Length: {
    units: ['Meters', 'Kilometers', 'Centimeters', 'Millimeters', 'Miles', 'Yards', 'Feet', 'Inches'],
    factors: {
      'Meters': 1,
      'Kilometers': 1000,
      'Centimeters': 0.01,
      'Millimeters': 0.001,
      'Miles': 1609.34,
      'Yards': 0.9144,
      'Feet': 0.3048,
      'Inches': 0.0254
    }
  },
  Weight: {
    units: ['Kilograms', 'Grams', 'Milligrams', 'Pounds', 'Ounces'],
    factors: {
      'Kilograms': 1,
      'Grams': 0.001,
      'Milligrams': 0.000001,
      'Pounds': 0.453592,
      'Ounces': 0.0283495
    }
  },
  Area: {
    units: ['Square Meters', 'Square Kilometers', 'Square Miles', 'Square Yards', 'Square Feet', 'Acres', 'Hectares'],
    factors: {
      'Square Meters': 1,
      'Square Kilometers': 1000000,
      'Square Miles': 2589988.11,
      'Square Yards': 0.836127,
      'Square Feet': 0.092903,
      'Acres': 4046.86,
      'Hectares': 10000
    }
  },
  Volume: {
    units: ['Liters', 'Milliliters', 'Cubic Meters', 'Gallons (US)', 'Quarts (US)', 'Pints (US)', 'Cups (US)', 'Fluid Ounces (US)'],
    factors: {
      'Liters': 1,
      'Milliliters': 0.001,
      'Cubic Meters': 1000,
      'Gallons (US)': 3.78541,
      'Quarts (US)': 0.946353,
      'Pints (US)': 0.473176,
      'Cups (US)': 0.236588,
      'Fluid Ounces (US)': 0.0295735
    }
  },
  Temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'],
    // Specialized logic for Temperature
    convert: (val, from, to) => {
      let celsius;
      if (from === 'Celsius') celsius = val;
      else if (from === 'Fahrenheit') celsius = (val - 32) * 5 / 9;
      else if (from === 'Kelvin') celsius = val - 273.15;

      if (to === 'Celsius') return celsius;
      else if (to === 'Fahrenheit') return (celsius * 9 / 5) + 32;
      else if (to === 'Kelvin') return celsius + 273.15;
    }
  },
  Speed: {
    units: ['Meters per second', 'Kilometers per hour', 'Miles per hour', 'Knots'],
    factors: {
      'Meters per second': 1,
      'Kilometers per hour': 0.277778,
      'Miles per hour': 0.44704,
      'Knots': 0.514444
    }
  }
};

const UnitConverter = ({ onBack }) => {
  const { headerRef, scrollRef, handleScroll } = useHeaderScroll();
  const [category, setCategory] = useState('Length');
  const [fromUnit, setFromUnit] = useState(UNIT_DATA['Length'].units[0]);
  const [toUnit, setToUnit] = useState(UNIT_DATA['Length'].units[1]);
  const [fromValue, setFromValue] = useState('0');
  const [toValue, setToValue] = useState('0');

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeSide, setActiveSide] = useState('from'); // 'from' or 'to' to handle bi-directional

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('unit_converter_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const addToHistory = (val, from, to, cat, resultVal) => {
    if (!val || val === '0' || !resultVal || resultVal === '0') return;
    
    const newEntry = {
      id: Date.now(),
      category: cat,
      fromVal: val,
      fromUnit: from,
      toVal: resultVal,
      toUnit: to,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => {
      // Prevent duplicate consecutive entries
      if (prev.length > 0) {
        const last = prev[0];
        if (last.fromVal === val && last.fromUnit === from && last.toUnit === to && last.category === cat) {
          return prev;
        }
      }
      const updated = [newEntry, ...prev].slice(0, 10);
      localStorage.setItem('unit_converter_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Debounce saving to history
  useEffect(() => {
    if (!fromValue || fromValue === '0' || !toValue || toValue === '0') return;

    const timer = setTimeout(() => {
      addToHistory(fromValue, fromUnit, toUnit, category, toValue);
    }, 1200); // 1.2s debounce to ensure they finished typing

    return () => clearTimeout(timer);
  }, [fromValue, fromUnit, toUnit, category, toValue]);

  const convert = (val, from, to, cat) => {
    const numVal = parseFloat(val);
    if (isNaN(numVal)) return '';
    if (numVal === 0) return '0';

    if (cat === 'Temperature') {
      return UNIT_DATA[cat].convert(numVal, from, to).toFixed(4).replace(/\.?0+$/, '');
    } else {
      const fromFactor = UNIT_DATA[cat].factors[from];
      const toFactor = UNIT_DATA[cat].factors[to];
      const result = (numVal * fromFactor) / toFactor;
      return result.toFixed(6).replace(/\.?0+$/, '');
    }
  };

  useEffect(() => {
    // Sync Units when category changes
    setFromUnit(UNIT_DATA[category].units[0]);
    setToUnit(UNIT_DATA[category].units[1]);
  }, [category]);

  useEffect(() => {
    if (activeSide === 'from') {
      setToValue(convert(fromValue, fromUnit, toUnit, category));
    } else {
      setFromValue(convert(toValue, toUnit, fromUnit, category));
    }
  }, [fromValue, toValue, fromUnit, toUnit, category, activeSide]);

  const handleSwap = () => {
    const oldFromUnit = fromUnit;
    const oldToUnit = toUnit;
    setFromUnit(oldToUnit);
    setToUnit(oldFromUnit);
    // When swapping, we treat the current 'fromValue' as the source
    setActiveSide('from');
  };

  const categories = Object.keys(UNIT_DATA);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full">
      {/* Header Bar */}
      <AppHeader
        headerRef={headerRef}
        title="Unit Converter"
        onBack={onBack}
        rightActions={
          <button 
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="Conversion History"
            title="History"
            className="p-1.5 bg-transparent border-none shadow-none text-[#0F172A] dark:text-[#F8FAFC] active:opacity-60 active:scale-95 transition-all duration-100 cursor-pointer select-none flex items-center justify-center relative"
          >
            <History size={20} strokeWidth={2} />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-black text-white w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-gray-900">
                {history.length}
              </span>
            )}
          </button>
        }
      />

      {/* Category Selector */}
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100/50 dark:border-gray-800 px-6 py-4 relative z-20">
        <button
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          className="w-full flex justify-between items-center group"
        >
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            {category}
          </span>
          <ChevronDown
            size={20}
            className="text-indigo-450 transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        <AnimatePresence>
          {isCategoryOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-6 right-6 top-full mt-2 bg-white dark:bg-gray-850 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden py-2"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 text-sm font-bold transition-colors ${category === cat ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll} 
        className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col items-center"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 16px)'
        }}
      >
        {/* From Card */}
        <div className="w-full bg-white dark:bg-gray-800/40 rounded-3xl p-6 shadow-soft border border-gray-50 dark:border-gray-800 mb-4 transition-all focus-within:shadow-indigo-100/50 focus-within:border-indigo-100 dark:focus-within:border-indigo-900/50">
          <div className="relative mb-4">
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-300 appearance-none outline-none border-none cursor-pointer"
            >
              {UNIT_DATA[category].units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-555 pointer-events-none" />
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={fromValue}
            onChange={(e) => {
              setActiveSide('from');
              setFromValue(e.target.value.replace(/[^0-9.]/g, ''));
            }}
            className="w-full text-5xl font-black text-gray-900 dark:text-white border-none outline-none bg-transparent"
          />
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform z-10 -my-6 ring-4 ring-gray-50 dark:ring-gray-900"
        >
          <ArrowUpDown size={20} />
        </button>

        {/* To Card */}
        <div className="w-full bg-white dark:bg-gray-800/40 rounded-3xl p-6 shadow-soft border border-gray-50 dark:border-gray-800 mt-4 transition-all focus-within:shadow-indigo-100/50 focus-within:border-indigo-100 dark:focus-within:border-indigo-900/50">
          <div className="relative mb-4">
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-300 appearance-none outline-none border-none cursor-pointer"
            >
              {UNIT_DATA[category].units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-555 pointer-events-none" />
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={toValue}
            onChange={(e) => {
              setActiveSide('to');
              setToValue(e.target.value.replace(/[^0-9.]/g, ''));
            }}
            className="w-full text-5xl font-black text-gray-900 dark:text-white border-none outline-none bg-transparent"
          />
        </div>

        </div>

      {/* Premium History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[9999] cursor-pointer"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ paddingBottom: 'calc(20px + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))' }}
              className="fixed bottom-0 left-0 right-0 max-h-[80%] bg-white dark:bg-gray-900 rounded-t-[2.5rem] shadow-premium z-[10000] flex flex-col overflow-hidden border-t border-slate-100 dark:border-gray-800 transition-colors"
            >
              {/* Drawer Pull Bar */}
              <div className="w-12 h-1 bg-slate-200 dark:bg-gray-700 rounded-full mx-auto my-3 shrink-0" />

              {/* Drawer Header */}
              <div className="px-6 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-black text-slate-800 dark:text-white">Conversion History</h3>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('unit_converter_history');
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                )}
              </div>

              {/* Drawer List */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3.5">
                {history.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-300 dark:text-gray-600">
                      <Clock size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">No history found</p>
                      <p className="text-[10px] font-semibold text-slate-300 dark:text-gray-600">Your recent conversions will appear here</p>
                    </div>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCategory(item.category);
                        setFromUnit(item.fromUnit);
                        setToUnit(item.toUnit);
                        setFromValue(item.fromVal);
                        setToValue(item.toVal);
                        setIsHistoryOpen(false);
                      }}
                      className="w-full text-left bg-slate-50 dark:bg-gray-855 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-100/50 dark:border-gray-800 rounded-2xl p-4 flex justify-between items-center gap-4 transition-all hover:scale-[1.01] active:scale-99 group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 dark:text-gray-500">
                            {item.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-slate-800 dark:text-white">
                            {item.fromVal}
                          </span>
                          <span className="text-xs font-bold text-slate-400 dark:text-gray-500">
                            {item.fromUnit}
                          </span>
                          <span className="text-slate-300 dark:text-gray-700 font-bold">→</span>
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                            {item.toVal}
                          </span>
                          <span className="text-xs font-bold text-slate-400 dark:text-gray-500">
                            {item.toUnit}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnitConverter;
