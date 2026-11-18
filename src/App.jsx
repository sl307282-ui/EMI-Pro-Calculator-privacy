import React, { useState, useCallback, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import CalculatorsScreen from './components/CalculatorsScreen';
import SmartBankingScreen from './components/SmartBankingScreen';
import SIPCalculator from './components/SIPCalculator';
import UserProfile from './components/UserProfile';
import BottomNav from './components/BottomNav';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Calendar, X, AlertCircle } from 'lucide-react';

import InputScreen from './components/InputScreen';
import ResultsScreen from './components/ResultsScreen';
import DetailsScreen from './components/DetailsScreen';
import CompareLoansInput from './components/CompareLoansInput';
import CompareResults from './components/CompareResults';
import CompareLoansList from './components/CompareLoansList';
import QuickCalculator from './components/QuickCalculator';
import QuickCalculatorDetails from './components/QuickCalculatorDetails';
import LoanAffordability from './components/LoanAffordability';
import LoanEligibility from './components/LoanEligibility';
import LoanProfile from './components/LoanProfile';
import AddLoanProfile from './components/AddLoanProfile';
import LoanProfileDetails from './components/LoanProfileDetails';
import LoanProfileSchedule from './components/LoanProfileSchedule';
import MoratoriumCalculator from './components/MoratoriumCalculator';
import SmartPrepayCalculator from './components/SmartPrepayCalculator';
import SmartPrepayTips from './components/SmartPrepayTips';
import SIPTips from './components/SIPTips';
import AdvanceEMICalculator from './components/AdvanceEMICalculator';
import AdvanceEMIDetails from './components/AdvanceEMIDetails';
import PrePaymentROI from './components/PrePaymentROI';
import StandardCalculator from './components/StandardCalculator';
import ScientificCalculator from './components/ScientificCalculator';
import ComingSoon from './components/ComingSoon';
import LandPurchaseCalculator from './components/LandPurchaseCalculator';
import LoanRefinance from './components/LoanRefinance';
import ChitCalculator from './components/ChitCalculator';
import RDCalculator from './components/RDCalculator';
import PPFCalculator from './components/PPFCalculator';
import InterestCalculator from './components/InterestCalculator';
import FDCalculator from './components/FDCalculator';
import UnitConverter from './components/UnitConverter';
import LoanSplitCalculator from './components/LoanSplitCalculator';
import RentVsBuyCalculator from './components/RentVsBuyCalculator';
import CardTrapCalculator from './components/CardTrapCalculator';
import WealthPlannerCalculator from './components/WealthPlannerCalculator';
import TaxSalaryCalculator from './components/TaxSalaryCalculator';
import RetirementCalculator from './components/RetirementCalculator';
import SmartROICalculator from './components/SmartROICalculator';
import NotificationCenter from './components/NotificationCenter';
import DashboardCustomizer from './components/DashboardCustomizer';
import InflationInsights from './components/InflationInsights';
import InstallModal from './components/InstallModal';
import UpdateModal from './components/UpdateModal';
import { SettingsProvider, useSettings } from './context/SettingsContext';
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  const cleanStr = dateStr.split('T')[0].trim();
  
  // Handle YYYY-MM-DD or DD/MM/YYYY format
  if (cleanStr.includes('/') || cleanStr.includes('-')) {
    const separator = cleanStr.includes('/') ? '/' : '-';
    const parts = cleanStr.split(separator);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day, 0, 0, 0, 0);
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
  }
  
  const d = new Date(cleanStr.replace(/-/g, "/"));
  d.setHours(0, 0, 0, 0);
  return d;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  if (result.getMonth() !== (targetMonth % 12 + 12) % 12) {
    result.setDate(0);
  }
  result.setHours(0, 0, 0, 0);
  return result;
};

const getLoanBaseNotificationId = (loanId) => {
  const str = String(loanId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash) % 2000000000;
  return positiveHash === 0 ? 1 : positiveHash;
};

const cancelScheduledNotificationsForLoan = async (loan) => {
  if (loan && loan.scheduledNotificationIds && loan.scheduledNotificationIds.length > 0) {
    try {
      await LocalNotifications.cancel({
        notifications: loan.scheduledNotificationIds.map(id => ({ id }))
      });
      console.log(`[EMI Pro Debug] Cancelled notifications for loan ${loan.name}:`, loan.scheduledNotificationIds);
    } catch (err) {
      console.warn('[EMI Pro Debug] Failed to cancel notifications:', err);
    }
  }
};

const scheduleNotificationsForLoan = async (loan) => {
  if (!loan.notification || !loan.firstEmiDate || !loan.tenure) {
    return [];
  }

  const firstEmiDate = parseLocalDate(loan.firstEmiDate);
  if (!firstEmiDate || isNaN(firstEmiDate.getTime())) {
    console.warn('[EMI Pro Debug] Invalid firstEmiDate for scheduling:', loan.firstEmiDate);
    return [];
  }

  const tenure = parseInt(loan.tenure) || 12;
  const emiVal = loan.emi || '0';
  const duration = loan.notificationDuration || '1 Day Before';
  
  let offsetDays = 1;
  if (duration === '1 Day Before') {
    offsetDays = 1;
  } else if (duration === '2 Days Before') {
    offsetDays = 2;
  } else if (duration === '3 Days Before') {
    offsetDays = 3;
  } else if (duration === '1 Week Before') {
    offsetDays = 7;
  }

  const notificationsToSchedule = [];
  const baseId = getLoanBaseNotificationId(loan.id);
  const scheduledNotificationIds = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxNotifications = Math.min(tenure, 60);

  for (let i = 0; i < maxNotifications; i++) {
    const dueDate = addMonths(firstEmiDate, i);
    const notificationDate = new Date(dueDate);
    notificationDate.setDate(dueDate.getDate() - offsetDays);
    notificationDate.setHours(9, 0, 0, 0); // 9:00 AM local time

    if (notificationDate > new Date()) {
      const notifId = baseId + i;
      const formattedDueDate = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      
      notificationsToSchedule.push({
        id: notifId,
        title: 'EMI Reminder!',
        body: `Your EMI of ₹${emiVal} for ${loan.name} is due on ${formattedDueDate}.`,
        schedule: { at: notificationDate },
        extra: { loanId: loan.id, emiIndex: i }
      });
      scheduledNotificationIds.push(notifId);
    }
  }

  if (notificationsToSchedule.length > 0) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule
        });
        console.log(`[EMI Pro Debug] Scheduled ${notificationsToSchedule.length} local notifications for loan "${loan.name}".`);
      } else {
        console.warn('[EMI Pro Debug] LocalNotification permission not granted, skipped native scheduling.');
      }
    } catch (err) {
      console.warn('[EMI Pro Debug] LocalNotifications.schedule failed:', err);
    }
  }

  return scheduledNotificationIds;
};

const tabVariants = {
  initial: false,
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 1, transition: { duration: 0 } },
  transition: { duration: 0 }
};

const toolScreenVariants = {
  initial: {
    x: '100%',
  },
  animate: {
    x: 0,
    transition: {
      duration: 0.24,
      ease: [0.2, 0.0, 0.0, 1.0],
    },
  },
  exit: {
    x: '100%',
    pointerEvents: 'none',
    transition: {
      duration: 0.22,
      ease: [0.2, 0.0, 0.0, 1.0],
    },
  },
};

const toolScreenMotionProps = {
  variants: toolScreenVariants,
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  style: {
    transform: 'translate3d(0, 0, 0)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    willChange: 'transform',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  className: 'flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] dark:bg-[#0F172A]'
};

const AppContent = () => {
  const { theme, currency, language } = useSettings();
  const [currentScreen, _setCurrentScreen] = useState('HOME');
  const [navigationSource, setNavigationSource] = useState('bottom-nav'); // 'bottom-nav' | 'subpage'
  const [slideDirection, setSlideDirection] = useState('forward');

  const setCurrentScreen = (nextScreen) => {
    const TAB_ORDER = {
      'HOME': 0,
      'CALCULATORS': 1,
      'SMART_BANKING': 2,
      'SIP_CALC': 3,
      'USER_PROFILE': 4
    };
    const resolvedNext = typeof nextScreen === 'function' ? nextScreen(currentScreen) : nextScreen;
    if (TAB_ORDER[resolvedNext] !== undefined && TAB_ORDER[currentScreen] !== undefined) {
      if (TAB_ORDER[resolvedNext] > TAB_ORDER[currentScreen]) {
        setSlideDirection('forward');
      } else if (TAB_ORDER[resolvedNext] < TAB_ORDER[currentScreen]) {
        setSlideDirection('backward');
      }
    }
    if (['HOME', 'CALCULATORS', 'SMART_BANKING', 'USER_PROFILE'].includes(resolvedNext)) {
      setNavigationSource('bottom-nav');
    }
    _setCurrentScreen(resolvedNext);
  };

  const [calculatorBackScreen, setCalculatorBackScreen] = useState('HOME');
  const triggerGlobalBackRef = React.useRef(null);

  // Unified Safe Back handler: blur active input immediately, clean up body/root overflow & pointer events, reset transition flags, then navigate in requestAnimationFrame
  const handleSafeBack = React.useCallback((customBackFn) => {
    if (typeof document !== 'undefined') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.overflow = '';
        rootEl.style.pointerEvents = '';
      }
    }
    if (isTransitioningRef.current) {
      isTransitioningRef.current = false;
    }
    requestAnimationFrame(() => {
      if (typeof customBackFn === 'function') {
        customBackFn();
      } else if (triggerGlobalBackRef.current) {
        triggerGlobalBackRef.current();
      }
    });
  }, []);

  const handleCalculatorBack = React.useCallback(() => {
    handleSafeBack(() => {
      setNavigationSource('bottom-nav');
      if (calculatorBackScreen === 'CALCULATORS') {
        setCurrentScreen('CALCULATORS');
        setActiveTab('calculators');
      } else if (calculatorBackScreen === 'SMART_BANKING') {
        setCurrentScreen('SMART_BANKING');
        setActiveTab('smart_banking');
      } else if (calculatorBackScreen === 'USER_PROFILE') {
        setCurrentScreen('USER_PROFILE');
        setActiveTab('profile');
      } else {
        setCurrentScreen('HOME');
        setActiveTab('home');
      }
    });
  }, [calculatorBackScreen, handleSafeBack]);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [updateUrl, setUpdateUrl] = useState('https://play.google.com/store/apps/details?id=com.sohan.emiprocalculator');
  const [isForceUpdate, setIsForceUpdate] = useState(false);

  React.useEffect(() => {
    const checkUpdate = async () => {
      // 1. Check if internet is available
      if (!navigator.onLine) {
        console.log('[EMI Pro Debug] No internet connection. Skipping update check.');
        return;
      }

      let fetchedLatestVersionCode = 13; // Default fallback to current versionCode
      let fetchedLatestVersionName = '1.2.9';
      let fetchedMinVersionCode = 13;
      let fetchedUpdateUrl = 'https://play.google.com/store/apps/details?id=com.sohan.emiprocalculator';
      let fetchedFromFirebase = false;

      // 2. Fetch from Firebase Remote Config
      try {
        // Placeholder Firebase Web Config - user will replace this with their actual config in the Firebase Console
        const firebaseConfig = {
          apiKey: "AIzaSyCTGccwOuKLblzjvO8EGp5svWlkCEChhFA",
          authDomain: "emi-pro-calculator-46221.firebaseapp.com",
          projectId: "emi-pro-calculator-46221",
          storageBucket: "emi-pro-calculator-46221.firebasestorage.app",
          messagingSenderId: "297710614676",
          appId: "1:297710614676:web:7c22c080b2371d2c3d9c81",
          measurementId: "G-35P6MJYKPS"
        };

        if (window.firebase) {
          if (!window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
          }
          
          const remoteConfig = window.firebase.remoteConfig();
          remoteConfig.settings.minimumFetchIntervalMillis = 0; // Fetch immediately for real-time check
          remoteConfig.defaultConfig = {
            latestVersionCode: 13,
            latestVersionName: '1.2.9',
            minVersionCode: 13,
            updateUrl: 'https://play.google.com/store/apps/details?id=com.sohan.emiprocalculator'
          };

          await remoteConfig.fetchAndActivate();
          fetchedLatestVersionCode = remoteConfig.getValue('latestVersionCode').asNumber();
          fetchedLatestVersionName = remoteConfig.getValue('latestVersionName').asString();
          fetchedMinVersionCode = remoteConfig.getValue('minVersionCode').asNumber();
          fetchedUpdateUrl = remoteConfig.getValue('updateUrl').asString();
          fetchedFromFirebase = true;
          console.log('[EMI Pro Debug] Successfully fetched from Firebase Remote Config:', {
            latestVersionCode: fetchedLatestVersionCode,
            latestVersionName: fetchedLatestVersionName,
            minVersionCode: fetchedMinVersionCode,
            updateUrl: fetchedUpdateUrl
          });
        }
      } catch (err) {
        console.warn('[EMI Pro Debug] Firebase Remote Config fetch failed, falling back to GitHub:', err);
      }

      // 3. Fallback to GitHub version.json if Firebase fails or is unconfigured
      if (!fetchedFromFirebase || !fetchedLatestVersionName || fetchedLatestVersionName === '1.2.9') {
        try {
          const response = await fetch('https://raw.githubusercontent.com/sohan-emiprocalculator/version/main/version.json');
          if (response.ok) {
            const data = await response.json();
            if (data) {
              fetchedLatestVersionCode = Number(data.latestVersionCode) || fetchedLatestVersionCode;
              fetchedLatestVersionName = data.latestVersionName || data.latestVersion || fetchedLatestVersionName;
              fetchedMinVersionCode = Number(data.minVersionCode) || fetchedMinVersionCode;
              fetchedUpdateUrl = data.updateUrl || fetchedUpdateUrl;
            }
          }
        } catch (gitErr) {
          console.warn('[EMI Pro Debug] GitHub version fallback also failed:', gitErr);
        }
      }

      // 4. Retrieve current application version info (dynamic from Capacitor if native)
      let currentVersionCode = 13;
      let currentVersionName = '1.2.9';
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
          const info = await window.Capacitor.Plugins.App.getInfo();
          currentVersionCode = parseInt(info.build) || 13;
          currentVersionName = info.version || '1.2.9';
        }
      } catch (e) {
        console.warn('[EMI Pro Debug] App.getInfo failed:', e);
      }

      const isNewer = (current, latest) => {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
          const curr = currentParts[i] || 0;
          const lat = latestParts[i] || 0;
          if (lat > curr) return true;
          if (curr > lat) return false;
        }
        return false;
      };

      // 5. Compare current app version with latest version info
      const isOutdated = currentVersionCode < fetchedLatestVersionCode || isNewer(currentVersionName, fetchedLatestVersionName);
      const isForced = currentVersionCode < fetchedMinVersionCode;

      if (isOutdated) {
        setLatestVersion(fetchedLatestVersionName);
        if (fetchedUpdateUrl) {
          setUpdateUrl(fetchedUpdateUrl);
        }
        setIsForceUpdate(isForced);
        setShowUpdateModal(true);
      }
    };

    // Defer update check until 2.5s after launch to avoid competing with startup rendering
    const updateTimer = setTimeout(() => {
      checkUpdate();
    }, 2500);
    return () => clearTimeout(updateTimer);
  }, []);

  const TAB_INDICES = {
    home: 0,
    calculators: 1,
    smart_banking: 2,
    sip_growth: 3,
    profile: 4,
  };

  const TAB_SCREEN_NAMES = {
    home: 'HOME',
    calculators: 'CALCULATORS',
    smart_banking: 'SMART_BANKING',
    sip_growth: 'SIP_CALC',
    profile: 'USER_PROFILE',
  };

  const PRIMARY_TAB_SCREENS = ['HOME', 'CALCULATORS', 'SMART_BANKING', 'SIP_CALC', 'USER_PROFILE'];

  const tabRefs = {
    home: React.useRef(null),
    calculators: React.useRef(null),
    smart_banking: React.useRef(null),
    sip_growth: React.useRef(null),
    profile: React.useRef(null),
  };

  const isTransitioningRef = React.useRef(false);
  const transitionCleanupTimerRef = React.useRef(null);
  const [activeTab, setActiveTab] = useState('home');
  const [activePanelTab, setActivePanelTab] = useState('home');
  const activeTabRef = React.useRef('home');

  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const syncTabPanelVisibility = React.useCallback((targetTab) => {
    Object.keys(tabRefs).forEach((k) => {
      const el = tabRefs[k]?.current;
      if (el) {
        if (k === targetTab) {
          el.style.visibility = 'visible';
          el.style.pointerEvents = 'auto';
          el.style.zIndex = '2';
          el.style.opacity = '1';
          el.style.transform = 'translate3d(0, 0, 0)';
          el.style.transition = 'none';
        } else {
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
          el.style.zIndex = '0';
          el.style.opacity = '0';
          el.style.transform = 'translate3d(0, 0, 0)';
          el.style.transition = 'none';
        }
      }
    });
  }, []);

  React.useEffect(() => {
    if (isTransitioningRef.current) return;
    if (currentScreen === 'HOME') {
      activeTabRef.current = 'home';
      setActiveTab('home');
      setActivePanelTab('home');
      syncTabPanelVisibility('home');
    } else if (currentScreen === 'CALCULATORS') {
      activeTabRef.current = 'calculators';
      setActiveTab('calculators');
      setActivePanelTab('calculators');
      syncTabPanelVisibility('calculators');
    } else if (currentScreen === 'SMART_BANKING') {
      activeTabRef.current = 'smart_banking';
      setActiveTab('smart_banking');
      setActivePanelTab('smart_banking');
      syncTabPanelVisibility('smart_banking');
    } else if (currentScreen === 'SIP_CALC') {
      if (navigationSource === 'bottom-nav') {
        activeTabRef.current = 'sip_growth';
        setActiveTab('sip_growth');
        setActivePanelTab('sip_growth');
        syncTabPanelVisibility('sip_growth');
      }
    } else if (currentScreen === 'USER_PROFILE') {
      activeTabRef.current = 'profile';
      setActiveTab('profile');
      setActivePanelTab('profile');
      syncTabPanelVisibility('profile');
    }
  }, [currentScreen, navigationSource, syncTabPanelVisibility]);

  const performTabTransition = useCallback((fromTab, toTab, direction) => {
    const fromEl = tabRefs[fromTab]?.current;
    const toEl = tabRefs[toTab]?.current;

    if (!fromEl || !toEl) {
      activeTabRef.current = toTab;
      setActiveTab(toTab);
      setActivePanelTab(toTab);
      setCurrentScreen(TAB_SCREEN_NAMES[toTab] || 'HOME');
      return;
    }

    if (transitionCleanupTimerRef.current) {
      clearTimeout(transitionCleanupTimerRef.current);
      transitionCleanupTimerRef.current = null;
    }

    isTransitioningRef.current = true;
    activeTabRef.current = toTab;
    setActiveTab(toTab);
    setCurrentScreen(TAB_SCREEN_NAMES[toTab] || 'HOME');

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Isolate the other 3 idle tabs completely
    Object.keys(tabRefs).forEach((tabKey) => {
      if (tabKey !== fromTab && tabKey !== toTab) {
        const idleEl = tabRefs[tabKey]?.current;
        if (idleEl) {
          idleEl.style.visibility = 'hidden';
          idleEl.style.pointerEvents = 'none';
          idleEl.style.zIndex = '0';
          idleEl.style.opacity = '0';
          idleEl.style.transform = 'translate3d(0, 0, 0)';
          idleEl.style.transition = 'none';
        }
      }
    });

    if (prefersReduced) {
      fromEl.style.visibility = 'hidden';
      fromEl.style.pointerEvents = 'none';
      fromEl.style.zIndex = '0';
      fromEl.style.opacity = '0';

      toEl.style.visibility = 'visible';
      toEl.style.pointerEvents = 'auto';
      toEl.style.zIndex = '2';
      toEl.style.opacity = '1';
      toEl.style.transform = 'translate3d(0, 0, 0)';
      toEl.style.transition = 'none';
      setActivePanelTab(toTab);
      isTransitioningRef.current = false;
      return;
    }

    // Step 1: Set initial layout states
    fromEl.style.transition = 'none';
    fromEl.style.transform = 'translate3d(0, 0, 0)';
    fromEl.style.opacity = '1';
    fromEl.style.visibility = 'visible';
    fromEl.style.pointerEvents = 'none';
    fromEl.style.zIndex = '1';

    toEl.style.transition = 'none';
    toEl.style.transform = direction > 0 ? 'translate3d(100%, 0, 0)' : 'translate3d(-100%, 0, 0)';
    toEl.style.opacity = '1';
    toEl.style.visibility = 'visible';
    toEl.style.pointerEvents = 'auto';
    toEl.style.zIndex = '2';

    // Step 2: Force layout flush to commit initial coordinates
    void toEl.offsetHeight;

    // Step 3: Run the 260ms Material decelerate curve
    requestAnimationFrame(() => {
      const motionCurve = 'transform 260ms cubic-bezier(0.2, 0.0, 0.0, 1.0), opacity 260ms cubic-bezier(0.2, 0.0, 0.0, 1.0)';

      toEl.style.transition = motionCurve;
      toEl.style.transform = 'translate3d(0, 0, 0)';
      toEl.style.opacity = '1';

      fromEl.style.transition = motionCurve;
      fromEl.style.transform = direction > 0 ? 'translate3d(-28%, 0, 0)' : 'translate3d(28%, 0, 0)';
      fromEl.style.opacity = '0.85';
    });

    // Step 4: Cleanup when animation ends
    const cleanup = () => {
      if (transitionCleanupTimerRef.current) {
        clearTimeout(transitionCleanupTimerRef.current);
        transitionCleanupTimerRef.current = null;
      }

      fromEl.style.transition = 'none';
      fromEl.style.transform = 'translate3d(0, 0, 0)';
      fromEl.style.opacity = '0';
      fromEl.style.visibility = 'hidden';
      fromEl.style.pointerEvents = 'none';
      fromEl.style.zIndex = '0';

      toEl.style.transition = 'none';
      toEl.style.transform = 'translate3d(0, 0, 0)';
      toEl.style.opacity = '1';
      toEl.style.visibility = 'visible';
      toEl.style.pointerEvents = 'auto';
      toEl.style.zIndex = '2';

      setActivePanelTab(toTab);
      isTransitioningRef.current = false;
    };

    transitionCleanupTimerRef.current = setTimeout(cleanup, 280);
  }, []);

  const handleSelectTab = useCallback((tab) => {
    setNavigationSource('bottom-nav');
    if (tab === activeTabRef.current) {
      if (tab === 'home') {
        window.dispatchEvent(new CustomEvent('scrollToTop', { detail: { tab } }));
      }
      return;
    }

    if (isTransitioningRef.current) {
      return;
    }

    const fromTab = activeTabRef.current;
    const fromIndex = TAB_INDICES[fromTab] ?? 0;
    const toIndex = TAB_INDICES[tab] ?? 0;
    const direction = toIndex > fromIndex ? 1 : -1;

    setCalculatorBackScreen('HOME');

    if (!PRIMARY_TAB_SCREENS.includes(currentScreen)) {
      // Switching from a tool sub-screen to a primary tab
      activeTabRef.current = tab;
      setActiveTab(tab);
      setActivePanelTab(tab);
      setCurrentScreen(TAB_SCREEN_NAMES[tab] || 'HOME');

      Object.keys(tabRefs).forEach((k) => {
        const el = tabRefs[k]?.current;
        if (el) {
          if (k === tab) {
            el.style.visibility = 'visible';
            el.style.pointerEvents = 'auto';
            el.style.zIndex = '2';
            el.style.opacity = '1';
            el.style.transform = 'translate3d(0, 0, 0)';
            el.style.transition = 'none';
          } else {
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
            el.style.zIndex = '0';
            el.style.opacity = '0';
            el.style.transform = 'translate3d(0, 0, 0)';
            el.style.transition = 'none';
          }
        }
      });
      return;
    }

    performTabTransition(fromTab, tab, direction);
  }, [currentScreen, performTabTransition]);

  const [safeBottom, setSafeBottom] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const navAttr = document.documentElement.getAttribute('data-nav-bottom');
    if (navAttr) return parseInt(navAttr, 10) || 0;
    const computed = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom');
    return parseInt(computed, 10) || 0;
  });

  React.useEffect(() => {
    const handleInsetsChange = (e) => {
      if (e?.detail?.bottom !== undefined) {
        setSafeBottom(e.detail.bottom);
      } else {
        const computed = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom');
        setSafeBottom(parseInt(computed, 10) || 0);
      }
    };

    window.addEventListener('safeInsetsChange', handleInsetsChange);
    window.addEventListener('resize', handleInsetsChange);

    const navAttr = document.documentElement.getAttribute('data-nav-bottom');
    if (navAttr) {
      setSafeBottom(parseInt(navAttr, 10) || 0);
    }

    return () => {
      window.removeEventListener('safeInsetsChange', handleInsetsChange);
      window.removeEventListener('resize', handleInsetsChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          if (window.AndroidThemeBridge && window.AndroidThemeBridge.notifyHomeReady) {
            window.AndroidThemeBridge.notifyHomeReady();
          }
          SplashScreen.hide({ fadeOutDuration: 280 }).catch(() => {});
        }
      });
    });

    // Safety fallback so splash screen can never get stuck under unexpected conditions
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        if (window.AndroidThemeBridge && window.AndroidThemeBridge.notifyHomeReady) {
          window.AndroidThemeBridge.notifyHomeReady();
        }
        SplashScreen.hide({ fadeOutDuration: 280 }).catch(() => {});
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
    };
  }, []);
  const [calculatorData, setCalculatorData] = useState(null);
  const [comparisonLoans, setComparisonLoans] = useState([]);
  const [detailsBackScreen, setDetailsBackScreen] = useState('RESULTS');
  const [quickCalculatorData, setQuickCalculatorData] = useState(null);
  const [loanProfiles, setLoanProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem('emi_loan_profiles');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedProfileLoan, setSelectedProfileLoan] = useState(null);
  const [advanceEMIData, setAdvanceEMIData] = useState(null);
  const [comingSoonTitle, setComingSoonTitle] = useState('');
  const [profileDetailsSource, setProfileDetailsSource] = useState('LOAN_PROFILE');
  const [loanProfileSource, setLoanProfileSource] = useState('HOME');
  const [loanToEdit, setLoanToEdit] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', title: 'Welcome to EMI Pro!', message: 'Start tracking your loans by creating a profile.', time: 'Just now', isRead: false },
    { id: 2, type: 'success', title: 'System Updated', message: 'New scientific calculator functions added.', time: '1 hour ago', isRead: true },
  ]);
  // Persist loan profiles to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('emi_loan_profiles', JSON.stringify(loanProfiles));
    } catch (e) {
      console.warn('Storage failed', e);
    }
  }, [loanProfiles]);

  const triggerGlobalBack = () => {
    switch (currentScreen) {
      case 'HOME':
        // Minimize the app if on native Capacitor
        import('@capacitor/app').then(({ App }) => {
          App.minimizeApp().catch(e => console.log('[EMI Pro Debug] App minimization not supported on web'));
        }).catch(e => console.log('[EMI Pro Debug] @capacitor/app not loaded'));
        break;
      case 'INPUT':
      case 'COMPARE_INPUT':
      case 'QUICK_CALCULATOR':
      case 'LOAN_AFFORDABILITY':
      case 'LOAN_ELIGIBILITY':
      case 'MORATORIUM':
      case 'ADVANCE_EMI':
      case 'PREPAYMENT_ROI':
      case 'STANDARD_CALC':
      case 'SCIENTIFIC_CALC':
      case 'LAND_PURCHASE':
      case 'LOAN_REFINANCE':
      case 'CHIT_CALCULATOR':
      case 'FD_CALC':
      case 'RD_CALC':
      case 'PPF_CALC':
      case 'INTEREST_CALC':
      case 'UNIT_CONVERTER':
      case 'LOAN_SPLIT':
      case 'RENT_VS_BUY':
      case 'CARD_TRAP':
      case 'WEALTH_PLANNER':
      case 'TAX_SALARY':
      case 'RETIREMENT':
      case 'SMART_ROI':
      case 'SMART_PREPAY':
      case 'SMART_PREPAY_TIPS':
      case 'INFLATION_INSIGHTS':
      case 'SIP_TIPS':
        handleCalculatorBack();
        break;
      case 'SIP_CALC':
        if (navigationSource === 'bottom-nav') {
          handleSelectTab('home');
        } else {
          handleCalculatorBack();
        }
        break;
      case 'RESULTS':
        setCurrentScreen('INPUT');
        break;
      case 'DETAILS':
        setCurrentScreen(detailsBackScreen);
        break;
      case 'COMPARE_RESULTS':
      case 'COMPARE_LIST':
        setCurrentScreen('COMPARE_INPUT');
        break;
      case 'QUICK_CALCULATOR_DETAILS':
        setCurrentScreen('QUICK_CALCULATOR');
        break;
      case 'LOAN_PROFILE':
        handleSafeBack(() => {
          setNavigationSource('bottom-nav');
          if (loanProfileSource === 'USER_PROFILE') {
            setCurrentScreen('USER_PROFILE');
            setActiveTab('profile');
            setActivePanelTab('profile');
            syncTabPanelVisibility('profile');
          } else {
            setCurrentScreen('HOME');
            setActiveTab('home');
            setActivePanelTab('home');
            syncTabPanelVisibility('home');
          }
        });
        break;
      case 'ADD_LOAN_PROFILE':
        handleSafeBack(() => {
          setLoanToEdit(null);
          if (profileDetailsSource === 'USER_PROFILE') {
            setNavigationSource('bottom-nav');
            setCurrentScreen('USER_PROFILE');
            setActiveTab('profile');
            setActivePanelTab('profile');
            syncTabPanelVisibility('profile');
          } else {
            setCurrentScreen('LOAN_PROFILE');
          }
        });
        break;
      case 'LOAN_PROFILE_DETAILS':
        handleSafeBack(() => {
          if (profileDetailsSource === 'USER_PROFILE') {
            setNavigationSource('bottom-nav');
            setCurrentScreen('USER_PROFILE');
            setActiveTab('profile');
            setActivePanelTab('profile');
            syncTabPanelVisibility('profile');
          } else if (profileDetailsSource === 'HOME') {
            setNavigationSource('bottom-nav');
            setCurrentScreen('HOME');
            setActiveTab('home');
            setActivePanelTab('home');
            syncTabPanelVisibility('home');
          } else {
            setCurrentScreen(profileDetailsSource);
          }
        });
        break;
      case 'LOAN_PROFILE_SCHEDULE':
        handleSafeBack(() => {
          setCurrentScreen('LOAN_PROFILE_DETAILS');
        });
        break;
      case 'NOTIFICATIONS':
        handleSafeBack(() => {
          setNavigationSource('bottom-nav');
          setCurrentScreen('HOME');
          setActiveTab('home');
          setActivePanelTab('home');
          syncTabPanelVisibility('home');
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        });
        break;
      case 'DASHBOARD_CUSTOMIZER':
      case 'COMING_SOON':
        handleSafeBack(() => {
          setNavigationSource('bottom-nav');
          setCurrentScreen('HOME');
          setActiveTab('home');
          setActivePanelTab('home');
          syncTabPanelVisibility('home');
        });
        break;
      case 'USER_PROFILE':
      case 'CALCULATORS':
      case 'SMART_BANKING':
        handleSelectTab('home');
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    triggerGlobalBackRef.current = triggerGlobalBack;
  });

  // Native Android back button/gesture setup using @capacitor/app
  React.useEffect(() => {
    let activeListener;
    const setupBackListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        activeListener = await App.addListener('backButton', () => {
          console.log('[EMI Pro Debug] Native back button/gesture triggered.');
          handleSafeBack();
        });
      } catch (e) {
        console.warn('[EMI Pro Debug] @capacitor/app plugin failed to load:', e);
      }
    };
    setupBackListener();
    return () => {
      if (activeListener) {
        activeListener.remove();
      }
    };
  }, [handleSafeBack]);

  // Web touch gesture (Swipe from left edge to go back) support
  React.useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    
    const handleTouchEnd = (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Rules: Must start near left edge (< 30px), drag significantly right (> 80px), low vertical drift (< 40px)
        if (touchStartX < 30 && deltaX > 80 && Math.abs(deltaY) < 40) {
          console.log('[EMI Pro Debug] Swipe-from-left back gesture detected.');
          handleSafeBack();
        }
      }
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const notifiedRefs = React.useRef(new Set());

  // Request native local notifications permissions on mount
  React.useEffect(() => {
    const initNotifications = async () => {
      try {
        const isSupported = await LocalNotifications.checkPermissions();
        if (isSupported.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          console.log('[EMI Pro Debug] Local Notification permission requested:', req.display);
        } else {
          console.log('[EMI Pro Debug] Local Notification permission already granted.');
        }
      } catch (e) {
        console.warn('[EMI Pro Debug] LocalNotifications plugin not supported or failed on platform:', e);
        // Fallback for Web Notifications in browser if supported and not denied
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          try {
            await Notification.requestPermission();
          } catch (webErr) {
            console.warn('Web notification request failed:', webErr);
          }
        }
      }
    };
    initNotifications();
  }, []);

  const triggerNativeSystemNotification = async (title, body, loanId) => {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Number(loanId) || Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 1000) }, // Trigger in 1 second
              sound: null,
              attachments: null,
              actionTypeId: "",
              extra: { loanId }
            }
          ]
        });
        console.log('[EMI Pro Debug] Native LocalNotification successfully scheduled:', title);
      } else {
        console.warn('[EMI Pro Debug] LocalNotification permission not granted, falling back to Web Notification.');
        triggerWebNotification(title, body);
      }
    } catch (e) {
      console.warn('[EMI Pro Debug] LocalNotification failed, falling back to Web Notification:', e);
      triggerWebNotification(title, body);
    }
  };

  const triggerWebNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: body });
    }
  };
  const prevScreenRef = React.useRef(currentScreen);

  React.useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = currentScreen;

    const cleanEntryScreens = [
      'INPUT', 
      'COMPARE_INPUT', 
      'SIP_CALC', 
      'ADVANCE_EMI', 
      'FD_CALC', 
      'PPF_CALC', 
      'INTEREST_CALC', 
      'SMART_PREPAY', 
      'INFLATION_INSIGHTS',
      'QUICK_CALCULATOR',
      'LOAN_AFFORDABILITY',
      'LOAN_ELIGIBILITY',
      'MORATORIUM',
      'PREPAYMENT_ROI',
      'STANDARD_CALC',
      'SCIENTIFIC_CALC',
      'LAND_PURCHASE',
      'LOAN_SPLIT',
      'RENT_VS_BUY',
      'CARD_TRAP',
      'WEALTH_PLANNER',
      'TAX_SALARY',
      'RETIREMENT',
      'SMART_ROI',
      'COMMERCIAL_LOAN'
    ];

    if (cleanEntryScreens.includes(currentScreen)) {
      // Do NOT reset if navigating back from results/details to input to edit
      const isBackFromResults = (prev === 'RESULTS' && currentScreen === 'INPUT') || 
                               (prev === 'COMPARE_RESULTS' && currentScreen === 'COMPARE_INPUT') ||
                               (prev === 'ADVANCE_EMI_DETAILS' && currentScreen === 'ADVANCE_EMI') ||
                               (prev === 'QUICK_CALCULATOR_DETAILS' && currentScreen === 'QUICK_CALCULATOR');

      if (!isBackFromResults) {
        setCalculatorData(null);
        setComparisonLoans([]);
        setAdvanceEMIData(null);
        setQuickCalculatorData(null);
        console.log('[EMI Pro Debug] Screen navigated to clean entry screen:', currentScreen, '- Resetting calculator states.');
      }
    }
  }, [currentScreen]);

  const handleDeleteLoan = async (loanId) => {
    const loan = loanProfiles.find(l => l.id === loanId);
    if (loan) {
      await cancelScheduledNotificationsForLoan(loan);
    }
    setLoanProfiles(prev => prev.filter(l => l.id !== loanId));
  };

  const handleUpdatePrepayments = async (loanId, updatedPrepayments) => {
    const targetLoan = loanProfiles.find(l => l.id === loanId);
    if (!targetLoan) return;

    let updatedLoan = { ...targetLoan, prepayments: updatedPrepayments };

    // Update notifications if active
    if (targetLoan.notification) {
      await cancelScheduledNotificationsForLoan(targetLoan);
      const scheduledIds = await scheduleNotificationsForLoan(updatedLoan);
      updatedLoan.scheduledNotificationIds = scheduledIds;
    }

    setLoanProfiles(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    if (loanToEdit && loanToEdit.id === loanId) {
      setLoanToEdit(updatedLoan);
    }
    if (selectedProfileLoan && selectedProfileLoan.id === loanId) {
      setSelectedProfileLoan(updatedLoan);
    }

    try {
      const raw = localStorage.getItem('emi_loan_profiles');
      if (raw) {
        const list = JSON.parse(raw);
        const updatedList = list.map(l => l.id === loanId ? { ...l, prepayments: updatedPrepayments } : l);
        localStorage.setItem('emi_loan_profiles', JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error('Error saving updated loan profiles to localStorage:', e);
    }
  };

  const handleDeletePrepayment = handleUpdatePrepayments;

  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);
  const [urgentEMI, setUrgentEMI] = useState(null);

  // Check for upcoming EMIs on load
  React.useEffect(() => {
    const checkUpcomingEMIs = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('[EMI Pro Debug] Starting upcoming EMI checks. Today is:', today);

      const urgent = loanProfiles.find(loan => {
        if (!loan.firstEmiDate) return false;
        if (loan.notification === false) return false;

        const firstEmiDate = parseLocalDate(loan.firstEmiDate);
        if (!firstEmiDate || isNaN(firstEmiDate.getTime())) {
          console.warn('[EMI Pro Debug] Invalid firstEmiDate for loan:', loan.name, loan.firstEmiDate);
          return false;
        }

        const tenure = parseInt(loan.tenure) || 12;
        let nextDueDate = null;

        for (let i = 0; i < tenure; i++) {
          const dueDate = addMonths(firstEmiDate, i);
          if (dueDate >= today) {
            nextDueDate = dueDate;
            break;
          }
        }

        if (!nextDueDate) {
          console.log('[EMI Pro Debug] Loan fully completed or expired:', loan.name);
          return false;
        }

        const diffTime = nextDueDate - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const duration = loan.notificationDuration || '1 Day Before';
        let targetDays = 1;
        if (duration === '1 Day Before') {
          targetDays = 1;
        } else if (duration === '2 Days Before') {
          targetDays = 2;
        } else if (duration === '3 Days Before') {
          targetDays = 3;
        } else if (duration === '1 Week Before') {
          targetDays = 7;
        }

        console.log(`[EMI Pro Debug] Loan Name: "${loan.name}"`);
        console.log(`[EMI Pro Debug] -> Parsed Start Date:`, firstEmiDate.toDateString());
        console.log(`[EMI Pro Debug] -> Upcoming Monthly Due Date:`, nextDueDate.toDateString());
        console.log(`[EMI Pro Debug] -> Selected Duration Alert Offset: "${duration}" (Target: ${targetDays} day(s))`);
        console.log(`[EMI Pro Debug] -> Actual Calculated Day Difference: ${diffDays} day(s)`);
        console.log(`[EMI Pro Debug] -> Will Alert Trigger? ${diffDays === targetDays ? 'YES' : 'NO'}`);

        return diffDays === targetDays;
      });

      if (urgent) {
        // Resolve target next due date for alert popup display
        const firstEmiDate = parseLocalDate(urgent.firstEmiDate);
        const tenure = parseInt(urgent.tenure) || 12;
        let nextDueDate = null;
        for (let i = 0; i < tenure; i++) {
          const dueDate = addMonths(firstEmiDate, i);
          if (dueDate >= today) {
            nextDueDate = dueDate;
            break;
          }
        }
        
        const nextDueDateStr = nextDueDate ? nextDueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : urgent.firstEmiDate;
        const urgentWithNextDate = { ...urgent, firstEmiDate: nextDueDateStr };

        setUrgentEMI(urgentWithNextDate);
        setShowWelcomeAlert(true);

        // Trigger native OS heads-up system notification at the top of the mobile screen
        if (!notifiedRefs.current.has(urgent.id)) {
          notifiedRefs.current.add(urgent.id);
          triggerNativeSystemNotification(
            'EMI Due Date Coming!',
            `Your EMI for ${urgent.name} is due on ${nextDueDateStr}.`,
            urgent.id
          );
        }

        // Add to in-app notifications if not already there
        setNotifications(prev => {
          const exists = prev.find(n => n.id === `emi-${urgent.id}`);
          if (exists) return prev;
          return [{
            id: `emi-${urgent.id}`,
            loanId: urgent.id,
            type: 'alert',
            title: 'EMI Due Date Coming!',
            message: `Your EMI for ${urgent.name} is due soon.`,
            time: 'Today',
            isRead: false,
            action: 'View Details'
          }, ...prev];
        });
      }
    };

    checkUpcomingEMIs();
  }, [loanProfiles]);

  const handleCalculate = (data) => {
    setCalculatorData(data);
    setCurrentScreen('RESULTS');
  };

  const isPrimaryTab = PRIMARY_TAB_SCREENS.includes(currentScreen) && (currentScreen !== 'SIP_CALC' || navigationSource === 'bottom-nav');

  const getTabPanelInitialStyle = (tabId) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: 'translate3d(0, 0, 0)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    willChange: 'transform',
    contain: 'layout paint',
    backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
    visibility: activePanelTab === tabId ? 'visible' : 'hidden',
    pointerEvents: activePanelTab === tabId ? 'auto' : 'none',
    zIndex: activePanelTab === tabId ? 2 : 0,
    opacity: activePanelTab === tabId ? 1 : 0,
  });

  const renderToolScreen = () => {
    switch (currentScreen) {
      case 'HOME':
        return null;
      case 'INPUT':
        return (
          <motion.div
            key="input"
            {...toolScreenMotionProps}
          >
            <InputScreen 
              onBack={() => handleSafeBack(handleCalculatorBack)} 
              onCalculate={handleCalculate}
              initialData={calculatorData}
            />
          </motion.div>
        );
      case 'RESULTS':
        return (
          <motion.div
            key="results"
            {...toolScreenMotionProps}
          >
            <ResultsScreen 
              data={calculatorData} 
              onBack={() => setCurrentScreen('INPUT')} 
              onDetails={() => {
                setDetailsBackScreen('RESULTS');
                setCurrentScreen('DETAILS');
              }}
            />
          </motion.div>
        );
      case 'DETAILS':
        return (
          <motion.div
            key="details"
            {...toolScreenMotionProps}
          >
            <DetailsScreen 
              data={calculatorData} 
              onBack={() => setCurrentScreen(detailsBackScreen)} 
            />
          </motion.div>
        );
      case 'COMPARE_INPUT':
        return (
          <motion.div
            key="compare_input"
            {...toolScreenMotionProps}
          >
            <CompareLoansInput 
              onBack={handleCalculatorBack}
              onCompare={(results) => {
                setComparisonLoans(results);
                setCurrentScreen('COMPARE_LIST');
              }}
              onDetails={(loan) => {
                setCalculatorData({ ...loan, isMonths: true, processingFee: 0 });
                setDetailsBackScreen('COMPARE_INPUT');
                setCurrentScreen('DETAILS');
              }}
            />
          </motion.div>
        );
      case 'COMPARE_RESULTS':
        return (
          <motion.div
            key="compare_results"
            {...toolScreenMotionProps}
          >
            <CompareResults 
              loans={comparisonLoans}
              onBack={() => setCurrentScreen('COMPARE_INPUT')}
              onCompareMore={() => setCurrentScreen('COMPARE_LIST')}
            />
          </motion.div>
        );
      case 'COMPARE_LIST':
        return (
          <motion.div
            key="compare_list"
            {...toolScreenMotionProps}
          >
            <CompareLoansList 
              initialLoans={comparisonLoans}
              onBack={() => setCurrentScreen('COMPARE_INPUT')}
              onDetails={(loan) => {
                setCalculatorData({ ...loan, isMonths: true, processingFee: 0 });
                setDetailsBackScreen('COMPARE_LIST');
                setCurrentScreen('DETAILS');
              }}
            />
          </motion.div>
        );
      case 'QUICK_CALCULATOR':
        return (
          <motion.div
            key="quick_calculator"
            {...toolScreenMotionProps}
          >
            <QuickCalculator 
              onBack={handleCalculatorBack}
              onDetails={(data) => {
                setQuickCalculatorData(data);
                setCurrentScreen('QUICK_CALCULATOR_DETAILS');
              }}
            />
          </motion.div>
        );
      case 'QUICK_CALCULATOR_DETAILS':
        return (
          <motion.div
            key="quick_calculator_details"
            {...toolScreenMotionProps}
          >
            <QuickCalculatorDetails 
              data={quickCalculatorData}
              onBack={() => setCurrentScreen('QUICK_CALCULATOR')}
            />
          </motion.div>
        );
      case 'LOAN_AFFORDABILITY':
        return (
          <motion.div
            key="loan_affordability"
            {...toolScreenMotionProps}
          >
            <LoanAffordability onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LOAN_ELIGIBILITY':
        return (
          <motion.div
            key="loan_eligibility"
            {...toolScreenMotionProps}
          >
            <LoanEligibility onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LOAN_PROFILE':
        return (
          <motion.div
            key="loan_profile"
            {...toolScreenMotionProps}
          >
            <LoanProfile 
              loans={loanProfiles}
              onBack={() => {
                handleSafeBack(() => {
                  setNavigationSource('bottom-nav');
                  if (loanProfileSource === 'USER_PROFILE') {
                    setCurrentScreen('USER_PROFILE');
                    setActiveTab('profile');
                    setActivePanelTab('profile');
                    syncTabPanelVisibility('profile');
                  } else {
                    setCurrentScreen('HOME');
                    setActiveTab('home');
                    setActivePanelTab('home');
                    syncTabPanelVisibility('home');
                  }
                });
              }}
              onAdd={() => {
                setProfileDetailsSource('LOAN_PROFILE');
                setCurrentScreen('ADD_LOAN_PROFILE');
              }}
              onViewDetails={(loan) => {
                setSelectedProfileLoan(loan);
                setProfileDetailsSource('LOAN_PROFILE');
                setCurrentScreen('LOAN_PROFILE_DETAILS');
              }}
              onEdit={(loan) => {
                setLoanToEdit(loan);
                setProfileDetailsSource('LOAN_PROFILE');
                setCurrentScreen('ADD_LOAN_PROFILE');
              }}
              onDelete={handleDeleteLoan}
              onUpdatePrepayments={handleUpdatePrepayments}
            />
          </motion.div>
        );
      case 'ADD_LOAN_PROFILE':
        return (
          <motion.div
            key="add_loan_profile"
            {...toolScreenMotionProps}
          >
            <AddLoanProfile 
              onBack={() => {
                handleSafeBack(() => {
                  setLoanToEdit(null);
                  if (profileDetailsSource === 'USER_PROFILE') {
                    setNavigationSource('bottom-nav');
                    setCurrentScreen('USER_PROFILE');
                    setActiveTab('profile');
                    setActivePanelTab('profile');
                    syncTabPanelVisibility('profile');
                  } else {
                    setCurrentScreen('LOAN_PROFILE');
                  }
                });
              }}
              onSave={async (loanData) => {
                let finalLoanData = { ...loanData };
                
                // If editing, first cancel any old notifications scheduled for this specific loan
                if (loanToEdit) {
                  await cancelScheduledNotificationsForLoan(loanToEdit);
                }

                // If notification is enabled, schedule new ones
                if (finalLoanData.notification) {
                  const scheduledIds = await scheduleNotificationsForLoan(finalLoanData);
                  finalLoanData.scheduledNotificationIds = scheduledIds;
                } else {
                  finalLoanData.scheduledNotificationIds = [];
                }

                if (loanToEdit) {
                  setLoanProfiles(prev => prev.map(l => l.id === loanToEdit.id ? { ...finalLoanData, id: l.id } : l));
                } else {
                  setLoanProfiles(prev => [...prev, finalLoanData]);
                }
                setLoanToEdit(null);
                handleSafeBack(() => {
                  if (profileDetailsSource === 'USER_PROFILE') {
                    setNavigationSource('bottom-nav');
                    setCurrentScreen('USER_PROFILE');
                    setActiveTab('profile');
                    setActivePanelTab('profile');
                    syncTabPanelVisibility('profile');
                  } else {
                    setCurrentScreen('LOAN_PROFILE');
                  }
                });
              }}
              onUpdatePrepayments={handleUpdatePrepayments}
              onDeletePrepayment={handleDeletePrepayment}
              initialData={loanToEdit}
            />
          </motion.div>
        );
      case 'LOAN_PROFILE_DETAILS':
        return (
          <motion.div
            key="loan_profile_details"
            {...toolScreenMotionProps}
          >
            <LoanProfileDetails 
              loan={loanProfiles.find(l => l.id === selectedProfileLoan?.id) || selectedProfileLoan}
              onBack={() => {
                handleSafeBack(() => {
                  if (profileDetailsSource === 'USER_PROFILE') {
                    setNavigationSource('bottom-nav');
                    setCurrentScreen('USER_PROFILE');
                    setActiveTab('profile');
                    setActivePanelTab('profile');
                    syncTabPanelVisibility('profile');
                  } else if (profileDetailsSource === 'HOME') {
                    setNavigationSource('bottom-nav');
                    setCurrentScreen('HOME');
                    setActiveTab('home');
                    setActivePanelTab('home');
                    syncTabPanelVisibility('home');
                  } else {
                    setCurrentScreen(profileDetailsSource);
                  }
                });
              }}
              onViewSchedule={() => setCurrentScreen('LOAN_PROFILE_SCHEDULE')}
            />
          </motion.div>
        );
      case 'LOAN_PROFILE_SCHEDULE':
        return (
          <motion.div
            key="loan_profile_schedule"
            {...toolScreenMotionProps}
          >
            <LoanProfileSchedule 
              loan={loanProfiles.find(l => l.id === selectedProfileLoan?.id) || selectedProfileLoan}
              onBack={() => {
                handleSafeBack(() => {
                  setCurrentScreen('LOAN_PROFILE_DETAILS');
                });
              }}
            />
          </motion.div>
        );
      case 'MORATORIUM':
        return (
          <motion.div
            key="moratorium"
            {...toolScreenMotionProps}
          >
            <MoratoriumCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'ADVANCE_EMI':
        return (
          <motion.div
            key="advance_emi"
            {...toolScreenMotionProps}
          >
            <AdvanceEMICalculator 
              onBack={handleCalculatorBack} 
              onDetails={(data) => {
                setAdvanceEMIData(data);
                setCurrentScreen('ADVANCE_EMI_DETAILS');
              }}
            />
          </motion.div>
        );
      case 'ADVANCE_EMI_DETAILS':
        return (
          <motion.div
            key="advance_emi_details"
            {...toolScreenMotionProps}
          >
            {advanceEMIData ? (
              <AdvanceEMIDetails 
                data={advanceEMIData} 
                onBack={() => setCurrentScreen('ADVANCE_EMI')} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center">
                <div className="space-y-4">
                  <p className="text-gray-500 font-bold">No calculation data found.</p>
                  <button onClick={() => setCurrentScreen('ADVANCE_EMI')} className="btn-primary w-full">Back to Calculator</button>
                </div>
              </div>
            )}
          </motion.div>
        );
      case 'PREPAYMENT_ROI':
        return (
          <motion.div
            key="prepayment_roi"
            {...toolScreenMotionProps}
          >
            <PrePaymentROI onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'STANDARD_CALC':
        return (
          <motion.div
            key="standard_calc"
            {...toolScreenMotionProps}
          >
            <StandardCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SCIENTIFIC_CALC':
        return (
          <motion.div
            key="scientific_calc"
            {...toolScreenMotionProps}
          >
            <ScientificCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LAND_PURCHASE':
        return (
          <motion.div
            key="land_purchase"
            {...toolScreenMotionProps}
          >
            <LandPurchaseCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LOAN_REFINANCE':
        return (
          <motion.div
            key="loan_refinance"
            {...toolScreenMotionProps}
          >
            <LoanRefinance onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'CHIT_CALCULATOR':
        return (
          <motion.div
            key="chit_calculator"
            {...toolScreenMotionProps}
          >
            <ChitCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'FD_CALC':
        return (
          <motion.div
            key="fd_calc"
            {...toolScreenMotionProps}
          >
            <FDCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LOAN_SPLIT':
        return (
          <motion.div
            key="loan_split"
            {...toolScreenMotionProps}
          >
            <LoanSplitCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'RENT_VS_BUY':
        return (
          <motion.div
            key="rent_vs_buy"
            {...toolScreenMotionProps}
          >
            <RentVsBuyCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'CARD_TRAP':
        return (
          <motion.div
            key="card_trap"
            {...toolScreenMotionProps}
          >
            <CardTrapCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'WEALTH_PLANNER':
        return (
          <motion.div
            key="wealth_planner"
            {...toolScreenMotionProps}
          >
            <WealthPlannerCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'TAX_SALARY':
        return (
          <motion.div
            key="tax_salary"
            {...toolScreenMotionProps}
          >
            <TaxSalaryCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'RETIREMENT':
        return (
          <motion.div
            key="retirement"
            {...toolScreenMotionProps}
          >
            <RetirementCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SMART_ROI':
        return (
          <motion.div
            key="smart_roi"
            {...toolScreenMotionProps}
          >
            <SmartROICalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SMART_BANKING':
        return null;
      case 'UNIT_CONVERTER':
        return (
          <motion.div
            key="unit_converter"
            {...toolScreenMotionProps}
          >
            <UnitConverter onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'RD_CALC':
        return (
          <motion.div
            key="rd_calc"
            {...toolScreenMotionProps}
          >
            <RDCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'PPF_CALC':
        return (
          <motion.div
            key="ppf_calc"
            {...toolScreenMotionProps}
          >
            <PPFCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'INTEREST_CALC':
        return (
          <motion.div
            key="interest_calc"
            {...toolScreenMotionProps}
          >
            <InterestCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'CALCULATORS':
        return null;
      case 'NOTIFICATIONS':
        return (
          <motion.div
            key="notifications"
            {...toolScreenMotionProps}
          >
            <NotificationCenter 
              notifications={notifications}
              onBack={() => {
                handleSafeBack(() => {
                  setNavigationSource('bottom-nav');
                  setCurrentScreen('HOME');
                  setActiveTab('home');
                  setActivePanelTab('home');
                  syncTabPanelVisibility('home');
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                });
              }}
              onClear={() => setNotifications([])}
              onActionClick={(notif) => {
                if (notif.loanId) {
                  const targetLoan = loanProfiles.find(l => l.id === notif.loanId);
                  if (targetLoan) {
                    setSelectedProfileLoan(targetLoan);
                    setProfileDetailsSource('NOTIFICATIONS');
                    setCurrentScreen('LOAN_PROFILE_DETAILS');
                  }
                }
              }}
            />
          </motion.div>
        );
      case 'USER_PROFILE':
        return null;

      case 'DASHBOARD_CUSTOMIZER':
        return (
          <motion.div
            key="dashboard_customizer"
            {...toolScreenMotionProps}
          >
            <DashboardCustomizer
              onBack={() => {
                handleSafeBack(() => {
                  setNavigationSource('bottom-nav');
                  setCurrentScreen('HOME');
                  setActiveTab('home');
                  setActivePanelTab('home');
                  syncTabPanelVisibility('home');
                });
              }}
            />
          </motion.div>
        );

      case 'SMART_PREPAY':
        return (
          <motion.div
            key="smart_prepay"
            {...toolScreenMotionProps}
          >
            <SmartPrepayCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SMART_PREPAY_TIPS':
        return (
          <motion.div
            key="smart_prepay_tips"
            {...toolScreenMotionProps}
          >
            <SmartPrepayTips 
              onBack={handleCalculatorBack} 
              onCalculate={() => {
                setCurrentScreen('SMART_PREPAY');
              }}
            />
          </motion.div>
        );
      case 'INFLATION_INSIGHTS':
        return (
          <motion.div
            key="inflation_insights"
            {...toolScreenMotionProps}
          >
            <InflationInsights onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SIP_CALC':
        return (
          <motion.div
            key="sip_calc"
            {...toolScreenMotionProps}
          >
            <SIPCalculator onBack={() => handleSafeBack(handleCalculatorBack)} hasBottomNav={false} />
          </motion.div>
        );
      case 'SIP_TIPS':
        return (
          <motion.div
            key="sip_tips"
            {...toolScreenMotionProps}
          >
            <SIPTips 
              onBack={handleCalculatorBack} 
              onCalculate={() => {
                setCurrentScreen('SIP_CALC');
              }}
            />
          </motion.div>
        );
      case 'COMING_SOON':
        return (
          <motion.div
            key="coming_soon"
            {...toolScreenMotionProps}
          >
            <ComingSoon onBack={() => {
                handleSafeBack(() => {
                  setNavigationSource('bottom-nav');
                  setCurrentScreen('HOME');
                  setActiveTab('home');
                  setActivePanelTab('home');
                  syncTabPanelVisibility('home');
                });
              }} title={comingSoonTitle} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-[100svh] h-[100svh] flex items-center justify-center p-0 sm:p-4"
      style={{
        minHeight: '100svh',
        height: '100svh',
        backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC'
      }}
    >
      <div 
        className="w-full h-full sm:h-[844px] sm:max-w-md sm:rounded-[3rem] sm:border-[8px] sm:border-gray-900 dark:sm:border-gray-800 shadow-2xl relative flex flex-col overflow-hidden"
        style={{
          minHeight: '100svh',
          backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC'
        }}
      >
        
        {/* Notch for desktop view */}
        <div className="hidden sm:flex h-6 justify-center items-end pb-1 bg-white dark:bg-gray-900 transition-colors duration-300">
          <div className="w-20 h-4 bg-gray-900 rounded-b-xl"></div>
        </div>

        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Global Mesh Gradient Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 overflow-hidden z-0">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-400 blur-[100px] rounded-full" />
          </div>

          <div 
            className="flex-1 relative z-10 flex flex-col overflow-hidden"
            style={{
              backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC'
            }}
          >
            <div className="flex-1 relative flex flex-col overflow-hidden">
              {/* Primary 5-Tab Shell: GPU-Accelerated Directional Slide Viewport */}
              <div
                className="flex-1 flex flex-col overflow-hidden"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  visibility: 'visible',
                  pointerEvents: isPrimaryTab ? 'auto' : 'none',
                  zIndex: 1,
                }}
              >
                <div
                  key="tab-home"
                  ref={tabRefs.home}
                  id="tab-panel-home"
                  style={getTabPanelInitialStyle('home')}
                >
                  <HomeScreen 
                    onNavigate={(screen, title) => {
                      if (screen === 'COMING_SOON' && title) setComingSoonTitle(title);
                      if (screen === 'LOAN_PROFILE') setLoanProfileSource('HOME');
                      setCalculatorBackScreen('HOME');
                      setNavigationSource('subpage');
                      setCurrentScreen(screen);
                    }} 
                    onNotifications={() => {
                      setCalculatorBackScreen('HOME');
                      setNavigationSource('subpage');
                      setCurrentScreen('NOTIFICATIONS');
                    }}
                    onInstall={() => setShowInstallModal(true)}
                    notificationCount={notifications.filter(n => !n.isRead).length}
                  />
                </div>

                <div
                  key="tab-calculators"
                  ref={tabRefs.calculators}
                  id="tab-panel-calculators"
                  style={getTabPanelInitialStyle('calculators')}
                >
                  <CalculatorsScreen 
                    onBack={() => {
                      handleSelectTab('home');
                    }} 
                    onNavigate={(route, title) => {
                      if (route === 'COMING_SOON' && title) setComingSoonTitle(title);
                      setCalculatorBackScreen('CALCULATORS');
                      setNavigationSource('subpage');
                      setCurrentScreen(route);
                    }}
                  />
                </div>

                <div
                  key="tab-smart-banking"
                  ref={tabRefs.smart_banking}
                  id="tab-panel-smart_banking"
                  style={getTabPanelInitialStyle('smart_banking')}
                >
                  <SmartBankingScreen 
                    onBack={() => {
                      handleSelectTab('home');
                    }} 
                    onNavigate={(route) => {
                      setCalculatorBackScreen('SMART_BANKING');
                      setNavigationSource('subpage');
                      setCurrentScreen(route);
                    }}
                  />
                </div>

                <div
                  key="tab-sip-growth"
                  ref={tabRefs.sip_growth}
                  id="tab-panel-sip_growth"
                  style={getTabPanelInitialStyle('sip_growth')}
                >
                  <SIPCalculator onBack={() => handleSelectTab('home')} hasBottomNav={true} />
                </div>

                <div
                  key="tab-profile"
                  ref={tabRefs.profile}
                  id="tab-panel-profile"
                  style={getTabPanelInitialStyle('profile')}
                >
                  <UserProfile
                    loans={loanProfiles}
                    onBack={() => {
                      handleSelectTab('home');
                    }}
                    onNotifications={() => {
                      setCalculatorBackScreen('USER_PROFILE');
                      setNavigationSource('subpage');
                      setCurrentScreen('NOTIFICATIONS');
                    }}
                    notificationCount={notifications.filter(n => !n.isRead).length}
                    onViewLoan={(loan) => {
                      setSelectedProfileLoan(loan);
                      setProfileDetailsSource('USER_PROFILE');
                      setCalculatorBackScreen('USER_PROFILE');
                      setNavigationSource('subpage');
                      setCurrentScreen('LOAN_PROFILE_DETAILS');
                    }}
                    onAdd={() => {
                      setLoanProfileSource('USER_PROFILE');
                      setCalculatorBackScreen('USER_PROFILE');
                      setNavigationSource('subpage');
                      setCurrentScreen('LOAN_PROFILE');
                    }}
                  />
                </div>
              </div>

              {/* Tool / Sub-Screens: Rendered on top when active with GPU slide transitions */}
              <div 
                className="flex-1 flex flex-col overflow-hidden"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  pointerEvents: isPrimaryTab ? 'none' : 'auto',
                }}
              >
                <AnimatePresence>
                  {!isPrimaryTab && renderToolScreen()}
                </AnimatePresence>
              </div>
            </div>
            <BottomNav 
              activeTab={activeTab} 
              onSelectTab={handleSelectTab}
              isVisible={isPrimaryTab}
            />
          </div>

          {/* Welcome Alert Overlay */}
          <AnimatePresence>
            {showWelcomeAlert && urgentEMI && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="w-full bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden transition-colors duration-300"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <button 
                      onClick={() => setShowWelcomeAlert(false)}
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-400 active:scale-90 transition-transform"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                      <AlertCircle size={40} />
                    </div>
                    
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">EMI Due Date!</h2>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed mb-8 px-4">
                      Your EMI for <span className="text-gray-900 dark:text-white">"{urgentEMI.name}"</span> is due within the next few days. Please ensure your account has sufficient funds.
                    </p>

                    <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-3xl p-5 mb-8 flex justify-between items-center transition-colors duration-300">
                      <div className="text-left">
                        <span className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Due Amount</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white">₹{urgentEMI.emi}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Due Date</span>
                        <span className="text-sm font-black text-red-600">{urgentEMI.firstEmiDate}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setShowWelcomeAlert(false);
                        setSelectedProfileLoan(urgentEMI);
                        setProfileDetailsSource(currentScreen);
                        setCurrentScreen('LOAN_PROFILE_DETAILS');
                      }}
                      className="w-full bg-blue-600 py-4 rounded-2xl text-white font-black shadow-xl shadow-blue-200 dark:shadow-blue-900/40 active:scale-95 transition-all mb-4"
                    >
                      View Loan Details
                    </button>
                    
                    <button 
                      onClick={() => setShowWelcomeAlert(false)}
                      className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                    >
                      Dismiss for now
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {showInstallModal && <InstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />}
          {showUpdateModal && (
            <UpdateModal 
              isOpen={showUpdateModal} 
              onClose={() => setShowUpdateModal(false)} 
              updateUrl={updateUrl} 
              latestVersion={latestVersion} 
              isForceUpdate={isForceUpdate}
            />
          )}

          {/* Global Bottom System Navigation Bar Backing Strip */}
          <div 
            aria-hidden="true"
            className="fixed sm:absolute bottom-0 left-0 right-0 z-[60] pointer-events-none"
            style={{
              height: 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))',
              backgroundColor: theme === 'dark' ? '#101827' : '#E8EEF7',
              borderTop: safeBottom > 12 
                ? (theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.07)') 
                : 'none',
              display: safeBottom === 0 ? 'none' : 'block',
              overflow: 'hidden',
              transition: 'height 0.15s ease-out, background-color 0.15s ease-out',
              transform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
            }}
          />
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <SettingsProvider>
    <AppContent />
  </SettingsProvider>
);

export default App;
