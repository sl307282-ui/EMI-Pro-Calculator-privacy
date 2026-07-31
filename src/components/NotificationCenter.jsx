import React from 'react';
import { 
  Bell, Calendar, ArrowLeft, ChevronRight, 
  AlertCircle, CheckCircle2, Info, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = ({ notifications, onBack, onClear, onActionClick }) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 px-6 pt-14 pb-6 shadow-sm z-30 transition-colors duration-300 border-b border-transparent dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Notifications</h1>
          </div>
          {notifications.length > 0 && (
            <button 
              onClick={onClear}
              className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl"
            >
              Clear All
            </button>
          )}
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex gap-4 ${notif.isRead ? 'opacity-80' : ''} transition-colors duration-300`}
              >
                {/* Status Indicator */}
                {!notif.isRead && (
                  <div className="absolute top-6 right-6 w-2 h-2 bg-blue-600 rounded-full" />
                )}

                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${
                  notif.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 
                  notif.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {notif.type === 'alert' ? <AlertCircle size={22} /> : 
                   notif.type === 'success' ? <CheckCircle2 size={22} /> : 
                   <Info size={22} />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight pr-4">{notif.title}</h3>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{notif.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-3">
                    {notif.message}
                  </p>
                  {notif.action && (
                    <button 
                      onClick={() => onActionClick && onActionClick(notif)}
                      className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all outline-none"
                    >
                      {notif.action} <ChevronRight size={12} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Bell size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-bold">No notifications yet</p>
              <p className="text-xs mt-1">We'll alert you when something important happens</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips Section */}
        <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-[2.5rem] border border-blue-100/50 dark:border-blue-900/30">
           <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
               <Calendar size={16} />
             </div>
             <h4 className="text-xs font-black text-blue-900 dark:text-blue-400 uppercase tracking-wider">Pro Tip</h4>
           </div>
           <p className="text-xs text-blue-800/70 dark:text-blue-300/70 font-bold leading-relaxed">
             Sync your EMI dates with your calendar to never miss a payment and avoid penalties.
           </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
