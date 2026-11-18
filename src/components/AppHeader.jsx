import React, { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useSettings } from '../context/SettingsContext';
import BackButton from './BackButton';

/**
 * Reusable Theme-Aware Top App Bar
 * Standardized soft sky-blue / deep-navy gradient surface across the entire application,
 * with uniform 60fps scroll-shrinking, scaling, circular back button, and borderless action icons.
 */
const AppHeader = ({
  title,
  subtitle,
  onBack,
  backVariant = 'soft-blue',
  variant = 'soft-blue',
  gradientClass = 'app-header-soft-blue',
  rightActions,
  headerRef,
  className = '',
  titleClassName = '',
  children,
}) => {
  const { theme } = useSettings();

  useEffect(() => {
    try {
      StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    } catch (e) {}
  }, [theme]);

  const resolvedBackVariant = backVariant || 'soft-blue';

  return (
    <header
      ref={headerRef}
      className={`app-header-sticky px-6 flex items-center justify-between app-header-soft-blue ${className}`}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {onBack && (
              <BackButton
                onClick={onBack}
                variant={resolvedBackVariant}
              />
            )}
            <div className="app-header-title min-w-0">
              {typeof title === 'string' ? (
                <h1
                  className={`font-bold truncate text-[18px] text-[#0F172A] dark:text-[#F8FAFC] ${titleClassName}`}
                  style={{ fontSize: '18px', fontWeight: 700 }}
                >
                  {title}
                </h1>
              ) : (
                title
              )}
              {subtitle && (
                <p
                  className="text-[11px] font-medium truncate text-slate-600 dark:text-slate-300"
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {rightActions && (
            <div className="app-header-actions flex items-center gap-2 flex-shrink-0 ml-3">
              {rightActions}
            </div>
          )}
        </>
      )}
    </header>
  );
};

export default AppHeader;
