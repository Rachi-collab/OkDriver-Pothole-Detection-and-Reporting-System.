# OkDriver – Smart Pothole Detection & Reporting System

A full-stack web application that detects potholes from image/video input, captures GPS location, estimates severity, identifies the responsible civic authority (MCD/PWD), and auto-generates reports - all tracked on a live map dashboard.

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

## How It Works

1. User uploads an image via the dashboard
2. Backend runs YOLOv8 inference → returns detections
3. Severity is estimated from bounding-box-to-image area ratio
4. Coordinates are reverse-mapped to the correct civic authority zone
5. A report record is saved to PostgreSQL
6. An email is dispatched to the authority's inbox
7. The dashboard map pin updates in real time


