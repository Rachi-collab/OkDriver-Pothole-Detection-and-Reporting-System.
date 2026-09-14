# OkDriver – Smart Pothole Detection & Reporting System

A full-stack web application that detects potholes from image/video input, captures GPS location, estimates severity, identifies the responsible civic authority (MCD/PWD), and auto-generates reports - all tracked on a live map dashboard.

## How The Project Works

The project has three main parts:

- *Frontend:* React, Vite, Tailwind CSS, React Router, Leaflet, and Axios.
- *Backend:* FastAPI with SQLAlchemy, image processing, YOLO inference, authority mapping, and email reporting.
- *Database:* PostgreSQL for pothole reports, status, location, severity, and authority information.

### Detection and Reporting Flow

1. The user opens the Report page.
2. The user selects a JPG, PNG, or WebP image.
3. The user enters latitude and longitude or uses browser geolocation.
4. The frontend sends the image and form fields as multipart form data to:
   /api/potholes/detect
5. The backend validates the file type and size.
6. The image is saved in the upload directory.
7. The detector runs YOLO inference.
8. The result is classified as low, medium, or high severity based on the detected bounding-box area.
9. The coordinates are mapped to a civic authority zone.
10. The report is saved in PostgreSQL.
11. An email task is queued if SMTP settings are configured.
12. The frontend displays the result and links to the saved report.

## Tech Stack

| Layer | Technology |
| ------- | ----------- |
| Frontend | React 18 + Vite, Tailwind CSS, Leaflet.js |
| Backend | FastAPI (Python) |
| Database | PostgreSQL via SQLAlchemy |
| ML Model | YOLOv8 (Ultralytics) fine-tuned for pothole detection |
| Maps | Leaflet + OpenStreetMap (no API key needed) |
| Reporting | SMTP email + dashboard tickets |

## Features

- **Pothole Detection** – Upload an image or video frame; YOLOv8 runs inference and returns bounding boxes + confidence scores
- **Geo-tagging** – Each detection is stamped with GPS coordinates and timestamp
- **Severity Estimation** – Classified as Low / Medium / High based on bounding-box area ratio
- **Authority Routing** – Zone-to-authority mapping (MCD North/South/East, PWD, etc.) from coordinates
- **Auto-Reporting** – Email sent to the relevant department with photo evidence
- **Live Dashboard** – Map view of all potholes; filter by zone, severity, status
- **Status Tracking** - Reported → Acknowledged → In Progress → Resolved

## Project Structure

```
pothole-app/
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── core/     # Config, auth, DB
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # ML inference, email, authority mapping
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Docker & Docker Compose, **or** Python 3.10+ and Node 18+

### Run with Docker

```bash
cp backend/.env.example backend/.env   # fill in your values
docker compose up --build
```

Open http://localhost:5173

### Run locally

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```



