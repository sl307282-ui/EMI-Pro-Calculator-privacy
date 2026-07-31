import React from 'react';
import { 
  ChevronLeft, History, Settings, ChevronRight, 
  Landmark, PiggyBank, ShieldCheck, Percent,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

const SmartBankingScreen = ({ onBack, onNavigate }) => {
  const tools = [
    {
      id: 'fd',
      title: 'FD Calculator',
      subtitle: 'Fixed Deposit Analysis',
      icon: Landmark,
      secondaryIcon: Lock,
      route: 'FD_CALC',
      color: 'bg-blue-500'
    },
    {
      id: 'rd',
      title: 'RD Calculator',
      subtitle: 'Recurring Savings Plan',
      icon: PiggyBank,
      route: 'RD_CALC',
      color: 'bg-emerald-500'
    },
    {
      id: 'ppf',
      title: 'PPF Calculator',
      subtitle: 'Secure Public Fund',
      icon: ShieldCheck,
      route: 'PPF_CALC',
      color: 'bg-amber-500'
    },
    {
      id: 'interest',
      title: 'Interest Calculator',
      subtitle: 'Simple & Compound Math',
      icon: Percent,
      route: 'INTEREST_CALC',
      color: 'bg-rose-500'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden h-full transition-colors duration-300">
      {/* Header Bar */}
      <header className="bg-indigo-600 dark:bg-indigo-900 px-6 pt-14 pb-6 flex justify-between items-center shadow-lg z-30 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-white active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Smart Banking Tools</h1>
        </div>
        <div className="w-6" /> {/* Placeholder to balance the layout if needed, or leave empty */}
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-36 space-y-4 bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate(tool.route)}
            className="w-full bg-white dark:bg-gray-800 rounded-3xl p-5 flex items-center justify-between shadow-soft border border-gray-50 dark:border-gray-700 active:scale-[0.98] active:bg-gray-50 dark:active:bg-gray-700 transition-all text-left"
          >
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 ${tool.color} rounded-2xl flex items-center justify-center text-white shadow-lg relative overflow-hidden`}>
                <tool.icon size={26} strokeWidth={2.2} className="relative z-10" />
                {tool.secondaryIcon && (
                   <div className="absolute -right-1 -bottom-1 opacity-20">
                     <tool.secondaryIcon size={32} />
                   </div>
                )}
                {/* Subtle circuitry pattern effect */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
              </div>
              
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight mb-1">{tool.title}</h3>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{tool.subtitle}</p>
              </div>
            </div>
            
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600">
              <ChevronRight size={20} />
            </div>
          </motion.button>
        ))}
        
        {/* Info Card */}
        <div className="mt-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] flex gap-4">
           <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
             <ShieldCheck size={20} />
           </div>
           <p className="text-[11px] text-indigo-900/70 dark:text-indigo-300 font-semibold leading-relaxed">
             Our Smart Banking tools use advanced algorithms to provide accurate financial projections for your investments.
           </p>
        </div>
      </div>
    </div>
  );
};

export default SmartBankingScreen;
