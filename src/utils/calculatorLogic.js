import {
  TAX_CONFIG_2025_26,
  AGE_GROUPS,
  EMPLOYER_TYPES,
  SECTION_80G_CATEGORIES
} from './taxConfig.fy2025_26.js';

export {
  TAX_CONFIG_2025_26,
  AGE_GROUPS,
  EMPLOYER_TYPES,
  SECTION_80G_CATEGORIES
};

export const calculateEMI = (principal, ratePerYear, years, isMonths = false) => {
  const p = parseFloat(principal);
  const r = parseFloat(ratePerYear) / 12 / 100; // Monthly interest rate
  const n = isMonths ? parseInt(years) : parseInt(years) * 12; // Total number of months

  if (p === 0 || r === 0 || n === 0) return 0;

  const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return emi;
};

export const calculateLoanAmount = (emi, ratePerYear, years, isMonths = false) => {
  const e = parseFloat(emi);
  const r = parseFloat(ratePerYear) / 12 / 100;
  const n = isMonths ? parseInt(years) : parseInt(years) * 12;

  if (e === 0 || r === 0 || n === 0) return 0;

  const p = (e * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
  return p;
};

export const calculateTenure = (principal, ratePerYear, emi, isMonths = false) => {
  const p = parseFloat(principal);
  const r = parseFloat(ratePerYear) / 12 / 100;
  const e = parseFloat(emi);

  if (p === 0 || r === 0 || e === 0) return 0;
  if (e <= p * r) return 0; // EMI must be greater than monthly interest

  const n = Math.log(e / (e - p * r)) / Math.log(1 + r);
  return isMonths ? Math.round(n) : n / 12;
};

export const calculateInterestRate = (principal, years, emi, isMonths = false) => {
  const p = parseFloat(principal);
  const n = isMonths ? parseInt(years) : parseInt(years) * 12;
  const targetEmi = parseFloat(emi);

  if (p === 0 || n === 0 || targetEmi === 0) return 0;

  // Binary search for monthly interest rate 'r'
  let low = 0;
  let high = 1; // 100% per month is way too much, but safe upper bound
  let r = 0.05 / 12; // Start guess at 5% annual

  for (let i = 0; i < 100; i++) {
    r = (low + high) / 2;
    if (r === 0) {
        low = 0.0000001;
        continue;
    }
    const currentEmi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    if (currentEmi > targetEmi) {
      high = r;
    } else {
      low = r;
    }
    
    if (Math.abs(currentEmi - targetEmi) < 0.01) break;
  }

  return r * 12 * 100; // Return annual percentage rate
};

export const parseLocalDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }
  const cleanStr = String(dateInput).split('T')[0].trim();
  
  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = cleanStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10), 0, 0, 0, 0);
  }

  // MM/DD/YYYY or DD-MM-YYYY
  const parts = cleanStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (parts) {
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    const y = parseInt(parts[3], 10);
    if (p1 > 12) {
      return new Date(y, p2 - 1, p1, 0, 0, 0, 0);
    } else if (p2 > 12) {
      return new Date(y, p1 - 1, p2, 0, 0, 0, 0);
    } else {
      if (cleanStr.includes('/')) {
        return new Date(y, p1 - 1, p2, 0, 0, 0, 0);
      } else {
        return new Date(y, p2 - 1, p1, 0, 0, 0, 0);
      }
    }
  }

  const d = new Date(cleanStr.replace(/-/g, "/"));
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isDateOnOrBefore = (dateA, dateB) => {
  const da = parseLocalDate(dateA);
  const db = parseLocalDate(dateB);
  if (!da || !db) return false;
  return da.getTime() <= db.getTime();
};

export const getEmiDateForMonth = (firstEmiDate, monthIndex) => {
  const start = parseLocalDate(firstEmiDate);
  if (!start) return new Date();
  const offset = monthIndex - 1;
  const targetYear = start.getFullYear() + Math.floor((start.getMonth() + offset) / 12);
  const targetMonth = (start.getMonth() + offset) % 12;
  const origDay = start.getDate();
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(origDay, maxDays), 0, 0, 0, 0);
};

export const generateAmortizationSchedule = (principal, ratePerYear, years, isMonths = false, loanData = null, firstEmiDate = null, providedEmi = null) => {
  const p = parseFloat(principal) || 0;
  const r = (parseFloat(ratePerYear) || 0) / 12 / 100;
  const initialN = isMonths ? parseInt(years) : parseInt(years) * 12;
  
  let currentEmi = parseFloat(providedEmi) || calculateEMI(p, ratePerYear, years, isMonths);

  let remainingBalance = p;
  const schedule = [];

  // Prepare prepayments map for quick lookup
  const prepaymentsMap = {};
  if (loanData && loanData.prepayments && Array.isArray(loanData.prepayments) && firstEmiDate) {
    const start = parseLocalDate(firstEmiDate);
    loanData.prepayments.forEach(pre => {
      if (pre.amount && pre.date) {
        const preDate = parseLocalDate(pre.date);
        if (!preDate || !start) return;
        let monthOffset = (preDate.getFullYear() - start.getFullYear()) * 12 + (preDate.getMonth() - start.getMonth()) + 1;
        if (monthOffset < 1) monthOffset = 1;
        if (!prepaymentsMap[monthOffset]) prepaymentsMap[monthOffset] = [];
        prepaymentsMap[monthOffset].push(pre);
      }
    });
  }

  for (let i = 1; i <= 960; i++) {
    const interest = remainingBalance * r;
    let monthTotalPrepayment = 0;
    let emiReductionTriggered = false;

    // Apply all prepayments for this month
    if (prepaymentsMap[i]) {
      prepaymentsMap[i].forEach(pre => {
        monthTotalPrepayment += parseFloat(pre.amount) || 0;
        if (pre.effect === 'EMI Reduction') emiReductionTriggered = true;
      });
    }

    let principalPaid = currentEmi - interest + monthTotalPrepayment;
    
    if (principalPaid >= remainingBalance) {
      principalPaid = remainingBalance;
      remainingBalance = 0;
    } else {
      remainingBalance -= principalPaid;
    }

    // Recalculate EMI if any prepayment in this month triggered EMI Reduction
    if (emiReductionTriggered && remainingBalance > 0) {
      const remainingMonths = initialN - i;
      if (remainingMonths > 0) {
        currentEmi = (remainingBalance * r * Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1);
      }
    }

    schedule.push({
      month: i,
      principal: principalPaid,
      interest: interest,
      emi: principalPaid + interest,
      actualEmi: currentEmi,
      balance: Math.max(0, remainingBalance),
      prepayment: monthTotalPrepayment,
      emiDate: firstEmiDate ? getEmiDateForMonth(firstEmiDate, i) : null
    });

    if (remainingBalance <= 0) break;
    if (i > initialN + 120) break; 
  }

  return schedule;
};

export const calculateLoanCurrentStatus = (loan, asOfDate = new Date()) => {
  if (!loan) return null;
  const amount = parseFloat(loan.amount) || 0;
  const tenure = parseInt(loan.tenure) || 0;
  const emi = parseFloat(loan.emi) || 0;
  
  const schedule = generateAmortizationSchedule(amount, loan.interest, tenure, true, loan, loan.firstEmiDate, emi);
  const today = parseLocalDate(asOfDate) || new Date();

  // 1. Scheduled EMIs paid: Any EMI installment with emiDate <= today
  let scheduledPrincipalPaid = 0;
  let scheduledInterestPaid = 0;
  let passedEmiCount = 0;

  schedule.forEach((row, idx) => {
    const emiDate = row.emiDate || getEmiDateForMonth(loan.firstEmiDate, idx + 1);
    if (isDateOnOrBefore(emiDate, today)) {
      passedEmiCount++;
      const regPrincipal = row.principal - (row.prepayment || 0);
      scheduledPrincipalPaid += regPrincipal;
      scheduledInterestPaid += row.interest;
    }
  });

  // 2. Prepayments applied: evaluated independently by actual prepayment.date <= today
  let appliedPrepayments = 0;
  if (loan.prepayments && Array.isArray(loan.prepayments)) {
    loan.prepayments.forEach(p => {
      if (p.amount && p.date && isDateOnOrBefore(p.date, today)) {
        appliedPrepayments += parseFloat(p.amount) || 0;
      }
    });
  }

  // 3. Current principal paid and outstanding principal as of today
  const principalPaid = Math.min(amount, scheduledPrincipalPaid + appliedPrepayments);
  const outstandingPrincipal = Math.max(0, amount - principalPaid);
  const interestPaid = scheduledInterestPaid;
  const totalPaid = principalPaid + interestPaid;

  // 4. Overall life-of-loan projections
  const totalInterest = schedule.reduce((acc, curr) => acc + curr.interest, 0);
  const totalPayable = amount + totalInterest;
  const outstandingInterest = Math.max(0, totalInterest - interestPaid);
  const outstandingTotal = outstandingPrincipal + outstandingInterest;

  // Original schedule for interest savings comparison
  const originalSchedule = generateAmortizationSchedule(amount, loan.interest, tenure, true);
  const originalTotalInterest = originalSchedule.reduce((acc, curr) => acc + curr.interest, 0);
  const interestSaved = Math.max(0, originalTotalInterest - totalInterest);

  // Total prepayments planned across all dates
  const totalPrepaymentPlanned = loan.prepayments?.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) || 0;

  // Last EMI Date based on actual schedule length
  const lastEmiDateObj = schedule.length > 0 ? getEmiDateForMonth(loan.firstEmiDate, schedule.length) : parseLocalDate(loan.firstEmiDate);

  // Revised EMI detection
  const lastMonthEmi = schedule[schedule.length - 1]?.actualEmi;
  const revisedEmi = lastMonthEmi && Math.abs(lastMonthEmi - emi) > 1 ? lastMonthEmi : null;

  return {
    schedule,
    passedEmiCount,
    principalPaid,
    interestPaid,
    totalPaid,
    totalPrepaymentPaid: appliedPrepayments,
    totalPrepaymentPlanned,
    outstandingPrincipal,
    outstandingInterest,
    outstandingTotal,
    totalInterest,
    interestSaved,
    totalPayable,
    newTenure: schedule.length,
    revisedEmi,
    lastEmiDate: formatDate(lastEmiDateObj, 'DD-MM-YYYY')
  };
};

export const aggregateScheduleByYear = (monthlySchedule) => {
  const yearlySchedule = [];
  let currentYear = {
    year: 1,
    principal: 0,
    interest: 0,
    balance: 0,
  };

  monthlySchedule.forEach((item, index) => {
    currentYear.principal += item.principal;
    currentYear.interest += item.interest;
    currentYear.balance = item.balance;

    if ((index + 1) % 12 === 0 || index === monthlySchedule.length - 1) {
      yearlySchedule.push({ ...currentYear });
      currentYear = {
        year: yearlySchedule.length + 1,
        principal: 0,
        interest: 0,
        balance: 0,
      };
    }
  });

  return yearlySchedule;
};

export const formatCurrency = (value, currencyType = '₹ INR') => {
  const config = {
    '₹ INR': { locale: 'en-IN', currency: 'INR' },
    '$ USD': { locale: 'en-US', currency: 'USD' },
    '€ EUR': { locale: 'de-DE', currency: 'EUR' },
    '£ GBP': { locale: 'en-GB', currency: 'GBP' },
    '¥ JPY': { locale: 'ja-JP', currency: 'JPY' },
    'R$ BRL': { locale: 'pt-BR', currency: 'BRL' },
    'Rp IDR': { locale: 'id-ID', currency: 'IDR' },
    'د.إ AED': { locale: 'ar-AE', currency: 'AED' },
    'ر.س SAR': { locale: 'ar-SA', currency: 'SAR' },
  };

  const { locale, currency } = config[currencyType] || config['₹ INR'];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const translations = {
  English: {
    hello: 'Hello',
    home: 'Home',
    calculators: 'Calculators',
    smart_banking: 'Smart Banking',
    saved: 'Saved',
    profile: 'Profile',
    loan_tracker: 'Loan Tracker',
    loan_tracker_desc: 'Directly add new loan details & start tracking',
    active_loans: 'Active Loans',
    monthly_emi: 'Monthly EMI',
    upcoming_emi: 'Upcoming EMI',
    loan_amount: 'Loan Amount',
    emi: 'EMI',
    amount_paid: 'Amount Paid',
    outstanding: 'Outstanding',
    calculate_now: 'Calculate Now',
    financial_tools: 'Financial Tools',
    see_all: 'See More',
    smart_tip: 'Smart Tip',
    know_more: 'Know More',
    my_loan_profile: 'My Loan Profile',
    saved_loans: 'Saved Loans',
    no_record: 'No Record Found',
    loan_name: 'Loan Name',
    bank_name: 'Bank Name',
    interest_rate: 'Interest Rate %',
    tenure: 'Tenure (Month)',
    save: 'Save',
    reset: 'Reset',
    calculate: 'Calculate',
    sip_growth: 'SIP Growth',
    sip_growth_sub: 'Continuous Wealth',
    advance_emi: 'Advance EMI',
    advance_emi_sub: 'Detailed plan',
    compare_loans: 'Compare Loans',
    compare_loans_sub: 'Best options',
    smart_prepay: 'Smart Prepay',
    smart_prepay_sub: 'Save Interest',
    inflation_insights: 'Inflation Insights',
    inflation_insights_sub: 'Purchasing Power',
    loan_tracker_sub: 'Saved profiles',
    loan_eligible: 'Loan Eligible',
    loan_eligible_sub: 'Check limits',
    loan_affordability: 'Loan Affordability',
    loan_affordability_sub: 'Know limits',
    quick_calculator: 'Quick Calculator',
    quick_emi_calculator: 'Quick EMI Calculator',
    quick_calculator_sub: 'Instant results',
    loan_refinance: 'Loan Refinance',
    loan_refinance_sub: 'Switch & Save',
    standard_calc: 'Standard Calc',
    standard_calc_sub: 'Basic math',
    scientific_calc: 'Scientific Calc',
    scientific_calc_sub: 'Advanced math',
    unit_converter: 'Unit Converter',
    unit_converter_sub: 'Instant conv.',
    customize_home: 'Customize Home',
    loan_split: 'Loan Split',
    loan_split_sub: 'Gold, Car & Home',
    wealth_planner: 'Wealth Planner',
    wealth_planner_sub: 'SWP, Goal & Hybrid',
    rent_vs_buy: 'Rent vs. Buy',
    rent_vs_buy_sub: 'Home Wealth Analyzer',
    card_trap: 'Card Trap',
    card_trap_sub: 'Min-Due Calculator',
    tax_salary: 'Tax & Salary',
    tax_salary_sub: 'Income Tax, CTC & GST',
    retirement: 'Retirement',
    retirement_sub: 'NPS, EPF & Gratuity',
    smart_roi: 'Smart ROI',
    smart_roi_sub: 'CAGR, Real Return & Doubling',
    rate_us: 'Rate Us',
    share_us: 'Share Us',
    currency: 'Currency',
    language: 'Language',
    choose_language: 'Choose your language',
    track_loans: 'Track and manage your active loans',
    reorder_icons: 'Reorder dashboard shortcut icons',
    rate_app_store: 'Show your love on the app store',
    share_friends: 'Share EMI Pro with friends',
    std_currency: 'Standard system currency',
  },
  Hindi: {
    hello: 'नमस्ते',
    home: 'होम',
    calculators: 'कैलकुलेटर',
    smart_banking: 'स्मार्ट बैंकिंग',
    saved: 'सहेजे गए',
    profile: 'प्रोफ़ाइल',
    loan_tracker: 'ऋण ट्रैकर',
    loan_tracker_desc: 'सीधे नए ऋण विवरण जोड़ें और ट्रैकिंग शुरू करें',
    active_loans: 'सक्रिय ऋण',
    monthly_emi: 'मासिक ईएमआई',
    upcoming_emi: 'आगामी ईएमआई',
    loan_amount: 'ऋण राशि',
    emi: 'ईएमआई',
    amount_paid: 'भुगतान की गई राशि',
    outstanding: 'बकाया',
    calculate_now: 'अभी गणना करें',
    financial_tools: 'वित्तीय उपकरण',
    see_all: 'और देखें',
    smart_tip: 'दिन की स्मार्ट टिप',
    know_more: 'अधिक जानें',
    my_loan_profile: 'मेरा ऋण प्रोफ़ाइल',
    saved_loans: 'सहेजे गए ऋण',
    loan_split: 'ऋण विभाजन',
    loan_split_sub: 'गोल्ड, कार और होम',
    wealth_planner: 'वेल्थ प्लानर',
    wealth_planner_sub: 'एसडब्ल्यूपी और लक्ष्य',
    rent_vs_buy: 'किराया बनाम खरीद',
    rent_vs_buy_sub: 'गृह संपत्ति विश्लेषक',
    card_trap: 'कार्ड ट्रैप',
    card_trap_sub: 'न्यूनतम देय कैलकुलेटर',
    tax_salary: 'टैक्स और वेतन',
    tax_salary_sub: 'आयकर, सीटीसी और जीएसटी',
    retirement: 'सेवानिवृत्ति',
    retirement_sub: 'एनपीएस, ईपीएफ और ग्रेच्युटी',
    smart_roi: 'स्मार्ट आरओआई',
    smart_roi_sub: 'सीएजीआर और वास्तविक रिटर्न',
    no_record: 'कोई रिकॉर्ड नहीं मिला',
    loan_name: 'ऋण का नाम',
    bank_name: 'बैंक का नाम',
    interest_rate: 'ब्याज दर %',
    tenure: 'अवधि (महीना)',
    save: 'सहेजें',
    reset: 'रीसेट',
    calculate: 'गणना करें',
    sip_growth: 'एसआईपी वृद्धि',
    sip_growth_sub: 'निरंतर धन संचय',
    advance_emi: 'अग्रिम ईएमआई',
    advance_emi_sub: 'विस्तृत योजना',
    compare_loans: 'ऋणों की तुलना',
    compare_loans_sub: 'सर्वश्रेष्ठ विकल्प',
    smart_prepay: 'स्मार्ट प्रीपे',
    smart_prepay_sub: 'ब्याज बचाएं',
    inflation_insights: 'मुद्रास्फीति अंतर्दृष्टि',
    inflation_insights_sub: 'क्रय शक्ति',
    loan_tracker_sub: 'सहेजे गए प्रोफाइल',
    loan_eligible: 'ऋण पात्रता',
    loan_eligible_sub: 'सीमाओं की जांच करें',
    loan_affordability: 'ऋण सामर्थ्य',
    loan_affordability_sub: 'सीमाओं को जानें',
    quick_calculator: 'त्वरित कैलकुलेटर',
    quick_emi_calculator: 'त्वरित ईएमआई कैलकुलेटर',
    quick_calculator_sub: 'त्वरित परिणाम',
    loan_refinance: 'ऋण पुनर्वित्त',
    loan_refinance_sub: 'बदलें और बचाएं',
    standard_calc: 'मानक कैलकुलेटर',
    standard_calc_sub: 'बुनियादी गणित',
    scientific_calc: 'वैज्ञानिक कैलकुलेटर',
    scientific_calc_sub: 'उन्नत गणित',
    unit_converter: 'इकाई कनवर्टर',
    unit_converter_sub: 'त्वरित रूपांतरण',
    customize_home: 'होम कस्टमाइज़ करें',
    rate_us: 'हमें रेट करें',
    share_us: 'ऐप शेयर करें',
    currency: 'मुद्रा',
    language: 'भाषा',
    choose_language: 'अपनी भाषा चुनें',
    track_loans: 'अपने सक्रिय ऋणों को ट्रैक करें',
    reorder_icons: 'शॉर्टकट आइकनों को पुनर्व्यवस्थित करें',
    rate_app_store: 'प्ले स्टोर पर अपना प्यार दिखाएं',
    share_friends: 'दोस्तों के साथ ईएमआई प्रो साझा करें',
    std_currency: 'मानक सिस्टम मुद्रा',
  },
  Spanish: {
    hello: 'Hola',
    home: 'Inicio',
    calculators: 'Calculadoras',
    smart_banking: 'Banca Inteligente',
    saved: 'Guardados',
    profile: 'Perfil',
    loan_tracker: 'Seguimiento de Préstamos',
    loan_tracker_desc: 'Añada detalles del préstamo y comience el seguimiento',
    active_loans: 'Préstamos Activos',
    monthly_emi: 'EMI Mensual',
    upcoming_emi: 'Próxima EMI',
    loan_amount: 'Monto del Préstamo',
    emi: 'EMI',
    amount_paid: 'Monto Pagado',
    outstanding: 'Pendiente',
    calculate_now: 'Calcular Ahora',
    financial_tools: 'Herramientas Financieras',
    see_all: 'Ver Más',
    smart_tip: 'Consejo Inteligente',
    know_more: 'Saber Más',
    my_loan_profile: 'Mi Perfil de Préstamo',
    saved_loans: 'Préstamos Guardados',
    no_record: 'No se encontraron registros',
    loan_name: 'Nombre del Préstamo',
    bank_name: 'Nombre del Banco',
    interest_rate: 'Tasa de Interés %',
    tenure: 'Plazo (Meses)',
    save: 'Guardar',
    reset: 'Restablecer',
    calculate: 'Calcular',
    sip_growth: 'Crecimiento SIP',
    sip_growth_sub: 'Riqueza Continua',
    wealth_planner: 'Planificador de Riqueza',
    wealth_planner_sub: 'SWP, Metas y Combo',
    tax_salary: 'Impuestos y Salario',
    tax_salary_sub: 'Impuestos, Neto y GST',
    retirement: 'Jubilación',
    retirement_sub: 'NPS, EPF y Gratificación',
    smart_roi: 'Retorno Inteligente',
    smart_roi_sub: 'CAGR, Retorno Real y Duplicación',
    advance_emi: 'EMI Adelantada',
    advance_emi_sub: 'Plan detallado',
    compare_loans: 'Comparar Préstamos',
    compare_loans_sub: 'Mejores opciones',
    smart_prepay: 'Prepagos Inteligentes',
    smart_prepay_sub: 'Ahorrar interés',
    inflation_insights: 'Efecto Inflación',
    inflation_insights_sub: 'Poder adquisitivo',
    loan_tracker_sub: 'Perfiles Guardados',
    loan_eligible: 'Elegibilidad Préstamo',
    loan_eligible_sub: 'Verificar límites',
    loan_affordability: 'Asequibilidad Préstamo',
    loan_affordability_sub: 'Conocer límites',
    quick_calculator: 'Calculadora Rápida',
    quick_emi_calculator: 'Calculadora Rápida de EMI',
    quick_calculator_sub: 'Resultados al instante',
    loan_refinance: 'Refinanciar Préstamo',
    loan_refinance_sub: 'Cambiar y ahorrar',
    standard_calc: 'Calc. Estándar',
    standard_calc_sub: 'Matemática básica',
    scientific_calc: 'Calc. Científica',
    scientific_calc_sub: 'Matemática avanzada',
    unit_converter: 'Conversor Unidades',
    unit_converter_sub: 'Conversiones rápidas',
    customize_home: 'Personalizar Inicio',
    rate_us: 'Valorarnos',
    share_us: 'Compartir App',
    currency: 'Moneda',
    language: 'Idioma',
    choose_language: 'Elige tu idioma',
    track_loans: 'Gestione sus préstamos activos',
    reorder_icons: 'Reorganizar accesos directos',
    rate_app_store: 'Califícanos en la tienda',
    share_friends: 'Comparte EMI Pro con amigos',
    std_currency: 'Moneda del sistema',
  },
  Arabic: {
    hello: 'مرحبا',
    home: 'الرئيسية',
    calculators: 'الحاسبات',
    smart_banking: 'الخدمات الذكية',
    saved: 'المحفوظة',
    profile: 'الملف الشخصي',
    loan_tracker: 'تتبع القروض',
    loan_tracker_desc: 'أضف تفاصيل القرض مباشرة وابدأ التتبع',
    active_loans: 'القروض النشطة',
    monthly_emi: 'القسط الشهري',
    upcoming_emi: 'القسط القادم',
    loan_amount: 'مبلغ القرض',
    emi: 'القسط الشهري',
    amount_paid: 'المبلغ المدفوع',
    outstanding: 'المبلغ المتبقي',
    calculate_now: 'احسب الآن',
    financial_tools: 'الأدوات المالية',
    see_all: 'عرض المزيد',
    smart_tip: 'نصيحة ذكية',
    know_more: 'معرفة المزيد',
    my_loan_profile: 'ملف القرض الخاص بي',
    saved_loans: 'القروض المحفوظة',
    no_record: 'لم يتم العثور على سجلات',
    loan_name: 'اسم القرض',
    bank_name: 'اسم البنك',
    interest_rate: 'نسبة الفائدة %',
    tenure: 'مدة القرض (بالأشهر)',
    save: 'حفظ',
    reset: 'إعادة تعيين',
    calculate: 'احسب',
    sip_growth: 'نمو الاستثمار SIP',
    sip_growth_sub: 'ثروة مستمرة',
    wealth_planner: 'مخطط الثروة',
    wealth_planner_sub: 'السحب والهدف والتراكم',
    tax_salary: 'الضرائب والراتب',
    tax_salary_sub: 'ضريبة الدخل والراتب وضريبة السلع',
    retirement: 'التقاعد',
    retirement_sub: 'التقاعد ومكافأة نهاية الخدمة',
    smart_roi: 'عائد الاستثمار الذكي',
    smart_roi_sub: 'معدل النمو والعائد الحقيقي والمضاعفة',
    advance_emi: 'القسط المتقدم',
    advance_emi_sub: 'خطة مفصلة',
    compare_loans: 'مقارنة القروض',
    compare_loans_sub: 'أفضل الخيارات',
    smart_prepay: 'السداد الذكي',
    smart_prepay_sub: 'وفر الفائدة',
    inflation_insights: 'تأثير التضخم',
    inflation_insights_sub: 'القوة الشرائية',
    loan_tracker_sub: 'الملفات المحفوظة',
    loan_eligible: 'أهلية القرض',
    loan_eligible_sub: 'تحقق من الحدود',
    loan_affordability: 'القدرة على الاقتراض',
    loan_affordability_sub: 'اعرف حدودك',
    quick_calculator: 'الحاسبة السريعة',
    quick_emi_calculator: 'حاسبة القسط السريع',
    quick_calculator_sub: 'نتائج فورية',
    loan_refinance: 'إعادة تمويل القرض',
    loan_refinance_sub: 'غيّر ووفر',
    standard_calc: 'حاسبة عادية',
    standard_calc_sub: 'عمليات أساسية',
    scientific_calc: 'حاسبة علمية',
    scientific_calc_sub: 'رياضيات متقدمة',
    unit_converter: 'محول الوحدات',
    unit_converter_sub: 'تحويل سريع',
    customize_home: 'تخصيص الرئيسية',
    rate_us: 'قيمنا',
    share_us: 'مشاركة التطبيق',
    currency: 'العملة',
    language: 'اللغة',
    choose_language: 'اختر لغتك',
    track_loans: 'تتبع وإدارة قروضك النشطة',
    reorder_icons: 'إعادة ترتيب أيقونات الاختصار',
    rate_app_store: 'عبّر عن حبك في متجر التطبيقات',
    share_friends: 'شارك التطبيق مع أصدقائك',
    std_currency: 'العملة الافتراضية للنظام',
  },
  French: {
    hello: 'Bonjour',
    home: 'Accueil',
    calculators: 'Calculatrices',
    smart_banking: 'Banque Intel.',
    saved: 'Enregistrés',
    profile: 'Profil',
    loan_tracker: 'Suivi de Prêt',
    loan_tracker_desc: 'Ajoutez des détails de prêt et commencez le suivi',
    active_loans: 'Prêts Actifs',
    monthly_emi: 'EMI Mensuelle',
    upcoming_emi: 'Prochaine EMI',
    loan_amount: 'Montant du Prêt',
    emi: 'EMI',
    amount_paid: 'Montant Payé',
    outstanding: 'Restant',
    calculate_now: 'Calculer Maintenant',
    financial_tools: 'Outils Financiers',
    see_all: 'Voir Plus',
    smart_tip: 'Conseil Malin',
    know_more: 'En savoir plus',
    my_loan_profile: 'Mon Profil de Prêt',
    saved_loans: 'Prêts Enregistrés',
    no_record: 'Aucun enregistrement trouvé',
    loan_name: 'Nom du Prêt',
    bank_name: 'Nom de la Banque',
    interest_rate: "Taux d'Intérêt %",
    tenure: 'Durée (Mois)',
    save: 'Enregistrer',
    reset: 'Réinitialiser',
    calculate: 'Calculer',
    sip_growth: 'Croissance SIP',
    sip_growth_sub: 'Richesse Continue',
    advance_emi: 'EMI Anticipée',
    advance_emi_sub: 'Plan détaillé',
    compare_loans: 'Comparer Prêts',
    compare_loans_sub: 'Meilleures options',
    smart_prepay: 'Rembourser Malin',
    smart_prepay_sub: 'Économiser intérêt',
    inflation_insights: 'Impact Inflation',
    inflation_insights_sub: 'Pouvoir d\'achat',
    loan_tracker_sub: 'Profils Enregistrés',
    loan_eligible: 'Éligibilité Prêt',
    loan_eligible_sub: 'Vérifier limites',
    loan_affordability: 'Capacité d\'Emprunt',
    loan_affordability_sub: 'Connaître limites',
    quick_calculator: 'Calcul Rapide',
    quick_emi_calculator: "Calculateur d'EMI Rapide",
    quick_calculator_sub: 'Résultats instantanés',
    loan_refinance: 'Refinancer Prêt',
    loan_refinance_sub: 'Changer & économiser',
    standard_calc: 'Calcul Standard',
    standard_calc_sub: 'Maths de base',
    scientific_calc: 'Calcul Scientifique',
    scientific_calc_sub: 'Maths avancées',
    unit_converter: 'Convertisseur Unités',
    unit_converter_sub: 'Conversion instantanée',
    customize_home: 'Modifier l\'Accueil',
    rate_us: 'Nous Évaluer',
    share_us: 'Partager l\'App',
    currency: 'Devise',
    language: 'Langue',
    choose_language: 'Choisissez votre langue',
    track_loans: 'Suivez vos prêts actifs',
    reorder_icons: 'Réorganiser les raccourcis',
    rate_app_store: 'Notez-nous sur l\'App Store',
    share_friends: 'Partager EMI Pro avec des amis',
    std_currency: 'Devise système standard',
  },
  Portuguese: {
    hello: 'Olá',
    home: 'Início',
    calculators: 'Calculadoras',
    smart_banking: 'Banco Intel.',
    saved: 'Salvos',
    profile: 'Perfil',
    loan_tracker: 'Rastreador de Empréstimos',
    loan_tracker_desc: 'Adicione detalhes do empréstimo e comece a rastrear',
    active_loans: 'Empréstimos Ativos',
    monthly_emi: 'EMI Mensal',
    upcoming_emi: 'Próxima EMI',
    loan_amount: 'Valor do Empréstimo',
    emi: 'EMI',
    amount_paid: 'Valor Pago',
    outstanding: 'Pendente',
    calculate_now: 'Calcular Agora',
    financial_tools: 'Ferramentas Financ.',
    see_all: 'Ver Mais',
    smart_tip: 'Dica Inteligente',
    know_more: 'Saber Mais',
    my_loan_profile: 'Meu Perfil de Empréstimo',
    saved_loans: 'Empréstimos Salvos',
    no_record: 'Nenhum registro encontrado',
    loan_name: 'Nome do Empréstimo',
    bank_name: 'Nome do Banco',
    interest_rate: 'Taxa de Juros %',
    tenure: 'Prazo (Meses)',
    save: 'Salvar',
    reset: 'Redefinir',
    calculate: 'Calcular',
    sip_growth: 'Crescimento SIP',
    sip_growth_sub: 'Riqueza Contínua',
    advance_emi: 'EMI Adiantada',
    advance_emi_sub: 'Planejamento detalhado',
    compare_loans: 'Comparar Empréstimos',
    compare_loans_sub: 'Melhores opções',
    smart_prepay: 'Amortizar Inteligente',
    smart_prepay_sub: 'Economizar juros',
    inflation_insights: 'Impacto da Inflação',
    inflation_insights_sub: 'Poder de compra',
    loan_tracker_sub: 'Perfis Salvos',
    loan_eligible: 'Elegibilidade de Empréstimo',
    loan_eligible_sub: 'Verificar limites',
    loan_affordability: 'Capacidade Financeira',
    loan_affordability_sub: 'Conhecer limites',
    quick_calculator: 'Calculadora Rápida',
    quick_emi_calculator: 'Calculadora de EMI Rápida',
    quick_calculator_sub: 'Resultados na hora',
    loan_refinance: 'Refinanciar Empréstimo',
    loan_refinance_sub: 'Mudar e economizar',
    standard_calc: 'Calc. Padrão',
    standard_calc_sub: 'Matemática básica',
    scientific_calc: 'Calc. Científica',
    scientific_calc_sub: 'Matemática avançada',
    unit_converter: 'Conversor Unidades',
    unit_converter_sub: 'Conversões rápidas',
    customize_home: 'Personalizar Início',
    rate_us: 'Avaliar App',
    share_us: 'Compartilhar App',
    currency: 'Moeda',
    language: 'Idioma',
    choose_language: 'Escolha seu idioma',
    track_loans: 'Gerencie seus empréstimos ativos',
    reorder_icons: 'Reorganizar atalhos do início',
    rate_app_store: 'Deixe sua nota na loja',
    share_friends: 'Compartilhe o EMI Pro',
    std_currency: 'Moeda padrão do sistema',
  },
  Indonesian: {
    hello: 'Halo',
    home: 'Beranda',
    calculators: 'Kalkulator',
    smart_banking: 'Perbankan Pintar',
    saved: 'Disimpan',
    profile: 'Profil',
    loan_tracker: 'Pelacak Pinjaman',
    loan_tracker_desc: 'Tambahkan detail pinjaman baru & mulai lacak',
    active_loans: 'Pinjaman Aktif',
    monthly_emi: 'EMI Bulanan',
    upcoming_emi: 'EMI Mendatang',
    loan_amount: 'Jumlah Pinjaman',
    emi: 'EMI',
    amount_paid: 'Jumlah Terbayar',
    outstanding: 'Sisa Pinjaman',
    calculate_now: 'Hitung Sekarang',
    financial_tools: 'Alat Keuangan',
    see_all: 'Lihat Semua',
    smart_tip: 'Tips Pintar',
    know_more: 'Info Selengkapnya',
    my_loan_profile: 'Profil Pinjaman Saya',
    saved_loans: 'Pinjaman Disimpan',
    no_record: 'Data Tidak Ditemukan',
    loan_name: 'Nama Pinjaman',
    bank_name: 'Nama Bank',
    interest_rate: 'Suku Bunga %',
    tenure: 'Tenor (Bulan)',
    save: 'Simpan',
    reset: 'Reset',
    calculate: 'Hitung',
    sip_growth: 'Pertumbuhan SIP',
    sip_growth_sub: 'Kekayaan Berkelanjutan',
    advance_emi: 'EMI Lanjutan',
    advance_emi_sub: 'Perencanaan detail',
    compare_loans: 'Bandingkan Pinjaman',
    compare_loans_sub: 'Pilihan terbaik',
    smart_prepay: 'Bayar Cepat Pintar',
    smart_prepay_sub: 'Hemat bunga',
    inflation_insights: 'Analisis Inflasi',
    inflation_insights_sub: 'Daya beli uang',
    loan_tracker_sub: 'Profil Disimpan',
    loan_eligible: 'Kelayakan Pinjaman',
    loan_eligible_sub: 'Periksa batas pinjaman',
    loan_affordability: 'Kemampuan Pinjaman',
    loan_affordability_sub: 'Ketahui batas Anda',
    quick_calculator: 'Kalkulator Cepat',
    quick_emi_calculator: 'Kalkulator EMI Cepat',
    quick_calculator_sub: 'Hasil instan',
    loan_refinance: 'Refinancing Pinjaman',
    loan_refinance_sub: 'Ganti & hemat',
    standard_calc: 'Kalkulator Standar',
    standard_calc_sub: 'Matematika dasar',
    scientific_calc: 'Kalkulator Ilmiah',
    scientific_calc_sub: 'Matematika tingkat lanjut',
    unit_converter: 'Konverter Satuan',
    unit_converter_sub: 'Konversi instan',
    customize_home: 'Sesuaikan Beranda',
    rate_us: 'Beri Nilai',
    share_us: 'Bagikan Aplikasi',
    currency: 'Mata Uang',
    language: 'Bahasa',
    choose_language: 'Pilih bahasa Anda',
    track_loans: 'Lacak & kelola pinjaman aktif Anda',
    reorder_icons: 'Atur ulang pintasan beranda',
    rate_app_store: 'Beri ulasan di Play Store',
    share_friends: 'Bagikan EMI Pro ke teman',
    std_currency: 'Mata uang default sistem',
  }
};

export const t = (key, lang = 'English') => {
  return translations[lang]?.[key] || translations['English']?.[key] || key;
};


export const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
    return '';
  };

  if (num === 0) return 'Zero';
  
  let str = '';
  const n = Math.floor(num);
  
  const crores = Math.floor(n / 10000000);
  const lakhs = Math.floor((n % 10000000) / 100000);
  const thousands = Math.floor((n % 100000) / 1000);
  const remaining = n % 1000;

  if (crores > 0) str += convert(crores) + 'Crore ';
  if (lakhs > 0) str += convert(lakhs) + 'Lakh ';
  if (thousands > 0) str += convert(thousands) + 'Thousand ';
  if (remaining > 0) str += convert(remaining);

  return str.trim();
};

export const getMonthsDifference = (startDate, endDate = new Date()) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  if (!start || !end) return 0;
  if (end.getTime() < start.getTime()) return 0;

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
  // Inclusive if the day has passed or is today
  if (end.getDate() >= start.getDate()) {
    months += 1;
  }
  
  return months;
};

export const formatDate = (date, format = 'DD-MM-YYYY') => {
  const d = parseLocalDate(date);
  if (!d || isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'DD-MM-YYYY') return `${day}-${month}-${year}`;
  if (format === 'MMM-YYYY') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]}-${year}`;
  }
  return d.toLocaleDateString('en-IN');
};

export const formatNumericInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = value.toString().replace(/[^0-9.]/g, '');
  if (isNaN(parseFloat(num))) return '';
  
  const parts = num.split('.');
  parts[0] = new Intl.NumberFormat('en-IN').format(parts[0]);
  return parts.join('.');
};

export const parseFormattedNumber = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/,/g, '');
};

export const calculateChitFund = (chitAmount, months, commissionRate, avgDividendRate) => {
  const totalChitValue = parseFloat(chitAmount);
  const tenure = parseInt(months);
  const commissionPercent = parseFloat(commissionRate);
  const dividendPercent = parseFloat(avgDividendRate);

  if (!totalChitValue || !tenure) return null;

  const monthlyContribution = totalChitValue / tenure;
  const foremanCommission = (totalChitValue * commissionPercent) / 100;
  
  // Total dividend is the amount returned to members after foreman commission
  // In a real scenario, this varies month by month. Here we use an average.
  const totalDividend = (totalChitValue * dividendPercent) / 100;
  const monthlyDividend = totalDividend / tenure;
  
  const netMonthlyInstallment = monthlyContribution - monthlyDividend;
  const totalPaid = netMonthlyInstallment * tenure;
  const netBenefit = totalChitValue - totalPaid;
  
  return {
    monthlyContribution,
    foremanCommission,
    monthlyDividend,
    netMonthlyInstallment,
    totalPaid,
    netBenefit,
    roi: (netBenefit / totalPaid) * 100
  };
};

/**
 * Standard reducing-balance loan calculation
 */
export const calculateReducingLoan = (principal, annualRate, months) => {
  const p = Math.max(0, parseFloat(principal) || 0);
  const n = Math.max(1, parseInt(months) || 1);
  const rate = Math.max(0, parseFloat(annualRate) || 0);
  const r = rate / 12 / 100;

  if (p === 0) {
    return { emi: 0, totalPayable: 0, totalInterest: 0, monthlyOutflow: 0 };
  }

  let emi = 0;
  if (r === 0) {
    emi = p / n;
  } else {
    emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  const totalPayable = emi * n;
  const totalInterest = Math.max(0, totalPayable - p);

  return {
    emi,
    monthlyOutflow: emi,
    totalPayable,
    totalInterest
  };
};

/**
 * Gold loan special repayment modes:
 * - 'regular': Standard reducing-balance EMI
 * - 'interest_only': Monthly interest = P * r; principal P repaid at month n
 * - 'bullet': Monthly EMI = 0; maturity payable = P * (1 + r)^n (compounded) or simple interest
 */
export const calculateGoldLoanRepayment = (
  principal,
  annualRate,
  months,
  repaymentMode = 'regular',
  bulletCompounding = 'monthly'
) => {
  const p = Math.max(0, parseFloat(principal) || 0);
  const n = Math.max(1, parseInt(months) || 1);
  const rate = Math.max(0, parseFloat(annualRate) || 0);
  const r = rate / 12 / 100;

  if (p === 0) {
    return {
      monthlyOutflow: 0,
      monthlyInterest: 0,
      principalBullet: 0,
      totalInterest: 0,
      totalPayable: 0,
      repaymentMode
    };
  }

  if (repaymentMode === 'regular') {
    const reducing = calculateReducingLoan(p, rate, n);
    return {
      monthlyOutflow: reducing.emi,
      monthlyInterest: reducing.totalInterest / n,
      principalBullet: 0,
      totalInterest: reducing.totalInterest,
      totalPayable: reducing.totalPayable,
      repaymentMode
    };
  }

  if (repaymentMode === 'interest_only') {
    const monthlyInterest = p * r;
    const totalInterest = monthlyInterest * n;
    const totalPayable = p + totalInterest;

    return {
      monthlyOutflow: monthlyInterest,
      monthlyInterest,
      principalBullet: p,
      totalInterest,
      totalPayable,
      repaymentMode
    };
  }

  if (repaymentMode === 'bullet') {
    let maturityPayable = 0;
    if (bulletCompounding === 'simple') {
      maturityPayable = p * (1 + (rate / 100) * (n / 12));
    } else {
      // Monthly compounding
      maturityPayable = p * Math.pow(1 + r, n);
    }
    const totalInterest = Math.max(0, maturityPayable - p);

    return {
      monthlyOutflow: 0,
      monthlyInterest: 0,
      principalBullet: maturityPayable,
      totalInterest,
      totalPayable: maturityPayable,
      repaymentMode
    };
  }

  return calculateReducingLoan(p, rate, n);
};

/**
 * Weighted average interest rate (Blended Cost of Borrowing)
 * sum(P_i * Rate_i) / sum(P_i)
 */
export const calculateBlendedRate = (loans = []) => {
  let totalPrincipal = 0;
  let weightedRateSum = 0;

  loans.forEach((loan) => {
    if (!loan || !loan.enabled) return;
    const p = parseFloat(loan.principal) || 0;
    const rate = parseFloat(loan.rate) || 0;
    if (p > 0) {
      totalPrincipal += p;
      weightedRateSum += p * rate;
    }
  });

  if (totalPrincipal === 0) return 0;
  return weightedRateSum / totalPrincipal;
};

/**
 * Rent vs Buy Valuation Simulation Engine
 */
export const calculateRentVsBuy = ({
  propertyPrice = 8000000,
  downPayment = 1600000,
  loanRate = 8.5,
  loanTenureYrs = 20,
  appreciationRate = 6,
  monthlyRent = 22000,
  rentEscalationRate = 5,
  sipReturnRate = 12,
  maintenanceRate = 0.5,
  horizonYrs = 20
}) => {
  const price = Math.max(0, parseFloat(propertyPrice) || 0);
  const dp = Math.min(price, Math.max(0, parseFloat(downPayment) || 0));
  const principal = Math.max(0, price - dp);
  const loanRatePct = Math.max(0, parseFloat(loanRate) || 0);
  const loanTenure = Math.max(1, parseInt(loanTenureYrs) || 1);
  const horizon = Math.max(1, parseInt(horizonYrs) || loanTenure);
  const appreciationPct = parseFloat(appreciationRate) || 0;
  const rent0 = Math.max(0, parseFloat(monthlyRent) || 0);
  const rentEscPct = parseFloat(rentEscalationRate) || 0;
  const sipReturnPct = parseFloat(sipReturnRate) || 0;
  const maintPct = parseFloat(maintenanceRate) || 0;

  const totalLoanMonths = loanTenure * 12;
  const totalHorizonMonths = horizon * 12;

  // Monthly rates
  const rLoan = loanRatePct / 12 / 100;
  const rSip = sipReturnPct / 12 / 100;
  const rApprec = appreciationPct / 12 / 100;

  // Monthly EMI for loan
  let emi = 0;
  if (principal > 0 && totalLoanMonths > 0) {
    if (rLoan === 0) {
      emi = principal / totalLoanMonths;
    } else {
      emi = (principal * rLoan * Math.pow(1 + rLoan, totalLoanMonths)) /
        (Math.pow(1 + rLoan, totalLoanMonths) - 1);
    }
  }

  // Simulation variables
  let loanBalance = principal;
  let sipCorpus = dp; // Down payment invested on day 1 for the renter
  let totalEmiPaid = 0;
  let totalInterestPaid = 0;
  let totalMaintenancePaid = 0;
  let totalRentPaid = 0;

  const trajectory = []; // Yearly milestones for charts/tables
  let breakEvenYear = null;

  for (let m = 1; m <= totalHorizonMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);

    // 1. BUY PATH: EMI & Balance
    let emiThisMonth = 0;
    if (m <= totalLoanMonths && loanBalance > 0) {
      emiThisMonth = emi;
      const interestThisMonth = loanBalance * rLoan;
      const principalThisMonth = Math.min(loanBalance, emiThisMonth - interestThisMonth);
      loanBalance = Math.max(0, loanBalance - principalThisMonth);
      totalEmiPaid += emiThisMonth;
      totalInterestPaid += interestThisMonth;
    }

    // Monthly maintenance (escalating at property appreciation rate)
    const currentPropertyValue = price * Math.pow(1 + rApprec, m);
    const monthlyMaintenance = (currentPropertyValue * (maintPct / 100)) / 12;
    totalMaintenancePaid += monthlyMaintenance;

    const buyMonthlyOutflow = emiThisMonth + monthlyMaintenance;

    // 2. RENT PATH: Escalated Rent
    const currentMonthlyRent = rent0 * Math.pow(1 + rentEscPct / 100, yearIndex);
    totalRentPaid += currentMonthlyRent;

    // Monthly Surplus/Deficit
    const monthlySurplus = buyMonthlyOutflow - currentMonthlyRent;

    // Compound SIP corpus
    sipCorpus = sipCorpus * (1 + rSip) + monthlySurplus;

    // Calculate Net Wealths at this month
    const netWealthBuy = currentPropertyValue - loanBalance;
    const netWealthRent = sipCorpus;

    // Check break-even year
    if (breakEvenYear === null && netWealthBuy >= netWealthRent && m >= 12) {
      breakEvenYear = Math.ceil(m / 12);
    }

    // Snapshot at yearly intervals
    if (m % 12 === 0 || m === totalHorizonMonths) {
      const yearNum = Math.ceil(m / 12);
      trajectory.push({
        year: yearNum,
        propertyValue: currentPropertyValue,
        loanBalance,
        netWealthBuy,
        sipCorpus,
        netWealthRent,
        cumulativeRent: totalRentPaid,
        difference: netWealthBuy - netWealthRent
      });
    }
  }

  const finalPropertyValue = price * Math.pow(1 + rApprec, totalHorizonMonths);
  const finalNetWealthBuy = finalPropertyValue - loanBalance;
  const finalNetWealthRent = sipCorpus;
  const netDifference = finalNetWealthBuy - finalNetWealthRent;
  const buyWins = netDifference >= 0;

  const totalBuyOutflow = dp + totalEmiPaid + totalMaintenancePaid;
  const totalRentOutflow = totalRentPaid;

  return {
    price,
    dp,
    principal,
    emi,
    totalLoanMonths,
    totalHorizonMonths,
    horizonYrs: horizon,
    finalPropertyValue,
    remainingLoanBalance: loanBalance,
    finalNetWealthBuy,
    finalNetWealthRent,
    netDifference,
    buyWins,
    breakEvenYear,
    totalBuyOutflow,
    totalRentOutflow,
    totalInterestPaid,
    totalMaintenancePaid,
    trajectory
  };
};

/**
 * Credit Card Min-Due Trap Simulator
 */
export const calculateCardTrap = ({
  balance = 100000,
  apr = 42,
  minDuePercent = 5,
  minDueFloor = 200,
  emiRate = 15,
  emiMonths = 12,
  processingFeePercent = 1.5
}) => {
  const principal = Math.max(100, parseFloat(balance) || 0);
  const annualRate = Math.max(1, parseFloat(apr) || 42);
  const minDuePct = Math.max(1, parseFloat(minDuePercent) || 5);
  const floor = Math.max(100, parseFloat(minDueFloor) || 200);
  const convRate = Math.max(0, parseFloat(emiRate) || 15);
  const tenureMonths = Math.max(1, parseInt(emiMonths) || 12);
  const feePct = Math.max(0, parseFloat(processingFeePercent) || 0);

  const monthlyRate = annualRate / 12 / 100;

  // --- PATH 1: MINIMUM DUE TRAP ---
  let bal = principal;
  let totalInterestMinDue = 0;
  let totalPaidMinDue = 0;
  let monthsMinDue = 0;
  let isDebtTrap = false;
  const maxMonths = 600; // 50 years cap

  while (bal > 1 && monthsMinDue < maxMonths) {
    monthsMinDue++;
    const monthlyInterest = bal * monthlyRate;
    totalInterestMinDue += monthlyInterest;

    let due = Math.max(floor, bal * (minDuePct / 100));

    // If minimum due doesn't even cover the interest, balance expands forever
    if (due <= monthlyInterest && bal > floor) {
      isDebtTrap = true;
    }

    const payment = Math.min(bal + monthlyInterest, Math.max(due, monthlyInterest + 1));
    totalPaidMinDue += payment;
    bal = Math.max(0, bal + monthlyInterest - payment);

    if (bal < 5) {
      totalPaidMinDue += bal;
      bal = 0;
      break;
    }
  }

  // --- PATH 2: EMI CONVERSION ---
  const rEmi = convRate / 12 / 100;
  const processingFee = (principal * (feePct / 100)) * 1.18; // 18% GST

  let emiAmount = 0;
  if (rEmi === 0) {
    emiAmount = principal / tenureMonths;
  } else {
    emiAmount = (principal * rEmi * Math.pow(1 + rEmi, tenureMonths)) /
      (Math.pow(1 + rEmi, tenureMonths) - 1);
  }

  const totalPaidEMI = (emiAmount * tenureMonths) + processingFee;
  const totalInterestEMI = (emiAmount * tenureMonths) - principal;

  // Savings
  const interestSaved = Math.max(0, totalInterestMinDue - (totalInterestEMI + processingFee));
  const timeSavedMonths = Math.max(0, monthsMinDue - tenureMonths);
  const payoffYearsMinDue = (monthsMinDue / 12).toFixed(1);

  return {
    principal,
    annualRate,
    minDuePct,
    monthsMinDue,
    payoffYearsMinDue,
    totalInterestMinDue,
    totalPaidMinDue,
    isDebtTrap,
    multiplierMinDue: (totalPaidMinDue / principal).toFixed(1),
    // EMI Conversion
    tenureMonths,
    convRate,
    emiAmount,
    processingFee,
    totalInterestEMI,
    totalPaidEMI,
    multiplierEMI: (totalPaidEMI / principal).toFixed(2),
    // Comparison
    interestSaved,
    timeSavedMonths,
    timeSavedYears: (timeSavedMonths / 12).toFixed(1)
  };
};

/**
 * Systematic Withdrawal Plan (SWP) Simulation Engine
 * Formula per month:
 * Balance_m = Balance_{m-1} * (1 + r) - MonthlyWithdrawal
 */
export const calculateSWP = ({
  investment = 2500000,
  monthlyWithdrawal = 20000,
  annualRate = 8,
  tenureMonths = 120
}) => {
  const p0 = Math.max(0, parseFloat(investment) || 0);
  const w = Math.max(0, parseFloat(monthlyWithdrawal) || 0);
  const rAnnual = Math.max(0, parseFloat(annualRate) || 0);
  const rMonthly = (rAnnual / 100) / 12;
  const n = Math.max(1, parseInt(tenureMonths) || 1);

  let currentBalance = p0;
  let totalWithdrawn = 0;
  let totalInterest = 0;
  let isDepleted = false;
  let depletedMonth = null;
  const monthlySchedule = [];

  for (let m = 1; m <= n; m++) {
    if (currentBalance <= 0) {
      if (!isDepleted) {
        isDepleted = true;
        depletedMonth = m - 1;
      }
      monthlySchedule.push({
        month: m,
        openingBalance: 0,
        interest: 0,
        withdrawal: 0,
        closingBalance: 0
      });
      continue;
    }

    const opening = currentBalance;
    const interest = opening * rMonthly;
    const balanceBeforeWithdrawal = opening + interest;
    let actualWithdrawal = w;

    if (balanceBeforeWithdrawal < w) {
      actualWithdrawal = balanceBeforeWithdrawal;
      currentBalance = 0;
      if (!isDepleted) {
        isDepleted = true;
        depletedMonth = m;
      }
    } else {
      currentBalance = balanceBeforeWithdrawal - actualWithdrawal;
    }

    totalWithdrawn += actualWithdrawal;
    totalInterest += interest;

    monthlySchedule.push({
      month: m,
      openingBalance: opening,
      interest,
      withdrawal: actualWithdrawal,
      closingBalance: currentBalance
    });
  }

  const finalRemainingCorpus = currentBalance;
  const totalValueGenerated = totalWithdrawn + finalRemainingCorpus;

  // Aggregate yearly breakdown
  const yearlySchedule = [];
  let currentYearOpening = p0;
  let currentYearWithdrawn = 0;
  let currentYearInterest = 0;

  monthlySchedule.forEach((row, idx) => {
    if (idx % 12 === 0) {
      currentYearOpening = row.openingBalance;
      currentYearWithdrawn = 0;
      currentYearInterest = 0;
    }

    currentYearWithdrawn += row.withdrawal;
    currentYearInterest += row.interest;

    if ((idx + 1) % 12 === 0 || idx === monthlySchedule.length - 1) {
      yearlySchedule.push({
        year: Math.floor(idx / 12) + 1,
        openingBalance: currentYearOpening,
        withdrawn: currentYearWithdrawn,
        interestEarned: currentYearInterest,
        closingBalance: row.closingBalance
      });
    }
  });

  const durationYrs = depletedMonth ? Math.floor(depletedMonth / 12) : Math.floor(n / 12);
  const durationMos = depletedMonth ? depletedMonth % 12 : n % 12;

  return {
    investment: p0,
    monthlyWithdrawal: w,
    annualRate: rAnnual,
    tenureMonths: n,
    totalWithdrawn: Math.round(totalWithdrawn),
    totalInterest: Math.round(totalInterest),
    finalRemainingCorpus: Math.round(finalRemainingCorpus),
    totalValueGenerated: Math.round(totalValueGenerated),
    isDepleted,
    depletedMonth,
    durationYrs,
    durationMos,
    monthlySchedule,
    yearlySchedule
  };
};

/**
 * Reverse Target Corpus Planner (Goal SIP)
 * FV_initial = ExistingSavings * (1 + r)^N
 * Target_rem = max(0, Target - FV_initial)
 * RequiredMonthlySIP = (Target_rem * r) / (((1 + r)^N - 1) * (1 + r))
 */
export const calculateGoalSIP = ({
  targetCorpus = 10000000,
  existingSavings = 0,
  annualRate = 12,
  tenureMonths = 120,
  stepUpRate = 10
}) => {
  const target = Math.max(0, parseFloat(targetCorpus) || 0);
  const existing = Math.max(0, parseFloat(existingSavings) || 0);
  const rAnnual = Math.max(0, parseFloat(annualRate) || 0);
  const rMonthly = (rAnnual / 100) / 12;
  const n = Math.max(1, parseInt(tenureMonths) || 1);
  const sRate = Math.max(0, parseFloat(stepUpRate) || 0);

  // Future value of existing savings
  let fvExisting = existing;
  if (rMonthly > 0) {
    fvExisting = existing * Math.pow(1 + rMonthly, n);
  }

  const targetRemaining = Math.max(0, target - fvExisting);

  // Required monthly SIP (Regular fixed annuity-due)
  let requiredMonthlySIP = 0;
  if (targetRemaining > 0) {
    if (rMonthly > 0) {
      const denom = (Math.pow(1 + rMonthly, n) - 1) * (1 + rMonthly);
      requiredMonthlySIP = denom > 0 ? (targetRemaining * rMonthly) / denom : 0;
    } else {
      requiredMonthlySIP = targetRemaining / n;
    }
  }

  const totalSIPInvested = requiredMonthlySIP * n;
  const totalAmountInvested = existing + totalSIPInvested;
  const wealthGained = Math.max(0, target - totalAmountInvested);

  // 10% Step-Up Alternative calculation
  // Calculate unit coefficient for step-up SIP: FV of starting 1000/mo stepped up annually
  let unitStartingSIP = 1000;
  let unitClosing = 0;
  for (let m = 1; m <= n; m++) {
    const yrIndex = Math.floor((m - 1) / 12);
    const sipThisMonth = unitStartingSIP * Math.pow(1 + sRate / 100, yrIndex);
    unitClosing = (unitClosing + sipThisMonth) * (1 + rMonthly);
  }

  let stepUpStartingSIP = 0;
  let stepUpTotalInvested = existing;
  if (targetRemaining > 0 && unitClosing > 0) {
    const multiplier = targetRemaining / unitClosing;
    stepUpStartingSIP = unitStartingSIP * multiplier;

    let accumulatedStepUp = 0;
    for (let m = 1; m <= n; m++) {
      const yrIndex = Math.floor((m - 1) / 12);
      accumulatedStepUp += stepUpStartingSIP * Math.pow(1 + sRate / 100, yrIndex);
    }
    stepUpTotalInvested += accumulatedStepUp;
  }

  // Yearly projection for the regular SIP path
  const yearlySchedule = [];
  let closing = existing;
  let accumulatedInvested = existing;

  for (let m = 1; m <= n; m++) {
    const opening = closing;
    const investThisMonth = requiredMonthlySIP;
    accumulatedInvested += investThisMonth;
    const interest = (opening + investThisMonth) * rMonthly;
    closing = opening + investThisMonth + interest;

    if (m % 12 === 0 || m === n) {
      yearlySchedule.push({
        year: Math.ceil(m / 12),
        totalInvested: Math.round(accumulatedInvested),
        corpusAccumulated: Math.round(closing),
        interestEarned: Math.round(closing - accumulatedInvested)
      });
    }
  }

  return {
    targetCorpus: target,
    existingSavings: existing,
    annualRate: rAnnual,
    tenureMonths: n,
    fvExisting: Math.round(fvExisting),
    targetRemaining: Math.round(targetRemaining),
    requiredMonthlySIP: Math.round(requiredMonthlySIP),
    totalSIPInvested: Math.round(totalSIPInvested),
    totalAmountInvested: Math.round(totalAmountInvested),
    wealthGained: Math.round(wealthGained),
    // Step-Up alternative
    stepUpStartingSIP: Math.round(stepUpStartingSIP),
    stepUpTotalInvested: Math.round(stepUpTotalInvested),
    stepUpWealthGained: Math.max(0, Math.round(target - stepUpTotalInvested)),
    stepUpInitialDiscountPct: requiredMonthlySIP > 0 
      ? Math.max(0, Math.round(((requiredMonthlySIP - stepUpStartingSIP) / requiredMonthlySIP) * 100))
      : 0,
    yearlySchedule
  };
};

/**
 * Hybrid Wealth Builder (Lumpsum + Monthly SIP + Step-Up)
 */
export const calculateSipPlusLumpsum = ({
  initialLumpsum = 100000,
  monthlySip = 10000,
  annualStepUpPct = 0,
  annualRate = 12,
  tenureMonths = 120
}) => {
  const lumpsum0 = Math.max(0, parseFloat(initialLumpsum) || 0);
  const sip0 = Math.max(0, parseFloat(monthlySip) || 0);
  const stepUpPct = Math.max(0, parseFloat(annualStepUpPct) || 0);
  const rAnnual = Math.max(0, parseFloat(annualRate) || 0);
  const rMonthly = (rAnnual / 100) / 12;
  const n = Math.max(1, parseInt(tenureMonths) || 1);

  // 1. Lumpsum Future Value
  let fvLumpsum = lumpsum0;
  if (rMonthly > 0) {
    fvLumpsum = lumpsum0 * Math.pow(1 + rMonthly, n);
  }
  const lumpsumGains = Math.max(0, fvLumpsum - lumpsum0);

  // 2. SIP Simulation with compounding and optional step-up
  let sipClosing = 0;
  let totalSipInvested = 0;
  let lumpsumClosing = lumpsum0;

  const monthlySchedule = [];
  const yearlySchedule = [];

  for (let m = 1; m <= n; m++) {
    const yrIndex = Math.floor((m - 1) / 12);
    const sipThisMonth = sip0 * Math.pow(1 + stepUpPct / 100, yrIndex);
    totalSipInvested += sipThisMonth;

    // SIP compounding (annuity-due)
    const sipOpening = sipClosing;
    const sipInterest = (sipOpening + sipThisMonth) * rMonthly;
    sipClosing = sipOpening + sipThisMonth + sipInterest;

    // Lumpsum tracking
    const lumpOpening = lumpsumClosing;
    const lumpInterest = lumpOpening * rMonthly;
    lumpsumClosing = lumpOpening + lumpInterest;

    monthlySchedule.push({
      month: m,
      sipInvestment: sipThisMonth,
      sipInterest,
      sipClosing,
      lumpClosing: lumpsumClosing,
      combinedClosing: sipClosing + lumpsumClosing
    });

    if (m % 12 === 0 || m === n) {
      yearlySchedule.push({
        year: Math.ceil(m / 12),
        totalInvested: Math.round(lumpsum0 + totalSipInvested),
        lumpVal: Math.round(lumpsumClosing),
        sipVal: Math.round(sipClosing),
        combinedVal: Math.round(sipClosing + lumpsumClosing),
        totalGains: Math.round((sipClosing + lumpsumClosing) - (lumpsum0 + totalSipInvested))
      });
    }
  }

  const fvSIP = sipClosing;
  const sipGains = Math.max(0, fvSIP - totalSipInvested);
  const combinedMaturity = fvLumpsum + fvSIP;
  const totalInvested = lumpsum0 + totalSipInvested;
  const totalWealthGained = Math.max(0, combinedMaturity - totalInvested);

  return {
    initialLumpsum: lumpsum0,
    monthlySip: sip0,
    annualStepUpPct: stepUpPct,
    annualRate: rAnnual,
    tenureMonths: n,
    fvLumpsum: Math.round(fvLumpsum),
    lumpsumGains: Math.round(lumpsumGains),
    totalSipInvested: Math.round(totalSipInvested),
    fvSIP: Math.round(fvSIP),
    sipGains: Math.round(sipGains),
    totalInvested: Math.round(totalInvested),
    combinedMaturity: Math.round(combinedMaturity),
    totalWealthGained: Math.round(totalWealthGained),
    wealthMultiplier: totalInvested > 0 ? (combinedMaturity / totalInvested).toFixed(2) : '1.00',
    yearlySchedule
  };
};

/**
 * Helper to compute base tax using slab thresholds
 */
export const computeTaxFromSlabs = (taxableIncome, slabs) => {
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
      tax += taxableInSlab * slab.rate;
    }
  }
  return tax;
};

/**
 * Helper to compute surcharge with marginal relief
 */
export const computeSurcharge = (taxableIncome, baseTax, surchargeSlabs, taxSlabs) => {
  if (taxableIncome <= 5000000 || baseTax <= 0) return 0;

  let currentRate = 0;
  let currentThreshold = 5000000;
  for (const s of surchargeSlabs) {
    if (taxableIncome > s.min) {
      currentRate = s.rate;
      currentThreshold = s.min;
    }
  }
  if (currentRate === 0) return 0;

  const rawSurcharge = baseTax * currentRate;
  const totalWithSurcharge = baseTax + rawSurcharge;

  // Marginal relief: Total tax payable (tax + surcharge) on taxableIncome cannot exceed
  // [tax + surcharge on threshold] + [taxableIncome - threshold]
  const taxOnThreshold = computeTaxFromSlabs(currentThreshold, taxSlabs);
  let surchargeOnThreshold = 0;
  if (currentThreshold > 5000000) {
    let lowerRate = 0;
    for (const s of surchargeSlabs) {
      if (currentThreshold > s.min) lowerRate = s.rate;
    }
    surchargeOnThreshold = taxOnThreshold * lowerRate;
  }

  const maxAllowableTotal = taxOnThreshold + surchargeOnThreshold + (taxableIncome - currentThreshold);
  if (totalWithSurcharge > maxAllowableTotal) {
    return Math.max(0, maxAllowableTotal - baseTax);
  }
  return rawSurcharge;
};

/**
 * 1. Income Tax Engine (Old vs New Regime Comparator - FY 2025-26 / AY 2026-27)
 */
export const calculateIncomeTax = ({
  grossSalary = 1500000,
  ageGroup = 'BELOW_60', // 'BELOW_60' | 'SENIOR' | 'SUPER_SENIOR'
  // Existing deductions
  sec80C = 150000,
  sec80D = 25000,
  hraExemption = 0,
  homeLoanInterest24b = 0, // self-occupied property interest
  
  // 1. NPS 80CCD(1B) - Own NPS contribution
  npsOwn80CCD1B = 0,

  // 2. Employer NPS 80CCD(2)
  employerNps80CCD2 = 0,
  basicPlusDA = null, // Default 40% of gross if not specified
  employerType = 'PRIVATE', // 'PRIVATE' | 'GOVT'

  // 3. Education loan interest 80E
  educationLoan80E = 0,

  // 4. Donations 80G
  donation80G = 0,
  donation80GCategory = '100_NO_LIMIT', // '100_NO_LIMIT' | '50_NO_LIMIT' | '100_WITH_10_LIMIT' | '50_WITH_10_LIMIT'
  donationPaidCashOver2k = false,

  // 5. Savings / Deposit interest 80TTA / 80TTB
  savingsInterest = 0,

  // 6. House property - Let-Out 24(b)
  letOutRent = 0,
  letOutMunicipalTaxes = 0,
  letOutLoanInterest = 0
}) => {
  const cfg = TAX_CONFIG_2025_26;
  const gross = Math.max(0, parseFloat(grossSalary) || 0);

  // Age group validation
  const age = AGE_GROUPS[ageGroup] ? ageGroup : AGE_GROUPS.BELOW_60;

  // Basic + DA (default 40% of gross if not provided or empty)
  const basicDA = (basicPlusDA !== null && basicPlusDA !== undefined && basicPlusDA !== '')
    ? Math.max(0, parseFloat(basicPlusDA) || 0)
    : gross * cfg.deductions.sec80CCD2.defaultBasicDaPctOfGross;

  // Inputs sanitization
  const empNpsInput = Math.max(0, parseFloat(employerNps80CCD2) || 0);
  const ownNpsInput = Math.max(0, parseFloat(npsOwn80CCD1B) || 0);
  const eduLoanInput = Math.max(0, parseFloat(educationLoan80E) || 0);
  const interestInput = Math.max(0, parseFloat(savingsInterest) || 0);
  const donationInput = Math.max(0, parseFloat(donation80G) || 0);
  const rentInput = Math.max(0, parseFloat(letOutRent) || 0);
  const muniTaxInput = Math.max(0, parseFloat(letOutMunicipalTaxes) || 0);
  const letOutInterestInput = Math.max(0, parseFloat(letOutLoanInterest) || 0);
  const selfOccupiedInterest = Math.min(
    cfg.deductions.houseProperty.selfOccupiedInterestMaxLimit,
    Math.max(0, parseFloat(homeLoanInterest24b) || 0)
  );

  // --- HOUSE PROPERTY CALCULATION ---
  const nav = Math.max(0, rentInput - muniTaxInput);
  const letOutStdDed = nav * cfg.deductions.houseProperty.letOutStdDeductionPct;
  const netLetOutIncome = nav - letOutStdDed - letOutInterestInput;

  // OLD REGIME HOUSE PROPERTY
  const combinedHouseProperty = netLetOutIncome - selfOccupiedInterest;
  let oldHousePropertyNet = 0;
  let carryForwardLoss = 0;
  let allowedHouseLossSetOff = 0;

  if (combinedHouseProperty < 0) {
    const rawLoss = Math.abs(combinedHouseProperty);
    allowedHouseLossSetOff = Math.min(cfg.deductions.houseProperty.oldRegimeMaxLossSetOff, rawLoss);
    oldHousePropertyNet = -allowedHouseLossSetOff;
    carryForwardLoss = Math.max(0, rawLoss - cfg.deductions.houseProperty.oldRegimeMaxLossSetOff);
  } else {
    oldHousePropertyNet = combinedHouseProperty;
    allowedHouseLossSetOff = 0;
    carryForwardLoss = 0;
  }

  // NEW REGIME HOUSE PROPERTY
  const newHousePropertyNet = Math.max(0, netLetOutIncome);

  // --- GROSS TOTAL INCOME (GTI) ---
  const dedHRA = Math.max(0, parseFloat(hraExemption) || 0);
  const stdDedOld = cfg.standardDeduction.oldRegime;
  const stdDedNew = cfg.standardDeduction.newRegime;

  const oldGTI = Math.max(0, gross + interestInput - dedHRA - stdDedOld + oldHousePropertyNet);
  const newGTI = Math.max(0, gross + interestInput - stdDedNew + newHousePropertyNet);

  // --- CHAPTER VI-A DEDUCTIONS ---
  // 1. Employer NPS 80CCD(2)
  const capPctNew = cfg.deductions.sec80CCD2.newRegimeCapPct;
  const allowedEmpNpsNew = Math.min(empNpsInput, capPctNew * basicDA);
  const empNpsExceedsNew = empNpsInput > (capPctNew * basicDA);

  const capPctOld = employerType === EMPLOYER_TYPES.GOVT
    ? cfg.deductions.sec80CCD2.oldRegimeCapPct.GOVT
    : cfg.deductions.sec80CCD2.oldRegimeCapPct.PRIVATE;
  const allowedEmpNpsOld = Math.min(empNpsInput, capPctOld * basicDA);
  const empNpsExceedsOld = empNpsInput > (capPctOld * basicDA);

  // 2. Section 80C
  const allowed80C = Math.min(cfg.deductions.sec80C.maxLimit, Math.max(0, parseFloat(sec80C) || 0));

  // 3. Section 80CCD(1B) - Own NPS contribution
  const allowedOwnNps80CCD1B = Math.min(cfg.deductions.sec80CCD1B.maxLimit, ownNpsInput);

  // 4. Section 80D - Health insurance
  const allowed80D = Math.min(cfg.deductions.sec80D.maxCap, Math.max(0, parseFloat(sec80D) || 0));

  // 5. Section 80E - Education loan interest
  const allowed80E = eduLoanInput;

  // 6. Section 80TTA / 80TTB
  let allowed80TTA = 0;
  let allowed80TTB = 0;
  if (age === AGE_GROUPS.BELOW_60) {
    allowed80TTA = Math.min(cfg.deductions.savingsInterest.sec80TTA.maxLimit, interestInput);
  } else {
    allowed80TTB = Math.min(cfg.deductions.savingsInterest.sec80TTB.maxLimit, interestInput);
  }
  const allowedInterestDedOld = allowed80TTA + allowed80TTB;

  // Step 2 Deductions (all Chapter VI-A except 80G)
  const step2DeductionsOld = allowed80C + allowedOwnNps80CCD1B + allowedEmpNpsOld + allowed80D + allowed80E + allowedInterestDedOld;

  // --- SECTION 80G DEDUCTION ---
  const agti = Math.max(0, oldGTI - step2DeductionsOld);
  let allowed80G = 0;
  let stepByStep80G = '';

  if (donationPaidCashOver2k) {
    allowed80G = 0;
    stepByStep80G = 'Cash donation exceeding ₹2,000 is not eligible for deduction.';
  } else if (donationInput > 0) {
    const cat = SECTION_80G_CATEGORIES[donation80GCategory] || SECTION_80G_CATEGORIES['100_NO_LIMIT'];
    if (!cat.hasQualifyingLimit) {
      allowed80G = cat.deductionPct * donationInput;
      stepByStep80G = `${cat.deductionPct * 100}% of ₹${donationInput.toLocaleString('en-IN')} = ₹${allowed80G.toLocaleString('en-IN')}`;
    } else {
      const qualifyingLimit = cat.qualifyingLimitPct * agti;
      const eligibleAmount = Math.min(donationInput, qualifyingLimit);
      allowed80G = cat.deductionPct * eligibleAmount;
      stepByStep80G = `${cat.deductionPct * 100}% of min(donation ₹${donationInput.toLocaleString('en-IN')}, 10% of AGTI ₹${qualifyingLimit.toLocaleString('en-IN')}) = ₹${allowed80G.toLocaleString('en-IN')}`;
    }
    allowed80G = Math.min(allowed80G, agti);
  }

  // --- NET TAXABLE INCOME ---
  const taxableOld = Math.max(0, agti - allowed80G);
  const taxableNew = Math.max(0, newGTI - allowedEmpNpsNew);

  // Total deductions / exemptions tracked for display
  const totalDeductionsOld = stdDedOld + dedHRA + (allowedHouseLossSetOff > 0 ? allowedHouseLossSetOff : 0) + step2DeductionsOld + allowed80G;
  const totalDeductionsNew = stdDedNew + allowedEmpNpsNew;

  // --- TAX COMPUTATION: NEW REGIME ---
  const newSlabs = cfg.slabs.newRegime;
  let baseTaxNew = computeTaxFromSlabs(taxableNew, newSlabs);

  // Section 87A rebate in New Regime
  if (taxableNew <= cfg.rebate87A.newRegime.threshold) {
    baseTaxNew = 0;
  } else {
    const excessIncome = taxableNew - cfg.rebate87A.newRegime.threshold;
    if (baseTaxNew > excessIncome) {
      baseTaxNew = excessIncome;
    }
  }

  const surchargeNew = computeSurcharge(taxableNew, baseTaxNew, cfg.surcharge.newRegime, newSlabs);
  const cessNew = (baseTaxNew + surchargeNew) * cfg.cessRate;
  const totalTaxNew = Math.round(baseTaxNew + surchargeNew + cessNew);
  const effectiveRateNew = (gross + interestInput) > 0 ? ((totalTaxNew / (gross + interestInput)) * 100).toFixed(2) : '0.00';

  // --- TAX COMPUTATION: OLD REGIME ---
  const oldSlabs = cfg.slabs.oldRegime[age] || cfg.slabs.oldRegime[AGE_GROUPS.BELOW_60];
  let baseTaxOld = computeTaxFromSlabs(taxableOld, oldSlabs);

  // Section 87A rebate in Old Regime
  if (taxableOld <= cfg.rebate87A.oldRegime.threshold) {
    baseTaxOld = 0;
  }

  const surchargeOld = computeSurcharge(taxableOld, baseTaxOld, cfg.surcharge.oldRegime, oldSlabs);
  const cessOld = (baseTaxOld + surchargeOld) * cfg.cessRate;
  const totalTaxOld = Math.round(baseTaxOld + surchargeOld + cessOld);
  const effectiveRateOld = (gross + interestInput) > 0 ? ((totalTaxOld / (gross + interestInput)) * 100).toFixed(2) : '0.00';

  const taxDiff = Math.abs(totalTaxNew - totalTaxOld);
  const winner = totalTaxNew < totalTaxOld ? 'NEW' : totalTaxOld < totalTaxNew ? 'OLD' : 'EQUAL';

  return {
    gross,
    ageGroup: age,
    basicDA: Math.round(basicDA),
    employerType,
    savingsInterest: interestInput,

    // New Regime details
    stdDedNew,
    allowedEmpNpsNew: Math.round(allowedEmpNpsNew),
    empNpsExceedsNew,
    newHousePropertyNet: Math.round(newHousePropertyNet),
    totalDeductionsNew: Math.round(totalDeductionsNew),
    newGTI: Math.round(newGTI),
    taxableNew: Math.round(taxableNew),
    baseTaxNew: Math.round(baseTaxNew),
    surchargeNew: Math.round(surchargeNew),
    cessNew: Math.round(cessNew),
    totalTaxNew,
    effectiveRateNew,

    // Old Regime details
    stdDedOld,
    dedHRA: Math.round(dedHRA),
    allowed80C: Math.round(allowed80C),
    allowed80D: Math.round(allowed80D),
    allowedOwnNps80CCD1B: Math.round(allowedOwnNps80CCD1B),
    allowedEmpNpsOld: Math.round(allowedEmpNpsOld),
    empNpsExceedsOld,
    allowed80E: Math.round(allowed80E),
    allowed80TTA: Math.round(allowed80TTA),
    allowed80TTB: Math.round(allowed80TTB),
    allowedInterestDedOld: Math.round(allowedInterestDedOld),

    // House Property details
    nav: Math.round(nav),
    letOutStdDed: Math.round(letOutStdDed),
    netLetOutIncome: Math.round(netLetOutIncome),
    selfOccupiedInterest: Math.round(selfOccupiedInterest),
    combinedHouseProperty: Math.round(combinedHouseProperty),
    allowedHouseLossSetOff: Math.round(allowedHouseLossSetOff),
    oldHousePropertyNet: Math.round(oldHousePropertyNet),
    carryForwardLoss: Math.round(carryForwardLoss),

    // Old Regime GTI & 80G
    oldGTI: Math.round(oldGTI),
    agti: Math.round(agti),
    allowed80G: Math.round(allowed80G),
    stepByStep80G,
    step2DeductionsOld: Math.round(step2DeductionsOld),
    totalDeductionsOld: Math.round(totalDeductionsOld),
    taxableOld: Math.round(taxableOld),
    baseTaxOld: Math.round(baseTaxOld),
    surchargeOld: Math.round(surchargeOld),
    cessOld: Math.round(cessOld),
    totalTaxOld,
    effectiveRateOld,

    // Diff
    taxDiff,
    winner
  };
};

/**
 * 2. In-Hand CTC & Take-Home Pay Engine
 */
export const calculateInHandSalary = ({
  annualCTC = 1200000,
  basicSalaryPct = 40,
  epfMode = 'standard', // 'standard' | 'statutory_cap_1800'
  annualBonus = 0,
  monthlyProfTax = 200
}) => {
  const ctc = Math.max(0, parseFloat(annualCTC) || 0);
  const bonus = Math.max(0, parseFloat(annualBonus) || 0);
  const basicPct = Math.max(10, Math.min(80, parseFloat(basicSalaryPct) || 40));
  const ptMonthly = Math.max(0, parseFloat(monthlyProfTax) || 0);

  const nonBonusCTC = Math.max(0, ctc - bonus);
  const monthlyCTC = nonBonusCTC / 12;
  const monthlyBasic = (nonBonusCTC * (basicPct / 100)) / 12;

  // EPF: 12% of basic, or capped at 1800/mo
  let employeePFMonthly = monthlyBasic * 0.12;
  if (epfMode === 'statutory_cap_1800') {
    employeePFMonthly = Math.min(1800, employeePFMonthly);
  }
  employeePFMonthly = Math.round(employeePFMonthly);
  const employerPFMonthly = employeePFMonthly;

  // Estimated Monthly TDS using New Regime
  const taxEst = calculateIncomeTax({ grossSalary: nonBonusCTC });
  const monthlyTDS = Math.round(taxEst.totalTaxNew / 12);

  // Take-home pay
  const monthlyInHand = Math.max(0, Math.round(monthlyCTC - employerPFMonthly - employeePFMonthly - ptMonthly - monthlyTDS));
  const annualInHand = Math.round((monthlyInHand * 12) + Math.max(0, bonus * (1 - (taxEst.totalTaxNew / (nonBonusCTC || 1)))));

  return {
    annualCTC: ctc,
    annualBonus: bonus,
    monthlyCTC: Math.round(monthlyCTC),
    monthlyBasic: Math.round(monthlyBasic),
    employeePFMonthly,
    employerPFMonthly,
    monthlyProfTax: Math.round(ptMonthly),
    monthlyTDS,
    monthlyInHand,
    annualInHand,
    totalMonthlyDeductions: employeePFMonthly + employerPFMonthly + ptMonthly + monthlyTDS
  };
};

/**
 * 3. GST Inclusive & Exclusive Engine
 */
export const calculateGST = ({
  amount = 10000,
  rate = 18,
  mode = 'EXCLUSIVE' // 'EXCLUSIVE' | 'INCLUSIVE'
}) => {
  const amt = Math.max(0, parseFloat(amount) || 0);
  const r = Math.max(0, parseFloat(rate) || 0);

  let netBase = 0;
  let gstAmount = 0;
  let grossTotal = 0;

  if (mode === 'EXCLUSIVE') {
    netBase = amt;
    gstAmount = amt * (r / 100);
    grossTotal = amt + gstAmount;
  } else {
    grossTotal = amt;
    netBase = amt / (1 + r / 100);
    gstAmount = amt - netBase;
  }

  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const igst = gstAmount;

  return {
    mode,
    rate: r,
    netBase: Math.round(netBase),
    gstAmount: Math.round(gstAmount),
    cgst: Math.round(cgst),
    sgst: Math.round(sgst),
    igst: Math.round(igst),
    grossTotal: Math.round(grossTotal)
  };
};

/**
 * 4. National Pension System (NPS) Engine
 */
export const calculateNPS = ({
  monthlyContribution = 5000,
  currentAge = 30,
  retirementAge = 60,
  expectedReturnRate = 10,
  annuityPurchasePct = 40,
  expectedAnnuityRate = 6.5
}) => {
  const p = Math.max(0, parseFloat(monthlyContribution) || 0);
  const cAge = Math.max(18, Math.min(65, parseInt(currentAge) || 30));
  const rAge = Math.max(cAge + 1, Math.min(75, parseInt(retirementAge) || 60));
  const rRate = Math.max(0, parseFloat(expectedReturnRate) || 0);
  const annPct = Math.max(40, Math.min(100, parseFloat(annuityPurchasePct) || 40));
  const annRate = Math.max(0, parseFloat(expectedAnnuityRate) || 0);

  const totalYears = rAge - cAge;
  const totalMonths = totalYears * 12;
  const rMonthly = (rRate / 100) / 12;

  let totalCorpus = 0;
  const totalInvested = p * totalMonths;

  if (rMonthly > 0) {
    totalCorpus = p * ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly) * (1 + rMonthly);
  } else {
    totalCorpus = totalInvested;
  }

  const lumpSumPct = 100 - annPct;
  const lumpSumAmount = totalCorpus * (lumpSumPct / 100);
  const annuityCorpus = totalCorpus * (annPct / 100);
  const monthlyPension = (annuityCorpus * (annRate / 100)) / 12;
  const wealthGained = Math.max(0, totalCorpus - totalInvested);

  return {
    monthlyContribution: p,
    currentAge: cAge,
    retirementAge: rAge,
    totalYears,
    totalInvested: Math.round(totalInvested),
    totalCorpus: Math.round(totalCorpus),
    wealthGained: Math.round(wealthGained),
    lumpSumPct,
    lumpSumAmount: Math.round(lumpSumAmount),
    annuityPurchasePct: annPct,
    annuityCorpus: Math.round(annuityCorpus),
    expectedAnnuityRate: annRate,
    monthlyPension: Math.round(monthlyPension)
  };
};

/**
 * 5. Employee Provident Fund (EPF) Engine
 */
export const calculateEPF = ({
  currentAge = 25,
  retirementAge = 58,
  monthlyBasic = 30000,
  employeeContribPct = 12,
  employerSharePct = 3.67,
  annualSalaryIncrementPct = 5,
  epfInterestRate = 8.25
}) => {
  const cAge = Math.max(18, Math.min(57, parseInt(currentAge) || 25));
  const rAge = Math.max(cAge + 1, Math.min(65, parseInt(retirementAge) || 58));
  let curBasic = Math.max(0, parseFloat(monthlyBasic) || 0);
  const empPct = Math.max(0, parseFloat(employeeContribPct) || 12);
  const emplyrPct = Math.max(0, parseFloat(employerSharePct) || 3.67);
  const incPct = Math.max(0, parseFloat(annualSalaryIncrementPct) || 5);
  const rRate = Math.max(0, parseFloat(epfInterestRate) || 8.25);

  const totalYears = rAge - cAge;
  let closingBalance = 0;
  let totalEmployeeContrib = 0;
  let totalEmployerContrib = 0;
  const yearlySchedule = [];

  for (let y = 1; y <= totalYears; y++) {
    const opening = closingBalance;
    const empDepositAnnual = (curBasic * (empPct / 100)) * 12;
    const emplyrDepositAnnual = (curBasic * (emplyrPct / 100)) * 12;
    const totalDepositsThisYear = empDepositAnnual + emplyrDepositAnnual;

    totalEmployeeContrib += empDepositAnnual;
    totalEmployerContrib += emplyrDepositAnnual;

    // Approximate monthly compounding interest credited at end of year
    const interest = (opening + (totalDepositsThisYear / 2)) * (rRate / 100);
    closingBalance = opening + totalDepositsThisYear + interest;

    yearlySchedule.push({
      year: y,
      age: cAge + y,
      basic: Math.round(curBasic),
      opening: Math.round(opening),
      deposits: Math.round(totalDepositsThisYear),
      interest: Math.round(interest),
      closing: Math.round(closingBalance)
    });

    curBasic *= (1 + incPct / 100);
  }

  const totalContrib = totalEmployeeContrib + totalEmployerContrib;
  const totalInterest = Math.max(0, closingBalance - totalContrib);

  return {
    totalYears,
    totalMaturity: Math.round(closingBalance),
    totalEmployeeContrib: Math.round(totalEmployeeContrib),
    totalEmployerContrib: Math.round(totalEmployerContrib),
    totalContrib: Math.round(totalContrib),
    totalInterest: Math.round(totalInterest),
    yearlySchedule
  };
};

/**
 * 6. Service Gratuity Estimator Engine
 * Gratuity = (15 * LastDrawnBasicDA * CompletedYears) / 26
 */
export const calculateGratuity = ({
  lastDrawnSalary = 50000,
  completedYears = 7
}) => {
  const salary = Math.max(0, parseFloat(lastDrawnSalary) || 0);
  const years = Math.max(0, parseFloat(completedYears) || 0);

  const gratuityAmount = Math.round((15 * salary * years) / 26);
  const isEligible = years >= 5;
  const exemptLimit = 2000000; // ₹20 Lakhs statutory tax exempt
  const exemptAmount = Math.min(gratuityAmount, exemptLimit);
  const taxableAmount = Math.max(0, gratuityAmount - exemptLimit);

  return {
    lastDrawnSalary: salary,
    completedYears: years,
    gratuityAmount,
    isEligible,
    exemptLimit,
    exemptAmount,
    taxableAmount
  };
};

/**
 * 7. Compound Annual Growth Rate (CAGR) Engine
 */
export const calculateCAGR = ({
  initialValue = 100000,
  finalValue = 250000,
  periodValue = 5,
  periodType = 'Years'
}) => {
  const v0 = Math.max(1, parseFloat(initialValue) || 1);
  const v1 = Math.max(0, parseFloat(finalValue) || 0);
  const p = Math.max(0.01, parseFloat(periodValue) || 1);
  const years = periodType === 'Years' ? p : p / 12;

  let cagr = 0;
  if (v1 > 0 && years > 0) {
    cagr = (Math.pow(v1 / v0, 1 / years) - 1) * 100;
  }

  const absoluteReturn = ((v1 - v0) / v0) * 100;
  const netProfit = v1 - v0;

  return {
    initialValue: v0,
    finalValue: v1,
    years: years.toFixed(2),
    cagr: cagr.toFixed(2),
    absoluteReturn: absoluteReturn.toFixed(2),
    netProfit: Math.round(netProfit)
  };
};

/**
 * 8. Real Return (Fisher Equation Inflation-Adjusted) Engine
 */
export const calculateRealReturn = ({
  investmentAmount = 500000,
  nominalReturnRate = 12,
  inflationRate = 6,
  periodYears = 10
}) => {
  const p = Math.max(0, parseFloat(investmentAmount) || 0);
  const rNom = Math.max(0, parseFloat(nominalReturnRate) || 0);
  const rInf = Math.max(0, parseFloat(inflationRate) || 0);
  const n = Math.max(1, parseFloat(periodYears) || 1);

  // Fisher Equation: Real Rate = ((1 + Nom / 100) / (1 + Inf / 100) - 1) * 100
  const realRate = (((1 + rNom / 100) / (1 + rInf / 100)) - 1) * 100;

  const nominalMaturity = p * Math.pow(1 + rNom / 100, n);
  const realPurchasingPower = nominalMaturity / Math.pow(1 + rInf / 100, n);
  const purchasingPowerErosion = Math.max(0, nominalMaturity - realPurchasingPower);

  return {
    investmentAmount: p,
    nominalReturnRate: rNom,
    inflationRate: rInf,
    periodYears: n,
    realRate: realRate.toFixed(2),
    nominalMaturity: Math.round(nominalMaturity),
    realPurchasingPower: Math.round(realPurchasingPower),
    purchasingPowerErosion: Math.round(purchasingPowerErosion)
  };
};

/**
 * 9. Doubling & Multiplier Timeline Engine (Rule of 72 & Exact ln)
 */
export const calculateDoublingTimeline = ({
  annualRate = 12,
  startingAmount = 100000
}) => {
  const rate = Math.max(0.1, parseFloat(annualRate) || 12);
  const principal = Math.max(0, parseFloat(startingAmount) || 0);
  const r = rate / 100;

  // Exact time: ln(multiplier) / ln(1 + r)
  const lnR = Math.log(1 + r);
  const exactDoublingYears = (Math.log(2) / lnR).toFixed(1);
  const ruleOf72Years = (72 / rate).toFixed(1);

  const milestones = [
    { multiplier: '2x', label: 'Doubles (2x)', years: (Math.log(2) / lnR).toFixed(1), amount: Math.round(principal * 2) },
    { multiplier: '3x', label: 'Triples (3x)', years: (Math.log(3) / lnR).toFixed(1), amount: Math.round(principal * 3) },
    { multiplier: '5x', label: 'Quintuples (5x)', years: (Math.log(5) / lnR).toFixed(1), amount: Math.round(principal * 5) },
    { multiplier: '10x', label: '10x Wealth', years: (Math.log(10) / lnR).toFixed(1), amount: Math.round(principal * 10) }
  ];

  return {
    annualRate: rate,
    startingAmount: principal,
    exactDoublingYears,
    ruleOf72Years,
    milestones
  };
};




