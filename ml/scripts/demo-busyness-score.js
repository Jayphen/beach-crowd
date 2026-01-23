#!/usr/bin/env node

/**
 * Busyness Score Algorithm Demonstration
 * BeachWatch MVP - Shows how to use the area-based busyness scoring
 *
 * Run with: node demo-busyness-score.js
 */

const {
  calculateBusynessScoreWithArea,
  calculateDensity
} = require('./yolo-integration');
const fs = require('fs');

// Load beach configuration
const beachesConfig = JSON.parse(fs.readFileSync('./beaches-config.json', 'utf8'));

console.log('\n' + '='.repeat(70));
console.log('🏖️  BeachWatch Busyness Score Algorithm - Live Demo');
console.log('='.repeat(70) + '\n');

console.log('📋 This demonstration shows how the area-based busyness score');
console.log('   algorithm normalizes crowd levels across different beach sizes.\n');

// Function to format and display beach analysis
function displayBeachAnalysis(beach, personCount) {
  const beachArea = beach.visible_area_sqm;
  const thresholds = beach.density_thresholds;

  const result = calculateBusynessScoreWithArea(personCount, {
    beachArea,
    quietDensity: thresholds.quiet_density,
    moderateDensity: thresholds.moderate_density,
    busyDensity: thresholds.busy_density,
    veryBusyDensity: thresholds.very_busy_density
  });

  // Emoji indicators
  const levelEmoji = {
    'Empty': '⚪',
    'Quiet': '🟢',
    'Moderate': '🟡',
    'Busy': '🟠',
    'Very Busy': '🔴'
  };

  console.log(`${levelEmoji[result.level]} ${beach.name.padEnd(20)} | ${String(personCount).padStart(3)} people | ` +
              `Density: ${result.density.toFixed(2)} | Score: ${String(result.score).padStart(3)} | ${result.level}`);
}

// ============================================================================
// SCENARIO 1: Same density, different beach sizes
// ============================================================================
console.log('📊 Scenario 1: Normalization Across Beach Sizes');
console.log('-'.repeat(70));
console.log('All beaches have the same density (2.0 people per 100 sqm)');
console.log('The algorithm produces consistent scores regardless of beach size:\n');

const bondi = beachesConfig.beaches.find(b => b.id === 'bondi');
const manly = beachesConfig.beaches.find(b => b.id === 'manly');
const coogee = beachesConfig.beaches.find(b => b.id === 'coogee');
const maroubra = beachesConfig.beaches.find(b => b.id === 'maroubra');

// Calculate person counts for density = 2.0
displayBeachAnalysis(bondi, Math.round(bondi.visible_area_sqm * 0.02));    // 100 people
displayBeachAnalysis(manly, Math.round(manly.visible_area_sqm * 0.02));    // 90 people
displayBeachAnalysis(coogee, Math.round(coogee.visible_area_sqm * 0.02));  // 70 people
displayBeachAnalysis(maroubra, Math.round(maroubra.visible_area_sqm * 0.02)); // 120 people

console.log('\n✅ All beaches show the same score (~50) despite different person counts!\n');

// ============================================================================
// SCENARIO 2: Quiet Morning (Low Density)
// ============================================================================
console.log('📊 Scenario 2: Quiet Monday Morning (8am)');
console.log('-'.repeat(70));
console.log('Low crowd density across all beaches:\n');

displayBeachAnalysis(bondi, 15);
displayBeachAnalysis(manly, 12);
displayBeachAnalysis(coogee, 8);
displayBeachAnalysis(maroubra, 18);

console.log('');

// ============================================================================
// SCENARIO 3: Moderate Weekday Afternoon
// ============================================================================
console.log('📊 Scenario 3: Moderate Weekday Afternoon (3pm)');
console.log('-'.repeat(70));
console.log('Moderate crowd levels after work/school:\n');

displayBeachAnalysis(bondi, 120);
displayBeachAnalysis(manly, 95);
displayBeachAnalysis(coogee, 75);
displayBeachAnalysis(maroubra, 140);

console.log('');

// ============================================================================
// SCENARIO 4: Busy Summer Weekend
// ============================================================================
console.log('📊 Scenario 4: Busy Summer Weekend (Saturday 1pm)');
console.log('-'.repeat(70));
console.log('High crowd density - popular beaches are packed:\n');

displayBeachAnalysis(bondi, 350);
displayBeachAnalysis(manly, 280);
displayBeachAnalysis(coogee, 220);
displayBeachAnalysis(maroubra, 420);

console.log('');

// ============================================================================
// SCENARIO 5: Progressive Crowd Growth
// ============================================================================
console.log('📊 Scenario 5: Bondi Beach - Progressive Crowd Growth');
console.log('-'.repeat(70));
console.log('Tracking crowd levels throughout the day:\n');

const timeScenarios = [
  { time: '6:00 AM', people: 5 },
  { time: '8:00 AM', people: 25 },
  { time: '10:00 AM', people: 80 },
  { time: '12:00 PM', people: 200 },
  { time: '2:00 PM', people: 350 },
  { time: '4:00 PM', people: 280 },
  { time: '6:00 PM', people: 120 },
  { time: '8:00 PM', people: 15 }
];

console.log('Time      | People | Density | Score | Level');
console.log('-'.repeat(60));

timeScenarios.forEach(scenario => {
  const result = calculateBusynessScoreWithArea(scenario.people, {
    beachArea: bondi.visible_area_sqm,
    quietDensity: bondi.density_thresholds.quiet_density,
    moderateDensity: bondi.density_thresholds.moderate_density,
    busyDensity: bondi.density_thresholds.busy_density,
    veryBusyDensity: bondi.density_thresholds.very_busy_density
  });

  const levelEmoji = {
    'Empty': '⚪',
    'Quiet': '🟢',
    'Moderate': '🟡',
    'Busy': '🟠',
    'Very Busy': '🔴'
  };

  console.log(
    `${scenario.time.padEnd(9)} | ${String(scenario.people).padStart(6)} | ` +
    `${result.density.toFixed(2).padStart(7)} | ${String(result.score).padStart(5)} | ` +
    `${levelEmoji[result.level]} ${result.level}`
  );
});

console.log('');

// ============================================================================
// ALGORITHM INSIGHTS
// ============================================================================
console.log('📊 Algorithm Insights');
console.log('-'.repeat(70));
console.log('✅ Density-based scoring ensures fair comparison across beaches');
console.log('✅ Scores range from 0-100 for easy interpretation');
console.log('✅ Four busyness levels: Quiet (0-24), Moderate (25-49),');
console.log('   Busy (50-74), Very Busy (75-100)');
console.log('✅ Thresholds are configurable per beach for local optimization');
console.log('✅ Algorithm handles edge cases (empty beaches, overcrowding)');
console.log('');

// ============================================================================
// TECHNICAL DETAILS
// ============================================================================
console.log('📊 Technical Details');
console.log('-'.repeat(70));
console.log('Density Calculation:');
console.log('  density = (person_count / beach_area_sqm) × 100');
console.log('  Units: people per 100 square meters\n');

console.log('Default Thresholds (configurable per beach):');
console.log('  Quiet:     density ≤ 0.5  → score 0-25');
console.log('  Moderate:  density ≤ 2.0  → score 25-50');
console.log('  Busy:      density ≤ 4.0  → score 50-75');
console.log('  Very Busy: density > 4.0  → score 75-100');
console.log('');

console.log('Beach Areas (visible in webcam):');
beachesConfig.beaches
  .filter(b => b.enabled)
  .forEach(beach => {
    console.log(`  ${beach.name.padEnd(20)}: ${beach.visible_area_sqm} sqm`);
  });

console.log('');
console.log('='.repeat(70));
console.log('✅ Demonstration Complete!');
console.log('='.repeat(70) + '\n');
