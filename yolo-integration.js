const { spawn } = require('child_process');
const path = require('path');

/**
 * YOLOv8 Integration Module
 * Provides person detection capabilities for beach crowd analysis
 * Calls Python YOLOv8 detector and returns structured results
 */

/**
 * Calculate busyness score based on person count
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
 * Analyze beach crowd from image
 * Combines person detection with busyness scoring
 *
 * @param {string} imagePath - Path to the beach screenshot
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Complete analysis with person count, confidence, and busyness score
 */
async function analyzeBeachCrowd(imagePath, options = {}) {
  const startTime = Date.now();

  try {
    // Run YOLOv8 person detection
    const detectionResult = await detectPersons(imagePath, options);

    if (!detectionResult.success) {
      return {
        success: false,
        error: detectionResult.error,
        image_path: imagePath,
        analysis_duration: ((Date.now() - startTime) / 1000).toFixed(2)
      };
    }

    const personCount = detectionResult.detections.total_persons;
    const busynessScore = calculateBusynessScore(personCount, options.busynessThresholds);
    const busynessLevel = getBusynessLevel(busynessScore);

    const analysisDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      success: true,
      image_path: imagePath,
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
      timestamp: new Date().toISOString()
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

module.exports = {
  detectPersons,
  analyzeBeachCrowd,
  calculateBusynessScore,
  getBusynessLevel,
  checkDependencies
};
