# FinSense

FinSense is an intelligent financial asset intelligence and lifecycle management platform that connects physical asset movement, operational risk, financing decisions, and financial visibility in a unified platform.

## Overview

- Asset lifecycle tracking from purchase order creation to cash realisation
- Portfolio monitoring across multiple asset stages and locations
- Risk scoring across asset, buyer, logistics, and financing dimensions
- Interactive India-wide asset and logistics map
- Digital Twin visualization for physical assets and infrastructure
- AR-style visualization of factories, warehouses, routes, and moving assets
- Real-time truck and logistics movement visualization
- Asset location and lifecycle state tracking
- Financing capacity analysis and financing workflows
- Scenario-based simulation for delays, damage, buyer risk, and invoice delays
- Reconciliation of data across multiple operational sources
- AI Copilot for portfolio analysis and decision support
- Real-time alerts and operational monitoring
- Evidence tracking and decision trails
- Audit and operational history

## Architecture

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + Python + Pydantic
- Maps: Leaflet and geospatial visualization
- 3D / Digital Twin: Spatial asset visualization and interactive models
- AR: Asset and infrastructure visualization layer
- Real-time updates: WebSocket communication
- API communication: REST APIs
- Data layer: API-backed demo data with local development support

## Project Structure

- `client/` – React + Vite frontend application
- `client/src/pages/` – application pages and modules
- `client/src/components/` – reusable UI components
- `client/src/services/` – API and WebSocket services
- `client/src/spatial/` – Digital Twin, AR, terrain, tracking, and spatial engines
- `server/` – FastAPI backend
- `server/engine/` – AI, financial, risk, simulation, reconciliation, and shield engines
- `server/app/` – backend application and spatial modules
- `server/tests/` – backend tests
- `scripts/` – setup and utility scripts
- `.github/workflows/` – GitHub Pages deployment workflow

## Core Modules

### Dashboard

Provides an executive overview of:

- Portfolio value
- Financing exposure
- Asset status
- Risk indicators
- Active alerts
- Operational metrics

### Portfolio

Provides detailed asset-level information including:

- Asset ID
- Asset category
- Lifecycle stage
- Current location
- Asset value
- Risk status
- Financing exposure
- Operational status

### Map

Provides a geographic view of the asset portfolio across India.

The map can represent:

- Factories
- Warehouses
- Ports
- Logistics locations
- Asset routes
- Transit assets
- Moving trucks
- Risk locations

### Digital Twin

Provides an interactive spatial representation of physical assets and infrastructure.

The Digital Twin can visualize:

- Factories
- Warehouses
- Roads
- Ports
- Logistics facilities
- Asset locations
- Transport vehicles
- Supply-chain routes

Users can select locations and assets to inspect their details and operational state.

### AR View

Provides an AR-style visualization layer for asset intelligence.

The AR experience is designed to visualize:

- Infrastructure models
- Asset locations
- Logistics routes
- Moving vehicles
- Factories
- Warehouses
- Asset information
- Operational states

### Simulation

Allows users to evaluate hypothetical scenarios without changing the real asset state.

Supported scenarios include:

- Transit delays
- Asset damage
- Buyer risk increase
- Invoice payment delays
- Custom operational scenarios

Simulation results can show changes in:

- Risk
- Asset value
- Financing exposure
- Expected loss
- Recommended actions

### Financing

Connects asset intelligence with financing decisions.

The financing module supports:

- Financing provider selection
- Requested financing amount
- Financial instrument selection
- Financing exposure analysis
- Financing shield checks
- Financing attempt workflows

### Alerts

Provides operational and financial alerts for:

- High-risk assets
- Logistics delays
- Financing exposure
- Data conflicts
- Operational anomalies

Alerts can be acknowledged and resolved.

### Reconciliation

Identifies inconsistencies between different data sources.

The system can compare:

- Asset values
- Asset states
- Operational information
- Source records
- Financial information

Each discrepancy can be tracked through its resolution status.

### Advisor

The AI Copilot provides decision-support capabilities using portfolio and asset information.

It can help users understand:

- Asset risk
- Financing exposure
- Simulation results
- Operational conditions
- Portfolio changes
- Recommended actions

### Audit

Provides traceability for important system and operational events.

Audit information can include:

- Event
- Asset
- Timestamp
- Action
- User
- Decision
- Operational impact

## Asset Lifecycle

FinSense follows assets throughout their physical and financial lifecycle:

```text
Purchase Order
      ↓
Production
      ↓
Transit
      ↓
Warehouse
      ↓
Invoice
      ↓
Cash Realisation

The system connects physical movement with financial intelligence at each stage.

Local Setup
Prerequisites
Node.js 18+
Python 3.11+
npm
pip
Git
Backend
cd server

python -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install -r requirements.txt

uvicorn main:app --reload --host 0.0.0.0 --port 8000

Backend:

http://localhost:8000
Frontend

Open another terminal:

cd client

npm install

npm run dev

Frontend:

http://localhost:5173
Environment

Create a production environment file inside the client directory:

client/.env.production

Example:

VITE_API_BASE_URL=https://finsense-api-15lk.onrender.com/api
VITE_WS_BASE_URL=wss://finsense-api-15lk.onrender.com

For local development, configure the appropriate API endpoint in the environment configuration.

Testing
Backend
cd server
pytest -q
Frontend
cd client
npm run build
Production Build
cd client
npm run build

The production frontend is generated in:

client/dist
API
Health
GET /api/health
Dashboard
GET /api/dashboard
Assets
GET /api/assets
GET /api/assets/{assetId}
Simulation
POST /api/assets/{assetId}/simulate
POST /api/simulation/{assetId}/apply
Financing
POST /api/assets/{assetId}/financing/attempt
Alerts
GET  /api/alerts
POST /api/alerts/{alertId}/acknowledge
POST /api/alerts/{alertId}/resolve
Reconciliation
GET  /api/reconciliation
POST /api/reconciliation/{assetId}/resolve
AI Copilot
POST /api/ai/chat
Evidence
GET /api/assets/{assetId}/evidence
Authentication
GET  /api/auth/me
POST /api/auth/login
WebSocket

Real-time asset and operational events are available through:

ws://localhost:8000/ws/events

Production:

wss://finsense-api-15lk.onrender.com/ws/events
Demo User
Email: executive@finsense.ai
Role: Executive
Deployment
Frontend

The frontend is deployed using GitHub Actions and GitHub Pages.

Git Push
   ↓
GitHub Actions
   ↓
npm ci
   ↓
npm run build
   ↓
client/dist
   ↓
GitHub Pages

Production frontend:

https://barathisankar29.github.io/FinSense/
Backend

The FastAPI backend is deployed separately on Render.

Production API:

https://finsense-api-15lk.onrender.com

Health check:

https://finsense-api-15lk.onrender.com/api/health
Data Flow
                    FinSense Platform
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Physical          Financial        Operational
        Assets           Data             Events
          │                │                │
          └────────────────┼────────────────┘
                           ↓
                    Asset Intelligence
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
           Risk       Simulation     Financing
             │             │             │
             └─────────────┼─────────────┘
                           ↓
                     AI Advisor
                           │
                           ↓
                  Recommended Action
Digital Twin Flow
Factory
   │
   │
   ├────────────── Road ──────────────┐
   │                                  │
   ▼                                  ▼
Warehouse  ←──── 🚚 Truck ────────  Port
   │
   ▼
Customer

Each location can contain a corresponding digital model and operational information.

Key Objectives

FinSense is designed to answer four critical questions:

Where is the asset?
        ↓
What is happening to it?
        ↓
What is the financial impact?
        ↓
What should we do next?

The platform combines physical asset intelligence with financial decision-making to provide a unified operational view.

Future Scope
Real-time GPS and vehicle telemetry
Advanced 3D India terrain
Enhanced AR asset visualization
IoT sensor integration
Predictive risk models
AI-powered forecasting
Automated financing recommendations
Advanced supply-chain simulation
Satellite and geospatial intelligence
PostgreSQL production database
Enterprise authentication and access control
Multi-user collaboration
Advanced digital-twin synchronization
Notes

FinSense is currently implemented as a working demonstration platform with API-backed functionality and seeded portfolio data.
