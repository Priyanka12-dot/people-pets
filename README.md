# People & Pets 🔍
### Crowdsourced Lost & Found Infrastructure

> A hackathon-ready, full-stack missing persons and lost pet registry with AI-powered photo matching.

---

## Overview

People & Pets is a nationwide missing persons and lost pet registry dashboard built for communities and rescue teams. When a user uploads a photo of a found person or stray animal, the AI module compares it against all active "missing" database entries using facial recognition (persons) or fur-pattern matching (pets).

---

## Tech Stack

| Layer    | Technology                          | Why                                     |
|----------|-------------------------------------|-----------------------------------------|
| Frontend | React + Tailwind CSS + Vite         | Fast UI, responsive, hackathon-friendly |
| Backend  | Flask (Python) + SQLAlchemy         | Lightweight, easy AI integration        |
| Database | SQLite                              | Zero server setup, single file          |
| AI       | `face_recognition` + `scikit-image` / OpenCV | Pre-trained, offline, high-level APIs |

---

## Project Structure

```
people-pets/
├── backend/
│ ├── app.py # Flask routes & entry point
│ ├── models.py # SQLAlchemy models
│ ├── config.py # DB & upload config
│ ├── ai/ # Matching modules
│ │ ├── face_match.py # Facial recognition
│ │ └── pet_match.py # Pet pattern matching
│ ├── static/uploads/ # Uploaded images
│ └── requirements.txt
├── frontend/
│ ├── src/
│ │ ├── App.jsx # Routes & layout
│ │ ├── api.js # Backend API calls
│ │ └── components/ # React components
│ │ ├── Navbar.jsx
│ │ ├── Dashboard.jsx
│ │ ├── MissingForm.jsx
│ │ ├── FoundForm.jsx
│ │ ├── MatchCard.jsx
│ │ └── MatchesPage.jsx
│ ├── tailwind.config.js
│ └── vite.config.js
├── demo_data/ # Test images
└── README.md

```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Flask runs on http://localhost:5000
```

**Optional AI libraries** (uncomment in `requirements.txt`):

```bash
# Full facial recognition (requires cmake):
pip install face_recognition dlib

# Full pet pattern matching:
pip install opencv-python

# Without these, the app uses histogram-distance fallback — perfect for demos.
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Vite dev server on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/missing` | List missing entries (`?type=person\|pet&status=missing\|found\|all`) |
| POST | `/api/missing` | Create missing entry (multipart/form-data with optional `image`) |
| PATCH | `/api/missing/:id` | Update status (`{"status": "found"}`) |
| DELETE | `/api/missing/:id` | Remove entry |
| GET | `/api/found` | List found entries |
| POST | `/api/found` | Upload found photo → triggers AI scan → returns matches |
| GET | `/api/matches` | All AI matches (`?type=person\|pet&min_confidence=0.5`) |
| DELETE | `/api/matches/:id` | Remove a match |

---

## AI Matching

### Persons — `face_recognition`
1. Extracts 128-dimension face encodings from both images.
2. Computes Euclidean distance between encodings.
3. Converts distance to a 0–1 confidence score.
4. **Fallback**: RGB histogram cosine similarity when `face_recognition` is unavailable.

### Pets — OpenCV ORB + HSV Histogram
1. Detects ORB keypoints and descriptors in both images.
2. Brute-force matches descriptors; counts "good" matches (Hamming distance < 64).
3. Blends keypoint ratio (60%) + HSV colour histogram similarity (40%).
4. **Fallback**: Pillow + NumPy histogram similarity when OpenCV is unavailable.

Confidence thresholds:
| Range | Interpretation |
|-------|----------------|
| ≥ 75% | High confidence — contact reporter immediately |
| 50–74% | Possible match — visual review recommended |
| 30–49% | Low confidence — inspect before contacting |
| < 30% | Very unlikely match |

---

## Demo Data

Place sample images in `demo_data/` and use the **Report Missing** form to register them, then upload any of the same or similar images via **Upload Found** to test the AI pipeline.

---

## Deployment Notes

- Set `SECRET_KEY` as an environment variable in production.
- Replace SQLite with PostgreSQL by updating `SQLALCHEMY_DATABASE_URI` in `config.py`.
- Serve static uploads via a CDN or Nginx in production; the `/static/uploads` route is Flask-served for local dev only.
- For the frontend build: `npm run build` → deploy `dist/` to any static host.

---

## License

MIT — built for the Devpost Hackathon.
