#!/usr/bin/env node

/**
 * Generate Test Data for BeachWatch
 * Creates 1 week of realistic test data for beaches, snapshots, and busyness scores
 */

const fs = require('fs');
const { randomUUID } = require('crypto');

// Configuration
const BEACHES = [
  {
    id: 'bondi',
    name: 'Bondi Beach',
    location: 'Waverley Council, Eastern Suburbs',
    webcam_url: 'https://bondisurfclub.com/bondi-surf-cam/',
    latitude: -33.8915,
    longitude: 151.2767,
    beach_area_sqm: 40000
  },
  {
    id: 'manly',
    name: 'Manly Beach',
    location: 'Northern Beaches Council',
    webcam_url: 'https://manlypacific.com.au/live-webcam/',
    latitude: -33.7969,
    longitude: 151.2899,
    beach_area_sqm: 35000
  },
  {
    id: 'coogee',
    name: 'Coogee Beach',
    location: 'Randwick City Council, Eastern Suburbs',
    webcam_url: 'https://www.randwick.nsw.gov.au/facilities-and-recreation/explore-randwick-city/beach-cams',
    latitude: -33.9231,
    longitude: 151.2585,
    beach_area_sqm: 28000
  },
  {
    id: 'maroubra',
    name: 'Maroubra Beach',
    location: 'Randwick City Council, Eastern Suburbs',
    webcam_url: 'https://www.brasurf.com.au/',
    latitude: -33.9506,
    longitude: 151.2590,
    beach_area_sqm: 45000
  }
];

const WEATHER_CONDITIONS = ['sunny', 'partly_cloudy', 'cloudy', 'overcast', 'rainy'];
const DETECTION_METHODS = ['yolov8', 'yolov8', 'yolov8', 'pixel_density']; // 75% yolov8

// Capture every 10 minutes for 1 week
const CAPTURES_PER_HOUR = 6;
const HOURS_PER_DAY = 24;
const DAYS = 7;
const TOTAL_CAPTURES_PER_BEACH = CAPTURES_PER_HOUR * HOURS_PER_DAY * DAYS;

// Start date: 7 days ago from now
const END_DATE = new Date();
const START_DATE = new Date(END_DATE.getTime() - (DAYS * 24 * 60 * 60 * 1000));

/**
 * Generate a realistic busyness score based on time of day and weather
 */
function generateBusynessScore(hour, dayOfWeek, weatherCondition) {
  let baseScore = 0;

  // Time of day patterns
  if (hour >= 6 && hour < 9) {
    baseScore = 15 + Math.random() * 25; // Early morning: 15-40
  } else if (hour >= 9 && hour < 12) {
    baseScore = 40 + Math.random() * 30; // Late morning: 40-70
  } else if (hour >= 12 && hour < 16) {
    baseScore = 60 + Math.random() * 35; // Peak afternoon: 60-95
  } else if (hour >= 16 && hour < 19) {
    baseScore = 35 + Math.random() * 30; // Late afternoon: 35-65
  } else if (hour >= 19 && hour < 22) {
    baseScore = 10 + Math.random() * 20; // Evening: 10-30
  } else {
    baseScore = 0 + Math.random() * 10; // Night: 0-10
  }

  // Weekend boost (Saturday=6, Sunday=0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    baseScore *= 1.3; // 30% busier on weekends
  }

  // Weather impact
  if (weatherCondition === 'sunny') {
    baseScore *= 1.2;
  } else if (weatherCondition === 'partly_cloudy') {
    baseScore *= 1.0;
  } else if (weatherCondition === 'cloudy') {
    baseScore *= 0.8;
  } else if (weatherCondition === 'rainy') {
    baseScore *= 0.3;
  }

  // Ensure within 0-100 range
  return Math.min(100, Math.max(0, Math.round(baseScore)));
}

/**
 * Generate person count from busyness score
 * Approximate: 1 person per 50 sqm at 100% capacity
 */
function generatePersonCount(busynessScore, beachAreaSqm) {
  const maxCapacity = Math.floor(beachAreaSqm / 50);
  const count = Math.round((busynessScore / 100) * maxCapacity);

  // Add some randomness (±10%)
  const variance = Math.floor(count * 0.1 * (Math.random() - 0.5) * 2);
  return Math.max(0, count + variance);
}

/**
 * Generate confidence score (higher for yolov8)
 */
function generateConfidence(detectionMethod) {
  if (detectionMethod === 'yolov8') {
    return 0.85 + Math.random() * 0.13; // 0.85-0.98
  } else {
    return 0.65 + Math.random() * 0.20; // 0.65-0.85
  }
}

/**
 * Generate temperature in Celsius (Sydney summer temps)
 */
function generateTemperature(hour, weatherCondition) {
  let baseTemp = 22; // Base temperature

  // Diurnal variation
  if (hour >= 0 && hour < 6) {
    baseTemp = 18 + Math.random() * 4; // Night: 18-22°C
  } else if (hour >= 6 && hour < 12) {
    baseTemp = 20 + Math.random() * 6; // Morning: 20-26°C
  } else if (hour >= 12 && hour < 18) {
    baseTemp = 24 + Math.random() * 8; // Afternoon: 24-32°C
  } else {
    baseTemp = 21 + Math.random() * 5; // Evening: 21-26°C
  }

  // Weather adjustment
  if (weatherCondition === 'rainy' || weatherCondition === 'overcast') {
    baseTemp -= 3;
  }

  return Math.round(baseTemp * 10) / 10; // Round to 1 decimal
}

/**
 * Generate SQL INSERT statements
 */
function generateTestData() {
  const beachesSQL = [];
  const snapshotsSQL = [];
  const busynessScoresSQL = [];

  // Generate beaches data
  const now = Date.now();
  const baseTimestamp = Math.floor(now / 1000);

  BEACHES.forEach(beach => {
    beachesSQL.push(
      `INSERT INTO beaches (id, name, location, webcam_url, latitude, longitude, beach_area_sqm, active, created_at) VALUES ('${beach.id}', '${beach.name}', '${beach.location}', '${beach.webcam_url}', ${beach.latitude}, ${beach.longitude}, ${beach.beach_area_sqm}, 1, ${baseTimestamp});`
    );
  });

  // Generate snapshots and busyness scores for each beach
  let totalSnapshots = 0;

  BEACHES.forEach(beach => {
    console.error(`Generating data for ${beach.name}...`);

    for (let i = 0; i < TOTAL_CAPTURES_PER_BEACH; i++) {
      // Calculate timestamp (every 10 minutes)
      const captureTime = new Date(START_DATE.getTime() + (i * 10 * 60 * 1000));
      const capturedAt = Math.floor(captureTime.getTime() / 1000);
      const hour = captureTime.getHours();
      const dayOfWeek = captureTime.getDay();

      // Generate realistic data
      const weatherCondition = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
      const temperature = generateTemperature(hour, weatherCondition);
      const busynessScore = generateBusynessScore(hour, dayOfWeek, weatherCondition);
      const personCount = generatePersonCount(busynessScore, beach.beach_area_sqm);
      const detectionMethod = DETECTION_METHODS[Math.floor(Math.random() * DETECTION_METHODS.length)];
      const confidence = generateConfidence(detectionMethod);
      const analysisDuration = 1500 + Math.floor(Math.random() * 2000); // 1.5-3.5 seconds

      // Generate UUIDs
      const snapshotId = randomUUID();
      const scoreId = randomUUID();

      // R2 URL pattern
      const dateStr = captureTime.toISOString().split('T')[0];
      const timeStr = captureTime.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
      const imageUrl = `https://beachwatch.r2.dev/snapshots/${beach.id}/${dateStr}/${beach.id}_${timeStr}.jpg`;

      // Metadata JSON
      const metadata = {
        detection_boxes: personCount,
        avg_confidence: confidence,
        processing_version: '1.0',
        model: detectionMethod === 'yolov8' ? 'yolov8n' : 'pixel_density_v1'
      };

      // Create SQL statements
      snapshotsSQL.push(
        `INSERT INTO snapshots (id, beach_id, image_url, captured_at, weather_condition, temperature_celsius, processing_status, created_at) VALUES ('${snapshotId}', '${beach.id}', '${imageUrl}', ${capturedAt}, '${weatherCondition}', ${temperature}, 'completed', ${capturedAt + 5});`
      );

      busynessScoresSQL.push(
        `INSERT INTO busyness_scores (id, snapshot_id, person_count, busyness_score, detection_method, confidence, analysis_duration_ms, metadata, created_at) VALUES ('${scoreId}', '${snapshotId}', ${personCount}, ${busynessScore}, '${detectionMethod}', ${confidence.toFixed(3)}, ${analysisDuration}, '${JSON.stringify(metadata)}', ${capturedAt + 5});`
      );

      totalSnapshots++;
    }
  });

  console.error(`\nGenerated ${totalSnapshots} total snapshots across ${BEACHES.length} beaches`);
  console.error(`Period: ${START_DATE.toISOString()} to ${END_DATE.toISOString()}\n`);

  return {
    beaches: beachesSQL,
    snapshots: snapshotsSQL,
    busynessScores: busynessScoresSQL
  };
}

/**
 * Main execution
 */
function main() {
  console.error('BeachWatch Test Data Generator');
  console.error('================================\n');
  console.error(`Generating ${DAYS} days of test data...`);
  console.error(`Captures per beach: ${TOTAL_CAPTURES_PER_BEACH}`);
  console.error(`Total captures: ${TOTAL_CAPTURES_PER_BEACH * BEACHES.length}\n`);

  const data = generateTestData();

  // Build complete SQL file
  const sqlLines = [
    '-- BeachWatch Test Data',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Period: ${DAYS} days (${START_DATE.toISOString()} to ${END_DATE.toISOString()})`,
    `-- Total snapshots: ${data.snapshots.length}`,
    '',
    '-- Clear existing data',
    'DELETE FROM busyness_scores;',
    'DELETE FROM snapshots;',
    'DELETE FROM beaches;',
    '',
    '-- Insert beaches',
    ...data.beaches,
    '',
    '-- Insert snapshots',
    ...data.snapshots,
    '',
    '-- Insert busyness scores',
    ...data.busynessScores,
    ''
  ];

  const sql = sqlLines.join('\n');

  // Write to file
  const outputFile = 'test-data.sql';
  fs.writeFileSync(outputFile, sql);

  console.error(`✅ Test data written to ${outputFile}`);
  console.error(`   File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
  console.error(`   Beaches: ${data.beaches.length}`);
  console.error(`   Snapshots: ${data.snapshots.length}`);
  console.error(`   Busyness scores: ${data.busynessScores.length}`);
}

// Run the generator
main();
