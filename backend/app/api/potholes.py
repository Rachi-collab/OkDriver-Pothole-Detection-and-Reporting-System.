"""
REST endpoints for pothole records.
"""

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.pothole import Pothole, Severity, Status
from app.schemas.pothole import DetectionResponse, PotholeCreate, PotholeRead, PotholeUpdate
from app.services.authority_mapper import get_authority, reverse_geocode
from app.services.detector import run_detection
from app.services.email_service import send_report_email

router = APIRouter(prefix="/api/potholes", tags=["potholes"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


# ── Helpers ─────────────────────────────────────────────────────────────────

def _save_upload(file_bytes: bytes, original_name: str) -> str:
    """Save raw bytes to the upload directory and return the filename."""
    suffix = Path(original_name).suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{suffix}"
    out = Path(settings.UPLOAD_DIR) / filename
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(file_bytes)
    return filename


# ── Detect endpoint ──────────────────────────────────────────────────────────

@router.post("/detect", response_model=DetectionResponse, status_code=201)
async def detect_pothole(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload an image, run YOLOv8 detection, persist the result, and
    dispatch a report email to the responsible civic authority.
    """
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{image.content_type}'. Use JPEG, PNG, or WebP.",
        )

    image_bytes = await image.read()
    if len(image_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB} MB.",
        )

    # Save original upload
    original_filename = _save_upload(image_bytes, image.filename or "upload.jpg")

    # Run ML inference
    detection = run_detection(image_bytes, original_filename)

    if not detection["pothole_detected"]:
        return DetectionResponse(
            pothole_detected=False,
            confidence=0.0,
            severity=Severity.low,
            bounding_boxes=[],
        )

    # Map to civic authority
    authority = get_authority(latitude, longitude)

    # Reverse geocode address if not provided
    resolved_address = address or reverse_geocode(latitude, longitude)

    # Persist record
    pothole = Pothole(
        latitude=latitude,
        longitude=longitude,
        address=resolved_address,
        zone=authority.zone,
        severity=detection["severity"],
        confidence=detection["confidence"],
        image_path=detection.get("annotated_filename") or original_filename,
        authority_name=authority.name,
        authority_email=authority.email,
        status=Status.reported,
    )
    db.add(pothole)
    db.commit()
    db.refresh(pothole)

    # Fire-and-forget email
    background_tasks.add_task(send_report_email, pothole)

    return DetectionResponse(
        pothole_detected=True,
        confidence=detection["confidence"],
        severity=detection["severity"],
        bounding_boxes=detection["bounding_boxes"],
        annotated_image_url=f"/api/potholes/{pothole.id}/image",
        pothole_id=pothole.id,
    )


# ── CRUD endpoints ───────────────────────────────────────────────────────────

@router.get("", response_model=list[PotholeRead])
def list_potholes(
    status: Optional[Status] = Query(None),
    severity: Optional[Severity] = Query(None),
    zone: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Pothole)
    if status:
        q = q.filter(Pothole.status == status)
    if severity:
        q = q.filter(Pothole.severity == severity)
    if zone:
        q = q.filter(Pothole.zone.ilike(f"%{zone}%"))
    return q.order_by(Pothole.reported_at.desc()).offset(skip).limit(limit).all()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Pothole.id)).scalar()
    by_status = {
        row[0].value: row[1]
        for row in db.query(Pothole.status, func.count(Pothole.id)).group_by(Pothole.status).all()
    }
    by_severity = {
        row[0].value: row[1]
        for row in db.query(Pothole.severity, func.count(Pothole.id)).group_by(Pothole.severity).all()
    }
    return {"total": total, "by_status": by_status, "by_severity": by_severity}


@router.get("/{pothole_id}", response_model=PotholeRead)
def get_pothole(pothole_id: int, db: Session = Depends(get_db)):
    pothole = db.get(Pothole, pothole_id)
    if not pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    return pothole


@router.patch("/{pothole_id}", response_model=PotholeRead)
def update_pothole(
    pothole_id: int,
    payload: PotholeUpdate,
    db: Session = Depends(get_db),
):
    pothole = db.get(Pothole, pothole_id)
    if not pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pothole, field, value)
    db.commit()
    db.refresh(pothole)
    return pothole


@router.get("/{pothole_id}/image")
def get_image(pothole_id: int, db: Session = Depends(get_db)):
    from fastapi.responses import FileResponse

    pothole = db.get(Pothole, pothole_id)
    if not pothole or not pothole.image_path:
        raise HTTPException(status_code=404, detail="Image not found")
    path = Path(settings.UPLOAD_DIR) / pothole.image_path
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image file missing")
    return FileResponse(path)
