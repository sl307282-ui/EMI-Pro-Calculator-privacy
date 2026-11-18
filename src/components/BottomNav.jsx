import React from 'react';
import { Home, LayoutGrid, TrendingUp, User, Cpu } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { t } from '../utils/calculatorLogic';

const BottomNav = React.memo(({ activeTab, onSelectTab, onTabChange, isVisible = true }) => {
  const { theme, language } = useSettings();
  const handleSelect = onSelectTab || onTabChange;

  const tabs = [
    { id: 'home', icon: Home, label: t('home', language) },
    { id: 'calculators', icon: LayoutGrid, label: t('calculators', language) },
    { id: 'smart_banking', icon: Cpu, label: t('smart_banking', language) },
    { id: 'sip_growth', icon: TrendingUp, label: 'SIP Growth' },
    { id: 'profile', icon: User, label: t('profile', language) },
  ];

  return (
    <div
      className="fixed sm:absolute z-50 pointer-events-none flex justify-center items-center"
      style={{
        left: 16,
        right: 16,
        bottom: 'calc(var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)) + 8px)',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform',
        contain: 'layout paint style',
        display: isVisible ? 'flex' : 'none',
      }}
    >
      <nav
        role="navigation"
        aria-label="Bottom Navigation"
        className="pointer-events-auto w-full"
        style={{
          maxWidth: 420,
          height: 58,
          borderRadius: 9999,
          backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: theme === 'dark' ? '0 4px 16px rgba(0, 0, 0, 0.32)' : '0 4px 16px rgba(15, 23, 42, 0.08)',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
          contain: 'layout paint style',
          padding: '0 4px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            height: '58px',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                type="button"
                onClick={() => handleSelect && handleSelect(tab.id)}
                aria-label={tab.label}
                aria-selected={isActive}
                className="flex flex-col items-center justify-center h-full w-full focus:outline-none select-none"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 44,
                    height: 28,
                    borderRadius: 9999,
                    backgroundColor: isActive
                      ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.20)' : '#EFF6FF')
                      : 'transparent',
                    transition: 'color 0.12s linear, background-color 0.12s linear',
                    marginBottom: 2,
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    style={{
                      color: isActive
                        ? (theme === 'dark' ? '#60A5FA' : '#2563EB')
                        : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                      transition: 'color 0.12s linear',
                      flexShrink: 0,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: isActive ? 800 : 700,
                    letterSpacing: '-0.025em',
                    textTransform: 'uppercase',
                    lineHeight: '12px',
                    height: 12,
                    color: isActive
                      ? (theme === 'dark' ? '#93C5FD' : '#1D4ED8')
                      : (theme === 'dark' ? '#94A3B8' : '#64748B'),
                    transition: 'color 0.12s linear',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '0 1px',
                    display: 'block',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
});

export default BottomNav;
