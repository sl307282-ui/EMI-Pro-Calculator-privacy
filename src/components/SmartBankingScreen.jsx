import React, { useEffect } from 'react';
import { 
  ChevronLeft, History, Settings, ChevronRight, 
  Landmark, PiggyBank, ShieldCheck, Percent,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from './BackButton';
import AppHeader from './AppHeader';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useSettings } from '../context/SettingsContext';

const SmartBankingScreen = ({ onBack, onNavigate }) => {
  const { theme } = useSettings();
  const { headerRef, handleScroll } = useHeaderScroll();

  useEffect(() => {
    const isDark = theme === 'dark';
    try {
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch (err) {
      console.warn('Capacitor StatusBar failed', err);
    }
  }, [theme]);

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
      {/* Main Body with Sticky AppHeader */}
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
        style={{
          paddingBottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 88px)'
        }}
      >
        <AppHeader
          headerRef={headerRef}
          title="Smart Banking Tools"
          onBack={onBack}
          variant="soft-blue"
        />

        <div className="p-6 space-y-4">
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
    </div>
  );
};

export default SmartBankingScreen;
