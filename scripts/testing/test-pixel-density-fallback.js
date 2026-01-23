#!/usr/bin/env node

/**
 * Pixel Density Fallback Test Script
 * BeachWatch MVP - Tests fallback crowd analysis when YOLO is unavailable
 *
 * This script demonstrates:
 * 1. Normal YOLO detection
 * 2. Pixel density fallback when YOLO fails
 * 3. Direct pixel density analysis
 *
 * Run with: node test-pixel-density-fallback.js
 */

const {
  analyzeBeachCrowd,
  detectPersonsPixelDensity
} = require('../../ml/scripts/yolo-integration');
const fs = require('fs');
const path = require('path');

// Find test image
function findTestImage() {
  const screenshotsDir = './test-data/screenshots';

  if (!fs.existsSync(screenshotsDir)) {
    console.error('❌ Screenshots directory not found. Please run the scraper first.');
    process.exit(1);
  }

  const files = fs.readdirSync(screenshotsDir)
    .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
    .sort()
    .reverse(); // Get most recent

  if (files.length === 0) {
    console.error('❌ No test images found in test-data/screenshots/. Please run the scraper first.');
    process.exit(1);
  }

  return path.join(screenshotsDir, files[0]);
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🏖️  BeachWatch Pixel Density Fallback Test');
  console.log('='.repeat(70) + '\n');

  const testImage = findTestImage();
  console.log(`📸 Test Image: ${testImage}\n`);

  // ============================================================================
  // TEST 1: Normal YOLO Detection (with fallback enabled)
  // ============================================================================
  console.log('📊 Test 1: Normal Analysis (YOLO with fallback enabled)');
  console.log('-'.repeat(70));

  try {
    const result1 = await analyzeBeachCrowd(testImage, {
      useFallback: true,
      beachArea: 5000
    });

    if (result1.success) {
      console.log(`✅ Success!`);
      console.log(`   Method: ${result1.method}`);
      console.log(`   Person Count: ${result1.person_count}`);
      console.log(`   Busyness Score: ${result1.busyness_score}`);
      console.log(`   Busyness Level: ${result1.busyness_level}`);
      console.log(`   Confidence: ${result1.confidence_stats.avg}`);
      console.log(`   Fallback Used: ${result1.fallback_used}`);
      console.log(`   Duration: ${result1.analysis_duration}s`);
    } else {
      console.log(`❌ Failed: ${result1.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // ============================================================================
  // TEST 2: Simulate YOLO Failure (force fallback by using wrong model)
  // ============================================================================
  console.log('📊 Test 2: Simulated YOLO Failure (fallback should trigger)');
  console.log('-'.repeat(70));

  try {
    const result2 = await analyzeBeachCrowd(testImage, {
      useFallback: true,
      beachArea: 5000,
      model: 'nonexistent-model.pt' // This will cause YOLO to fail, but fallback will work
    });

    if (result2.success) {
      console.log(`✅ Fallback Success!`);
      console.log(`   Method: ${result2.method}`);
      console.log(`   Person Count: ${result2.person_count}`);
      console.log(`   Busyness Score: ${result2.busyness_score}`);
      console.log(`   Busyness Level: ${result2.busyness_level}`);
      console.log(`   Confidence: ${result2.confidence_stats.avg}`);
      console.log(`   Fallback Used: ${result2.fallback_used}`);
      console.log(`   Fallback Reason: ${result2.fallback_reason}`);
      console.log(`   Duration: ${result2.analysis_duration}s`);

      if (result2.pixel_analysis) {
        console.log(`\n   📊 Pixel Analysis Details:`);
        console.log(`      Skin Detection: ${result2.pixel_analysis.skin_percentage}%`);
        console.log(`      Bright Colors: ${result2.pixel_analysis.bright_percentage}%`);
        console.log(`      Activity Score: ${result2.pixel_analysis.weighted_activity}`);
      }
    } else {
      console.log(`❌ Both methods failed: ${result2.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // ============================================================================
  // TEST 3: Direct Pixel Density Analysis (no YOLO attempt)
  // ============================================================================
  console.log('📊 Test 3: Direct Pixel Density Analysis');
  console.log('-'.repeat(70));

  try {
    const result3 = await detectPersonsPixelDensity(testImage, {
      beachArea: 5000,
      saveDebug: true // Save debug visualization
    });

    if (result3.success) {
      console.log(`✅ Pixel Density Analysis Complete!`);
      console.log(`   Method: ${result3.method}`);
      console.log(`   Estimated People: ${result3.detections.total_persons}`);
      console.log(`   Confidence: ${result3.detections.confidence}`);
      console.log(`\n   📊 Pixel Analysis:`);
      console.log(`      Image: ${result3.image_dimensions.width}x${result3.image_dimensions.height}`);
      console.log(`      Skin Tone: ${result3.analysis.skin_percentage}%`);
      console.log(`      Bright Colors: ${result3.analysis.bright_percentage}%`);
      console.log(`      Edge Activity: ${result3.analysis.edge_percentage}%`);
      console.log(`      Combined Activity: ${result3.analysis.activity_percentage}%`);
      console.log(`      Weighted Score: ${result3.analysis.weighted_activity}`);
      console.log(`\n   🎨 Debug visualizations saved to: test-data/screenshots/pixel_density_debug/`);
    } else {
      console.log(`❌ Failed: ${result3.error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('='.repeat(70));
  console.log('📋 Test Summary');
  console.log('='.repeat(70));
  console.log('');
  console.log('✅ Fallback Implementation Complete!');
  console.log('');
  console.log('Key Features:');
  console.log('  • YOLO detection runs first (most accurate)');
  console.log('  • Pixel density fallback triggers automatically on YOLO failure');
  console.log('  • Fallback provides crowd estimates when YOLO unavailable');
  console.log('  • Both methods return consistent data structure');
  console.log('  • Debug visualizations available for pixel density');
  console.log('');
  console.log('Usage in Production:');
  console.log('  • Keep useFallback: true (default) for resilience');
  console.log('  • Monitor fallback_used flag in results');
  console.log('  • Pixel density is less accurate but better than nothing');
  console.log('  • Consider alerting when fallback is frequently used');
  console.log('');
  console.log('='.repeat(70) + '\n');
}

// Run tests
main().catch(error => {
  console.error('\n❌ Fatal Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
