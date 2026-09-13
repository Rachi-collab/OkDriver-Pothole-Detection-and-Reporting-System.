"""
Maps GPS coordinates to the responsible civic authority.

In a production system this would call a GIS boundary service.
Here we use a simple bounding-box lookup that covers Delhi's major zones
and falls back gracefully for other cities.
"""

import logging
from dataclasses import dataclass
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


@dataclass
class Authority:
    name: str
    email: str
    zone: str


# Delhi zone bounding boxes: (lat_min, lat_max, lon_min, lon_max)
_DELHI_ZONES: list[tuple[tuple[float, float, float, float], Authority]] = [
    (
        (28.70, 28.82, 77.10, 77.25),
        Authority("MCD North Delhi", "north@mcd.delhi.gov.in", "MCD North"),
    ),
    (
        (28.50, 28.70, 77.15, 77.35),
        Authority("MCD South Delhi", "south@mcd.delhi.gov.in", "MCD South"),
    ),
    (
        (28.60, 28.72, 77.25, 77.45),
        Authority("MCD East Delhi", "east@mcd.delhi.gov.in", "MCD East"),
    ),
    (
        (28.58, 28.68, 76.98, 77.18),
        Authority("MCD West Delhi", "west@mcd.delhi.gov.in", "MCD West"),
    ),
    (
        (28.45, 28.60, 77.00, 77.20),
        Authority("PWD Delhi South-West", "pwd.sw@delhi.gov.in", "PWD SW"),
    ),
]

_DEFAULT = Authority(
    "Municipal Corporation (General)",
    "complaints@municipalcorp.gov.in",
    "General",
)


def get_authority(lat: float, lon: float) -> Authority:
    """Return the civic authority responsible for the given coordinates."""
    for (lat_min, lat_max, lon_min, lon_max), authority in _DELHI_ZONES:
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return authority
    return _DEFAULT


def get_zone_name(lat: float, lon: float) -> str:
    return get_authority(lat, lon).zone


def reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """
    Reverse geocode coordinates using OpenStreetMap's Nominatim API.
    Returns display address string or None if unresolvable.
    """
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {"lat": lat, "lon": lon, "format": "json"}
    headers = {"User-Agent": "OkDriver-PotholeApp/1.0"}
    try:
        with httpx.Client(timeout=2.5) as client:
            resp = client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("display_name")
    except Exception as exc:
        logger.warning("Reverse geocoding failed for (%s, %s): %s", lat, lon, exc)
    return None

