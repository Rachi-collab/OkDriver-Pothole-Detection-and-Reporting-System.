import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Status(str, enum.Enum):
    reported = "reported"
    acknowledged = "acknowledged"
    in_progress = "in_progress"
    resolved = "resolved"


class Pothole(Base):
    __tablename__ = "potholes"

    id = Column(Integer, primary_key=True, index=True)

    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(512), nullable=True)
    zone = Column(String(128), nullable=True)          # e.g. "MCD North"

    # Detection metadata
    severity = Column(Enum(Severity), nullable=False, default=Severity.medium)
    confidence = Column(Float, nullable=True)           # model confidence 0-1
    image_path = Column(String(512), nullable=True)    # saved image filename

    # Civic authority
    authority_name = Column(String(256), nullable=True)
    authority_email = Column(String(256), nullable=True)

    # Status tracking
    status = Column(
        Enum(Status), nullable=False, default=Status.reported
    )
    notes = Column(Text, nullable=True)

    # Timestamps
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return (
            f"<Pothole id={self.id} severity={self.severity} "
            f"lat={self.latitude} lon={self.longitude}>"
        )
