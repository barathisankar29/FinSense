from typing import Dict, Any, Tuple
from ..models import LifecycleStage, FinancingInstrument, RiskLevel

STAGE_LTV_MAP = {
    LifecycleStage.PO_CREATED: 0.50,
    LifecycleStage.RAW_MATERIAL: 0.55,
    LifecycleStage.PRODUCTION: 0.60,
    LifecycleStage.FINISHED_GOODS: 0.70,
    LifecycleStage.IN_TRANSIT: 0.75,
    LifecycleStage.WAREHOUSE: 0.80,
    LifecycleStage.DELIVERED: 0.82,
    LifecycleStage.INVOICE_GENERATED: 0.85,
    LifecycleStage.RECEIVABLE: 0.90,
    LifecycleStage.CASH_REALISED: 0.00,
}

STAGE_INSTRUMENT_MAP = {
    LifecycleStage.PO_CREATED: FinancingInstrument.PURCHASE_ORDER_FINANCING,
    LifecycleStage.RAW_MATERIAL: FinancingInstrument.PROCUREMENT_FINANCING,
    LifecycleStage.PRODUCTION: FinancingInstrument.PROCUREMENT_FINANCING,
    LifecycleStage.FINISHED_GOODS: FinancingInstrument.INVENTORY_FINANCING,
    LifecycleStage.IN_TRANSIT: FinancingInstrument.IN_TRANSIT_FINANCING,
    LifecycleStage.WAREHOUSE: FinancingInstrument.WAREHOUSE_FINANCING,
    LifecycleStage.DELIVERED: FinancingInstrument.TRADE_FINANCING,
    LifecycleStage.INVOICE_GENERATED: FinancingInstrument.INVOICE_FINANCING,
    LifecycleStage.RECEIVABLE: FinancingInstrument.RECEIVABLES_FINANCING,
    LifecycleStage.CASH_REALISED: FinancingInstrument.SETTLED,
}

def format_inr(amount: float) -> str:
    if amount == 0:
        return '₹0'
    abs_amt = abs(amount)
    if abs_amt >= 10000000:
        val = amount / 10000000
        return f'₹{val:.2f} Cr'
    elif abs_amt >= 100000:
        val = amount / 100000
        return f'₹{val:.2f} L' if val % 1 != 0 else f'₹{int(val)} L'
    elif abs_amt >= 1000:
        val = amount / 1000
        return f'₹{val:.1f}k'
    else:
        return f'₹{int(amount)}'

def calculate_safe_exposure(current_val: float, stage: LifecycleStage, risk_score: int) -> float:
    if stage == LifecycleStage.CASH_REALISED:
        return 0.0
    ltv = STAGE_LTV_MAP.get(stage, 0.60)
    risk_discount = max(0.2, (1.0 - (risk_score / 150.0)))
    raw_safe = current_val * ltv * risk_discount
    return round(raw_safe, 2)

def calculate_financing_metrics(current_val: float, stage: LifecycleStage, risk_score: int, existing_financing: float) -> Dict[str, Any]:
    ltv = STAGE_LTV_MAP.get(stage, 0.60)
    max_safe = calculate_safe_exposure(current_val, stage, risk_score)
    available_capacity = max(0.0, round(max_safe - existing_financing, 2))
    trapped_capital = max(0.0, round(current_val - existing_financing, 2))
    
    return {
        'currentValue': current_val,
        'ltvPercent': int(ltv * 100),
        'maxSafeExposure': max_safe,
        'existingFinancing': existing_financing,
        'availableCapacity': available_capacity,
        'trappedCapital': trapped_capital,
        'formattedValue': format_inr(current_val),
        'formattedFinancing': format_inr(existing_financing),
        'formattedTrapped': format_inr(trapped_capital),
        'formattedCapacity': format_inr(available_capacity),
    }

def recommend_financing_action(
    stage: LifecycleStage,
    current_val: float,
    existing_financing: float,
    available_capacity: float,
    risk_score: int,
    risk_level: RiskLevel,
    buyer_score: int,
    conflict_count: int
) -> Tuple[str, float, FinancingInstrument, int, list]:
    if stage == LifecycleStage.CASH_REALISED:
        return (
            'Settle all financing & release collateral',
            0.0,
            FinancingInstrument.SETTLED,
            99,
            ['Full customer payment received in escrow', 'Contractual delivery obligations fulfilled', 'Zero counterparty exposure remaining']
        )
    
    instrument = STAGE_INSTRUMENT_MAP.get(stage, FinancingInstrument.IN_TRANSIT_FINANCING)
    
    if conflict_count > 0:
        return (
            'Pause additional financing until data discrepancy resolved',
            0.0,
            instrument,
            72,
            ['Multi-source telemetry mismatch detected (ERP vs Physical audit)', 'High risk of phantom inventory or shrinkage', 'Safety hold initiated to prevent over-advance']
        )
    
    if risk_score >= 70 or risk_level == RiskLevel.CRITICAL:
        reduction_target = round(existing_financing * 0.25, 2)
        return (
            f'De-risk & reduce exposure by {format_inr(reduction_target)}',
            0.0,
            instrument,
            88,
            ['Severe route/physical or buyer default risk detected', 'Safe exposure threshold breached under stressed scenarios', 'Recommended immediate margin call or secondary collateral pledge']
        )
    
    if available_capacity > 50000:
        rec_amount = round(min(available_capacity * 0.75, available_capacity), 2)
        confidence = 94 if buyer_score > 80 else 86
        stage_name = stage.value.replace('_', ' ').title()
        reasons = [
            f'{stage_name} phase verified via multi-source consensus',
            f'Buyer credit rating ({buyer_score}/100) confirms high payment probability',
            f'Asset valuation stable at {format_inr(current_val)}',
            f'Total exposure remains strictly within safe cap ({format_inr(existing_financing + rec_amount)})'
        ]
        return (
            f'Provide additional financing ({format_inr(rec_amount)})',
            rec_amount,
            instrument,
            confidence,
            reasons
        )
    
    return (
        'Maintain existing exposure and monitor milestones',
        0.0,
        instrument,
        90,
        ['Existing financing is close to safe exposure capacity', 'Next tranche unlocks upon reaching subsequent lifecycle milestone', 'Telemetry signals remain stable']
    )
