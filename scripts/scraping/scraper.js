const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Beach Webcam Scraper - Bondi Beach
 * Captures screenshots from Bondi Beach webcam using Playwright
 */

const BONDI_WEBCAM_URL = 'https://bondisurfclub.com/bondi-surf-cam/';
const SCREENSHOTS_DIR = './screenshots';

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Generate a timestamp-based filename
 * Format: bondi_YYYY-MM-DD_HH-MM-SS.png
 */
function generateFilename() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `bondi_${timestamp}.png`;
}

/**
 * Main scraper function
 */
async function scrapeWebcam() {
  const startTime = Date.now();
  console.log('🏖️  Starting Bondi Beach webcam scraper...');
  console.log(`📅 ${new Date().toLocaleString()}`);
  console.log(`🔗 URL: ${BONDI_WEBCAM_URL}`);

  let browser;

  try {
    // Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // Navigate to webcam page
    console.log('📡 Navigating to Bondi Surf Club webcam...');
    await page.goto(BONDI_WEBCAM_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to load completely
    console.log('⏳ Waiting for webcam to load...');
    await page.waitForTimeout(5000); // Give webcam stream time to load

    // Try to find and wait for video/iframe element
    try {
      const videoSelector = 'video, iframe[src*="youtube"], iframe[src*="player"], .video-container';
      await page.waitForSelector(videoSelector, { timeout: 10000 });
      console.log('✅ Webcam element found');
    } catch (e) {
      console.log('⚠️  Could not detect specific webcam element, proceeding with full page capture');
    }

    // Generate filename
    const filename = generateFilename();
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    // Capture screenshot
    console.log('📸 Capturing screenshot...');
    await page.screenshot({
      path: filepath,
      fullPage: false // Capture viewport only
    });

    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Success!
    console.log('\n✅ SUCCESS!');
    console.log(`📁 Saved: ${filepath}`);
    console.log(`📦 Size: ${fileSizeKB} KB`);
    console.log(`⏱️  Duration: ${duration}s`);

    return {
      success: true,
      filepath,
      filename,
      fileSize: stats.size,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error('\n❌ FAILURE!');
    console.error(`⚠️  Error: ${error.message}`);
    console.error(`⏱️  Duration: ${duration}s`);

    return {
      success: false,
      error: error.message,
      duration: parseFloat(duration),
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

// Run the scraper
if (require.main === module) {
  scrapeWebcam()
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

module.exports = { scrapeWebcam };
