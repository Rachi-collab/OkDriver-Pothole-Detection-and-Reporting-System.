from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.pothole import Severity, Status


class PotholeBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    zone: Optional[str] = None
    severity: Severity = Severity.medium
    confidence: Optional[float] = Field(None, ge=0, le=1)
    authority_name: Optional[str] = None
    authority_email: Optional[str] = None
    notes: Optional[str] = None


class PotholeCreate(PotholeBase):
    """Schema used when creating a pothole record from a detection event."""
    image_path: Optional[str] = None


class PotholeUpdate(BaseModel):
    """Schema for partial updates, e.g. status changes by the authority."""
    status: Optional[Status] = None
    notes: Optional[str] = None
    authority_name: Optional[str] = None
    authority_email: Optional[str] = None


class PotholeRead(PotholeBase):
    id: int
    image_path: Optional[str]
    status: Status
    reported_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DetectionResponse(BaseModel):
    """Returned after running ML inference on an uploaded image."""
    pothole_detected: bool
    confidence: float
    severity: Severity
    bounding_boxes: list[list[float]]   # [[x1,y1,x2,y2], ...]
    annotated_image_url: Optional[str] = None
    pothole_id: Optional[int] = None    # set if record was saved
