#!/usr/bin/env node

/**
 * Unit Tests for Busyness Score Algorithm
 * BeachWatch MVP - Test Suite
 *
 * Tests the density-based busyness scoring system
 * Run with: node test-busyness-score.js
 */

const {
  calculateDensity,
  calculateBusynessScoreWithArea,
  calculateBusynessScore,
  getBusynessLevel
} = require('../../ml/scripts/yolo-integration');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    console.log(`     Expected: ${expected}, Got: ${actual}`);
    testsFailed++;
  }
}

function assertInRange(value, min, max, message) {
  if (value >= min && value <= max) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
    console.log(`     Expected value between ${min} and ${max}, Got: ${value}`);
    testsFailed++;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.log(`  ❌ ${message} - Expected error but none was thrown`);
    testsFailed++;
  } catch (error) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('🏖️  BeachWatch Busyness Score Algorithm Test Suite');
console.log('='.repeat(60) + '\n');

// ============================================================================
// TEST SUITE 1: Density Calculation
// ============================================================================
console.log('📊 Test Suite 1: Density Calculation');
console.log('-'.repeat(60));

// Test 1.1: Basic density calculation
const density1 = calculateDensity(50, 5000);
assertEqual(density1, 1.0, 'Calculate density: 50 people in 5000 sqm = 1.0 per 100 sqm');

// Test 1.2: Zero people
const density2 = calculateDensity(0, 5000);
assertEqual(density2, 0, 'Calculate density: 0 people = 0 density');

// Test 1.3: High density
const density3 = calculateDensity(400, 5000);
assertEqual(density3, 8.0, 'Calculate density: 400 people in 5000 sqm = 8.0 per 100 sqm');

// Test 1.4: Small beach area
const density4 = calculateDensity(25, 2500);
assertEqual(density4, 1.0, 'Calculate density: 25 people in 2500 sqm = 1.0 per 100 sqm');

// Test 1.5: Invalid area (should throw error)
assertThrows(
  () => calculateDensity(50, 0),
  'Throw error for zero beach area'
);

assertThrows(
  () => calculateDensity(50, -100),
  'Throw error for negative beach area'
);

console.log('');

// ============================================================================
// TEST SUITE 2: Area-Based Busyness Score
// ============================================================================
console.log('📊 Test Suite 2: Area-Based Busyness Score');
console.log('-'.repeat(60));

// Test 2.1: Empty beach (0 people)
const result1 = calculateBusynessScoreWithArea(0, { beachArea: 5000 });
assertEqual(result1.score, 0, 'Empty beach: score = 0');
assertEqual(result1.level, 'Empty', 'Empty beach: level = Empty');
assertEqual(result1.density, 0, 'Empty beach: density = 0');

// Test 2.2: Quiet beach (25 people in 5000 sqm = 0.5 density)
const result2 = calculateBusynessScoreWithArea(25, { beachArea: 5000 });
assertInRange(result2.score, 23, 27, 'Quiet beach: score around 25');
assertEqual(result2.level, 'Quiet', 'Quiet beach: level = Quiet');
assertEqual(result2.density, 0.5, 'Quiet beach: density = 0.5');

// Test 2.3: Moderate beach (100 people in 5000 sqm = 2.0 density)
const result3 = calculateBusynessScoreWithArea(100, { beachArea: 5000 });
assertInRange(result3.score, 48, 52, 'Moderate beach: score around 50');
assertEqual(result3.level, 'Moderate', 'Moderate beach: level = Moderate');
assertEqual(result3.density, 2.0, 'Moderate beach: density = 2.0');

// Test 2.4: Busy beach (200 people in 5000 sqm = 4.0 density)
const result4 = calculateBusynessScoreWithArea(200, { beachArea: 5000 });
assertInRange(result4.score, 73, 77, 'Busy beach: score around 75');
assertEqual(result4.level, 'Busy', 'Busy beach: level = Busy');
assertEqual(result4.density, 4.0, 'Busy beach: density = 4.0');

// Test 2.5: Very busy beach (400 people in 5000 sqm = 8.0 density)
const result5 = calculateBusynessScoreWithArea(400, { beachArea: 5000 });
assertInRange(result5.score, 98, 100, 'Very busy beach: score approaching 100');
assertEqual(result5.level, 'Very Busy', 'Very busy beach: level = Very Busy');
assertEqual(result5.density, 8.0, 'Very busy beach: density = 8.0');

// Test 2.6: Extremely crowded (score should cap at 100)
const result6 = calculateBusynessScoreWithArea(1000, { beachArea: 5000 });
assertEqual(result6.score, 100, 'Extremely crowded: score caps at 100');
assertEqual(result6.level, 'Very Busy', 'Extremely crowded: level = Very Busy');

// Test 2.7: Custom thresholds
const result7 = calculateBusynessScoreWithArea(150, {
  beachArea: 5000,
  quietDensity: 1.0,
  moderateDensity: 3.0,
  busyDensity: 5.0,
  veryBusyDensity: 10.0
});
assertInRange(result7.score, 48, 52, 'Custom thresholds: score around 50');
assertEqual(result7.level, 'Moderate', 'Custom thresholds: level = Moderate');

// Test 2.8: Invalid inputs
assertThrows(
  () => calculateBusynessScoreWithArea(-10, { beachArea: 5000 }),
  'Throw error for negative person count'
);

assertThrows(
  () => calculateBusynessScoreWithArea(50, { beachArea: null }),
  'Throw error for null beach area'
);

assertThrows(
  () => calculateBusynessScoreWithArea(50, {}),
  'Throw error for missing beach area'
);

console.log('');

// ============================================================================
// TEST SUITE 3: Different Beach Sizes
// ============================================================================
console.log('📊 Test Suite 3: Beach Size Normalization');
console.log('-'.repeat(60));

// Test 3.1: Same density, different beach sizes should yield similar scores
const bondi = calculateBusynessScoreWithArea(100, { beachArea: 5000 }); // density = 2.0
const coogee = calculateBusynessScoreWithArea(70, { beachArea: 3500 }); // density = 2.0
const maroubra = calculateBusynessScoreWithArea(120, { beachArea: 6000 }); // density = 2.0

assertEqual(bondi.score, coogee.score, 'Same density on different beaches: Bondi = Coogee');
assertEqual(bondi.score, maroubra.score, 'Same density on different beaches: Bondi = Maroubra');
assertEqual(bondi.level, coogee.level, 'Same density yields same level: Bondi = Coogee');
assertEqual(bondi.level, maroubra.level, 'Same density yields same level: Bondi = Maroubra');

// Test 3.2: Verify all beaches have consistent scoring
assert(bondi.density === 2.0, 'Bondi density = 2.0');
assert(coogee.density === 2.0, 'Coogee density = 2.0');
assert(maroubra.density === 2.0, 'Maroubra density = 2.0');

console.log('');

// ============================================================================
// TEST SUITE 4: Legacy Busyness Score (Backward Compatibility)
// ============================================================================
console.log('📊 Test Suite 4: Legacy Busyness Score');
console.log('-'.repeat(60));

// Test 4.1: Empty beach
assertEqual(calculateBusynessScore(0), 0, 'Legacy: Empty beach = 0');

// Test 4.2: Quiet beach
assertInRange(calculateBusynessScore(5), 10, 15, 'Legacy: Quiet beach (5 people)');

// Test 4.3: Moderate beach
assertInRange(calculateBusynessScore(30), 35, 45, 'Legacy: Moderate beach (30 people)');

// Test 4.4: Busy beach
assertInRange(calculateBusynessScore(75), 60, 70, 'Legacy: Busy beach (75 people)');

// Test 4.5: Very busy beach
assertInRange(calculateBusynessScore(150), 80, 90, 'Legacy: Very busy beach (150 people)');

console.log('');

// ============================================================================
// TEST SUITE 5: Busyness Level Labels
// ============================================================================
console.log('📊 Test Suite 5: Busyness Level Labels');
console.log('-'.repeat(60));

assertEqual(getBusynessLevel(0), 'Quiet', 'Score 0 = Quiet');
assertEqual(getBusynessLevel(10), 'Quiet', 'Score 10 = Quiet');
assertEqual(getBusynessLevel(24), 'Quiet', 'Score 24 = Quiet');
assertEqual(getBusynessLevel(25), 'Moderate', 'Score 25 = Moderate');
assertEqual(getBusynessLevel(35), 'Moderate', 'Score 35 = Moderate');
assertEqual(getBusynessLevel(49), 'Moderate', 'Score 49 = Moderate');
assertEqual(getBusynessLevel(50), 'Busy', 'Score 50 = Busy');
assertEqual(getBusynessLevel(60), 'Busy', 'Score 60 = Busy');
assertEqual(getBusynessLevel(74), 'Busy', 'Score 74 = Busy');
assertEqual(getBusynessLevel(75), 'Very Busy', 'Score 75 = Very Busy');
assertEqual(getBusynessLevel(90), 'Very Busy', 'Score 90 = Very Busy');
assertEqual(getBusynessLevel(100), 'Very Busy', 'Score 100 = Very Busy');

console.log('');

// ============================================================================
// TEST SUITE 6: Real-World Scenarios
// ============================================================================
console.log('📊 Test Suite 6: Real-World Scenarios');
console.log('-'.repeat(60));

// Scenario 1: Bondi Beach on a quiet weekday morning
const bondiQuiet = calculateBusynessScoreWithArea(20, {
  beachArea: 5000,
  quietDensity: 0.5,
  moderateDensity: 2.0,
  busyDensity: 4.0,
  veryBusyDensity: 8.0
});
assert(bondiQuiet.score < 25, 'Bondi quiet weekday: score < 25');
assert(bondiQuiet.level === 'Quiet', 'Bondi quiet weekday: level = Quiet');
console.log(`  📍 Bondi weekday morning: ${bondiQuiet.personCount} people, density ${bondiQuiet.density}, score ${bondiQuiet.score}`);

// Scenario 2: Bondi Beach on a busy summer weekend
const bondiBusy = calculateBusynessScoreWithArea(350, {
  beachArea: 5000,
  quietDensity: 0.5,
  moderateDensity: 2.0,
  busyDensity: 4.0,
  veryBusyDensity: 8.0
});
assert(bondiBusy.score >= 75, 'Bondi summer weekend: score >= 75');
assert(bondiBusy.level === 'Very Busy', 'Bondi summer weekend: level = Very Busy');
console.log(`  📍 Bondi summer weekend: ${bondiBusy.personCount} people, density ${bondiBusy.density}, score ${bondiBusy.score}`);

// Scenario 3: Coogee Beach moderate crowd
const coogeeModerate = calculateBusynessScoreWithArea(55, {
  beachArea: 3500,
  quietDensity: 0.5,
  moderateDensity: 2.0,
  busyDensity: 4.0,
  veryBusyDensity: 8.0
});
assertInRange(coogeeModerate.score, 25, 50, 'Coogee moderate: score 25-50');
console.log(`  📍 Coogee moderate: ${coogeeModerate.personCount} people, density ${coogeeModerate.density}, score ${coogeeModerate.score}`);

// Scenario 4: Maroubra Beach very busy (density 4.67 > 4.0 busy threshold)
const maroubraBusy = calculateBusynessScoreWithArea(280, {
  beachArea: 6000,
  quietDensity: 0.5,
  moderateDensity: 2.0,
  busyDensity: 4.0,
  veryBusyDensity: 8.0
});
assertInRange(maroubraBusy.score, 75, 85, 'Maroubra very busy: score 75-85');
console.log(`  📍 Maroubra very busy: ${maroubraBusy.personCount} people, density ${maroubraBusy.density}, score ${maroubraBusy.score}`);

console.log('');

// ============================================================================
// TEST RESULTS SUMMARY
// ============================================================================
console.log('='.repeat(60));
console.log('📊 Test Results Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! The busyness score algorithm is working correctly.');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review the algorithm.`);
  process.exit(1);
}
