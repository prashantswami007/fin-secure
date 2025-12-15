# FinSecure

FinSecure is a demo robo-advisor with a Flask backend and React/Vite frontend. It offers portfolio recommendations based on risk scores, QA test execution from the UI, and basic metrics backed by Postgres.

## Project Structure
- Backend: [`server.py`](server.py)
- Frontend: [`frontend/src/App.jsx`](frontend/src/App.jsx)
- Tests: [`tests/security-tests.py`](tests/security-tests.py)
- Deployment: [`render.yaml`](render.yaml), [`Procfile`](Procfile)

## Features
- Portfolio recommendation API with JSON/XML input.
- QA dashboard to run compliance/security test suites.
- Metrics endpoint (tests and recommendations).
- Recommendation history with pagination/filtering.
- Render deployment config for backend and static frontend hosting.

## Getting Started (Backend)
1. Install dependencies:
   ```bash
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Set environment:
   ```bash
   export DATABASE_URL=<postgres-connection-url>
   export FLASK_APP=server.py
   ```
3. Run locally:
   ```bash
   python server.py
   # or
   gunicorn server:app
   ```
4. Health check: `GET /health`

## API Endpoints (Backend)
- `POST /recommend` — Recommend portfolio (JSON or XML).
  - Risk score validation: $0 \le \text{risk\_score} \le 100$.
- `GET /run-tests?type=compliance|security` — Executes pytest suites (disabled in production).
- `GET /metrics` — Returns test and recommendation stats.
- `GET /recommendations` — Paginated recommendations.
- `GET /health` — Service status.

## Frontend (Vite + React)
1. Install and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Build:
   ```bash
   npm run build
   ```
3. Configure API base URL via `frontend/.env`:
   ```bash
   VITE_BASE_URL=http://localhost:5000
   ```

## Tests
- Compliance & security suites live in [`tests/security-tests.py`](tests/security-tests.py).
- Run locally:
   ```bash
   pytest tests/security-tests.py -v
   ```
- Via API (non-production):
   ```bash
   curl "http://localhost:5000/run-tests?type=compliance"
   curl "http://localhost:5000/run-tests?type=security"
   ```

## Deployment (Render)
- Backend: see [`render.yaml`](render.yaml) and [`Procfile`](Procfile).
- Frontend: static build served from `frontend/dist`.

## Notes
- XML parsing in [`server.py`](server.py) is intentionally vulnerable for security testing demos—do not use in production.
- QA login in [`frontend/src/App.jsx`](frontend/src/App.jsx) is hardcoded for demo (`qa_admin` / `test123`).
