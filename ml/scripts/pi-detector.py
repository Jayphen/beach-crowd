#!/usr/bin/env python3
"""
Raspberry Pi Optimized Beach Crowd Detector

Designed for edge deployment on Raspberry Pi 4/5.
Uses YOLOv8s with image slicing for best accuracy/speed balance.

Performance (estimated):
- Pi 5 (8GB): ~3-5 seconds per frame
- Pi 4 (4GB): ~5-10 seconds per frame
- With NCNN export: ~2x faster

Usage:
    python pi-detector.py <image_path> [options]
    python pi-detector.py capture --stream <hls_url>  # Capture and detect

Setup on Raspberry Pi:
    pip install ultralytics opencv-python-headless numpy
    # Optional: Export to NCNN for faster inference
    python -c "from ultralytics import YOLO; YOLO('yolov8s.pt').export(format='ncnn')"

Author: BeachWatch Team
"""

import sys
import json
import argparse
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

try:
    from ultralytics import YOLO
    import cv2
    import numpy as np
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Missing dependencies: {e}. Install: pip install ultralytics opencv-python-headless numpy"
    }))
    sys.exit(1)


# Default model - yolov8s is best for Pi (good accuracy, reasonable speed)
DEFAULT_MODEL = 'yolov8s.pt'
DEFAULT_CONFIDENCE = 0.15
SLICE_SIZE = 640
SLICE_OVERLAP = 0.25


def capture_hls_frame(stream_url, output_path=None, timeout=30):
    """
    Capture a single frame from an HLS stream using ffmpeg.

    Args:
        stream_url: HLS stream URL (m3u8)
        output_path: Where to save the frame (default: temp file)
        timeout: Timeout in seconds

    Returns:
        Path to captured frame or None on failure
    """
    if output_path is None:
        output_path = tempfile.mktemp(suffix='.jpg')

    cmd = [
        'ffmpeg', '-y',
        '-i', stream_url,
        '-frames:v', '1',
        '-update', '1',
        '-q:v', '2',
        output_path
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=timeout
        )
        if result.returncode == 0 and Path(output_path).exists():
            return output_path
        return None
    except subprocess.TimeoutExpired:
        return None
    except FileNotFoundError:
        print("Error: ffmpeg not found. Install with: sudo apt install ffmpeg")
        return None


def slice_image(image, slice_size=SLICE_SIZE, overlap=SLICE_OVERLAP):
    """Split image into overlapping tiles for small object detection."""
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


def nms_merge(detections, iou_threshold=0.4):
    """Merge overlapping detections using Non-Maximum Suppression."""
    if not detections:
        return []

    boxes = np.array([[d['bbox'][0], d['bbox'][1], d['bbox'][2], d['bbox'][3]] for d in detections])
    scores = np.array([d['confidence'] for d in detections])

    indices = []
    order = scores.argsort()[::-1]

    while len(order) > 0:
        i = order[0]
        indices.append(i)

        if len(order) == 1:
            break

        # Calculate IoU
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

    return [detections[i] for i in indices]


def detect(image_path, model_path=DEFAULT_MODEL, confidence=DEFAULT_CONFIDENCE, use_slicing=True):
    """
    Detect people in beach image.

    Args:
        image_path: Path to image file
        model_path: YOLO model path (supports .pt, _ncnn_model/, _openvino_model/)
        confidence: Confidence threshold
        use_slicing: Enable image slicing for small objects

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

    # Sliced detection for large images
    if use_slicing and (w > 1280 or h > 1280):
        slices = slice_image(image)

        for slice_data in slices:
            results = model(
                slice_data['image'],
                conf=confidence,
                classes=[0],  # Person only
                verbose=False
            )

            for r in results:
                for box in r.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    ox, oy = slice_data['offset']
                    all_detections.append({
                        'bbox': [x1 + ox, y1 + oy, x2 + ox, y2 + oy],
                        'confidence': float(box.conf[0])
                    })

        all_detections = nms_merge(all_detections)

    # Full image detection
    full_results = model(image, conf=confidence, classes=[0], verbose=False)
    for r in full_results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            all_detections.append({
                'bbox': [x1, y1, x2, y2],
                'confidence': float(box.conf[0])
            })

    # Final merge
    all_detections = nms_merge(all_detections)

    # Calculate stats
    total = len(all_detections)
    confidences = [d['confidence'] for d in all_detections]

    return {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "image_path": str(image_path),
        "model": model_path,
        "person_count": total,
        "min_confidence": round(min(confidences), 3) if confidences else 0,
        "max_confidence": round(max(confidences), 3) if confidences else 0,
        "avg_confidence": round(sum(confidences) / len(confidences), 3) if confidences else 0
    }


def calculate_busyness(person_count, beach_area_sqm=5000):
    """
    Calculate busyness score from person count.

    Args:
        person_count: Number of people detected
        beach_area_sqm: Visible beach area in square meters

    Returns:
        dict with score and level
    """
    # Density per 100 sqm
    density = (person_count / beach_area_sqm) * 100

    # Thresholds (people per 100 sqm)
    if density <= 0.5:
        score = int((density / 0.5) * 25)
        level = "quiet"
    elif density <= 2.0:
        score = int(25 + ((density - 0.5) / 1.5) * 25)
        level = "moderate"
    elif density <= 4.0:
        score = int(50 + ((density - 2.0) / 2.0) * 25)
        level = "busy"
    else:
        score = min(100, int(75 + ((density - 4.0) / 4.0) * 25))
        level = "very_busy"

    return {
        "score": score,
        "level": level,
        "density": round(density, 2)
    }


def main():
    parser = argparse.ArgumentParser(
        description='Pi-optimized beach crowd detector',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Detect from image
  python pi-detector.py beach.jpg

  # Capture from HLS stream and detect
  python pi-detector.py --capture --stream "https://s116.ipcamlive.com/streams/xxx/stream.m3u8"

  # Use NCNN model for faster inference
  python pi-detector.py beach.jpg --model yolov8s_ncnn_model

  # Output JSON for pipeline integration
  python pi-detector.py beach.jpg --json
        """
    )

    # Main arguments
    parser.add_argument('image', nargs='?', help='Image path to analyze')
    parser.add_argument('--capture', action='store_true', help='Capture from HLS stream first')
    parser.add_argument('--stream', help='HLS stream URL (requires --capture)')
    parser.add_argument('--output', help='Output image path for capture')
    parser.add_argument('--model', default=DEFAULT_MODEL, help='YOLO model path')
    parser.add_argument('--confidence', type=float, default=DEFAULT_CONFIDENCE)
    parser.add_argument('--beach-area', type=float, default=5000, help='Beach area in sqm')
    parser.add_argument('--no-slicing', action='store_true', help='Disable image slicing')
    parser.add_argument('--json', action='store_true', help='JSON output')

    args = parser.parse_args()

    image_path = args.image

    # Handle capture mode
    if args.capture:
        if not args.stream:
            print("Error: --stream required with --capture", file=sys.stderr)
            sys.exit(1)

        print(f"Capturing from stream...", file=sys.stderr)
        image_path = capture_hls_frame(args.stream, args.output)
        if not image_path:
            result = {"success": False, "error": "Failed to capture frame from stream"}
            print(json.dumps(result) if args.json else f"Error: {result['error']}")
            sys.exit(1)
        print(f"Captured: {image_path}", file=sys.stderr)

    # Need an image to analyze
    if not image_path:
        parser.print_help()
        sys.exit(1)

    # Run detection
    print(f"Analyzing...", file=sys.stderr)
    result = detect(
        image_path,
        args.model,
        args.confidence,
        use_slicing=not args.no_slicing
    )

    if result['success']:
        busyness = calculate_busyness(result['person_count'], args.beach_area)
        result.update(busyness)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        if result['success']:
            print(f"\n🏖️  Beach Analysis")
            print(f"{'─' * 30}")
            print(f"People: {result['person_count']}")
            print(f"Score: {result['score']}/100 ({result['level']})")
            print(f"Density: {result['density']} per 100sqm")
            print(f"Confidence: {result['min_confidence']:.2f} - {result['max_confidence']:.2f}")
        else:
            print(f"Error: {result['error']}")


if __name__ == '__main__':
    main()
