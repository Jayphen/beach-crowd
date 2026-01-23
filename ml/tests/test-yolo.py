#!/usr/bin/env python3
"""
YOLOv8 Person Detection Test Script
BeachWatch MVP - Computer Vision Validation

Tests YOLOv8m model on captured beach screenshot to validate person detection accuracy.

Usage:
    python test-yolo.py

Requirements:
    pip install ultralytics opencv-python pillow

Author: BeachWatch Team
Date: 2026-01-23
"""

import os
from pathlib import Path

try:
    from ultralytics import YOLO
    import cv2
except ImportError:
    print("❌ Missing dependencies. Please install:")
    print("   pip install ultralytics opencv-python pillow")
    exit(1)


def test_person_detection(image_path: str, model_name: str = "yolov8m.pt", confidence_threshold: float = 0.5):
    """
    Run YOLOv8 person detection on a beach image.

    Args:
        image_path: Path to the test image
        model_name: YOLOv8 model variant (yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
        confidence_threshold: Minimum confidence for detections (0.0-1.0)

    Returns:
        Dictionary with detection results
    """

    print(f"\n{'='*70}")
    print(f"🏖️  BeachWatch YOLOv8 Person Detection Test")
    print(f"{'='*70}\n")

    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ Error: Image not found at {image_path}")
        return None

    print(f"📸 Test Image: {image_path}")
    print(f"🤖 Model: {model_name}")
    print(f"🎯 Confidence Threshold: {confidence_threshold}")
    print(f"\n{'─'*70}\n")

    # Load YOLOv8 model (downloads pretrained weights on first run)
    print(f"⏳ Loading {model_name} model...")
    model = YOLO(model_name)
    print(f"✅ Model loaded successfully!\n")

    # Run inference
    print(f"⏳ Running inference on image...")
    results = model(image_path, verbose=False)
    result = results[0]  # Get first result
    print(f"✅ Inference complete!\n")

    # Extract person detections (class 0 in COCO dataset)
    person_class_id = 0
    boxes = result.boxes

    # Filter for person class with confidence above threshold
    person_detections = []
    for i, box in enumerate(boxes):
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])

        if class_id == person_class_id and confidence >= confidence_threshold:
            person_detections.append({
                'bbox': box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                'confidence': confidence,
                'class': 'person'
            })

    # Print results
    print(f"{'─'*70}")
    print(f"📊 DETECTION RESULTS")
    print(f"{'─'*70}\n")

    print(f"👥 Total People Detected: {len(person_detections)}")
    print(f"📈 Confidence Range: {min([d['confidence'] for d in person_detections]):.2f} - {max([d['confidence'] for d in person_detections]):.2f}" if person_detections else "📈 Confidence Range: N/A")
    print(f"📊 Average Confidence: {sum([d['confidence'] for d in person_detections]) / len(person_detections):.2f}" if person_detections else "📊 Average Confidence: N/A")

    # Confidence distribution
    if person_detections:
        high_conf = len([d for d in person_detections if d['confidence'] >= 0.7])
        med_conf = len([d for d in person_detections if 0.5 <= d['confidence'] < 0.7])
        low_conf = len([d for d in person_detections if d['confidence'] < 0.5])

        print(f"\n🎯 Confidence Distribution:")
        print(f"   High (≥0.7): {high_conf} people")
        print(f"   Medium (0.5-0.7): {med_conf} people")
        print(f"   Low (<0.5): {low_conf} people")

    # Save annotated image
    output_dir = Path("../../test-data/screenshots/annotated")
    output_dir.mkdir(parents=True, exist_ok=True)

    image_name = Path(image_path).stem
    output_path = output_dir / f"{image_name}_annotated.jpg"

    print(f"\n⏳ Saving annotated image...")

    # Create annotated image with bounding boxes
    annotated_image = result.plot()  # Draw boxes on image
    cv2.imwrite(str(output_path), annotated_image)

    print(f"✅ Annotated image saved: {output_path}")

    print(f"\n{'─'*70}")
    print(f"✅ TEST COMPLETE")
    print(f"{'─'*70}\n")

    # Return results as dictionary
    return {
        'image_path': image_path,
        'model': model_name,
        'confidence_threshold': confidence_threshold,
        'total_detections': len(person_detections),
        'detections': person_detections,
        'annotated_image_path': str(output_path)
    }


def compare_models(image_path: str, confidence_threshold: float = 0.5):
    """
    Compare YOLOv8 model variants on the same image.

    Args:
        image_path: Path to the test image
        confidence_threshold: Minimum confidence for detections
    """

    models = ["yolov8n.pt", "yolov8s.pt", "yolov8m.pt"]
    results = {}

    print(f"\n{'='*70}")
    print(f"🔬 YOLOv8 Model Comparison")
    print(f"{'='*70}\n")

    for model_name in models:
        print(f"\n{'─'*70}")
        print(f"Testing {model_name}...")
        print(f"{'─'*70}\n")

        result = test_person_detection(image_path, model_name, confidence_threshold)
        if result:
            results[model_name] = result

    # Print comparison summary
    print(f"\n{'='*70}")
    print(f"📊 COMPARISON SUMMARY")
    print(f"{'='*70}\n")

    for model_name, result in results.items():
        print(f"{model_name:15s} → {result['total_detections']} people detected")

    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    # Default test image path
    test_image = "screenshots/bondi_2026-01-22_14-23-41.png"

    # Check if image exists
    if not os.path.exists(test_image):
        print(f"❌ Error: Test image not found at {test_image}")
        print(f"Please run the scraper first to capture a beach screenshot.")
        exit(1)

    # Run single model test (YOLOv8m - recommended)
    print("\n🚀 Running YOLOv8m test on Bondi Beach screenshot...\n")
    result = test_person_detection(test_image, model_name="yolov8m.pt", confidence_threshold=0.5)

    # Optionally, compare multiple models
    # Uncomment the line below to compare YOLOv8n, YOLOv8s, and YOLOv8m
    # compare_models(test_image, confidence_threshold=0.5)

    # Print next steps
    print(f"\n{'='*70}")
    print(f"📋 NEXT STEPS")
    print(f"{'='*70}\n")
    print(f"1. ✅ Review annotated image in screenshots/annotated/")
    print(f"2. 📝 Manually count people in original image for ground truth")
    print(f"3. 📊 Calculate accuracy: (Detected / Actual) × 100%")
    print(f"4. 🔍 Identify failure modes (missed detections, false positives)")
    print(f"5. 📈 Document findings in validation-plan.md")
    print(f"6. 🎯 Decide: Proceed with YOLOv8m or fine-tune model\n")
