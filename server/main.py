from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .engine.ai_engine import generate_ai_explanation, handle_copilot_chat
from .engine.financial_engine import (
    calculate_financing_metrics,
    calculate_safe_exposure,
    format_inr,
    recommend_financing_action,
)
from .engine.reconciliation_engine import reconcile_data_sources
from .engine.risk_engine import calculate_risk_assessment
from .engine.shield_engine import evaluate_financing_request
from .engine.simulation_engine import run_simulation
from .models import (
    Asset,
    CopilotChatRequest,
    CopilotChatResponse,
    FinancingAttemptRequest,
    FinancingAttemptResponse,
    LifecycleStage,
    RiskLevel,
    SimulationRequest,
    SimulationResponse,
)
from .seed_data import load_seed_assets

app = FastAPI(
    title='FinSense API',
    description='FinSense financial asset intelligence and lifecycle platform.',
    version='2.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

ASSETS_DB: Dict[str, Asset] = {}


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


def init_db() -> None:
    global ASSETS_DB
    assets = load_seed_assets()
    ASSETS_DB = {a.id.lower(): a for a in assets}
    for a in assets:
        ASSETS_DB[a.assetId.lower()] = a


init_db()


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def find_asset(asset_id: str) -> Asset:
    key = (asset_id or '').strip().lower()
    if not key:
        raise HTTPException(status_code=400, detail='Asset id is required.')
    if key in ASSETS_DB:
        return ASSETS_DB[key]
    raise HTTPException(status_code=404, detail=f'Asset {asset_id} not found in FinSense registry.')


@app.get('/api/health')
def health_check():
    return {
        'status': 'OPERATIONAL',
        'service': 'FinSense API',
        'version': '2.0.0',
        'assets_tracked': len({a.assetId for a in ASSETS_DB.values()}),
        'timestamp': now_utc(),
    }


@app.get('/api/auth/me')
def get_current_user():
    return {
        'id': 'user-1',
        'name': 'Executive User',
        'email': 'executive@finsense.ai',
        'role': 'Executive',
        'permissions': ['dashboard:view', 'assets:view', 'risk:view', 'audit:view'],
    }


@app.post('/api/auth/login')
def login_user(payload: Dict[str, Any]):
    role = str(payload.get('role') or 'Executive')
    return {
        'success': True,
        'token': f"finsense-{role.lower().replace(' ', '-')}-token",
        'user': {
            'id': 'user-1',
            'name': payload.get('email', 'FinSense User'),
            'email': payload.get('email', 'executive@finsense.ai'),
            'role': role,
            'permissions': ['dashboard:view', 'assets:view', 'risk:view'],
        },
    }


@app.post('/api/auth/logout')
def logout_user():
    return {'success': True, 'message': 'Logged out successfully.'}


@app.get('/api/dashboard')
def get_dashboard_metrics():
    unique_assets = list({a.assetId: a for a in ASSETS_DB.values()}.values())
    total_value = sum(a.financialState.currentValue for a in unique_assets)
    total_financing = sum(a.financialState.existingFinancing for a in unique_assets)
    trapped_capital = sum(a.financialState.trappedCapital for a in unique_assets)
    available_capacity = sum(a.financialState.availableCapacity for a in unique_assets)
    high_risk = sum(1 for a in unique_assets if a.riskAssessment.overallScore >= 50)

    stage_counts = {}
    for asset in unique_assets:
        key = asset.physicalState.stage.value
        stage_counts[key] = stage_counts.get(key, 0) + 1

    trapped_by_stage = {
        'PRODUCTION': sum(a.financialState.trappedCapital for a in unique_assets if a.physicalState.stage in [LifecycleStage.PO_CREATED, LifecycleStage.RAW_MATERIAL, LifecycleStage.PRODUCTION]),
        'WAREHOUSE': sum(a.financialState.trappedCapital for a in unique_assets if a.physicalState.stage in [LifecycleStage.FINISHED_GOODS, LifecycleStage.WAREHOUSE]),
        'IN_TRANSIT': sum(a.financialState.trappedCapital for a in unique_assets if a.physicalState.stage == LifecycleStage.IN_TRANSIT),
        'RECEIVABLES': sum(a.financialState.trappedCapital for a in unique_assets if a.physicalState.stage in [LifecycleStage.DELIVERED, LifecycleStage.INVOICE_GENERATED, LifecycleStage.RECEIVABLE]),
    }

    metrics = {
        'totalAssetValue': total_value,
        'formattedTotalValue': format_inr(total_value),
        'activeFinancing': total_financing,
        'formattedActiveFinancing': format_inr(total_financing),
        'trappedCapital': trapped_capital,
        'formattedTrappedCapital': format_inr(trapped_capital),
        'availableCapacity': available_capacity,
        'formattedAvailableCapacity': format_inr(available_capacity),
        'atRiskAssetsCount': high_risk,
        'financingEfficiencyPct': min(96, max(10, int(round((total_financing / max(1.0, total_value * 0.7)) * 100)))),
        'monthlyGrowthRate': '+12.4%',
        'trappedByStage': [
            {'stage': 'Production & Raw Materials', 'amount': trapped_by_stage['PRODUCTION'], 'formatted': format_inr(trapped_by_stage['PRODUCTION'])},
            {'stage': 'Warehouse & Inventory', 'amount': trapped_by_stage['WAREHOUSE'], 'formatted': format_inr(trapped_by_stage['WAREHOUSE'])},
            {'stage': 'In Transit & Freight', 'amount': trapped_by_stage['IN_TRANSIT'], 'formatted': format_inr(trapped_by_stage['IN_TRANSIT'])},
            {'stage': 'Receivables & Unpaid Invoices', 'amount': trapped_by_stage['RECEIVABLES'], 'formatted': format_inr(trapped_by_stage['RECEIVABLES'])},
        ],
        'stageCounts': stage_counts,
        'totalAssets': len(unique_assets),
    }
    return metrics


@app.get('/api/assets', response_model=List[Asset])
def get_assets(
    stage: Optional[str] = None,
    risk: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    unique_assets = list({a.assetId: a for a in ASSETS_DB.values()}.values())

    if stage and stage.upper() != 'ALL':
        unique_assets = [a for a in unique_assets if a.physicalState.stage.value == stage.upper()]
    if risk and risk.upper() != 'ALL':
        unique_assets = [a for a in unique_assets if a.riskAssessment.riskLevel.value == risk.upper()]
    if category and category.lower() != 'all':
        unique_assets = [a for a in unique_assets if a.category.lower() == category.lower()]
    if search:
        query = search.lower()
        unique_assets = [
            a for a in unique_assets
            if query in a.assetId.lower()
            or query in a.productName.lower()
            or query in a.contractualState.buyer.lower()
            or query in a.contractualState.poNumber.lower()
            or (a.contractualState.invoiceNumber and query in a.contractualState.invoiceNumber.lower())
            or (a.palletCode and query in a.palletCode.lower())
        ]
    return unique_assets


@app.get('/api/assets/{asset_id}', response_model=Asset)
def get_asset_by_id(asset_id: str):
    return find_asset(asset_id)


@app.get('/api/assets/{asset_id}/evidence')
def get_asset_evidence(asset_id: str):
    asset = find_asset(asset_id)
    return {
        'assetId': asset.assetId,
        'dataSources': asset.dataSources,
        'conflicts': asset.conflicts,
        'decisionTrail': asset.decisionTrail,
        'verificationConfidence': asset.physicalState.verificationConfidence,
    }


@app.get('/api/alerts')
def get_alerts():
    unique_assets = list({a.assetId: a for a in ASSETS_DB.values()}.values())
    alerts: List[Dict[str, Any]] = []
    for a in unique_assets:
        if a.conflicts:
            alerts.append({
                'id': f'ALT-{a.assetId}-CONF',
                'type': 'DATA_CONFLICT',
                'severity': 'CRITICAL',
                'assetId': a.assetId,
                'title': f'Data Conflict on {a.assetId}',
                'message': a.conflicts[0].discrepancy,
                'timestamp': now_utc(),
                'status': 'OPEN',
            })
        if a.riskAssessment.overallScore >= 60:
            alerts.append({
                'id': f'ALT-{a.assetId}-RISK',
                'type': 'HIGH_RISK',
                'severity': 'HIGH',
                'assetId': a.assetId,
                'title': f'High Risk Factor on {a.assetId}',
                'message': a.riskAssessment.earlyWarning or f'Composite risk spiked to {a.riskAssessment.overallScore}/100',
                'timestamp': now_utc(),
                'status': 'OPEN',
            })
        if a.physicalState.stage == LifecycleStage.DELIVERED:
            alerts.append({
                'id': f'ALT-{a.assetId}-DELIV',
                'type': 'LIFECYCLE_DELAY',
                'severity': 'MEDIUM',
                'assetId': a.assetId,
                'title': f'Delivery Confirmed for {a.assetId}',
                'message': f'Asset reached destination {a.physicalState.destination}. Ready for invoice generation.',
                'timestamp': now_utc(),
                'status': 'OPEN',
            })
    return alerts


@app.post('/api/alerts/{alert_id}/acknowledge')
def acknowledge_alert(alert_id: str):
    return {'success': True, 'alertId': alert_id, 'status': 'ACKNOWLEDGED'}


@app.post('/api/alerts/{alert_id}/resolve')
def resolve_alert(alert_id: str):
    return {'success': True, 'alertId': alert_id, 'status': 'RESOLVED'}


@app.get('/api/audit')
def get_audit_trail():
    trail = []
    for asset in sorted(ASSETS_DB.values(), key=lambda a: a.assetId):
        for event in asset.decisionTrail:
            trail.append({
                'assetId': asset.assetId,
                'productName': asset.productName,
                'time': event.time,
                'event': event.event,
                'description': event.description,
                'confidence': event.confidence,
                'impact': event.impact,
                'dataSources': event.dataSources,
            })
    return trail


@app.get('/api/reconciliation')
def get_reconciliation():
    records = []
    for asset in ASSETS_DB.values():
        if asset.conflicts:
            for conflict in asset.conflicts:
                records.append({
                    'assetId': asset.assetId,
                    'field': conflict.field,
                    'sourceA': conflict.sourceA,
                    'sourceB': conflict.sourceB,
                    'valueA': conflict.valueA,
                    'valueB': conflict.valueB,
                    'status': 'CONFLICT',
                    'resolution': conflict.resolution,
                })
    return records


@app.post('/api/reconciliation/{asset_id}/resolve')
def resolve_reconciliation(asset_id: str, payload: Dict[str, Any]):
    return {'success': True, 'assetId': asset_id, 'status': payload.get('status', 'RESOLVED')}


@app.post('/api/assets/{asset_id}/advance')
def advance_asset_stage(asset_id: str, target_stage: Optional[str] = None):
    asset = find_asset(asset_id)
    stages = list(LifecycleStage)
    current_idx = stages.index(asset.physicalState.stage)

    try:
        new_stage = LifecycleStage(target_stage) if target_stage else stages[min(current_idx + 1, len(stages) - 1)]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f'Invalid lifecycle stage: {target_stage}') from exc

    if target_stage and LifecycleStage(target_stage) not in stages[current_idx:]:
        raise HTTPException(status_code=400, detail='Invalid lifecycle transition: do not skip ahead or jump backwards.')

    asset.physicalState.stage = new_stage
    if new_stage == LifecycleStage.CASH_REALISED:
        asset.financialState.existingFinancing = 0.0
        asset.riskAssessment.overallScore = 0
        asset.riskAssessment.healthScore = 100
        asset.riskAssessment.riskLevel = RiskLevel.LOW
        for record in asset.financingRecords:
            record.outstanding = 0.0
            record.status = 'SETTLED'

    fin_metrics = calculate_financing_metrics(
        asset.financialState.currentValue,
        new_stage,
        asset.riskAssessment.overallScore,
        asset.financialState.existingFinancing,
    )
    action, rec_amt, rec_inst, conf, reasons = recommend_financing_action(
        stage=new_stage,
        current_val=asset.financialState.currentValue,
        existing_financing=asset.financialState.existingFinancing,
        available_capacity=fin_metrics['availableCapacity'],
        risk_score=asset.riskAssessment.overallScore,
        risk_level=asset.riskAssessment.riskLevel,
        buyer_score=asset.contractualState.buyerCreditScore,
        conflict_count=len(asset.conflicts),
    )

    asset.financialState.maxSafeExposure = fin_metrics['maxSafeExposure']
    asset.financialState.availableCapacity = fin_metrics['availableCapacity']
    asset.financialState.trappedCapital = fin_metrics['trappedCapital']
    asset.financialState.ltvPercent = fin_metrics['ltvPercent']
    asset.financialState.formattedValue = fin_metrics['formattedValue']
    asset.financialState.formattedFinancing = fin_metrics['formattedFinancing']
    asset.financialState.formattedTrapped = fin_metrics['formattedTrapped']
    asset.financialState.formattedCapacity = fin_metrics['formattedCapacity']
    asset.financingDecision.recommendedAction = action
    asset.financingDecision.recommendedAmount = rec_amt
    asset.financingDecision.formattedRecommendedAmount = format_inr(rec_amt)
    asset.financingDecision.recommendedInstrument = rec_inst
    asset.financingDecision.confidence = conf
    asset.financingDecision.reasons = reasons

    return {'status': 'SUCCESS', 'assetId': asset.assetId, 'newStage': new_stage.value, 'recommendedAction': action}


@app.post('/api/assets/{asset_id}/simulate', response_model=SimulationResponse)
def simulate_scenario(asset_id: str, req: SimulationRequest):
    asset = find_asset(asset_id)
    custom_params = {
        'customDaysDelay': req.customDaysDelay,
        'customDamagePct': req.customDamagePct,
        'customBuyerRiskIncrease': req.customBuyerRiskIncrease,
        'customInvoiceLagDays': req.customInvoiceLagDays,
    }
    return run_simulation(asset, req.preset, custom_params)


@app.post('/api/simulation/{asset_id}/apply')
def apply_simulation(asset_id: str, payload: Dict[str, Any]):
    asset = find_asset(asset_id)
    sim = run_simulation(asset, payload.get('preset', 'goods_damaged_10p'))
    asset.financialState.currentValue = sim.after['value']
    asset.financialState.maxSafeExposure = sim.after['maxSafeExposure']
    asset.financialState.availableCapacity = sim.after['availableCapacity']
    asset.riskAssessment.overallScore = sim.after['riskScore']
    asset.riskAssessment.riskLevel = RiskLevel(sim.after['riskLevel'])
    return {'success': True, 'assetId': asset.assetId, 'applied': True, 'result': sim}


@app.post('/api/assets/{asset_id}/financing/attempt', response_model=FinancingAttemptResponse)
def attempt_financing(asset_id: str, req: FinancingAttemptRequest):
    asset = find_asset(asset_id)
    return evaluate_financing_request(
        asset_id=asset.assetId,
        product_name=asset.productName,
        provider=req.provider,
        requested_amount=req.requestedAmount,
        instrument=req.instrument,
        current_val=asset.financialState.currentValue,
        max_safe_exposure=asset.financialState.maxSafeExposure,
        existing_records=asset.financingRecords,
    )


@app.get('/api/ai/explain/{asset_id}')
def get_ai_explanation(asset_id: str):
    return generate_ai_explanation(find_asset(asset_id))


@app.post('/api/ai/chat', response_model=CopilotChatResponse)
def copilot_chat(req: CopilotChatRequest):
    asset = find_asset(req.assetId) if req.assetId else None
    return handle_copilot_chat(req.message, asset, req.role or 'Executive')


@app.post('/api/ai/chat/safe')
def copilot_chat_safe(payload: Dict[str, Any]):
    asset_id = payload.get('assetId')
    message = payload.get('message', '')
    role = payload.get('role', 'Executive')
    asset = find_asset(asset_id) if asset_id else None
    return handle_copilot_chat(message, asset, role)


@app.post('/api/assets/reset')
def reset_to_seed():
    allowed = os.getenv('ALLOW_PUBLIC_RESET', 'false').lower() == 'true'
    if not allowed:
        raise HTTPException(status_code=403, detail='Admin role required to reset asset data.')
    init_db()
    return {'status': 'RESET_SUCCESS', 'message': 'All assets restored to baseline state.'}


@app.websocket('/ws/events')
async def websocket_events_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(5)
            await websocket.send_json({
                'type': 'ASSET_UPDATED',
                'timestamp': now_utc(),
                'assetId': 'AS-1042',
                'payload': {'status': 'LIVE', 'source': 'FinSense'},
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

