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
    const start = new Date(firstEmiDate);
    loanData.prepayments.forEach(pre => {
      if (pre.amount && pre.date) {
        const preDate = new Date(pre.date);
        const monthOffset = (preDate.getFullYear() - start.getFullYear()) * 12 + (preDate.getMonth() - start.getMonth()) + 1;
        if (monthOffset > 0) {
          if (!prepaymentsMap[monthOffset]) prepaymentsMap[monthOffset] = [];
          prepaymentsMap[monthOffset].push(pre);
        }
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
      prepayment: monthTotalPrepayment
    });

    if (remainingBalance <= 0) break;
    if (i > initialN + 120) break; 
  }

  return schedule;
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
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
  // Inclusive if the day has passed or is today
  if (end.getDate() >= start.getDate()) {
    months += 1;
  }
  
  return months;
};

export const formatDate = (date, format = 'DD-MM-YYYY') => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
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
