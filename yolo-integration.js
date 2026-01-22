import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * YOLOv8 Integration Module
 * Provides person detection capabilities for beach crowd analysis
 * Calls Python YOLOv8 detector and returns structured results
 */

/**
 * Calculate person density per 100 square meters
 *
 * @param {number} personCount - Number of people detected
 * @param {number} areaSqm - Beach area in square meters
 * @returns {number} Density (people per 100 sqm)
 */
function calculateDensity(personCount, areaSqm) {
  if (!areaSqm || areaSqm <= 0) {
    throw new Error('Beach area must be a positive number');
  }
  return (personCount / areaSqm) * 100;
}

/**
 * Calculate busyness score based on person density and beach area
 * Uses a sophisticated algorithm that normalizes crowd levels across different beach sizes
 *
 * @param {number} personCount - Number of people detected
 * @param {Object} options - Configuration options
 * @param {number} options.beachArea - Visible beach area in square meters
 * @param {number} options.quietDensity - Density threshold for quiet (people per 100 sqm)
 * @param {number} options.moderateDensity - Density threshold for moderate (people per 100 sqm)
 * @param {number} options.busyDensity - Density threshold for busy (people per 100 sqm)
 * @param {number} options.veryBusyDensity - Density threshold for very busy (people per 100 sqm)
 * @returns {Object} Object containing score, density, and level
 */
function calculateBusynessScoreWithArea(personCount, options = {}) {
  const {
    beachArea = null,
    quietDensity = 0.5,      // 0.5 people per 100 sqm = quiet
    moderateDensity = 2.0,   // 2.0 people per 100 sqm = moderate
    busyDensity = 4.0,       // 4.0 people per 100 sqm = busy
    veryBusyDensity = 8.0    // 8.0 people per 100 sqm = very busy
  } = options;

  // Validate inputs
  if (personCount < 0) {
    throw new Error('Person count cannot be negative');
  }

  if (!beachArea) {
    throw new Error('Beach area is required for density-based calculation');
  }

  // Calculate density (people per 100 square meters)
  const density = calculateDensity(personCount, beachArea);

  // Calculate score based on density thresholds
  let score;
  let level;

  if (density === 0) {
    // Empty beach
    score = 0;
    level = 'Empty';
  } else if (density <= quietDensity) {
    // Quiet: 0-25 score (non-linear curve for better UX)
    score = Math.round((density / quietDensity) * 25);
    level = 'Quiet';
  } else if (density <= moderateDensity) {
    // Moderate: 25-50 score
    const range = moderateDensity - quietDensity;
    const position = density - quietDensity;
    score = Math.round(25 + (position / range) * 25);
    level = 'Moderate';
  } else if (density <= busyDensity) {
    // Busy: 50-75 score
    const range = busyDensity - moderateDensity;
    const position = density - moderateDensity;
    score = Math.round(50 + (position / range) * 25);
    level = 'Busy';
  } else {
    // Very Busy: 75-100 score
    const range = veryBusyDensity - busyDensity;
    const position = Math.min(density - busyDensity, range);
    score = Math.round(75 + (position / range) * 25);
    score = Math.min(score, 100); // Cap at 100
    level = 'Very Busy';
  }

  return {
    score,
    level,
    density: parseFloat(density.toFixed(2)),
    personCount,
    beachArea
  };
}

/**
 * Calculate busyness score based on person count (legacy method)
 * Kept for backward compatibility
 *
 * @param {number} personCount - Number of people detected
 * @param {Object} options - Configuration options
 * @returns {number} Busyness score from 0-100
 */
function calculateBusynessScore(personCount, options = {}) {
  // Default thresholds (can be customized per beach)
  const {
    quietThreshold = 10,      // < 10 people = quiet
    moderateThreshold = 50,   // 10-50 people = moderate
    busyThreshold = 100,      // 50-100 people = busy
    maxCapacity = 200         // > 200 people = very busy (max score)
  } = options;

  if (personCount === 0) {
    return 0; // Empty beach
  } else if (personCount < quietThreshold) {
    // Quiet: 0-25 score
    return Math.round((personCount / quietThreshold) * 25);
  } else if (personCount < moderateThreshold) {
    // Moderate: 25-50 score
    const range = moderateThreshold - quietThreshold;
    const position = personCount - quietThreshold;
    return Math.round(25 + (position / range) * 25);
  } else if (personCount < busyThreshold) {
    // Busy: 50-75 score
    const range = busyThreshold - moderateThreshold;
    const position = personCount - moderateThreshold;
    return Math.round(50 + (position / range) * 25);
  } else {
    // Very Busy: 75-100 score
    const range = maxCapacity - busyThreshold;
    const position = Math.min(personCount - busyThreshold, range);
    return Math.round(75 + (position / range) * 25);
  }
}

/**
 * Get busyness level label based on score
 *
 * @param {number} score - Busyness score (0-100)
 * @returns {string} Busyness level label
 */
function getBusynessLevel(score) {
  if (score < 25) return 'Quiet';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'Busy';
  return 'Very Busy';
}

/**
 * Detect persons in an image using YOLOv8
 *
 * @param {string} imagePath - Path to the image file
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detection results with person count and confidence
 */
async function detectPersons(imagePath, options = {}) {
  const {
    model = 'yolov8m.pt',
    confidence = 0.5,
    saveAnnotated = false,
    pythonPath = path.join(__dirname, 'venv', 'bin', 'python3')
  } = options;

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'yolo-detector.py');

    const args = [
      scriptPath,
      imagePath,
      '--model', model,
      '--confidence', confidence.toString(),
      '--json'
    ];

    if (saveAnnotated) {
      args.push('--save-annotated');
    }

    const pythonProcess = spawn(pythonPath, args);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`YOLOv8 detector failed with code ${code}: ${errorData}`));
        return;
      }

      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse YOLOv8 output: ${error.message}\nOutput: ${outputData}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * Detect persons using pixel density analysis (fallback method)
 *
 * @param {string} imagePath - Path to the image file
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detection results from pixel density analysis
 */
async function detectPersonsPixelDensity(imagePath, options = {}) {
  const {
    beachArea = 5000,
    saveDebug = false,
    pythonPath = path.join(__dirname, 'venv', 'bin', 'python3')
  } = options;

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'pixel-density-analyzer.py');

    const args = [
      scriptPath,
      imagePath,
      '--beach-area', beachArea.toString(),
      '--json'
    ];

    if (saveDebug) {
      args.push('--save-debug');
    }

    const pythonProcess = spawn(pythonPath, args);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Pixel density analyzer failed with code ${code}: ${errorData}`));
        return;
      }

      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse pixel density output: ${error.message}\nOutput: ${outputData}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * Analyze beach crowd from image
 * Combines person detection with busyness scoring
 * Automatically falls back to pixel density analysis if YOLO fails
 *
 * @param {string} imagePath - Path to the beach screenshot
 * @param {Object} options - Analysis options
 * @param {boolean} options.useFallback - Enable pixel density fallback (default: true)
 * @returns {Promise<Object>} Complete analysis with person count, confidence, and busyness score
 */
async function analyzeBeachCrowd(imagePath, options = {}) {
  const startTime = Date.now();
  const useFallback = options.useFallback !== undefined ? options.useFallback : true;

  try {
    // Run YOLOv8 person detection
    const detectionResult = await detectPersons(imagePath, options);

    if (!detectionResult.success) {
      // YOLO failed - try pixel density fallback if enabled
      if (useFallback) {
        console.warn(`⚠️  YOLO detection failed: ${detectionResult.error}`);
        console.warn(`🔄 Falling back to pixel density analysis...`);

        try {
          const fallbackResult = await detectPersonsPixelDensity(imagePath, {
            beachArea: options.beachArea || 5000,
            saveDebug: options.saveDebug || false,
            pythonPath: options.pythonPath
          });

          if (!fallbackResult.success) {
            return {
              success: false,
              error: `Both YOLO and fallback failed. YOLO: ${detectionResult.error}, Fallback: ${fallbackResult.error}`,
              image_path: imagePath,
              analysis_duration: ((Date.now() - startTime) / 1000).toFixed(2)
            };
          }

          // Use fallback results
          const personCount = fallbackResult.detections.total_persons;
          const busynessScore = calculateBusynessScore(personCount, options.busynessThresholds);
          const busynessLevel = getBusynessLevel(busynessScore);

          const analysisDuration = ((Date.now() - startTime) / 1000).toFixed(2);

          return {
            success: true,
            image_path: imagePath,
            method: 'pixel_density_fallback',
            person_count: personCount,
            busyness_score: busynessScore,
            busyness_level: busynessLevel,
            confidence_stats: {
              min: fallbackResult.detections.min_confidence,
              max: fallbackResult.detections.max_confidence,
              avg: fallbackResult.detections.avg_confidence
            },
            confidence_distribution: fallbackResult.detections.confidence_distribution,
            pixel_analysis: fallbackResult.analysis,
            analysis_duration: parseFloat(analysisDuration),
            timestamp: new Date().toISOString(),
            fallback_used: true,
            fallback_reason: detectionResult.error
          };

        } catch (fallbackError) {
          return {
            success: false,
            error: `Both YOLO and fallback failed. YOLO: ${detectionResult.error}, Fallback: ${fallbackError.message}`,
            image_path: imagePath,
            analysis_duration: ((Date.now() - startTime) / 1000).toFixed(2)
          };
        }
      } else {
        // Fallback disabled, return error
        return {
          success: false,
          error: detectionResult.error,
          image_path: imagePath,
          analysis_duration: ((Date.now() - startTime) / 1000).toFixed(2)
        };
      }
    }

    // YOLO succeeded
    const personCount = detectionResult.detections.total_persons;
    const busynessScore = calculateBusynessScore(personCount, options.busynessThresholds);
    const busynessLevel = getBusynessLevel(busynessScore);

    const analysisDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      success: true,
      image_path: imagePath,
      method: 'yolo',
      model: detectionResult.model,
      confidence_threshold: detectionResult.confidence_threshold,
      person_count: personCount,
      busyness_score: busynessScore,
      busyness_level: busynessLevel,
      confidence_stats: {
        min: detectionResult.detections.min_confidence,
        max: detectionResult.detections.max_confidence,
        avg: detectionResult.detections.avg_confidence
      },
      confidence_distribution: detectionResult.detections.confidence_distribution,
      annotated_image_path: detectionResult.annotated_image_path,
      analysis_duration: parseFloat(analysisDuration),
      timestamp: new Date().toISOString(),
      fallback_used: false
    };

  } catch (error) {
    const analysisDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      success: false,
      error: error.message,
      image_path: imagePath,
      analysis_duration: parseFloat(analysisDuration),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check if YOLOv8 dependencies are installed
 *
 * @param {string} pythonPath - Path to Python executable
 * @returns {Promise<Object>} Status of dependencies
 */
async function checkDependencies(pythonPath = path.join(__dirname, 'venv', 'bin', 'python3')) {
  return new Promise((resolve) => {
    const checkScript = `
import sys
try:
    from ultralytics import YOLO
    import cv2
    print("OK")
except ImportError as e:
    print(f"MISSING: {e}")
    sys.exit(1)
`;

    const pythonProcess = spawn(pythonPath, ['-c', checkScript]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && outputData.includes('OK')) {
        resolve({
          installed: true,
          message: 'YOLOv8 dependencies are installed'
        });
      } else {
        resolve({
          installed: false,
          message: 'YOLOv8 dependencies missing. Install with: pip install ultralytics opencv-python pillow',
          error: errorData
        });
      }
    });

    pythonProcess.on('error', () => {
      resolve({
        installed: false,
        message: `Python not found at: ${pythonPath}`,
        error: 'Python executable not found'
      });
    });
  });
}

export {
  detectPersons,
  detectPersonsPixelDensity,
  analyzeBeachCrowd,
  calculateBusynessScore,
  calculateBusynessScoreWithArea,
  calculateDensity,
  getBusynessLevel,
  checkDependencies
};
