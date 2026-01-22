#!/usr/bin/env python3
"""
Pixel Density Fallback Analyzer
BeachWatch MVP - Computer Vision Fallback

Provides fallback crowd analysis when YOLOv8 is unavailable or fails.
Uses pixel density analysis to estimate crowd levels based on color variations,
skin tones, and activity areas in beach images.

Usage:
    python pixel-density-analyzer.py <image_path> [--json]

Requirements:
    pip install opencv-python numpy pillow

Author: BeachWatch Team
Date: 2026-01-23
"""

import os
import sys
import json
import argparse
import numpy as np

try:
    import cv2
    from PIL import Image
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "Missing dependencies. Please install: pip install opencv-python numpy pillow"
    }))
    sys.exit(1)


def analyze_pixel_density(image_path: str, beach_area_sqm: float = 5000, save_debug: bool = False):
    """
    Analyze pixel density to estimate crowd levels as a fallback to YOLO detection.

    This method detects:
    - Skin tones (people's exposed skin)
    - Bright colors (swimwear, towels, umbrellas)
    - Activity areas (movement, variation)

    Args:
        image_path: Path to the beach image
        beach_area_sqm: Beach area in square meters (for density calculation)
        save_debug: Whether to save debug visualization images

    Returns:
        Dictionary with analysis results including estimated person count
    """

    # Check if image exists
    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": f"Image not found: {image_path}"
        }

    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            return {
                "success": False,
                "error": f"Failed to load image: {image_path}"
            }

        height, width = img.shape[:2]
        total_pixels = height * width

        # Convert to different color spaces for analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)

        # =====================================================================
        # 1. SKIN TONE DETECTION
        # =====================================================================
        # Detect human skin tones (exposed skin on beach)
        # HSV ranges for skin detection (calibrated for various lighting)
        lower_skin1 = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin1 = np.array([20, 255, 255], dtype=np.uint8)

        lower_skin2 = np.array([0, 10, 60], dtype=np.uint8)
        upper_skin2 = np.array([25, 150, 255], dtype=np.uint8)

        skin_mask1 = cv2.inRange(hsv, lower_skin1, upper_skin1)
        skin_mask2 = cv2.inRange(hsv, lower_skin2, upper_skin2)
        skin_mask = cv2.bitwise_or(skin_mask1, skin_mask2)

        # Apply morphological operations to reduce noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel, iterations=2)
        skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        skin_pixels = cv2.countNonZero(skin_mask)
        skin_percentage = (skin_pixels / total_pixels) * 100

        # =====================================================================
        # 2. BRIGHT COLOR DETECTION (swimwear, towels, umbrellas)
        # =====================================================================
        # Detect bright, saturated colors typical of beach gear
        lower_bright = np.array([0, 50, 100], dtype=np.uint8)
        upper_bright = np.array([180, 255, 255], dtype=np.uint8)

        bright_mask = cv2.inRange(hsv, lower_bright, upper_bright)
        bright_mask = cv2.morphologyEx(bright_mask, cv2.MORPH_OPEN, kernel, iterations=1)

        bright_pixels = cv2.countNonZero(bright_mask)
        bright_percentage = (bright_pixels / total_pixels) * 100

        # =====================================================================
        # 3. ACTIVITY AREA DETECTION (texture variation)
        # =====================================================================
        # Use Canny edge detection to find areas with high variation
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)

        # Dilate edges to connect nearby edges (people tend to create clusters)
        edges = cv2.dilate(edges, kernel, iterations=2)

        edge_pixels = cv2.countNonZero(edges)
        edge_percentage = (edge_pixels / total_pixels) * 100

        # =====================================================================
        # 4. COMBINED ACTIVITY SCORE
        # =====================================================================
        # Combine masks to get overall "activity" areas
        combined_mask = cv2.bitwise_or(skin_mask, bright_mask)
        activity_pixels = cv2.countNonZero(combined_mask)
        activity_percentage = (activity_pixels / total_pixels) * 100

        # =====================================================================
        # 5. ESTIMATE PERSON COUNT
        # =====================================================================
        # Heuristic: Assume each person occupies roughly 0.8-1.2% of beach image
        # This is calibrated based on typical beach webcam perspectives

        # Average pixels per person (empirically derived)
        avg_person_pixel_percentage = 1.0  # 1% of image per person

        # Estimate based on activity (weighted combination)
        # Skin tone is most reliable, bright colors secondary, edges tertiary
        weighted_activity = (
            (skin_percentage * 0.6) +      # Skin is strongest indicator
            (bright_percentage * 0.25) +   # Bright colors help
            (edge_percentage * 0.15)       # Edges are weakest but still useful
        )

        estimated_persons = int(weighted_activity / avg_person_pixel_percentage)

        # Apply reasonable bounds (beach webcams typically show 0-500 people)
        estimated_persons = max(0, min(estimated_persons, 500))

        # Calculate confidence based on how strong the signals are
        # Higher skin tone % and bright color % = higher confidence
        signal_strength = (skin_percentage + bright_percentage) / 2

        if signal_strength < 1.0:
            confidence = 0.3  # Low confidence
        elif signal_strength < 3.0:
            confidence = 0.5  # Medium confidence
        elif signal_strength < 6.0:
            confidence = 0.7  # Good confidence
        else:
            confidence = 0.85  # High confidence

        # =====================================================================
        # 6. SAVE DEBUG VISUALIZATION (optional)
        # =====================================================================
        if save_debug:
            from pathlib import Path
            output_dir = Path(image_path).parent / "pixel_density_debug"
            output_dir.mkdir(exist_ok=True)

            image_name = Path(image_path).stem

            # Save masks
            cv2.imwrite(str(output_dir / f"{image_name}_skin_mask.jpg"), skin_mask)
            cv2.imwrite(str(output_dir / f"{image_name}_bright_mask.jpg"), bright_mask)
            cv2.imwrite(str(output_dir / f"{image_name}_edges.jpg"), edges)
            cv2.imwrite(str(output_dir / f"{image_name}_combined.jpg"), combined_mask)

            # Create overlay visualization
            overlay = img.copy()
            overlay[combined_mask > 0] = [0, 255, 0]  # Green overlay on activity areas
            result_img = cv2.addWeighted(img, 0.7, overlay, 0.3, 0)

            # Add text overlay
            cv2.putText(result_img, f"Estimated: {estimated_persons} people",
                       (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 2)
            cv2.putText(result_img, f"Confidence: {confidence:.2f}",
                       (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
            cv2.putText(result_img, f"Method: Pixel Density",
                       (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)

            cv2.imwrite(str(output_dir / f"{image_name}_analysis.jpg"), result_img)

        # =====================================================================
        # 7. RETURN RESULTS
        # =====================================================================
        return {
            "success": True,
            "method": "pixel_density",
            "image_path": image_path,
            "image_dimensions": {
                "width": width,
                "height": height,
                "total_pixels": total_pixels
            },
            "analysis": {
                "skin_pixels": int(skin_pixels),
                "skin_percentage": round(skin_percentage, 3),
                "bright_pixels": int(bright_pixels),
                "bright_percentage": round(bright_percentage, 3),
                "edge_pixels": int(edge_pixels),
                "edge_percentage": round(edge_percentage, 3),
                "activity_pixels": int(activity_pixels),
                "activity_percentage": round(activity_percentage, 3),
                "weighted_activity": round(weighted_activity, 3)
            },
            "detections": {
                "total_persons": estimated_persons,
                "confidence": round(confidence, 3),
                "min_confidence": round(confidence, 3),
                "max_confidence": round(confidence, 3),
                "avg_confidence": round(confidence, 3),
                "confidence_distribution": {
                    "high": estimated_persons if confidence >= 0.7 else 0,
                    "medium": estimated_persons if 0.5 <= confidence < 0.7 else 0,
                    "low": estimated_persons if confidence < 0.5 else 0
                },
                "persons": []  # No individual detections in density method
            },
            "beach_area_sqm": beach_area_sqm,
            "notes": "Fallback pixel density analysis. Less accurate than YOLO but provides estimates when ML unavailable."
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "image_path": image_path,
            "method": "pixel_density"
        }


def main():
    """
    CLI interface for pixel density analysis
    """
    parser = argparse.ArgumentParser(
        description='Pixel Density Fallback Analyzer for BeachWatch',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument('image_path', type=str, help='Path to the image file')
    parser.add_argument('--beach-area', type=float, default=5000,
                       help='Beach area in square meters (default: 5000)')
    parser.add_argument('--save-debug', action='store_true',
                       help='Save debug visualization images')
    parser.add_argument('--json', action='store_true',
                       help='Output results as JSON (for Node.js integration)')

    args = parser.parse_args()

    # Run analysis
    result = analyze_pixel_density(
        args.image_path,
        beach_area_sqm=args.beach_area,
        save_debug=args.save_debug
    )

    # Output results
    if args.json:
        # JSON output for Node.js integration
        print(json.dumps(result, indent=2))
    else:
        # Human-readable output
        if result['success']:
            print(f"\n{'='*60}")
            print(f"🏖️  Pixel Density Analysis Results (Fallback Method)")
            print(f"{'='*60}\n")
            print(f"📸 Image: {result['image_path']}")
            print(f"🔍 Method: {result['method']}")
            print(f"📐 Dimensions: {result['image_dimensions']['width']}x{result['image_dimensions']['height']}")
            print(f"\n{'─'*60}")
            print(f"📊 PIXEL ANALYSIS")
            print(f"{'─'*60}\n")

            analysis = result['analysis']
            print(f"👤 Skin Tone Detection: {analysis['skin_percentage']:.2f}% of image")
            print(f"🎨 Bright Colors: {analysis['bright_percentage']:.2f}% of image")
            print(f"📈 Edge Activity: {analysis['edge_percentage']:.2f}% of image")
            print(f"🎯 Combined Activity: {analysis['activity_percentage']:.2f}% of image")

            print(f"\n{'─'*60}")
            print(f"📊 CROWD ESTIMATE")
            print(f"{'─'*60}\n")

            detections = result['detections']
            print(f"👥 Estimated People: {detections['total_persons']}")
            print(f"📊 Confidence: {detections['confidence']:.2f}")

            print(f"\n⚠️  NOTE: This is a fallback method using pixel density.")
            print(f"   Accuracy is lower than YOLO detection.")
            print(f"   Use for rough estimates when YOLO is unavailable.\n")

            if args.save_debug:
                print(f"✅ Debug images saved to: pixel_density_debug/\n")

            print(f"{'─'*60}")
            print(f"✅ ANALYSIS COMPLETE")
            print(f"{'─'*60}\n")
        else:
            print(f"\n❌ ERROR: {result['error']}\n")
            sys.exit(1)


if __name__ == "__main__":
    main()
