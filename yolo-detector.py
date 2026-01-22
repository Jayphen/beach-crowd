#!/usr/bin/env python3
"""
YOLOv8 Person Detection Module
BeachWatch MVP - Computer Vision Integration

Provides person detection capabilities for beach crowd analysis.
Designed to be called from Node.js scraper pipeline.

Usage:
    python yolo-detector.py <image_path> [--model yolov8m.pt] [--confidence 0.5] [--json]

Requirements:
    pip install ultralytics opencv-python pillow

Author: BeachWatch Team
Date: 2026-01-23
"""

import os
import sys
import json
import argparse
from pathlib import Path

try:
    from ultralytics import YOLO
    import cv2
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "Missing dependencies. Please install: pip install ultralytics opencv-python pillow"
    }))
    sys.exit(1)


def detect_persons(image_path: str, model_name: str = "yolov8m.pt", confidence_threshold: float = 0.5, save_annotated: bool = False):
    """
    Run YOLOv8 person detection on an image.

    Args:
        image_path: Path to the image file
        model_name: YOLOv8 model variant (yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
        confidence_threshold: Minimum confidence for detections (0.0-1.0)
        save_annotated: Whether to save an annotated image with bounding boxes

    Returns:
        Dictionary with detection results
    """

    # Check if image exists
    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": f"Image not found: {image_path}"
        }

    try:
        # Load YOLOv8 model (downloads pretrained weights on first run)
        model = YOLO(model_name)

        # Run inference (suppress verbose output)
        results = model(image_path, verbose=False)
        result = results[0]  # Get first result

        # Extract person detections (class 0 in COCO dataset)
        person_class_id = 0
        boxes = result.boxes

        # Filter for person class with confidence above threshold
        person_detections = []
        for box in boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            if class_id == person_class_id and confidence >= confidence_threshold:
                person_detections.append({
                    'bbox': box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                    'confidence': round(confidence, 3),
                    'class': 'person'
                })

        # Calculate statistics
        total_detections = len(person_detections)

        if total_detections > 0:
            confidences = [d['confidence'] for d in person_detections]
            min_confidence = round(min(confidences), 3)
            max_confidence = round(max(confidences), 3)
            avg_confidence = round(sum(confidences) / len(confidences), 3)

            # Confidence distribution
            high_conf = len([d for d in person_detections if d['confidence'] >= 0.7])
            med_conf = len([d for d in person_detections if 0.5 <= d['confidence'] < 0.7])
            low_conf = len([d for d in person_detections if d['confidence'] < 0.5])

            confidence_distribution = {
                'high': high_conf,  # >= 0.7
                'medium': med_conf,  # 0.5 - 0.7
                'low': low_conf     # < 0.5
            }
        else:
            min_confidence = 0
            max_confidence = 0
            avg_confidence = 0
            confidence_distribution = {'high': 0, 'medium': 0, 'low': 0}

        # Optionally save annotated image
        annotated_image_path = None
        if save_annotated and total_detections > 0:
            output_dir = Path(image_path).parent / "annotated"
            output_dir.mkdir(exist_ok=True)

            image_name = Path(image_path).stem
            annotated_image_path = str(output_dir / f"{image_name}_annotated.jpg")

            # Create annotated image with bounding boxes
            annotated_image = result.plot()  # Draw boxes on image
            cv2.imwrite(annotated_image_path, annotated_image)

        # Return results
        return {
            "success": True,
            "image_path": image_path,
            "model": model_name,
            "confidence_threshold": confidence_threshold,
            "detections": {
                "total_persons": total_detections,
                "min_confidence": min_confidence,
                "max_confidence": max_confidence,
                "avg_confidence": avg_confidence,
                "confidence_distribution": confidence_distribution,
                "persons": person_detections
            },
            "annotated_image_path": annotated_image_path
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "image_path": image_path
        }


def main():
    """
    CLI interface for YOLOv8 person detection
    """
    parser = argparse.ArgumentParser(
        description='YOLOv8 Person Detection for BeachWatch',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('image_path', type=str, help='Path to the image file')
    parser.add_argument('--model', type=str, default='yolov8m.pt',
                        help='YOLOv8 model variant (default: yolov8m.pt)')
    parser.add_argument('--confidence', type=float, default=0.5,
                        help='Confidence threshold 0.0-1.0 (default: 0.5)')
    parser.add_argument('--save-annotated', action='store_true',
                        help='Save annotated image with bounding boxes')
    parser.add_argument('--json', action='store_true',
                        help='Output results as JSON (for Node.js integration)')

    args = parser.parse_args()

    # Run detection
    result = detect_persons(
        args.image_path,
        model_name=args.model,
        confidence_threshold=args.confidence,
        save_annotated=args.save_annotated
    )

    # Output results
    if args.json:
        # JSON output for Node.js integration
        print(json.dumps(result, indent=2))
    else:
        # Human-readable output
        if result['success']:
            print(f"\n{'='*60}")
            print(f"🏖️  YOLOv8 Person Detection Results")
            print(f"{'='*60}\n")
            print(f"📸 Image: {result['image_path']}")
            print(f"🤖 Model: {result['model']}")
            print(f"🎯 Confidence Threshold: {result['confidence_threshold']}")
            print(f"\n{'─'*60}")
            print(f"📊 DETECTION RESULTS")
            print(f"{'─'*60}\n")

            detections = result['detections']
            print(f"👥 Total People Detected: {detections['total_persons']}")

            if detections['total_persons'] > 0:
                print(f"📈 Confidence Range: {detections['min_confidence']:.3f} - {detections['max_confidence']:.3f}")
                print(f"📊 Average Confidence: {detections['avg_confidence']:.3f}")

                dist = detections['confidence_distribution']
                print(f"\n🎯 Confidence Distribution:")
                print(f"   High (≥0.7): {dist['high']} people")
                print(f"   Medium (0.5-0.7): {dist['medium']} people")
                print(f"   Low (<0.5): {dist['low']} people")

            if result.get('annotated_image_path'):
                print(f"\n✅ Annotated image saved: {result['annotated_image_path']}")

            print(f"\n{'─'*60}")
            print(f"✅ DETECTION COMPLETE")
            print(f"{'─'*60}\n")
        else:
            print(f"\n❌ ERROR: {result['error']}\n")
            sys.exit(1)


if __name__ == "__main__":
    main()
