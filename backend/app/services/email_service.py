"""
Sends automated pothole reports to civic authorities via SMTP.
Uses aiosmtplib for async email sending so it does not block FastAPI.
"""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.models.pothole import Pothole

logger = logging.getLogger(__name__)


def _build_html_body(pothole: Pothole, dashboard_url: str) -> str:
    severity_colour = {"low": "#f59e0b", "medium": "#f97316", "high": "#ef4444"}
    colour = severity_colour.get(pothole.severity, "#6b7280")

    return f"""
    <html><body style="font-family:Arial,sans-serif;color:#1f2937">
    <h2 style="color:{colour}">🚧 Pothole Reported – Action Required</h2>
    <p>A new pothole has been detected and logged in the OkDriver system.</p>
    <table border="0" cellpadding="6" style="border-collapse:collapse">
      <tr><td><b>Report ID</b></td><td>#{pothole.id}</td></tr>
      <tr><td><b>Severity</b></td>
          <td><span style="color:{colour};font-weight:bold">
              {pothole.severity.upper()}</span></td></tr>
      <tr><td><b>Location</b></td>
          <td>{pothole.address or 'N/A'} ({pothole.latitude:.5f}, {pothole.longitude:.5f})</td></tr>
      <tr><td><b>Zone</b></td><td>{pothole.zone or 'N/A'}</td></tr>
      <tr><td><b>Reported at</b></td><td>{pothole.reported_at.strftime('%d %b %Y %H:%M UTC')}</td></tr>
      <tr><td><b>Confidence</b></td><td>{(pothole.confidence or 0)*100:.1f}%</td></tr>
    </table>
    <p style="margin-top:20px">
      <a href="{dashboard_url}/pothole/{pothole.id}"
         style="background:#2563eb;color:white;padding:10px 20px;
                border-radius:6px;text-decoration:none">
        View on Dashboard →
      </a>
    </p>
    <p style="color:#6b7280;font-size:12px">
      This is an automated report from OkDriver Pothole Detection System.<br>
      Please acknowledge receipt and update the status on the dashboard.
    </p>
    </body></html>
    """


async def send_report_email(
    pothole: Pothole,
    dashboard_url: str = "http://localhost:5173",
) -> bool:
    """
    Send a report email to the authority responsible for the pothole.
    Returns True on success, False on failure (does not raise).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured – skipping email send")
        return False

    recipient = pothole.authority_email
    if not recipient:
        logger.warning("No authority email for pothole %s – skipping", pothole.id)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = (
        f"[OkDriver] Pothole Reported – {pothole.severity.capitalize()} Severity | "
        f"Zone: {pothole.zone or 'Unknown'} | ID #{pothole.id}"
    )
    msg["From"] = settings.REPORT_FROM_EMAIL
    msg["To"] = recipient

    html_body = _build_html_body(pothole, dashboard_url)
    msg.attach(MIMEText(html_body, "html"))

    try:
        import aiosmtplib

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("Report email sent to %s for pothole #%s", recipient, pothole.id)
        return True
    except Exception as exc:
        logger.error("Failed to send email for pothole #%s: %s", pothole.id, exc)
        return False
