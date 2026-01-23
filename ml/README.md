# YOLOv8 Testing Guide

Quick guide to test YOLOv8 person detection on beach images.

## Prerequisites

Python 3.8+ with pip installed.

## Installation

```bash
# Install YOLOv8 and dependencies
pip install ultralytics opencv-python pillow
```

## Run Test

```bash
# Test YOLOv8m on Bondi Beach screenshot
python test-yolo.py
```

## What It Does

1. Loads pretrained YOLOv8m model (auto-downloads ~50MB on first run)
2. Runs person detection on `screenshots/bondi_2026-01-22_14-23-41.png`
3. Filters detections by confidence threshold (default: 0.5)
4. Prints detection count and confidence statistics
5. Saves annotated image with bounding boxes to `screenshots/annotated/`

## Expected Output

```
🏖️  BeachWatch YOLOv8 Person Detection Test
======================================================================

📸 Test Image: screenshots/bondi_2026-01-22_14-23-41.png
🤖 Model: yolov8m.pt
🎯 Confidence Threshold: 0.5

⏳ Loading yolov8m.pt model...
✅ Model loaded successfully!

⏳ Running inference on image...
✅ Inference complete!

📊 DETECTION RESULTS
──────────────────────────────────────────────────────────────────────

👥 Total People Detected: XX
📈 Confidence Range: 0.XX - 0.XX
📊 Average Confidence: 0.XX

🎯 Confidence Distribution:
   High (≥0.7): XX people
   Medium (0.5-0.7): XX people
   Low (<0.5): XX people

✅ Annotated image saved: screenshots/annotated/bondi_2026-01-22_14-23-41_annotated.jpg
```

## Validation Steps

1. Run the test script
2. Open `screenshots/annotated/bondi_2026-01-22_14-23-41_annotated.jpg`
3. Manually count people in the original image
4. Compare YOLOv8 count vs manual count
5. Calculate accuracy: `(YOLOv8 count / Manual count) × 100%`
6. Inspect false positives and missed detections
7. Document findings in `validation-plan.md`

## Model Comparison (Optional)

To compare YOLOv8n, YOLOv8s, and YOLOv8m:

```python
# Edit test-yolo.py and uncomment this line at the bottom:
compare_models(test_image, confidence_threshold=0.5)
```

## Troubleshooting

**Error: "No module named 'ultralytics'"**
```bash
pip install ultralytics
```

**Error: "Image not found"**
- Run `node scraper.js` first to capture beach screenshot
- Or update `test_image` path in test-yolo.py

**Slow inference?**
- First run downloads model weights (~50MB for YOLOv8m)
- Subsequent runs are faster
- Use YOLOv8s or YOLOv8n for faster inference

## Next Steps

After validation, see `validation-plan.md` for:
- Integration into scraper pipeline
- Busyness score calculation
- Production deployment strategy
