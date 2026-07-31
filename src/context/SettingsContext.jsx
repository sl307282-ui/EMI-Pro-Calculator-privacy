import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { StatusBar, Style } from '@capacitor/status-bar';

// Languages supported by this version of the app.
const SUPPORTED_LANGUAGES = ['English', 'Hindi', 'Spanish', 'Arabic', 'French', 'Portuguese', 'Indonesian'];

// Currencies supported by this version of the app.
const SUPPORTED_CURRENCIES = ['₹ INR', '$ USD', '€ EUR', '£ GBP', '¥ JPY', 'R$ BRL', 'Rp IDR', 'د.إ AED', 'ر.س SAR'];

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('app_theme') || 'light';
      const isDark = savedTheme === 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
      }
      return savedTheme;
    } catch {
      return 'light';
    }
  });
  const [currency, setCurrency] = useState(() => {
    try {
      const stored = localStorage.getItem('app_currency');
      // If stored currency is in the supported list, keep it; otherwise reset to INR
      if (stored && SUPPORTED_CURRENCIES.includes(stored)) {
        return stored;
      }
      localStorage.removeItem('app_currency');
      return '₹ INR';
    } catch {
      return '₹ INR';
    }
  });
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('app_language');
      // If stored language is not in the supported list, reset to English
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
      }
      // Clear any legacy/unsupported language value
      localStorage.removeItem('app_language');
      return 'English';
    } catch {
      return 'English';
    }
  });

  // Configure Status Bar on mount
  useEffect(() => {
    const isDark = theme === 'dark';
    try {
      StatusBar.setOverlaysWebView({ overlay: true });
      StatusBar.setBackgroundColor({ color: '#00000000' });
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch (err) {
      console.warn('Capacitor StatusBar init failed', err);
    }
  }, []);

  const toggleTheme = (newTheme) => {
    if (newTheme === theme) return;
    const isDark = newTheme === 'dark';
    
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
          document.documentElement.classList.toggle('dark', isDark);
          document.body.classList.toggle('dark', isDark);
          try {
            StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          } catch (err) {}
        });
      });
    } else {
      setTheme(newTheme);
      document.documentElement.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark', isDark);
      try {
        StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      } catch (err) {}
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('app_currency', currency);
    } catch (e) {}
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem('app_language', language);
    } catch (e) {}
  }, [language]);

  // Build symbol: everything before the first space (handles '₹', '$', '€', '£', '¥', 'R$', 'Rp', 'د.إ', 'ر.س')
  const currencySymbol = currency.split(' ')[0] || '₹';

  const value = {
    theme,
    setTheme: toggleTheme,
    currency,
    setCurrency,
    currencySymbol,
    language,
    setLanguage,
  };

  return (
    <SettingsContext.Provider value={value}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
};
