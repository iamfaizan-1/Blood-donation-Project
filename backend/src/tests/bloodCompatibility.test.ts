import {
  getCompatibleDonorTypes,
  isBloodCompatible,
} from '../utils/bloodCompatibility';
import { calculateDistanceKm } from '../utils/distance';

let passed = 0;
let failed = 0;

function assertEqual(actual: any, expected: any, testName: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}\n     Expected: ${expectedStr}\n     Actual:   ${actualStr}`);
    failed++;
  }
}

function assertTrue(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}\n     Expected: true, Actual: false`);
    failed++;
  }
}

function assertFalse(condition: boolean, testName: string) {
  if (!condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}\n     Expected: false, Actual: true`);
    failed++;
  }
}

console.log('\n==================================================');
console.log('🧪 RUNNING BLOOD COMPATIBILITY & DISTANCE UNIT TESTS');
console.log('==================================================\n');

// --- 1. Test Recipient A+ Compatibility ---
console.log('--- Test Suite 1: Recipient A+ Compatibility ---');
assertEqual(getCompatibleDonorTypes('A+'), ['A+', 'A-', 'O+', 'O-'], 'A+ recipient compatible donor types');
assertTrue(isBloodCompatible('O-', 'A+'), 'O- donor is compatible with A+ recipient');
assertTrue(isBloodCompatible('A+', 'A+'), 'A+ donor is compatible with A+ recipient');
assertFalse(isBloodCompatible('B+', 'A+'), 'B+ donor is NOT compatible with A+ recipient');

// --- 2. Test Recipient A- Compatibility ---
console.log('\n--- Test Suite 2: Recipient A- Compatibility ---');
assertEqual(getCompatibleDonorTypes('A-'), ['A-', 'O-'], 'A- recipient compatible donor types');
assertTrue(isBloodCompatible('O-', 'A-'), 'O- donor is compatible with A- recipient');
assertFalse(isBloodCompatible('O+', 'A-'), 'O+ donor is NOT compatible with A- recipient');

// --- 3. Test Recipient B+ Compatibility ---
console.log('\n--- Test Suite 3: Recipient B+ Compatibility ---');
assertEqual(getCompatibleDonorTypes('B+'), ['B+', 'B-', 'O+', 'O-'], 'B+ recipient compatible donor types');
assertTrue(isBloodCompatible('B-', 'B+'), 'B- donor is compatible with B+ recipient');
assertFalse(isBloodCompatible('A+', 'B+'), 'A+ donor is NOT compatible with B+ recipient');

// --- 4. Test Recipient B- Compatibility ---
console.log('\n--- Test Suite 4: Recipient B- Compatibility ---');
assertEqual(getCompatibleDonorTypes('B-'), ['B-', 'O-'], 'B- recipient compatible donor types');
assertTrue(isBloodCompatible('B-', 'B-'), 'B- donor is compatible with B- recipient');
assertFalse(isBloodCompatible('B+', 'B-'), 'B+ donor is NOT compatible with B- recipient');

// --- 5. Test Recipient AB+ Universal Recipient ---
console.log('\n--- Test Suite 5: Recipient AB+ (Universal Recipient) ---');
assertEqual(
  getCompatibleDonorTypes('AB+'),
  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB+ recipient receives from all 8 blood groups'
);
assertTrue(isBloodCompatible('O-', 'AB+'), 'O- compatible with AB+');
assertTrue(isBloodCompatible('AB-', 'AB+'), 'AB- compatible with AB+');
assertTrue(isBloodCompatible('B+', 'AB+'), 'B+ compatible with AB+');

// --- 6. Test Recipient AB- Compatibility ---
console.log('\n--- Test Suite 6: Recipient AB- Compatibility ---');
assertEqual(getCompatibleDonorTypes('AB-'), ['AB-', 'A-', 'B-', 'O-'], 'AB- recipient compatible donor types');
assertTrue(isBloodCompatible('A-', 'AB-'), 'A- donor is compatible with AB- recipient');
assertFalse(isBloodCompatible('A+', 'AB-'), 'A+ donor is NOT compatible with AB- recipient');

// --- 7. Test Recipient O+ Compatibility ---
console.log('\n--- Test Suite 7: Recipient O+ Compatibility ---');
assertEqual(getCompatibleDonorTypes('O+'), ['O+', 'O-'], 'O+ recipient compatible donor types');
assertTrue(isBloodCompatible('O+', 'O+'), 'O+ donor is compatible with O+ recipient');
assertFalse(isBloodCompatible('A+', 'O+'), 'A+ donor is NOT compatible with O+ recipient');

// --- 8. Test Recipient O- (Universal Donor only receives O-) ---
console.log('\n--- Test Suite 8: Recipient O- Compatibility ---');
assertEqual(getCompatibleDonorTypes('O-'), ['O-'], 'O- recipient can only receive from O-');
assertTrue(isBloodCompatible('O-', 'O-'), 'O- donor is compatible with O- recipient');
assertFalse(isBloodCompatible('O+', 'O-'), 'O+ donor is NOT compatible with O- recipient');

// --- 9. Test Distance Calculation Utility ---
console.log('\n--- Test Suite 9: Haversine Distance Calculation ---');
const nyc = { latitude: 40.7128, longitude: -74.006 };
const jfk = { latitude: 40.6413, longitude: -73.7781 };
const distance = calculateDistanceKm(nyc, jfk);
assertTrue(distance > 20 && distance < 25, `Distance between NYC & JFK is ~21 km (Actual: ${distance} km)`);

console.log('\n==================================================');
console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('==================================================\n');

process.exit(failed > 0 ? 1 : 0);
