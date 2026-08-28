# FinSense

FinSense is a financial asset intelligence and lifecycle management platform for monitoring asset movement, financing capacity, lifecycle stages, risk exposure, and operational reconciliation in real time.

## Overview

- Asset lifecycle tracking from PO creation to cash realisation
- Risk scoring across physical, buyer, logistics, and financing dimensions
- Financing shield checks and approval workflows
- Digital twin simulations and scenario comparison
- Reconciliation of source data across ERP, supplier, logistics, and banking systems
- AI Copilot grounded in real portfolio data
- Real-time alerts and audit tracking

## Architecture

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + Pydantic + Python
- Data layer: API-backed in-memory demo store with a SQLite fallback for local development
- Real-time updates: WebSocket feed on `/ws/events`

## Project structure

- `client/` – Vite React application
- `server/` – FastAPI backend and business engines
- `scripts/` – helper scripts for setup, seed, build, and test

## Local setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm
- pip

### Backend

```bash
cd server
python -m venv .venv
. .venv\Scripts\activate   # Windows PowerShell
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Environment

Copy the example file:

```bash
copy .env.example .env
```

## Testing

```bash
cd server
pytest -q
```

```bash
cd client
npm run build
```

## API

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## WebSocket

- Real-time events: `ws://localhost:8000/ws/events`

## Demo user

- Email: `executive@finsense.ai`
- Role: `Executive`

## Notes

This project is designed as a working FinSense demo application with live API-backed behavior and seeded portfolio data. Production deployments should replace the demo in-memory store with PostgreSQL or another durable database layer.
