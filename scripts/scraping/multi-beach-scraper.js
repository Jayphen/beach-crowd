const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { analyzeBeachCrowd } = require('./yolo-integration');
const { uploadScrapedResult } = require('./upload-to-cloudflare');

/**
 * Multi-Beach Webcam Scraper
 * Captures screenshots from multiple Sydney beach webcams using Playwright
 */

// Load configuration
const config = JSON.parse(fs.readFileSync('./beaches-config.json', 'utf-8'));
const { beaches, scraper_config } = config;

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(scraper_config.screenshots_dir)) {
  fs.mkdirSync(scraper_config.screenshots_dir, { recursive: true });
}

/**
 * Generate a timestamp-based filename
 * Format: {beachId}_{webcamId}_YYYY-MM-DD_HH-MM-SS.png
 */
function generateFilename(beachId, webcamId) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `${beachId}_${webcamId}_${timestamp}.png`;
}

/**
 * Scrape a single webcam
 */
async function scrapeWebcam(beach, webcam, browser) {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏖️  ${beach.name} - ${webcam.name}`);
  console.log(`🔗 ${webcam.url}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Create new context for this webcam
    const context = await browser.newContext({
      viewport: scraper_config.viewport,
      userAgent: scraper_config.user_agent
    });
    const page = await context.newPage();

    // Navigate to webcam page
    console.log('📡 Navigating to webcam...');
    await page.goto(webcam.url, {
      waitUntil: 'domcontentloaded',
      timeout: scraper_config.timeout
    });

    // Wait for page to load completely
    console.log('⏳ Waiting for webcam to load...');
    await page.waitForTimeout(scraper_config.wait_for_load);

    // Try to find and wait for video/iframe element
    try {
      const videoSelector = 'video, iframe[src*="youtube"], iframe[src*="player"], iframe[src*="stream"], .video-container, img[src*="webcam"], img[src*="cam"]';
      await page.waitForSelector(videoSelector, { timeout: 10000 });
      console.log('✅ Webcam element found');
    } catch (e) {
      console.log('⚠️  Could not detect specific webcam element, proceeding with full page capture');
    }

    // Generate filename
    const filename = generateFilename(beach.id, webcam.id);
    const filepath = path.join(scraper_config.screenshots_dir, filename);

    // Capture screenshot
    console.log('📸 Capturing screenshot...');
    await page.screenshot({
      path: filepath,
      fullPage: false
    });

    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    // Close context
    await context.close();

    // Analyze screenshot with YOLOv8 person detection
    console.log('🤖 Analyzing crowd with YOLOv8...');
    const analysisResult = await analyzeBeachCrowd(filepath, {
      model: 'yolov8m.pt',
      confidence: 0.5,
      saveAnnotated: false
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Success!
    console.log('\n✅ SUCCESS!');
    console.log(`📁 Saved: ${filepath}`);
    console.log(`📦 Size: ${fileSizeKB} KB`);

    if (analysisResult.success) {
      console.log(`👥 People Detected: ${analysisResult.person_count}`);
      console.log(`📊 Busyness Score: ${analysisResult.busyness_score}/100 (${analysisResult.busyness_level})`);
      console.log(`🎯 Avg Confidence: ${analysisResult.confidence_stats.avg.toFixed(2)}`);
    } else {
      console.log(`⚠️  Analysis failed: ${analysisResult.error}`);
    }

    console.log(`⏱️  Duration: ${duration}s`);

    const result = {
      success: true,
      beach_id: beach.id,
      beach_name: beach.name,
      webcam_id: webcam.id,
      webcam_name: webcam.name,
      filepath,
      filename,
      fileSize: stats.size,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString(),
      url: webcam.url,
      analysis: analysisResult
    };

    // Upload to Cloudflare R2 and D1 (if configured)
    try {
      await uploadScrapedResult(result);
    } catch (uploadError) {
      console.warn(`⚠️  Upload to Cloudflare failed: ${uploadError.message}`);
      console.warn('📝 Data saved locally only');
    }

    return result;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error('\n❌ FAILURE!');
    console.error(`⚠️  Error: ${error.message}`);
    console.error(`⏱️  Duration: ${duration}s`);

    return {
      success: false,
      beach_id: beach.id,
      beach_name: beach.name,
      webcam_id: webcam.id,
      webcam_name: webcam.name,
      error: error.message,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString(),
      url: webcam.url
    };
  }
}

/**
 * Scrape a specific beach (all its webcams)
 */
async function scrapeBeach(beach, browser) {
  if (!beach.enabled) {
    console.log(`\n⏭️  Skipping ${beach.name} (disabled)`);
    return {
      beach_id: beach.id,
      beach_name: beach.name,
      skipped: true,
      reason: 'Beach disabled in config'
    };
  }

  if (!beach.webcams || beach.webcams.length === 0) {
    console.log(`\n⏭️  Skipping ${beach.name} (no webcams configured)`);
    return {
      beach_id: beach.id,
      beach_name: beach.name,
      skipped: true,
      reason: 'No webcams configured'
    };
  }

  console.log(`\n🌊 Processing ${beach.name} (${beach.webcams.length} webcam${beach.webcams.length > 1 ? 's' : ''})...`);

  const results = [];

  // Sort webcams by priority
  const sortedWebcams = [...beach.webcams].sort((a, b) => a.priority - b.priority);

  for (const webcam of sortedWebcams) {
    const result = await scrapeWebcam(beach, webcam, browser);
    results.push(result);

    // If successful, we might want to skip other webcams (optional behavior)
    // For now, we'll capture all webcams regardless of success
  }

  return {
    beach_id: beach.id,
    beach_name: beach.name,
    location: beach.location,
    webcams: results,
    total_webcams: results.length,
    successful_webcams: results.filter(r => r.success).length,
    failed_webcams: results.filter(r => !r.success).length
  };
}

/**
 * Scrape all beaches
 */
async function scrapeAllBeaches(beachFilter = null) {
  const startTime = Date.now();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🏖️  MULTI-BEACH WEBCAM SCRAPER - BeachWatch MVP          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`📅 ${new Date().toLocaleString()}`);
  console.log(`📊 Configuration loaded: ${beaches.length} beaches total`);

  // Filter beaches if specified
  let beachesToScrape = beaches;
  if (beachFilter) {
    beachesToScrape = beaches.filter(b =>
      beachFilter.includes(b.id) || beachFilter.includes(b.name.toLowerCase())
    );
    console.log(`🎯 Filter applied: ${beachesToScrape.length} beach(es) selected`);
  }

  const enabledBeaches = beachesToScrape.filter(b => b.enabled);
  console.log(`✅ ${enabledBeaches.length} enabled beach(es) to scrape`);

  let browser;
  const results = [];

  try {
    // Launch browser once for all scrapes
    console.log('\n🌐 Launching browser...');
    browser = await chromium.launch({
      headless: scraper_config.headless
    });
    console.log('✅ Browser launched successfully\n');

    // Scrape each beach
    for (const beach of beachesToScrape) {
      const result = await scrapeBeach(beach, browser);
      results.push(result);
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Summary
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      📊 SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const processedBeaches = results.filter(r => !r.skipped);
    const skippedBeaches = results.filter(r => r.skipped);

    console.log(`\n🏖️  Beaches Processed: ${processedBeaches.length}`);
    console.log(`⏭️  Beaches Skipped: ${skippedBeaches.length}`);

    if (processedBeaches.length > 0) {
      const totalWebcams = processedBeaches.reduce((sum, r) => sum + (r.total_webcams || 0), 0);
      const successfulWebcams = processedBeaches.reduce((sum, r) => sum + (r.successful_webcams || 0), 0);
      const failedWebcams = processedBeaches.reduce((sum, r) => sum + (r.failed_webcams || 0), 0);

      console.log(`📸 Total Webcams Attempted: ${totalWebcams}`);
      console.log(`✅ Successful Captures: ${successfulWebcams}`);
      console.log(`❌ Failed Captures: ${failedWebcams}`);
      console.log(`📈 Success Rate: ${((successfulWebcams / totalWebcams) * 100).toFixed(1)}%`);
    }

    console.log(`⏱️  Total Duration: ${totalDuration}s`);
    console.log(`📁 Screenshots saved to: ${scraper_config.screenshots_dir}/`);

    // Detailed results
    console.log('\n📋 Detailed Results:');
    processedBeaches.forEach(beach => {
      const icon = beach.successful_webcams === beach.total_webcams ? '✅' :
                   beach.successful_webcams > 0 ? '⚠️' : '❌';
      console.log(`  ${icon} ${beach.beach_name}: ${beach.successful_webcams}/${beach.total_webcams} webcams captured`);

      // Show crowd analysis for successful webcams
      if (beach.webcams && beach.webcams.length > 0) {
        beach.webcams.forEach(webcam => {
          if (webcam.success && webcam.analysis && webcam.analysis.success) {
            console.log(`     └─ 👥 ${webcam.analysis.person_count} people | 📊 ${webcam.analysis.busyness_level} (${webcam.analysis.busyness_score}/100)`);
          }
        });
      }
    });

    if (skippedBeaches.length > 0) {
      console.log('\n⏭️  Skipped:');
      skippedBeaches.forEach(beach => {
        console.log(`  • ${beach.beach_name}: ${beach.reason}`);
      });
    }

    console.log('\n✨ Done!\n');

    return {
      success: true,
      total_duration: parseFloat(totalDuration),
      beaches: results,
      summary: {
        processed: processedBeaches.length,
        skipped: skippedBeaches.length,
        total_webcams: processedBeaches.reduce((sum, r) => sum + (r.total_webcams || 0), 0),
        successful_webcams: processedBeaches.reduce((sum, r) => sum + (r.successful_webcams || 0), 0),
        failed_webcams: processedBeaches.reduce((sum, r) => sum + (r.failed_webcams || 0), 0)
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error('\n\n❌ FATAL ERROR!');
    console.error(`⚠️  Error: ${error.message}`);
    console.error(`⏱️  Duration: ${totalDuration}s\n`);

    return {
      success: false,
      error: error.message,
      total_duration: parseFloat(totalDuration),
      beaches: results,
      timestamp: new Date().toISOString()
    };

  } finally {
    // Close browser
    if (browser) {
      await browser.close();
      console.log('🚪 Browser closed\n');
    }
  }
}

/**
 * CLI argument parsing
 */
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    beaches: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--beaches' || arg === '-b') {
      options.beaches = args[i + 1] ? args[i + 1].split(',').map(b => b.trim().toLowerCase()) : null;
      i++;
    } else if (!arg.startsWith('-')) {
      // Assume it's a beach list without --beaches flag
      options.beaches = arg.split(',').map(b => b.trim().toLowerCase());
    }
  }

  return options;
}

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🏖️  Multi-Beach Webcam Scraper - Help                    ║
╚════════════════════════════════════════════════════════════╝

USAGE:
  node multi-beach-scraper.js [OPTIONS]

OPTIONS:
  --beaches, -b <list>   Comma-separated list of beach IDs or names
  --help, -h             Show this help message

EXAMPLES:
  # Scrape all enabled beaches
  node multi-beach-scraper.js

  # Scrape specific beaches by ID
  node multi-beach-scraper.js --beaches bondi,manly

  # Scrape specific beaches (shorthand)
  node multi-beach-scraper.js bondi,manly,coogee

AVAILABLE BEACHES:
${beaches.map(b => `  • ${b.id.padEnd(12)} - ${b.name} ${b.enabled ? '✅' : '❌ (disabled)'}`).join('\n')}

CONFIGURATION:
  Edit beaches-config.json to:
  - Add/remove beaches
  - Enable/disable beaches
  - Configure webcam URLs
  - Adjust scraper settings

OUTPUT:
  Screenshots saved to: ${scraper_config.screenshots_dir}/
  Filename format: {beachId}_{webcamId}_YYYY-MM-DD_HH-MM-SS.png
`);
}

// Run the scraper when executed directly
if (require.main === module) {
  const options = parseCliArgs();

  if (options.help) {
    displayHelp();
    process.exit(0);
  }

  scrapeAllBeaches(options.beaches)
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  scrapeAllBeaches,
  scrapeBeach,
  scrapeWebcam
};
