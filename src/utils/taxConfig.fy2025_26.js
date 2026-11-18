/**
 * Centralized Tax Configuration for FY 2025-26 (AY 2026-27)
 * Consolidates all tax slabs, statutory deduction limits, surcharge rates, and cess.
 */

export const TAX_YEAR = 'FY 2025-26';
export const ASSESSMENT_YEAR = 'AY 2026-27';

export const AGE_GROUPS = {
  BELOW_60: 'BELOW_60',
  SENIOR: 'SENIOR', // 60 to 79
  SUPER_SENIOR: 'SUPER_SENIOR', // 80+
};

export const EMPLOYER_TYPES = {
  PRIVATE: 'PRIVATE',
  GOVT: 'GOVT',
};

export const SECTION_80G_CATEGORIES = {
  '100_NO_LIMIT': {
    id: '100_NO_LIMIT',
    label: '100% without limit (e.g., PM CARES, NDF)',
    deductionPct: 1.0,
    hasQualifyingLimit: false,
    qualifyingLimitPct: null,
  },
  '50_NO_LIMIT': {
    id: '50_NO_LIMIT',
    label: '50% without limit (e.g., PM Drought Relief)',
    deductionPct: 0.5,
    hasQualifyingLimit: false,
    qualifyingLimitPct: null,
  },
  '100_WITH_10_LIMIT': {
    id: '100_WITH_10_LIMIT',
    label: '100% with 10% limit of AGTI',
    deductionPct: 1.0,
    hasQualifyingLimit: true,
    qualifyingLimitPct: 0.10,
  },
  '50_WITH_10_LIMIT': {
    id: '50_WITH_10_LIMIT',
    label: '50% with 10% limit of AGTI',
    deductionPct: 0.5,
    hasQualifyingLimit: true,
    qualifyingLimitPct: 0.10,
  },
};

export const TAX_CONFIG_2025_26 = {
  standardDeduction: {
    newRegime: 75000,
    oldRegime: 50000,
  },

  deductions: {
    // Section 80C (+ 80CCC + 80CCD(1)) under 80CCE
    sec80C: {
      maxLimit: 150000,
      oldRegimeOnly: true,
    },
    // Section 80CCD(1B) - Own NPS contribution outside 80C
    sec80CCD1B: {
      maxLimit: 50000,
      oldRegimeOnly: true,
    },
    // Section 80CCD(2) - Employer contribution to NPS
    sec80CCD2: {
      newRegimeCapPct: 0.14, // 14% of (Basic + DA)
      oldRegimeCapPct: {
        PRIVATE: 0.10, // 10% of (Basic + DA) for private sector
        GOVT: 0.14,    // 14% of (Basic + DA) for government sector
      },
      defaultBasicDaPctOfGross: 0.40,
      allowedInBothRegimes: true,
    },
    // Section 80D - Health Insurance
    sec80D: {
      defaultInput: 25000,
      maxCap: 100000,
      oldRegimeOnly: true,
    },
    // Section 80E - Education loan interest
    sec80E: {
      maxLimit: Infinity,
      maxYears: 8,
      oldRegimeOnly: true,
    },
    // Section 80G - Donations
    sec80G: {
      cashMaxLimit: 2000,
      oldRegimeOnly: true,
    },
    // Section 80TTA & 80TTB - Savings / Deposit Interest
    savingsInterest: {
      sec80TTA: {
        maxLimit: 10000,
        applicableAges: [AGE_GROUPS.BELOW_60],
      },
      sec80TTB: {
        maxLimit: 50000,
        applicableAges: [AGE_GROUPS.SENIOR, AGE_GROUPS.SUPER_SENIOR],
      },
      oldRegimeOnly: true,
    },
    // House Property - Section 24(b)
    houseProperty: {
      selfOccupiedInterestMaxLimit: 200000, // Old regime only
      letOutStdDeductionPct: 0.30, // Section 24(a): 30% of NAV
      oldRegimeMaxLossSetOff: 200000, // Max net loss set off against other income
      newRegimeMaxLossSetOff: 0, // In New regime, loss cannot offset salary/other income
    },
  },

  slabs: {
    // New Regime (FY 2025-26)
    newRegime: [
      { min: 0, max: 400000, rate: 0.00 },
      { min: 400000, max: 800000, rate: 0.05 },
      { min: 800000, max: 1200000, rate: 0.10 },
      { min: 1200000, max: 1600000, rate: 0.15 },
      { min: 1600000, max: 2000000, rate: 0.20 },
      { min: 2000000, max: 2400000, rate: 0.25 },
      { min: 2400000, max: Infinity, rate: 0.30 },
    ],

    // Old Regime by Age Group
    oldRegime: {
      [AGE_GROUPS.BELOW_60]: [
        { min: 0, max: 250000, rate: 0.00 },
        { min: 250000, max: 500000, rate: 0.05 },
        { min: 500000, max: 1000000, rate: 0.20 },
        { min: 1000000, max: Infinity, rate: 0.30 },
      ],
      [AGE_GROUPS.SENIOR]: [
        { min: 0, max: 300000, rate: 0.00 },
        { min: 300000, max: 500000, rate: 0.05 },
        { min: 500000, max: 1000000, rate: 0.20 },
        { min: 1000000, max: Infinity, rate: 0.30 },
      ],
      [AGE_GROUPS.SUPER_SENIOR]: [
        { min: 0, max: 500000, rate: 0.00 },
        { min: 500000, max: 1000000, rate: 0.20 },
        { min: 1000000, max: Infinity, rate: 0.30 },
      ],
    },
  },

  rebate87A: {
    newRegime: {
      threshold: 1200000,
      hasMarginalRelief: true,
    },
    oldRegime: {
      threshold: 500000,
      maxRebate: 12500,
    },
  },

  surcharge: {
    newRegime: [
      { min: 5000000, max: 10000000, rate: 0.10 },
      { min: 10000000, max: 20000000, rate: 0.15 },
      { min: 20000000, max: Infinity, rate: 0.25 },
    ],
    oldRegime: [
      { min: 5000000, max: 10000000, rate: 0.10 },
      { min: 10000000, max: 20000000, rate: 0.15 },
      { min: 20000000, max: 50000000, rate: 0.25 },
      { min: 50000000, max: Infinity, rate: 0.37 },
    ],
  },

  cessRate: 0.04,
};

export default TAX_CONFIG_2025_26;
