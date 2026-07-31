import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Copy, Delete, Divide, X, Minus, Plus, Equal, History, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as math from 'mathjs';

const StandardCalculator = ({ onBack }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('std_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const displayRef = useRef(null);

  // Formatting with commas
  const formatNumber = (val) => {
    if (val === '0' || val === 'Error') return val;
    const parts = val.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleNumber = (num) => {
    setDisplay(prev => (prev === '0' ? num : prev + num));
  };

  const handleOperator = (op) => {
    if (equation && display === '0') {
      setEquation(prev => prev.slice(0, -2) + op + ' ');
    } else {
      setEquation(prev => prev + display + ' ' + op + ' ');
      setDisplay('0');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEqual = () => {
    try {
      let fullExpr = equation + display;
      
      // Percentage logic
      if (display.endsWith('%')) {
        const value = parseFloat(display);
        const match = equation.match(/(\d+\.?\d*)\s*[\+\-\*\/]\s*$/);
        if (match) {
          const base = parseFloat(match[1]);
          const percentVal = base * (value / 100);
          fullExpr = equation + percentVal;
        } else {
          fullExpr = equation + (value / 100);
        }
      }

      const sanitizedExpr = fullExpr.replace(/×/g, '*').replace(/÷/g, '/');
      const result = math.evaluate(sanitizedExpr);
      const formattedResult = math.format(result, { precision: 14 });
      const resultStr = String(Number(formattedResult));

      // Save to history
      const newHistoryItem = { equation: fullExpr, result: resultStr, id: Date.now() };
      setHistory(prev => {
        const updated = [newHistoryItem, ...prev].slice(0, 55);
        localStorage.setItem('std_calc_history', JSON.stringify(updated));
        return updated;
      });

      setDisplay(resultStr);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handlePercent = () => {
    setDisplay(prev => (prev === '0' ? '0' : prev + '%'));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display.replace(/,/g, ''));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const buttons = [
    { label: 'AC', action: handleClear, type: 'clear' },
    { label: 'backspace', action: handleBackspace, type: 'number', icon: Delete },
    { label: '%', action: handlePercent, type: 'number' },
    { label: '÷', action: () => handleOperator('÷'), type: 'operator' },
    { label: '7', action: () => handleNumber('7'), type: 'number' },
    { label: '8', action: () => handleNumber('8'), type: 'number' },
    { label: '9', action: () => handleNumber('9'), type: 'number' },
    { label: '×', action: () => handleOperator('×'), type: 'operator' },
    { label: '4', action: () => handleNumber('4'), type: 'number' },
    { label: '5', action: () => handleNumber('5'), type: 'number' },
    { label: '6', action: () => handleNumber('6'), type: 'number' },
    { label: '-', action: () => handleOperator('-'), type: 'operator' },
    { label: '1', action: () => handleNumber('1'), type: 'number' },
    { label: '2', action: () => handleNumber('2'), type: 'number' },
    { label: '3', action: () => handleNumber('3'), type: 'number' },
    { label: '+', action: () => handleOperator('+'), type: 'operator' },
    { label: '00', action: () => handleNumber('00'), type: 'number' },
    { label: '0', action: () => handleNumber('0'), type: 'number' },
    { label: '.', action: () => !display.includes('.') && handleNumber('.'), type: 'number' },
    { label: '=', action: handleEqual, type: 'operator' },
  ];

  useEffect(() => {
    if (displayRef.current) {
      const len = display.length;
      if (len > 30) {
        displayRef.current.style.fontSize = '1.25rem';
      } else if (len > 20) {
        displayRef.current.style.fontSize = '1.75rem';
      } else if (len > 14) {
        displayRef.current.style.fontSize = '2.5rem';
      } else if (len > 10) {
        displayRef.current.style.fontSize = '3.5rem';
      } else {
        displayRef.current.style.fontSize = '4.5rem';
      }
    }
  }, [display]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 h-full overflow-hidden select-none">
      {/* Header Bar */}
      <header className="px-6 pt-14 pb-4 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-800 dark:text-gray-200 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Calculator</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={handleCopy} className="p-2 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform">
              <Copy size={20} />
            </button>
            <AnimatePresence>
              {showToast && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 35 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg z-50"
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setShowHistoryModal(true)} 
            className="p-2 text-gray-400 dark:text-gray-500 active:scale-90 transition-transform"
          >
            <History size={20} />
          </button>
        </div>
      </header>

      {/* Display Area */}
      <div className="flex-1 min-h-[160px] px-6 pt-6 pb-4 flex flex-col justify-center items-end w-full overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="text-gray-400 dark:text-gray-555 text-sm font-semibold mb-2 truncate w-full text-right h-6 flex-shrink-0">
          {equation}
        </div>
        <div 
          ref={displayRef}
          className="text-gray-900 dark:text-white font-black text-right w-full break-all transition-all duration-200 flex-1 flex items-center justify-end"
          style={{ fontSize: '4.5rem', lineHeight: '1.1' }}
        >
          {formatNumber(display)}
        </div>
      </div>

      {/* Keypad */}
      <div className="flex-2 bg-white dark:bg-gray-900 p-4 grid grid-cols-4 gap-3 z-10 pb-8 transition-colors duration-300">
        {buttons.map((btn, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.94 }}
            onClick={btn.action}
            className={`
              h-15 rounded-2xl flex items-center justify-center text-[26px] font-black transition-all
              ${btn.type === 'clear' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' : ''}
              ${btn.type === 'number' ? 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700' : ''}
              ${btn.type === 'operator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/40' : ''}
            `}
          >
            {btn.icon ? <btn.icon size={28} /> : btn.label}
          </motion.button>
        ))}
      </div>

      {/* History Slide-Up Panel */}
      <AnimatePresence>
        {showHistoryModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            />
            {/* Slide up panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-h-[70%] bg-white dark:bg-gray-900 rounded-t-[2.5rem] p-6 z-[95] flex flex-col shadow-2xl border-t border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Calculation History</h3>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        setHistory([]);
                        localStorage.removeItem('std_calc_history');
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full active:scale-95 transition-all flex items-center justify-center"
                      title="Clear History"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-gray-550 dark:text-gray-400 active:scale-90 transition-transform"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 pr-1">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
                    <History size={40} className="mb-3 opacity-20" />
                    <p className="text-sm font-bold">No calculations yet</p>
                    <p className="text-xs mt-1 text-center">Your past results will appear here</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setEquation(item.equation + ' = ');
                        setDisplay(item.result);
                        setShowHistoryModal(false);
                      }}
                      className="p-4 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/50 hover:border-indigo-100 dark:hover:border-indigo-900/30 rounded-2xl transition-all cursor-pointer text-right flex flex-col gap-1 active:scale-[0.99]"
                    >
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-555 truncate">{item.equation}</span>
                      <span className="text-base font-black text-gray-900 dark:text-white truncate">{item.result}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StandardCalculator;
