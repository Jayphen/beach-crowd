#!/usr/bin/env python3
"""
Beach-Optimized Person Detection

Uses YOLO with settings tuned for detecting distant people on beaches:
- Lower confidence threshold
- SAHI (Slicing Aided Hyper Inference) for small object detection
- Filtering for person class only

Usage:
    python beach-detector.py <image_path> [--visualize]
"""

import sys
import json
import argparse
from pathlib import Path

try:
    from ultralytics import YOLO
    import cv2
    import numpy as np
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "Missing dependencies. Install: pip install ultralytics opencv-python numpy"
    }))
    sys.exit(1)


def slice_image(image, slice_size=640, overlap=0.2):
    """
    Slice image into overlapping tiles for better small object detection.
    This is a simplified version of SAHI (Slicing Aided Hyper Inference).
    """
    h, w = image.shape[:2]
    stride = int(slice_size * (1 - overlap))
    slices = []

    for y in range(0, h, stride):
        for x in range(0, w, stride):
            x_end = min(x + slice_size, w)
            y_end = min(y + slice_size, h)
            x_start = max(0, x_end - slice_size)
            y_start = max(0, y_end - slice_size)

            slice_img = image[y_start:y_end, x_start:x_end]
            slices.append({
                'image': slice_img,
                'offset': (x_start, y_start)
            })

    return slices


def merge_detections(all_detections, iou_threshold=0.5):
    """
    Merge detections from multiple slices, removing duplicates via NMS.
    """
    if not all_detections:
        return []

    boxes = np.array([[d['bbox'][0], d['bbox'][1], d['bbox'][2], d['bbox'][3]] for d in all_detections])
    scores = np.array([d['confidence'] for d in all_detections])

    # Simple NMS implementation
    indices = []
    order = scores.argsort()[::-1]

    while len(order) > 0:
        i = order[0]
        indices.append(i)

        if len(order) == 1:
            break

        # Calculate IoU with remaining boxes
        xx1 = np.maximum(boxes[i, 0], boxes[order[1:], 0])
        yy1 = np.maximum(boxes[i, 1], boxes[order[1:], 1])
        xx2 = np.minimum(boxes[i, 2], boxes[order[1:], 2])
        yy2 = np.minimum(boxes[i, 3], boxes[order[1:], 3])

        w = np.maximum(0, xx2 - xx1)
        h = np.maximum(0, yy2 - yy1)

        inter = w * h
        area_i = (boxes[i, 2] - boxes[i, 0]) * (boxes[i, 3] - boxes[i, 1])
        area_rest = (boxes[order[1:], 2] - boxes[order[1:], 0]) * (boxes[order[1:], 3] - boxes[order[1:], 1])

        iou = inter / (area_i + area_rest - inter + 1e-6)

        remaining = np.where(iou <= iou_threshold)[0]
        order = order[remaining + 1]

    return [all_detections[i] for i in indices]


def detect_beach_crowd(image_path, model_path='yolov8m.pt', confidence=0.15, use_slicing=True, visualize=False):
    """
    Detect people on beach using optimized settings.

    Args:
        image_path: Path to beach image
        model_path: YOLO model to use
        confidence: Confidence threshold (lower for distant people)
        use_slicing: Whether to use image slicing for small objects
        visualize: Whether to save annotated image

    Returns:
        dict with detection results
    """
    # Load model
    model = YOLO(model_path)

    # Load image
    image = cv2.imread(str(image_path))
    if image is None:
        return {"success": False, "error": f"Could not load image: {image_path}"}

    h, w = image.shape[:2]
    all_detections = []

    if use_slicing and (w > 1280 or h > 1280):
        # Use slicing for large images
        slices = slice_image(image, slice_size=640, overlap=0.25)

        for slice_data in slices:
            results = model(
                slice_data['image'],
                conf=confidence,
                classes=[0],  # Person class only
                verbose=False
            )

            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    # Adjust coordinates back to original image
                    ox, oy = slice_data['offset']
                    all_detections.append({
                        'bbox': [x1 + ox, y1 + oy, x2 + ox, y2 + oy],
                        'confidence': float(box.conf[0]),
                        'class': 'person'
                    })

        # Merge overlapping detections
        all_detections = merge_detections(all_detections, iou_threshold=0.4)

    else:
        # Direct detection for smaller images
        results = model(
            image,
            conf=confidence,
            classes=[0],
            verbose=False
        )

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                all_detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'confidence': float(box.conf[0]),
                    'class': 'person'
                })

    # Also run full-image detection to catch larger people
    full_results = model(image, conf=confidence, classes=[0], verbose=False)
    for r in full_results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            all_detections.append({
                'bbox': [x1, y1, x2, y2],
                'confidence': float(box.conf[0]),
                'class': 'person'
            })

    # Final NMS to remove duplicates
    all_detections = merge_detections(all_detections, iou_threshold=0.4)

    # Sort by confidence
    all_detections.sort(key=lambda x: x['confidence'], reverse=True)

    # Calculate statistics
    total = len(all_detections)
    confidences = [d['confidence'] for d in all_detections]

    result = {
        "success": True,
        "image_path": str(image_path),
        "image_size": {"width": w, "height": h},
        "model": model_path,
        "confidence_threshold": confidence,
        "slicing_enabled": use_slicing,
        "detections": {
            "total_persons": total,
            "min_confidence": round(min(confidences), 3) if confidences else 0,
            "max_confidence": round(max(confidences), 3) if confidences else 0,
            "avg_confidence": round(sum(confidences) / len(confidences), 3) if confidences else 0,
            "persons": all_detections
        }
    }

    # Visualize if requested
    if visualize and total > 0:
        annotated = image.copy()
        for det in all_detections:
            x1, y1, x2, y2 = [int(v) for v in det['bbox']]
            conf = det['confidence']

            # Color based on confidence
            if conf >= 0.5:
                color = (0, 255, 0)  # Green - high confidence
            elif conf >= 0.3:
                color = (0, 255, 255)  # Yellow - medium
            else:
                color = (0, 165, 255)  # Orange - low

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            cv2.putText(annotated, f'{conf:.2f}', (x1, y1-5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Add count overlay
        cv2.putText(annotated, f'People detected: {total}', (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Save annotated image
        output_dir = Path(image_path).parent / 'annotated'
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / f'{Path(image_path).stem}_beach_annotated.jpg'
        cv2.imwrite(str(output_path), annotated)
        result['annotated_image_path'] = str(output_path)

    return result


def main():
    parser = argparse.ArgumentParser(description='Beach-optimized person detection')
    parser.add_argument('image', help='Path to beach image')
    parser.add_argument('--model', default='yolov8m.pt', help='YOLO model path')
    parser.add_argument('--confidence', type=float, default=0.15, help='Confidence threshold')
    parser.add_argument('--no-slicing', action='store_true', help='Disable image slicing')
    parser.add_argument('--visualize', action='store_true', help='Save annotated image')
    parser.add_argument('--json', action='store_true', help='Output as JSON')

    args = parser.parse_args()

    result = detect_beach_crowd(
        args.image,
        model_path=args.model,
        confidence=args.confidence,
        use_slicing=not args.no_slicing,
        visualize=args.visualize
    )

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        if result['success']:
            print(f"\n🏖️  Beach Crowd Detection Results")
            print(f"{'─' * 40}")
            print(f"Image: {Path(args.image).name}")
            print(f"People detected: {result['detections']['total_persons']}")
            if result['detections']['total_persons'] > 0:
                print(f"Confidence range: {result['detections']['min_confidence']:.2f} - {result['detections']['max_confidence']:.2f}")
            if 'annotated_image_path' in result:
                print(f"Annotated: {result['annotated_image_path']}")
        else:
            print(f"Error: {result['error']}")


if __name__ == '__main__':
    main()
