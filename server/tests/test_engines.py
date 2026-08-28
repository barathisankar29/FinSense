from fastapi.testclient import TestClient
from server.main import app
from server.models import LifecycleStage, FinancingInstrument, RiskLevel, FinancingRecord
from server.engine.financial_engine import (
    calculate_safe_exposure, calculate_financing_metrics,
    recommend_financing_action, format_inr
)
from server.engine.risk_engine import calculate_risk_assessment
from server.engine.shield_engine import evaluate_financing_request
from server.engine.simulation_engine import run_simulation
from server.seed_data import load_seed_assets

client = TestClient(app)

def test_financial_engine_calculations():
    safe = calculate_safe_exposure(5000000.0, LifecycleStage.IN_TRANSIT, 20)
    assert safe > 3000000.0
    metrics = calculate_financing_metrics(5000000.0, LifecycleStage.IN_TRANSIT, 20, 1500000.0)
    assert metrics['availableCapacity'] > 0
    assert metrics['trappedCapital'] == 3500000.0

def test_risk_engine_scoring():
    res = calculate_risk_assessment(20, 15, 25, 10, 15, 95)
    assert res['overallScore'] < 30
    assert res['riskLevel'] == RiskLevel.LOW
    assert res['healthScore'] > 80

def test_financing_shield_over_leverage_block():
    existing = [
        FinancingRecord(id='1', provider='Bank A', instrument='PO Financing', amount=2000000.0, outstanding=2000000.0, status='ACTIVE', startDate='2026-08-01', interestRate=8.5)
    ]
    res = evaluate_financing_request(
        asset_id='AS-1042', product_name='1000 Laptops', provider='Bank B', requested_amount=1500000.0,
        instrument='In-Transit Financing', current_val=5000000.0, max_safe_exposure=3000000.0, existing_records=existing
    )
    assert res.allowed is False
    assert res.status == 'BLOCKED'
    assert 'OVER-LEVERAGE VIOLATION' in res.reason

def test_financing_shield_duplicate_lien_block():
    existing = [
        FinancingRecord(id='1', provider='HDFC', instrument='PO Financing', amount=1000000.0, outstanding=1000000.0, status='ACTIVE', startDate='2026-08-01', interestRate=8.5)
    ]
    res = evaluate_financing_request(
        asset_id='AS-1042', product_name='1000 Laptops', provider='Axis Bank', requested_amount=500000.0,
        instrument='PO Financing', current_val=5000000.0, max_safe_exposure=3000000.0, existing_records=existing
    )
    assert res.allowed is False
    assert 'DUPLICATE PLEDGE COLLISION' in res.reason

def test_simulation_lab_delays():
    assets = load_seed_assets()
    as_1042 = next(a for a in assets if a.assetId == 'AS-1042')
    sim = run_simulation(as_1042, 'shipment_delay_7d')
    assert sim.after['riskScore'] > sim.before['riskScore']
    assert sim.after['expectedDays'] == sim.before['expectedDays'] + 7

def test_api_endpoints():
    # 1. Health check
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.json()['status'] == 'OPERATIONAL'
    
    # 2. Get assets
    res = client.get('/api/assets')
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 10
    
    # 3. Get single asset
    res = client.get('/api/assets/as-1042')
    assert res.status_code == 200
    assert res.json()['assetId'] == 'AS-1042'
    
    # 4. Get dashboard metrics
    res = client.get('/api/dashboard')
    assert res.status_code == 200
    dash = res.json()
    assert dash['totalAssetValue'] > 0
    assert len(dash['trappedByStage']) == 4
    
    # 5. Run simulation via API
    sim_res = client.post('/api/assets/as-1042/simulate', json={'preset': 'goods_damaged_10p'})
    assert sim_res.status_code == 200
    assert sim_res.json()['deltaValue'] < 0
    
    # 6. Attempt over-leverage financing via API
    att_res = client.post('/api/assets/as-1042/financing/attempt', json={
        'assetId': 'AS-1042',
        'provider': 'Bank X',
        'requestedAmount': 50000000.0,
        'instrument': 'Trade Financing'
    })
    assert att_res.status_code == 200
    assert att_res.json()['status'] == 'BLOCKED'
    
    # 7. AI Chat
    chat_res = client.post('/api/ai/chat', json={'assetId': 'AS-1042', 'message': 'Why are you recommending this amount?'})
    assert chat_res.status_code == 200
    assert len(chat_res.json()['reply']) > 20
