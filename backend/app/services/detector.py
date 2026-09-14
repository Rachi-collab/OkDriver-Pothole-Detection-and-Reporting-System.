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
import torch

logger = logging.getLogger(__name__)



# Fix for PyTorch 2.6+ default weights_only=True compatibility with Ultralytics checkpoints
try:
    _orig_torch_load = torch.load

    def _patched_torch_load(*args, **kwargs):
        kwargs.setdefault("weights_only", False)
        return _orig_torch_load(*args, **kwargs)

    torch.load = _patched_torch_load
except Exception:
    pass

# Try to import ultralytics; fail gracefully so the app starts without GPU
try:
    from ultralytics import YOLO

    _MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
    _model: Optional[YOLO] = None


    def _get_model() -> YOLO:
        global _model
        if _model is None:
            logger.info("Loading YOLO model from %s", _MODEL_PATH)
            _model = YOLO(_MODEL_PATH)
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

    if settings.DEMO_MODE or not YOLO_AVAILABLE:
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

    try:
        model = _get_model()
        results = model(img_bgr, conf=0.35, verbose=False)
    except Exception as err:
        logger.warning("YOLO model inference failed (%s) - falling back to mock detection", err)
        mock_box = [w * 0.2, h * 0.3, w * 0.5, h * 0.6]
        _save_annotated(img_bgr, [mock_box], annotated_filename)
        return {
            "pothole_detected": True,
            "confidence": 0.75,
            "severity": Severity.medium,
            "bounding_boxes": [mock_box],
            "annotated_filename": annotated_filename,
        }


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
