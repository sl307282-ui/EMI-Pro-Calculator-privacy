import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Copy, Delete, Divide, X, Minus, Plus, Equal, History, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as math from 'mathjs';

const ScientificCalculator = ({ onBack }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sci_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const displayRef = useRef(null);

  const handleNumber = (num) => {
    setDisplay(prev => (prev === '0' ? num : prev + num));
  };

  const handleOperator = (op) => {
    // If there's an operator, append the current display and the operator to the expression
    setExpression(prev => prev + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEqual = () => {
    try {
      const fullExpr = expression + display;
      // Convert display symbols to mathjs compatible operators
      const sanitizedExpr = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/e/g, 'e')
        .replace(/sin⁻¹/g, 'asin')
        .replace(/cos⁻¹/g, 'acos')
        .replace(/tan⁻¹/g, 'atan')
        .replace(/log/g, 'log10')
        .replace(/ln/g, 'log')
        .replace(/10ˣ/g, '10^')
        .replace(/eˣ/g, 'exp')
        .replace(/√/g, 'sqrt')
        .replace(/x²/g, '^2')
        .replace(/x³/g, '^3')
        .replace(/x!/g, '!')
        .replace(/Rand/g, 'random()');

      const result = math.evaluate(sanitizedExpr);
      const resultStr = String(Number(result.toFixed(10)));

      // Save to history
      const newHistoryItem = { expression: fullExpr, result: resultStr, id: Date.now() };
      setHistory(prev => {
        const updated = [newHistoryItem, ...prev].slice(0, 55);
        localStorage.setItem('sci_calc_history', JSON.stringify(updated));
        return updated;
      });

      setDisplay(resultStr);
      setExpression('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleScientific = (func) => {
    if (func === 'pi') {
      setDisplay(String(Math.PI));
    } else if (func === 'Rand') {
      setDisplay(String(Math.random()));
    } else if (func === '1/x') {
      setDisplay(prev => String(1 / parseFloat(prev)));
    } else {
      // For functions like sin, cos, etc., we append them to the expression
      setExpression(prev => prev + func + '(');
      setDisplay('0');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Buttons definitions
  const sciButtons = [
    { label: 'sin', action: () => handleScientific('sin') },
    { label: 'cos', action: () => handleScientific('cos') },
    { label: 'tan', action: () => handleScientific('tan') },
    { label: 'ln', action: () => handleScientific('ln') },
    { label: 'eˣ', action: () => handleScientific('exp') },
    
    { label: 'sin⁻¹', action: () => handleScientific('asin') },
    { label: 'cos⁻¹', action: () => handleScientific('acos') },
    { label: 'tan⁻¹', action: () => handleScientific('atan') },
    { label: 'log', action: () => handleScientific('log10') },
    { label: '10ˣ', action: () => handleScientific('10^') },
    
    { label: 'x²', action: () => setDisplay(prev => prev + '^2') },
    { label: 'x³', action: () => setDisplay(prev => prev + '^3') },
    { label: 'x!', action: () => setDisplay(prev => prev + '!') },
    { label: '√', action: () => setDisplay(prev => 'sqrt(' + prev + ')') },
    { label: 'π', action: () => handleScientific('pi') },
    
    { label: '1/x', action: () => handleScientific('1/x') },
    { label: 'Rand', action: () => handleScientific('Rand') },
    { label: '%', action: () => setDisplay(prev => String(parseFloat(prev) / 100)) },
    { label: '(', action: () => setDisplay(prev => (prev === '0' ? '(' : prev + '(')) },
    { label: ')', action: () => setDisplay(prev => prev + ')') },
  ];

  const basicButtons = [
    { label: 'AC', action: handleClear, type: 'clear' },
    { label: 'C', action: () => setDisplay('0'), type: 'clear' },
    { label: 'backspace', action: handleBackspace, type: 'number', icon: Delete },
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
    
    { label: '0', action: () => handleNumber('0'), type: 'number' },
    { label: '±', action: () => setDisplay(prev => String(parseFloat(prev) * -1)), type: 'number' },
    { label: '.', action: () => !display.includes('.') && handleNumber('.'), type: 'number' },
    { label: '=', action: handleEqual, type: 'operator' },
  ];

  // Dynamic font scaling for display
  useEffect(() => {
    if (displayRef.current) {
      const len = display.length;
      if (len > 30) {
        displayRef.current.style.fontSize = '1.25rem';
      } else if (len > 20) {
        displayRef.current.style.fontSize = '1.75rem';
      } else if (len > 12) {
        displayRef.current.style.fontSize = '2.5rem';
      } else if (len > 8) {
        displayRef.current.style.fontSize = '3.25rem';
      } else {
        displayRef.current.style.fontSize = '4rem';
      }
    }
  }, [display]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300 h-full overflow-hidden select-none">
      {/* Header Bar */}
      <header className="px-6 pt-14 pb-4 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-gray-800 dark:text-gray-200 active:scale-90 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Scientific</h1>
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
      <div className="flex-1 min-h-[140px] px-6 pt-4 pb-3 flex flex-col justify-center items-end w-full overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="text-gray-400 dark:text-gray-555 text-sm font-semibold mb-2 truncate w-full text-right h-6 flex-shrink-0">
          {expression}
        </div>
        <div 
          ref={displayRef}
          className="text-gray-900 dark:text-white font-black text-right w-full break-all transition-all duration-200 flex-1 flex items-center justify-end"
          style={{ fontSize: '4rem', lineHeight: '1.1' }}
        >
          {display}
        </div>
      </div>

      {/* Scientific Keypad */}
      <div className="bg-[#F8F9FE] dark:bg-gray-850 p-4 grid grid-cols-5 gap-2 border-t border-gray-100 dark:border-gray-800 shadow-inner transition-colors duration-300">
        {sciButtons.map((btn, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.92 }}
            onClick={btn.action}
            className="h-9 bg-[#EAEBFA] dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-[13px] font-black text-indigo-950 dark:text-indigo-200 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
          >
            {btn.label}
          </motion.button>
        ))}
      </div>

      {/* Basic Keypad */}
      <div className="bg-white dark:bg-gray-900 p-4 grid grid-cols-4 gap-3 shadow-2xl dark:shadow-none z-10 pb-5 transition-colors duration-300">
        {basicButtons.map((btn, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.95 }}
            onClick={btn.action}
            className={`
              h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all
              ${btn.type === 'clear' ? 'bg-[#FDDCDC] dark:bg-red-950/30 text-red-600 dark:text-red-400' : ''}
              ${btn.type === 'number' ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' : ''}
              ${btn.type === 'operator' ? 'bg-[#4F5BBE] dark:bg-indigo-750 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30' : ''}
            `}
          >
            {btn.icon ? <btn.icon size={24} /> : btn.label}
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
                        localStorage.removeItem('sci_calc_history');
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
                        setExpression(item.expression + ' = ');
                        setDisplay(item.result);
                        setShowHistoryModal(false);
                      }}
                      className="p-4 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/50 hover:border-indigo-100 dark:hover:border-indigo-900/30 rounded-2xl transition-all cursor-pointer text-right flex flex-col gap-1 active:scale-[0.99]"
                    >
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-555 truncate">{item.expression}</span>
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

export default ScientificCalculator;
