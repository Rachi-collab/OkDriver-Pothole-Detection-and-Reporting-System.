"""
Unit tests for the authority mapping logic.
These run without any DB or network access.
"""

import pytest
from app.services.authority_mapper import get_authority, get_zone_name


def test_mcd_north_delhi():
    auth = get_authority(28.75, 77.18)
    assert "North" in auth.name
    assert "@mcd" in auth.email


def test_mcd_south_delhi():
    auth = get_authority(28.55, 77.25)
    assert "South" in auth.name


def test_default_fallback():
    # Coordinates outside all defined zones (middle of the ocean)
    auth = get_authority(0.0, 0.0)
    assert auth.name == "Municipal Corporation (General)"


def test_zone_name_returns_string():
    zone = get_zone_name(28.75, 77.18)
    assert isinstance(zone, str)
    assert len(zone) > 0
