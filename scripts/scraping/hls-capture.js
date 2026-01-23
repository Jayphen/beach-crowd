#!/usr/bin/env node
/**
 * HLS Stream Capture Script
 *
 * Captures frames from HLS streams using ffmpeg.
 * Much faster and more reliable than browser-based screenshot capture.
 *
 * Usage:
 *   node scripts/scraping/hls-capture.js [--beach <beachId>] [--all]
 *
 * Examples:
 *   node scripts/scraping/hls-capture.js --beach bondi
 *   node scripts/scraping/hls-capture.js --all
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, '../../config/beaches-config.json');

async function loadConfig() {
  const data = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Capture a frame from an HLS stream using ffmpeg
 */
async function captureHlsFrame(streamUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',                    // Overwrite output
      '-i', streamUrl,         // Input HLS stream
      '-frames:v', '1',        // Capture 1 frame
      '-update', '1',          // Update mode for single image
      '-q:v', '2',             // High quality JPEG
      outputPath
    ];

    const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: outputPath });
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      ffmpeg.kill('SIGTERM');
      reject(new Error('Capture timed out after 30 seconds'));
    }, 30000);
  });
}

/**
 * Generate output filename
 */
function generateFilename(beachId, webcamId) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${beachId}_${webcamId}_${timestamp}.jpg`;
}

/**
 * Capture all HLS webcams for a beach
 */
async function captureBeach(beach, outputDir) {
  const results = [];

  const hlsWebcams = beach.webcams.filter(w => w.hls_stream);

  if (hlsWebcams.length === 0) {
    console.log(`  No HLS streams configured for ${beach.name}`);
    return results;
  }

  for (const webcam of hlsWebcams) {
    const filename = generateFilename(beach.id, webcam.id);
    const outputPath = path.join(outputDir, filename);

    console.log(`  Capturing ${webcam.name}...`);

    try {
      const startTime = Date.now();
      await captureHlsFrame(webcam.hls_stream, outputPath);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      const stats = await fs.stat(outputPath);
      const sizeKb = (stats.size / 1024).toFixed(1);

      console.log(`    ✓ Captured in ${elapsed}s (${sizeKb} KB)`);

      results.push({
        beachId: beach.id,
        webcamId: webcam.id,
        webcamName: webcam.name,
        filepath: outputPath,
        timestamp: new Date().toISOString(),
        success: true
      });
    } catch (error) {
      console.log(`    ✗ Failed: ${error.message}`);
      results.push({
        beachId: beach.id,
        webcamId: webcam.id,
        webcamName: webcam.name,
        error: error.message,
        success: false
      });
    }
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const beachFilter = args.includes('--beach')
    ? args[args.indexOf('--beach') + 1]
    : null;
  const captureAll = args.includes('--all');

  console.log('\n🏖️  BeachWatch HLS Capture\n');

  // Check ffmpeg is available
  try {
    const { execSync } = await import('child_process');
    execSync('which ffmpeg', { stdio: 'pipe' });
  } catch {
    console.error('Error: ffmpeg not found. Install with: brew install ffmpeg');
    process.exit(1);
  }

  // Load config
  const config = await loadConfig();

  // Ensure output directory exists
  const outputDir = path.resolve(__dirname, '../../screenshots');
  await fs.mkdir(outputDir, { recursive: true });

  // Filter beaches
  let beaches = config.beaches.filter(b => b.enabled);

  if (beachFilter) {
    beaches = beaches.filter(b => b.id === beachFilter);
    if (beaches.length === 0) {
      console.error(`Beach "${beachFilter}" not found or not enabled`);
      process.exit(1);
    }
  } else if (!captureAll) {
    // Default to just beaches with HLS streams
    beaches = beaches.filter(b => b.webcams.some(w => w.hls_stream));
  }

  console.log(`Capturing ${beaches.length} beach(es)...\n`);

  const allResults = [];

  for (const beach of beaches) {
    console.log(`📍 ${beach.name}`);
    const results = await captureBeach(beach, outputDir);
    allResults.push(...results);
  }

  // Summary
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log('\n' + '─'.repeat(40));
  console.log(`\n✅ Captured: ${successful.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
  }
  console.log(`📁 Output: ${outputDir}\n`);

  return allResults;
}

// Run if called directly
main().catch(console.error);

export { captureHlsFrame, captureBeach, loadConfig };
