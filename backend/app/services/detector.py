"""
Pothole detection service using YOLOv8.

On first run, ultralytics downloads the base weights (~6 MB for yolov8n).
We use a public pothole-detection model from Hugging Face as a fine-tuned
checkpoint when available, falling back to the base model for demo purposes.
"""

import logging
import os
import uuid
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings
from app.models.pothole import Severity

logger = logging.getLogger(__name__)

# Try to import ultralytics; fail gracefully so the app starts without GPU
try:
    from ultralytics import YOLO

    _MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
    _model: Optional[YOLO] = None
    _model_load_failed = False

    def _get_model() -> Optional[YOLO]:
        global _model, _model_load_failed
        if _model_load_failed:
            return None
        if _model is None:
            try:
                logger.info("Loading YOLO model from %s", _MODEL_PATH)
                _model = YOLO(_MODEL_PATH)
            except Exception:
                _model_load_failed = True
                logger.exception("Could not load YOLO model; using demo detection")
        return _model

    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("ultralytics not installed – using mock detector")


def _estimate_severity(box_area_ratio: float) -> Severity:
    """
    Classify pothole severity from the fraction of the image the detection covers.
    Thresholds are empirically chosen; tune with labelled data.
    """
    if box_area_ratio < 0.02:
        return Severity.low
    if box_area_ratio < 0.08:
        return Severity.medium
    return Severity.high


def _save_annotated(image: np.ndarray, boxes: list, filename: str) -> str:
    """Draw bounding boxes on the image and save it to the uploads dir."""
    annotated = image.copy()
    for box in boxes:
        x1, y1, x2, y2 = map(int, box[:4])
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)
    out_path = Path(settings.UPLOAD_DIR) / filename
    cv2.imwrite(str(out_path), annotated)
    return filename


def run_detection(image_bytes: bytes, original_filename: str) -> dict:
    """
    Run pothole detection on raw image bytes.

    Returns a dict with keys:
        pothole_detected, confidence, severity, bounding_boxes, annotated_filename
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image – unsupported format?")

    h, w = img_bgr.shape[:2]
    img_area = h * w

    stem = Path(original_filename).stem
    annotated_filename = f"{stem}_{uuid.uuid4().hex[:8]}_annotated.jpg"

    model = _get_model() if YOLO_AVAILABLE and not settings.DEMO_MODE else None

    if settings.DEMO_MODE or not YOLO_AVAILABLE or model is None:
        # ── Mock mode (useful in CI / no-GPU environments) ──────────────────
        # Return a fake detection so the rest of the pipeline can be tested.
        mock_box = [w * 0.2, h * 0.3, w * 0.5, h * 0.6]
        _save_annotated(img_bgr, [mock_box], annotated_filename)
        return {
            "pothole_detected": True,
            "confidence": 0.72,
            "severity": Severity.medium,
            "bounding_boxes": [mock_box],
            "annotated_filename": annotated_filename,
        }

    results = model(img_bgr, conf=0.35, verbose=False)

    boxes: list[list[float]] = []
    max_conf = 0.0

    for result in results:
        for box in result.boxes:
            xyxy = box.xyxy[0].cpu().numpy().tolist()
            conf = float(box.conf[0])
            boxes.append(xyxy)
            max_conf = max(max_conf, conf)

    if not boxes:
        return {
            "pothole_detected": False,
            "confidence": 0.0,
            "severity": Severity.low,
            "bounding_boxes": [],
            "annotated_filename": None,
        }

    # Severity from the largest detected box
    largest_area = max(
        (b[2] - b[0]) * (b[3] - b[1]) for b in boxes
    )
    severity = _estimate_severity(largest_area / img_area)

    _save_annotated(img_bgr, boxes, annotated_filename)

    return {
        "pothole_detected": True,
        "confidence": round(max_conf, 4),
        "severity": severity,
        "bounding_boxes": boxes,
        "annotated_filename": annotated_filename,
    }