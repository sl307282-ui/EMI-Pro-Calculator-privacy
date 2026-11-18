import { calculateIncomeTax } from '../src/utils/calculatorLogic.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('====================================================');
console.log('RUNNING FY 2025-26 INCOME TAX UNIT TESTS');
console.log('====================================================\n');

// -----------------------------------------------------------------
// TEST 1: Gross ₹20L, 80CCD(1B) = ₹50,000, other fields 0
// Old regime taxable income falls by ₹50,000; New regime taxable unchanged.
// -----------------------------------------------------------------
console.log('--- TEST 1: Section 80CCD(1B) Own NPS Contribution ---');
const baseRes1 = calculateIncomeTax({
  grossSalary: 2000000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  npsOwn80CCD1B: 0
});
const testRes1 = calculateIncomeTax({
  grossSalary: 2000000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  npsOwn80CCD1B: 50000
});

console.log(`Base: Old Taxable = ₹${baseRes1.taxableOld}, New Taxable = ₹${baseRes1.taxableNew}`);
console.log(`With 80CCD(1B): Old Taxable = ₹${testRes1.taxableOld}, New Taxable = ₹${testRes1.taxableNew}`);

assert(testRes1.taxableOld === baseRes1.taxableOld - 50000, 'Old regime taxable income fell by exactly ₹50,000');
assert(testRes1.taxableNew === baseRes1.taxableNew, 'New regime taxable income is unchanged');
assert(testRes1.allowedOwnNps80CCD1B === 50000, '80CCD(1B) allowed deduction is ₹50,000');

// -----------------------------------------------------------------
// TEST 2: Employer NPS ₹1,00,000 on Basic+DA ₹6,00,000, Private sector
// Old allows ₹60,000 (10%); New allows ₹84,000 (14%).
// -----------------------------------------------------------------
console.log('\n--- TEST 2: Section 80CCD(2) Employer NPS ---');
const testRes2 = calculateIncomeTax({
  grossSalary: 1500000,
  employerNps80CCD2: 100000,
  basicPlusDA: 600000,
  employerType: 'PRIVATE'
});

console.log(`Employer NPS: Entered = ₹1,00,000, Basic+DA = ₹6,00,000, Private Sector`);
console.log(`Old Allowed = ₹${testRes2.allowedEmpNpsOld} (Expected: 60,000)`);
console.log(`New Allowed = ₹${testRes2.allowedEmpNpsNew} (Expected: 84,000)`);

assert(testRes2.allowedEmpNpsOld === 60000, 'Old regime allows exactly 10% of Basic+DA (₹60,000)');
assert(testRes2.allowedEmpNpsNew === 84000, 'New regime allows exactly 14% of Basic+DA (₹84,000)');
assert(testRes2.empNpsExceedsOld === true, 'empNpsExceedsOld flagged true');
assert(testRes2.empNpsExceedsNew === true, 'empNpsExceedsNew flagged true');

// Also test Govt sector: Old should allow 14% (84,000)
const testRes2Govt = calculateIncomeTax({
  grossSalary: 1500000,
  employerNps80CCD2: 100000,
  basicPlusDA: 600000,
  employerType: 'GOVT'
});
assert(testRes2Govt.allowedEmpNpsOld === 84000, 'Govt sector in Old regime allows 14% of Basic+DA (₹84,000)');

// -----------------------------------------------------------------
// TEST 3: Savings interest ₹15,000, Age Below 60 (80TTA) vs Age 60-79 (80TTB)
// Below 60: 80TTA allows ₹10,000 (net +₹5,000 taxable in Old).
// 60-79: 80TTB allows ₹50,000 on ₹60,000 (net +₹10,000 taxable in Old).
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Savings / Deposit Interest (80TTA / 80TTB) & Age Slabs ---');
const baseRes3 = calculateIncomeTax({
  grossSalary: 1000000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  savingsInterest: 0,
  ageGroup: 'BELOW_60'
});

const testRes3_80TTA = calculateIncomeTax({
  grossSalary: 1000000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  savingsInterest: 15000,
  ageGroup: 'BELOW_60'
});

console.log(`Below 60: Interest = ₹15,000 -> Allowed 80TTA = ₹${testRes3_80TTA.allowed80TTA}`);
console.log(`Base Taxable Old = ₹${baseRes3.taxableOld}, With Interest Taxable Old = ₹${testRes3_80TTA.taxableOld}`);
assert(testRes3_80TTA.allowed80TTA === 10000, '80TTA allows max ₹10,000');
assert(testRes3_80TTA.taxableOld === baseRes3.taxableOld + 5000, 'Net +₹5,000 taxable in Old regime');
assert(testRes3_80TTA.taxableNew === baseRes3.taxableNew + 15000, 'In New regime, full ₹15,000 is added with no deduction');

// Senior Citizen (60-79) with deposit interest ₹60,000
const baseRes3Senior = calculateIncomeTax({
  grossSalary: 1000000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  savingsInterest: 0,
  ageGroup: 'SENIOR'
});

const testRes3_80TTB = calculateIncomeTax({
  grossSalary: 1000000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  savingsInterest: 60000,
  ageGroup: 'SENIOR'
});

console.log(`Senior 60-79: Deposit Interest = ₹60,000 -> Allowed 80TTB = ₹${testRes3_80TTB.allowed80TTB}`);
console.log(`Base Senior Taxable Old = ₹${baseRes3Senior.taxableOld}, With Interest Taxable Old = ₹${testRes3_80TTB.taxableOld}`);
assert(testRes3_80TTB.allowed80TTB === 50000, '80TTB allows max ₹50,000');
assert(testRes3_80TTB.taxableOld === baseRes3Senior.taxableOld + 10000, 'Net +₹10,000 taxable in Old regime for Senior');

// -----------------------------------------------------------------
// TEST 4: Let-out property with rent ₹3,00,000, municipal tax ₹10,000, interest ₹4,00,000
// NAV = ₹2,90,000, 30% std ded = ₹87,000, net house property income = −₹1,97,000.
// Old regime sets off ₹1,97,000 against salary; New regime sets off ₹0.
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Let-Out Property Section 24(b) ---');
const baseRes4 = calculateIncomeTax({
  grossSalary: 1500000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0
});

const testRes4 = calculateIncomeTax({
  grossSalary: 1500000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  letOutRent: 300000,
  letOutMunicipalTaxes: 10000,
  letOutLoanInterest: 400000
});

console.log(`NAV = ₹${testRes4.nav} (Expected: 2,90,000)`);
console.log(`30% Std Ded = ₹${testRes4.letOutStdDed} (Expected: 87,000)`);
console.log(`Net Let-Out Income = ₹${testRes4.netLetOutIncome} (Expected: -1,97,000)`);
console.log(`Old Allowed Loss Set Off = ₹${testRes4.allowedHouseLossSetOff}`);
console.log(`Base Old Taxable = ₹${baseRes4.taxableOld}, With Let-Out Old Taxable = ₹${testRes4.taxableOld}`);
console.log(`Base New Taxable = ₹${baseRes4.taxableNew}, With Let-Out New Taxable = ₹${testRes4.taxableNew}`);

assert(testRes4.nav === 290000, 'NAV is ₹2,90,000');
assert(testRes4.letOutStdDed === 87000, '30% standard deduction is ₹87,000');
assert(testRes4.netLetOutIncome === -197000, 'Net let-out income is -₹1,97,000');
assert(testRes4.allowedHouseLossSetOff === 197000, 'Old regime sets off full ₹1,97,000 loss against salary');
assert(testRes4.taxableOld === baseRes4.taxableOld - 197000, 'Old regime taxable income reduces by ₹1,97,000');
assert(testRes4.taxableNew === baseRes4.taxableNew, 'New regime sets off ₹0 (loss cannot reduce salary)');

// -----------------------------------------------------------------
// TEST 5: 80G with "50% with the 10% limit" category:
// verify deduction equals 0.5 × min(donation, 0.10 × AGTI) and print step-by-step working.
// -----------------------------------------------------------------
console.log('\n--- TEST 5: Section 80G Donations with 10% AGTI Limit ---');
const testRes5 = calculateIncomeTax({
  grossSalary: 1200000, // Std ded = 50,000 -> GTI = 11,50,000
  sec80C: 150000,       // Step 2 deduction = 150,000 -> AGTI = 10,00,000
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  donation80G: 200000,
  donation80GCategory: '50_WITH_10_LIMIT',
  donationPaidCashOver2k: false
});

console.log(`Step-by-step working:`);
console.log(`• Gross Salary: ₹12,00,000`);
console.log(`• Old GTI (Gross - Std Ded): ₹${testRes5.oldGTI}`);
console.log(`• Step 2 Deductions (80C): ₹${testRes5.step2DeductionsOld}`);
console.log(`• Adjusted Gross Total Income (AGTI): ₹${testRes5.agti}`);
console.log(`• 10% of AGTI Limit: ₹${0.10 * testRes5.agti}`);
console.log(`• Donation: ₹2,00,000`);
console.log(`• Eligible amount = min(₹2,00,000, ₹1,00,000) = ₹1,00,000`);
console.log(`• Allowed 80G Deduction = 50% × ₹1,00,000 = ₹${testRes5.allowed80G}`);
console.log(`• Engine Working Output: "${testRes5.stepByStep80G}"`);

const expectedQualifying = Math.min(200000, 0.10 * testRes5.agti);
const expected80G = 0.5 * expectedQualifying;
assert(testRes5.allowed80G === expected80G, `80G deduction equals 0.5 × min(donation, 0.10 × AGTI) = ₹${expected80G}`);

// Verify cash > 2000 gives 0
const testRes5Cash = calculateIncomeTax({
  grossSalary: 1200000,
  donation80G: 50000,
  donation80GCategory: '100_NO_LIMIT',
  donationPaidCashOver2k: true
});
assert(testRes5Cash.allowed80G === 0, 'Donation paid by cash > ₹2,000 gives ₹0 deduction');

// -----------------------------------------------------------------
// TEST 6: 80E ₹80,000 -> fully deducted in Old regime; ₹0 in New regime.
// -----------------------------------------------------------------
console.log('\n--- TEST 6: Section 80E Higher Education Loan Interest ---');
const baseRes6 = calculateIncomeTax({
  grossSalary: 1500000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  educationLoan80E: 0
});

const testRes6 = calculateIncomeTax({
  grossSalary: 1500000,
  sec80C: 0,
  sec80D: 0,
  hraExemption: 0,
  homeLoanInterest24b: 0,
  educationLoan80E: 80000
});

console.log(`80E: ₹80,000 entered`);
console.log(`Old Allowed = ₹${testRes6.allowed80E}`);
console.log(`Base Old Taxable = ₹${baseRes6.taxableOld}, With 80E Old Taxable = ₹${testRes6.taxableOld}`);
console.log(`Base New Taxable = ₹${baseRes6.taxableNew}, With 80E New Taxable = ₹${testRes6.taxableNew}`);

assert(testRes6.allowed80E === 80000, '80E allowed is exactly ₹80,000 in Old regime');
assert(testRes6.taxableOld === baseRes6.taxableOld - 80000, 'Old regime taxable income fell by exactly ₹80,000');
assert(testRes6.taxableNew === baseRes6.taxableNew, 'New regime taxable income is unchanged (₹0 deduction under 80E)');

console.log('\n====================================================');
console.log('ALL 6 UNIT TESTS PASSED SUCCESSFULLY! 🎉');
console.log('====================================================');
