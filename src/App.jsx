import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import InputScreen from './components/InputScreen';
import ResultsScreen from './components/ResultsScreen';
import DetailsScreen from './components/DetailsScreen';
import SIPCalculator from './components/SIPCalculator';
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
import SmartBankingScreen from './components/SmartBankingScreen';
import CalculatorsScreen from './components/CalculatorsScreen';
import NotificationCenter from './components/NotificationCenter';
import BottomNav from './components/BottomNav';
import UserProfile from './components/UserProfile';
import DashboardCustomizer from './components/DashboardCustomizer';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import InstallModal from './components/InstallModal';
import UpdateModal from './components/UpdateModal';
import InflationInsights from './components/InflationInsights';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Calendar, X, AlertCircle } from 'lucide-react';
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
  initial: (direction) => ({
    x: direction === 'forward' ? '100%' : '-100%',
    opacity: 1
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 350, damping: 35 },
      opacity: { duration: 0.2 }
    }
  },
  exit: (direction) => ({
    x: direction === 'forward' ? '-100%' : '100%',
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 350, damping: 35 },
      opacity: { duration: 0.2 }
    }
  })
};

const AppContent = () => {
  const { theme, currency, language } = useSettings();
  const [currentScreen, _setCurrentScreen] = useState('HOME');
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
    _setCurrentScreen(resolvedNext);
  };

  const [calculatorBackScreen, setCalculatorBackScreen] = useState('HOME');

  const handleCalculatorBack = () => {
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
  };
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

    checkUpdate();
  }, []);

  const [activeTab, setActiveTab] = useState('home');
  React.useEffect(() => {
    if (currentScreen === 'HOME') setActiveTab('home');
    else if (currentScreen === 'CALCULATORS') setActiveTab('calculators');
    else if (currentScreen === 'SMART_BANKING') setActiveTab('smart_banking');
    else if (currentScreen === 'SIP_CALC') setActiveTab('sip_growth');
    else if (['USER_PROFILE', 'LOAN_PROFILE'].includes(currentScreen)) setActiveTab('profile');
  }, [currentScreen]);

  React.useEffect(() => {
    // Wait for the browser to complete layout and paint of the initial home screen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          SplashScreen.hide().catch((err) => {
            console.warn('SplashScreen hide failed or not on mobile device:', err);
          });
        }, 1200); // 1.2s delay to keep splash visible
      });
    });
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
      case 'SMART_PREPAY':
      case 'SMART_PREPAY_TIPS':
      case 'INFLATION_INSIGHTS':
      case 'SIP_CALC':
      case 'SIP_TIPS':
        handleCalculatorBack();
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
        if (loanProfileSource === 'USER_PROFILE') {
          setCurrentScreen('USER_PROFILE');
        } else {
          setCurrentScreen('HOME');
          setActiveTab('home');
        }
        break;
      case 'ADD_LOAN_PROFILE':
        setLoanToEdit(null);
        setCurrentScreen(profileDetailsSource === 'USER_PROFILE' ? 'USER_PROFILE' : 'LOAN_PROFILE');
        break;
      case 'LOAN_PROFILE_DETAILS':
        setCurrentScreen(profileDetailsSource);
        break;
      case 'LOAN_PROFILE_SCHEDULE':
        setCurrentScreen('LOAN_PROFILE_DETAILS');
        break;
      case 'NOTIFICATIONS':
        setCurrentScreen('HOME');
        setActiveTab('home');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        break;
      case 'DASHBOARD_CUSTOMIZER':
      case 'USER_PROFILE':
      case 'CALCULATORS':
      case 'SMART_BANKING':
      case 'COMING_SOON':
        setCurrentScreen('HOME');
        setActiveTab('home');
        break;
      default:
        break;
    }
  };

  const triggerGlobalBackRef = React.useRef(triggerGlobalBack);
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
          triggerGlobalBackRef.current();
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
  }, []);

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
          triggerGlobalBackRef.current();
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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'HOME':
        return (
          <motion.div
            key="home"
            custom={slideDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ willChange: 'transform, opacity', width: '100%', height: '100%' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <HomeScreen 
              onNavigate={(screen, title) => {
                if (screen === 'COMING_SOON' && title) setComingSoonTitle(title);
                if (screen === 'LOAN_PROFILE') setLoanProfileSource('HOME');
                setCalculatorBackScreen('HOME');
                setCurrentScreen(screen);
              }} 
              onNotifications={() => setCurrentScreen('NOTIFICATIONS')}
              onInstall={() => setShowInstallModal(true)}
              notificationCount={notifications.filter(n => !n.isRead).length}
            />
          </motion.div>
        );
      case 'INPUT':
        return (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <InputScreen 
              onBack={handleCalculatorBack} 
              onCalculate={handleCalculate}
              initialData={calculatorData}
            />
          </motion.div>
        );
      case 'RESULTS':
        return (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <LoanAffordability onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LOAN_ELIGIBILITY':
        return (
          <motion.div
            key="loan_eligibility"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <LoanEligibility onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LOAN_PROFILE':
        return (
          <motion.div
            key="loan_profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <LoanProfile 
              loans={loanProfiles}
              onBack={() => {
                if (loanProfileSource === 'USER_PROFILE') {
                  setCurrentScreen('USER_PROFILE');
                } else {
                  setCurrentScreen('HOME');
                  setActiveTab('home');
                }
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
            />
          </motion.div>
        );
      case 'ADD_LOAN_PROFILE':
        return (
          <motion.div
            key="add_loan_profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <AddLoanProfile 
              onBack={() => {
                setLoanToEdit(null);
                setCurrentScreen(profileDetailsSource === 'USER_PROFILE' ? 'USER_PROFILE' : 'LOAN_PROFILE');
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
                setCurrentScreen(profileDetailsSource === 'USER_PROFILE' ? 'USER_PROFILE' : 'LOAN_PROFILE');
              }}
              initialData={loanToEdit}
            />
          </motion.div>
        );
      case 'LOAN_PROFILE_DETAILS':
        return (
          <motion.div
            key="loan_profile_details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <LoanProfileDetails 
              loan={loanProfiles.find(l => l.id === selectedProfileLoan?.id) || selectedProfileLoan}
              onBack={() => setCurrentScreen(profileDetailsSource)}
              onViewSchedule={() => setCurrentScreen('LOAN_PROFILE_SCHEDULE')}
            />
          </motion.div>
        );
      case 'LOAN_PROFILE_SCHEDULE':
        return (
          <motion.div
            key="loan_profile_schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <LoanProfileSchedule 
              loan={loanProfiles.find(l => l.id === selectedProfileLoan?.id) || selectedProfileLoan}
              onBack={() => setCurrentScreen('LOAN_PROFILE_DETAILS')}
            />
          </motion.div>
        );
      case 'MORATORIUM':
        return (
          <motion.div
            key="moratorium"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <MoratoriumCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'ADVANCE_EMI':
        return (
          <motion.div
            key="advance_emi"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <PrePaymentROI onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'STANDARD_CALC':
        return (
          <motion.div
            key="standard_calc"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <StandardCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SCIENTIFIC_CALC':
        return (
          <motion.div
            key="scientific_calc"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ScientificCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LAND_PURCHASE':
        return (
          <motion.div
            key="land_purchase"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <LandPurchaseCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'LOAN_REFINANCE':
        return (
          <motion.div
            key="loan_refinance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <LoanRefinance onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'CHIT_CALCULATOR':
        return (
          <motion.div
            key="chit_calculator"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ChitCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'FD_CALC':
        return (
          <motion.div
            key="fd_calc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <FDCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SMART_BANKING':
        return (
          <motion.div
            key="smart_banking"
            custom={slideDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ willChange: 'transform, opacity', width: '100%', height: '100%' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <SmartBankingScreen 
              onBack={() => {
                setCurrentScreen('HOME');
                setActiveTab('home');
              }} 
              onNavigate={(route) => {
                setCalculatorBackScreen('SMART_BANKING');
                setCurrentScreen(route);
              }}
            />
          </motion.div>
        );
      case 'UNIT_CONVERTER':
        return (
          <motion.div
            key="unit_converter"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <UnitConverter onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'RD_CALC':
        return (
          <motion.div
            key="rd_calc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <RDCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'PPF_CALC':
        return (
          <motion.div
            key="ppf_calc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <PPFCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'INTEREST_CALC':
        return (
          <motion.div
            key="interest_calc"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <InterestCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'CALCULATORS':
        return (
          <motion.div
            key="calculators"
            custom={slideDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ willChange: 'transform, opacity', width: '100%', height: '100%' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <CalculatorsScreen 
              onBack={() => {
                setCurrentScreen('HOME');
                setActiveTab('home');
              }} 
              onNavigate={(route, title) => {
                if (route === 'COMING_SOON' && title) setComingSoonTitle(title);
                setCalculatorBackScreen('CALCULATORS');
                setCurrentScreen(route);
              }}
            />
          </motion.div>
        );
      case 'NOTIFICATIONS':
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <NotificationCenter 
              notifications={notifications}
              onBack={() => {
                setCurrentScreen('HOME');
                setActiveTab('home');
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
        return (
          <motion.div
            key="user_profile"
            custom={slideDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ willChange: 'transform, opacity', width: '100%', height: '100%' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <UserProfile
              loans={loanProfiles}
              onBack={() => {
                setCurrentScreen('HOME');
                setActiveTab('home');
              }}
              onNotifications={() => setCurrentScreen('NOTIFICATIONS')}
              notificationCount={notifications.filter(n => !n.isRead).length}
              onViewLoan={(loan) => {
                setSelectedProfileLoan(loan);
                setProfileDetailsSource('USER_PROFILE');
                setCurrentScreen('LOAN_PROFILE_DETAILS');
              }}
               onAdd={() => {
                setLoanProfileSource('USER_PROFILE');
                setCurrentScreen('LOAN_PROFILE');
              }}
            />
          </motion.div>
        );

      case 'DASHBOARD_CUSTOMIZER':
        return (
          <motion.div
            key="dashboard_customizer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <DashboardCustomizer
              onBack={() => {
                setCurrentScreen('HOME');
                setActiveTab('home');
              }}
            />
          </motion.div>
        );

      case 'SMART_PREPAY':
        return (
          <motion.div
            key="smart_prepay"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <SmartPrepayCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SMART_PREPAY_TIPS':
        return (
          <motion.div
            key="smart_prepay_tips"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <InflationInsights onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SIP_CALC':
        return (
          <motion.div
            key="sip_calc"
            custom={slideDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ willChange: 'transform, opacity', width: '100%', height: '100%' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <SIPCalculator onBack={handleCalculatorBack} />
          </motion.div>
        );
      case 'SIP_TIPS':
        return (
          <motion.div
            key="sip_tips"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ComingSoon onBack={() => {
                setCurrentScreen('HOME');
                setActiveTab('home');
              }} title={comingSoonTitle} />
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <HomeScreen 
              onNavigate={(screen, title) => {
                if (screen === 'COMING_SOON' && title) setComingSoonTitle(title);
                setCalculatorBackScreen('HOME');
                setCurrentScreen(screen);
              }} 
              onNotifications={() => setCurrentScreen('NOTIFICATIONS')}
              onInstall={() => setShowInstallModal(true)}
              notificationCount={notifications.filter(n => !n.isRead).length}
            />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-0 sm:p-4 transition-colors duration-300">
      <div className="w-full h-screen sm:h-[844px] sm:max-w-md sm:rounded-[3rem] sm:border-[8px] sm:border-gray-900 dark:sm:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Notch for desktop view */}
        <div className="hidden sm:flex h-6 justify-center items-end pb-1 bg-white dark:bg-gray-900 transition-colors duration-300">
          <div className="w-20 h-4 bg-gray-900 rounded-b-xl"></div>
        </div>

        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Global Mesh Gradient Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 overflow-hidden z-0">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-400 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-purple-400 blur-[100px] rounded-full opacity-50" />
          </div>

          <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
            <div className="flex-1 relative flex flex-col overflow-hidden">
              <AnimatePresence mode="popLayout" custom={slideDirection}>
                {renderScreen()}
              </AnimatePresence>
            </div>
            {['HOME', 'CALCULATORS', 'SMART_BANKING', 'SIP_CALC', 'USER_PROFILE', 'LOAN_PROFILE'].includes(currentScreen) && (
              <BottomNav 
                activeTab={activeTab} 
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setCalculatorBackScreen('HOME');
                  if (tab === 'smart_banking') {
                    setCurrentScreen('SMART_BANKING');
                  } else if (tab === 'home') {
                    setCurrentScreen('HOME');
                  } else if (tab === 'calculators') {
                    setCurrentScreen('CALCULATORS');
                  } else if (tab === 'sip_growth') {
                    setCurrentScreen('SIP_CALC');
                  } else if (tab === 'profile') {
                    setCurrentScreen('USER_PROFILE');
                  }
                }} 
              />
            )}
          </div>

          {/* Welcome Alert Overlay */}
          <AnimatePresence>
            {showWelcomeAlert && urgentEMI && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm"
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
          <InstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
          <UpdateModal 
            isOpen={showUpdateModal} 
            onClose={() => setShowUpdateModal(false)} 
            updateUrl={updateUrl} 
            latestVersion={latestVersion} 
            isForceUpdate={isForceUpdate}
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
