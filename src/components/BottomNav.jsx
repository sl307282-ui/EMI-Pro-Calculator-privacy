import React from 'react';
import { Home, LayoutGrid, TrendingUp, User, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { t } from '../utils/calculatorLogic';

const BottomNav = ({ activeTab, onTabChange }) => {
  const { theme, language } = useSettings();

  const tabs = [
    { id: 'home', icon: Home, label: t('home', language) },
    { id: 'calculators', icon: LayoutGrid, label: t('calculators', language) },
    { id: 'smart_banking', icon: Cpu, label: t('smart_banking', language) },
    { id: 'sip_growth', icon: TrendingUp, label: 'SIP Growth' },
    { id: 'profile', icon: User, label: t('profile', language) },
  ];

  return (
    <div
      style={{ maxWidth: 'calc(100% - 2rem)', width: 420 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      <div className="relative">
        <div
          className={`
            flex justify-around items-center
            px-3 py-1
            rounded-full
            border
            shadow-xl
            backdrop-blur-xl
            transition-all duration-300
            ${theme === 'dark'
              ? 'bg-gray-950/80 border-gray-800/80 shadow-black/40'
              : 'bg-white/80 border-gray-100/80 shadow-gray-200/80'}
          `}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center flex-1 cursor-pointer relative py-0 focus:outline-none"
              >
                <div className="relative w-14 h-7 rounded-full flex items-center justify-center mb-0.5">
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-blue-100 dark:bg-blue-900/40 rounded-full z-0"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 28
                      }}
                    />
                  )}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      rotate: isActive && tab.id === 'smart_banking' ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      className={isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}
                    />
                  </motion.div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider leading-none transition-colors duration-200 mt-[1px] ${isActive ? (theme === 'dark' ? 'text-blue-300' : 'text-blue-700') : (theme === 'dark' ? 'text-gray-400 opacity-75' : 'text-gray-600 opacity-75')
                  }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
