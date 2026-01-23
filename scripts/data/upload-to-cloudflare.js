/**
 * Upload utility for sending screenshots to Cloudflare R2 and data to D1
 * This script is called by the local scraper after capturing screenshots
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Configuration
 * These should be set via environment variables in production
 */
const config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  r2BucketName: process.env.R2_BUCKET_NAME || 'beachwatch-images',
  databaseId: process.env.D1_DATABASE_ID,
  workerUrl: process.env.WORKER_URL // Optional: URL to your deployed worker
};

/**
 * Upload image to R2 bucket
 */
async function uploadImageToR2(imagePath, key) {
  if (!config.accountId || !config.apiToken) {
    console.warn('⚠️  Cloudflare credentials not configured. Skipping R2 upload.');
    return null;
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);

    // Use Cloudflare R2 API
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.r2BucketName}/objects/${key}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'image/png'
      },
      body: imageBuffer
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.statusText}`);
    }

    console.log(`✅ Uploaded to R2: ${key}`);
    return key;

  } catch (error) {
    console.error(`❌ R2 upload error: ${error.message}`);
    return null;
  }
}

/**
 * Store snapshot data in D1 database
 */
async function storeInD1(snapshotData) {
  if (!config.accountId || !config.apiToken || !config.databaseId) {
    console.warn('⚠️  Cloudflare D1 credentials not configured. Skipping D1 storage.');
    return null;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;

    // Create snapshot record
    const snapshotQuery = {
      sql: `INSERT INTO snapshots (id, beach_id, image_url, captured_at, processing_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      params: [
        snapshotData.id,
        snapshotData.beach_id,
        snapshotData.image_url,
        snapshotData.captured_at,
        snapshotData.processing_status || 'completed',
        Math.floor(Date.now() / 1000)
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(snapshotQuery)
    });

    if (!response.ok) {
      throw new Error(`D1 query failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`D1 error: ${result.errors?.[0]?.message || 'Unknown error'}`);
    }

    console.log(`✅ Stored snapshot in D1: ${snapshotData.id}`);

    // Store busyness score if available
    if (snapshotData.analysis) {
      const scoreQuery = {
        sql: `INSERT INTO busyness_scores (id, snapshot_id, person_count, busyness_score, detection_method, confidence, analysis_duration_ms, metadata, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          `${snapshotData.id}_score`,
          snapshotData.id,
          snapshotData.analysis.person_count,
          snapshotData.analysis.busyness_score,
          snapshotData.analysis.method,
          snapshotData.analysis.confidence_stats?.avg || null,
          snapshotData.analysis.analysis_duration ? Math.floor(snapshotData.analysis.analysis_duration * 1000) : null,
          JSON.stringify(snapshotData.analysis),
          Math.floor(Date.now() / 1000)
        ]
      };

      const scoreResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreQuery)
      });

      if (scoreResponse.ok) {
        console.log(`✅ Stored busyness score in D1`);
      }
    }

    return snapshotData.id;

  } catch (error) {
    console.error(`❌ D1 storage error: ${error.message}`);
    return null;
  }
}

/**
 * Generate a unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate R2 key from beach and webcam info
 */
function generateImageKey(beachId, webcamId, timestamp = null) {
  const date = timestamp ? new Date(timestamp) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestampStr = date.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');

  return `${beachId}/${year}/${month}/${timestampStr}_${webcamId}.png`;
}

/**
 * Upload a scraped result to Cloudflare
 */
async function uploadScrapedResult(result) {
  if (!result.success || !result.filepath) {
    console.log('⏭️  Skipping upload for failed scrape');
    return null;
  }

  console.log(`\n📤 Uploading to Cloudflare...`);

  // Generate image key
  const imageKey = generateImageKey(result.beach_id, result.webcam_id, result.timestamp);

  // Upload image to R2
  const r2Key = await uploadImageToR2(result.filepath, imageKey);

  if (!r2Key) {
    console.warn('⚠️  Image upload failed, storing with local path');
  }

  // Prepare snapshot data
  const snapshotData = {
    id: generateId(),
    beach_id: result.beach_id,
    image_url: r2Key ? `/images/${r2Key}` : result.filepath,
    captured_at: Math.floor(new Date(result.timestamp).getTime() / 1000),
    processing_status: 'completed',
    analysis: result.analysis
  };

  // Store in D1
  const snapshotId = await storeInD1(snapshotData);

  if (snapshotId) {
    console.log(`✅ Upload complete: ${snapshotId}`);
  }

  return snapshotId;
}

/**
 * Main function
 */
async function main() {
  // Check if running as a standalone script
  if (process.argv.length > 2) {
    const filepath = process.argv[2];
    const beachId = process.argv[3] || 'test';
    const webcamId = process.argv[4] || 'test-webcam';

    console.log(`Uploading single file: ${filepath}`);

    const result = {
      success: true,
      filepath,
      beach_id: beachId,
      webcam_id: webcamId,
      timestamp: new Date().toISOString()
    };

    await uploadScrapedResult(result);
  } else {
    console.log('Usage: node upload-to-cloudflare.js <filepath> <beachId> <webcamId>');
    console.log('Or call uploadScrapedResult(result) programmatically');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  uploadScrapedResult,
  uploadImageToR2,
  storeInD1,
  generateImageKey
};
