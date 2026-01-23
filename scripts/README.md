# Scripts

Utility scripts for development, testing, and data management.

## Directory Structure

### scraping/
Webcam scraping and screenshot capture scripts.

- **scraper.js** - Single beach scraper
- **multi-beach-scraper.js** - Multi-beach scraping orchestrator
- **README-scraper.md** - Detailed scraper documentation

### data/
Data generation and upload utilities.

- **generate-test-data.js** - Generate synthetic test data
- **upload-to-cloudflare.js** - Upload images and data to Cloudflare

### testing/
Test scripts for validation and integration testing.

- **test-busyness-score.js** - Test busyness score calculations
- **test-integration.js** - End-to-end integration tests
- **test-pixel-density-fallback.js** - Test pixel density fallback analysis

## Root Scripts

- **seed-beaches.js** - Seed D1 database with beach data

## Usage

Most scripts can be run via npm commands defined in `package.json`:

```bash
# Scraping
npm run scrape:all
npm run scrape:bondi

# Testing
npm run test:yolo
npm run test:e2e

# Database
npm run d1:seed
```

For direct execution:

```bash
node scripts/scraping/scraper.js
node scripts/data/generate-test-data.js
node scripts/testing/test-integration.js
```
