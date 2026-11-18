import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

const PremiumDatePicker = ({ isOpen, onClose, onSelect, initialDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'year'

  // Sync state when modal opens or initialDate changes
  useEffect(() => {
    if (isOpen) {
      const date = initialDate ? new Date(initialDate) : new Date();
      const validDate = isNaN(date.getTime()) ? new Date() : date;
      setCurrentDate(validDate);
      setSelectedDate(validDate);
      setViewMode('calendar');
    }
  }, [isOpen, initialDate]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      arr.push(i);
    }
    return arr;
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleYearSelect = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setViewMode('calendar');
  };

  const handleConfirm = () => {
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onSelect(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [currentDate]);

  return (
    <AnimatePresence>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 dark:border-gray-800 z-[10000]"
          >
            {/* Header */}
            <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-none">Select Date</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Premium Edition</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400 active:scale-90 transition-transform">
                <X size={18} />
              </button>
            </div>

            {/* View Selector Header */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <button 
                  onClick={handlePrevMonth}
                  className={`p-2.5 text-gray-400 hover:text-primary active:scale-90 transition-all ${viewMode === 'year' ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <button 
                  onClick={() => setViewMode(viewMode === 'calendar' ? 'year' : 'calendar')}
                  className="flex flex-col items-center px-4 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-1">
                    {months[currentDate.getMonth()]}
                  </span>
                  <span className="text-[10px] font-bold text-primary">
                    {currentDate.getFullYear()}
                  </span>
                </button>

                <button 
                  onClick={handleNextMonth}
                  className={`p-2.5 text-gray-400 hover:text-primary active:scale-90 transition-all ${viewMode === 'year' ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="h-[300px] overflow-hidden relative">
              <AnimatePresence mode="wait">
                {viewMode === 'calendar' ? (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="p-6 pt-0"
                  >
                    <div className="grid grid-cols-7 mb-4">
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-center text-[9px] font-black text-gray-300 dark:text-gray-600 tracking-wider">
                          {d}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, i) => {
                        if (day === null) return <div key={`empty-${i}`} className="h-10" />;
                        
                        const isToday = 
                          day === new Date().getDate() && 
                          currentDate.getMonth() === new Date().getMonth() && 
                          currentDate.getFullYear() === new Date().getFullYear();
                        
                        const isSelected = 
                          day === selectedDate.getDate() && 
                          currentDate.getMonth() === selectedDate.getMonth() && 
                          currentDate.getFullYear() === selectedDate.getFullYear();

                        return (
                          <motion.button
                            key={day}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDateClick(day)}
                            className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all relative ${
                              isSelected 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : isToday 
                                  ? 'bg-primary/5 text-primary' 
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {day}
                            {isToday && !isSelected && (
                              <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="year"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 px-6 overflow-y-auto no-scrollbar pb-6"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {years.map(year => (
                        <button
                          key={year}
                          onClick={() => handleYearSelect(year)}
                          className={`py-4 rounded-2xl text-sm font-black transition-all ${
                            year === currentDate.getFullYear()
                              ? 'bg-primary text-white shadow-lg'
                              : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div 
              style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 24px)' }}
              className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20"
            >
              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                Confirm Selection
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
};

export default PremiumDatePicker;
