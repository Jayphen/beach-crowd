# Beach Webcam Scraper - Documentation

This document provides instructions for running and understanding the Bondi Beach webcam scraper built with Playwright.

## Overview

The scraper captures screenshots from the Bondi Beach webcam at Bondi Surf Club, saving timestamped images for crowd analysis and monitoring.

**Target Webcam:** [Bondi Surf Club Live Cam](https://bondisurfclub.com/bondi-surf-cam/)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Chromium browser for Playwright (if not already installed):
```bash
npx playwright install chromium
```

## Usage

### Run the scraper:

```bash
node scraper.js
```

### Expected Output:

```
🏖️  Starting Bondi Beach webcam scraper...
📅 1/23/2026, 1:23:23 AM
🔗 URL: https://bondisurfclub.com/bondi-surf-cam/

🌐 Launching browser...
📡 Navigating to Bondi Surf Club webcam...
⏳ Waiting for webcam to load...
✅ Webcam element found
📸 Capturing screenshot...

✅ SUCCESS!
📁 Saved: screenshots/bondi_2026-01-22_14-23-41.png
📦 Size: 67.06 KB
⏱️  Duration: 17.82s
🚪 Browser closed
```

## Output

Screenshots are saved in the `screenshots/` directory with the following naming convention:

```
bondi_YYYY-MM-DD_HH-MM-SS.png
```

Example: `bondi_2026-01-22_14-23-41.png`

## How It Works

1. **Launch Browser**: Chromium browser is launched in headless mode
2. **Navigate**: Loads the Bondi Surf Club webcam page
3. **Wait**: Allows 5+ seconds for the webcam stream to load
4. **Capture**: Takes a viewport screenshot (1920x1080)
5. **Save**: Saves the image with a timestamp-based filename
6. **Log**: Reports success/failure with file size and duration

## Configuration

Key parameters in `scraper.js`:

- **URL**: `BONDI_WEBCAM_URL` - The webcam page to scrape
- **Directory**: `SCREENSHOTS_DIR` - Where screenshots are saved
- **Viewport**: 1920x1080 resolution
- **Timeout**: 30 seconds for page load
- **Wait Time**: 5 seconds for stream to initialize

## Return Value

The `scrapeWebcam()` function returns an object:

**Success:**
```javascript
{
  success: true,
  filepath: './screenshots/bondi_2026-01-22_14-23-41.png',
  filename: 'bondi_2026-01-22_14-23-41.png',
  fileSize: 68673, // bytes
  duration: 17.82,  // seconds
  timestamp: '2026-01-23T01:23:41.234Z'
}
```

**Failure:**
```javascript
{
  success: false,
  error: 'Error message here',
  duration: 5.23,
  timestamp: '2026-01-23T01:23:41.234Z'
}
```

## Error Handling

The scraper handles common errors:
- Network timeouts
- Page load failures
- Missing webcam elements (falls back to full page capture)
- Browser launch issues

Exit codes:
- `0`: Success
- `1`: Failure

## Using as a Module

You can import and use the scraper in other Node.js scripts:

```javascript
const { scrapeWebcam } = require('./scraper');

async function main() {
  const result = await scrapeWebcam();

  if (result.success) {
    console.log('Screenshot saved:', result.filepath);
  } else {
    console.error('Failed:', result.error);
  }
}

main();
```

## Next Steps

1. **Test Additional Beaches**: Expand to Manly, Coogee, Maroubra, etc.
2. **Automation**: Set up cron jobs or Cloudflare Workers for scheduled captures
3. **Analysis**: Integrate YOLOv8 person detection
4. **Storage**: Upload to Cloudflare R2 and store metadata in D1 database
5. **API**: Build Cloudflare Workers endpoints to serve the data

## Troubleshooting

**Issue: Browser fails to launch**
- Run: `npx playwright install chromium`
- Check: Ensure sufficient disk space

**Issue: Timeout errors**
- Increase timeout in `page.goto()` options
- Check your internet connection

**Issue: No screenshots saved**
- Verify `screenshots/` directory exists (auto-created)
- Check file permissions

**Issue: Screenshot is blank/black**
- The webcam stream may not have loaded
- Try increasing `waitForTimeout` duration
- Some webcams may require user interaction or have anti-bot protection

## Performance

Typical scrape duration: 15-20 seconds
- Browser launch: ~2s
- Page load: ~3-5s
- Webcam load wait: ~5s
- Screenshot capture: ~2-3s
- Cleanup: ~1s

## Testing Results

**Date**: 2026-01-23
**URL**: https://bondisurfclub.com/bondi-surf-cam/
**Status**: ✅ Working
**Screenshot Size**: ~67 KB
**Duration**: ~18 seconds
**Notes**: Successfully captures full page view of Bondi webcam

## License

ISC

## Author

BeachWatch Team
