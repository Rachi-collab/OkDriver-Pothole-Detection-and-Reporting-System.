"""
Unit tests for pothole detection helpers (severity estimation, image decode).
Runs in mock mode – no actual YOLO weights needed.
"""

import numpy as np
import cv2
import pytest
from app.services.detector import _estimate_severity, run_detection
from app.models.pothole import Severity


def test_severity_low():
    assert _estimate_severity(0.01) == Severity.low


def test_severity_medium():
    assert _estimate_severity(0.04) == Severity.medium


def test_severity_high():
    assert _estimate_severity(0.10) == Severity.high


def test_run_detection_bad_bytes():
    with pytest.raises(ValueError, match="Could not decode"):
        run_detection(b"not-an-image", "test.jpg")


def test_run_detection_valid_image(tmp_path, monkeypatch):
    """Mock detector should return a detection dict for a valid image."""
    import app.services.detector as det
    # Force mock mode
    monkeypatch.setattr(det, "YOLO_AVAILABLE", False)
    monkeypatch.setattr(det.settings, "UPLOAD_DIR", str(tmp_path))

    # Create a tiny blank JPEG in memory
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok

    result = run_detection(buf.tobytes(), "blank.jpg")
    assert result["pothole_detected"] is True
    assert 0 < result["confidence"] <= 1
    assert result["severity"] in list(Severity)
