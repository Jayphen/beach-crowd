/**
 * Test script for YOLOv8 Integration
 * Tests the analyzeBeachCrowd function on existing screenshots
 */

const { analyzeBeachCrowd, checkDependencies } = require('./yolo-integration');
const fs = require('fs');
const path = require('path');

async function testIntegration() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 YOLOv8 Integration Test - BeachWatch MVP              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check dependencies
  console.log('🔍 Checking YOLOv8 dependencies...');
  const depsStatus = await checkDependencies();

  if (depsStatus.installed) {
    console.log('✅', depsStatus.message);
  } else {
    console.log('❌', depsStatus.message);
    console.log('   ', depsStatus.error);
    process.exit(1);
  }

  // Find test images
  const screenshotsDir = './screenshots';
  const screenshots = fs.readdirSync(screenshotsDir)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(screenshotsDir, f))
    .slice(0, 3); // Test first 3 images

  if (screenshots.length === 0) {
    console.log('\n❌ No screenshots found in ./screenshots/');
    console.log('   Run "npm run scrape" first to capture beach images');
    process.exit(1);
  }

  console.log(`\n📸 Found ${screenshots.length} screenshot(s) to analyze\n`);

  // Analyze each screenshot
  for (const imagePath of screenshots) {
    const filename = path.basename(imagePath);
    console.log(`${'─'.repeat(60)}`);
    console.log(`📷 Analyzing: ${filename}`);
    console.log(`${'─'.repeat(60)}`);

    const result = await analyzeBeachCrowd(imagePath, {
      model: 'yolov8m.pt',
      confidence: 0.5
    });

    if (result.success) {
      console.log(`✅ Analysis successful!`);
      console.log(`   👥 People detected: ${result.person_count}`);
      console.log(`   📊 Busyness score: ${result.busyness_score}/100 (${result.busyness_level})`);
      console.log(`   🎯 Avg confidence: ${result.confidence_stats.avg.toFixed(3)}`);
      console.log(`   ⏱️  Analysis time: ${result.analysis_duration}s`);
    } else {
      console.log(`❌ Analysis failed: ${result.error}`);
    }

    console.log('');
  }

  console.log(`${'='.repeat(60)}`);
  console.log('✨ Integration test complete!\n');
}

// Run test
testIntegration()
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
