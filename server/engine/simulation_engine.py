from typing import Dict, Any
import copy
from ..models import Asset, SimulationResponse, LifecycleStage, RiskLevel
from .financial_engine import calculate_safe_exposure, format_inr, recommend_financing_action
from .risk_engine import calculate_risk_assessment

def run_simulation(asset: Asset, preset: str, custom_params: Dict[str, Any] = None) -> SimulationResponse:
    before_state = {
        'stage': asset.physicalState.stage.value,
        'value': asset.financialState.currentValue,
        'formattedValue': asset.financialState.formattedValue,
        'riskScore': asset.riskAssessment.overallScore,
        'healthScore': asset.riskAssessment.healthScore,
        'riskLevel': asset.riskAssessment.riskLevel.value,
        'existingFinancing': asset.financialState.existingFinancing,
        'formattedFinancing': asset.financialState.formattedFinancing,
        'maxSafeExposure': asset.financialState.maxSafeExposure,
        'formattedMaxSafe': format_inr(asset.financialState.maxSafeExposure),
        'availableCapacity': asset.financialState.availableCapacity,
        'formattedCapacity': asset.financialState.formattedCapacity,
        'expectedDays': asset.financialState.expectedRealisationDays,
        'recommendedAction': asset.financingDecision.recommendedAction,
        'recommendedInstrument': asset.financingDecision.recommendedInstrument.value,
    }
    
    # Clone and modify
    new_val = asset.financialState.currentValue
    new_stage = asset.physicalState.stage
    new_phys_risk = asset.riskAssessment.physicalRisk
    new_log_risk = asset.riskAssessment.logisticsRisk
    new_buyer_risk = asset.riskAssessment.buyerRisk
    new_market_risk = asset.riskAssessment.marketRisk
    new_pay_risk = asset.riskAssessment.paymentRisk
    new_days = asset.financialState.expectedRealisationDays
    new_existing_fin = asset.financialState.existingFinancing
    
    explanation = ''
    
    if preset == 'shipment_delay_7d':
        new_log_risk = min(95, new_log_risk + 40)
        new_pay_risk = min(90, new_pay_risk + 15)
        new_days += 7
        explanation = 'A 7-day transit delay increases logistics carrier failure probability and postpones downstream invoice generation, reducing collateral velocity.'
        
    elif preset == 'goods_damaged_10p':
        new_val = round(new_val * 0.90, 2)
        new_phys_risk = min(95, new_phys_risk + 45)
        new_market_risk = min(90, new_market_risk + 20)
        explanation = '10% physical inventory damage immediately impairs recoverable liquidation value and triggers insurance verification requirements.'
        
    elif preset == 'buyer_risk_increase':
        new_buyer_risk = min(95, new_buyer_risk + 48)
        new_pay_risk = min(95, new_pay_risk + 42)
        explanation = 'Counterparty credit downgrade raises default and dispute probabilities. Collateral advance ratios are automatically tightened.'
        
    elif preset == 'invoice_delayed_15d':
        new_pay_risk = min(90, new_pay_risk + 35)
        new_days += 15
        explanation = 'A 15-day delay in billing cycles traps additional working capital and increases borrower debt-service burden.'
        
    elif preset == 'delivery_confirmed':
        new_stage = LifecycleStage.DELIVERED
        new_log_risk = max(10, new_log_risk - 35)
        new_phys_risk = max(10, new_phys_risk - 25)
        new_days = max(5, new_days - 12)
        explanation = 'Physical delivery confirmation removes transit risk. Asset enters the higher-certainty invoice generation and trade acceptance window.'
        
    elif preset == 'customer_paid_early':
        new_stage = LifecycleStage.CASH_REALISED
        new_pay_risk = 5
        new_buyer_risk = 5
        new_log_risk = 5
        new_phys_risk = 5
        new_days = 0
        new_existing_fin = 0.0
        explanation = 'Full escrow settlement received. Commercial lifecycle successfully concluded with zero residual capital at risk.'

    elif preset == 'custom' and custom_params:
        days_delay = custom_params.get('customDaysDelay', 0)
        damage_pct = custom_params.get('customDamagePct', 0.0)
        buyer_risk_inc = custom_params.get('customBuyerRiskIncrease', 0)
        invoice_lag = custom_params.get('customInvoiceLagDays', 0)
        
        new_days += days_delay + invoice_lag
        new_val = round(new_val * (1.0 - damage_pct / 100.0), 2)
        new_phys_risk = min(95, new_phys_risk + int(damage_pct * 2.5))
        new_log_risk = min(95, new_log_risk + int(days_delay * 3))
        new_buyer_risk = min(95, new_buyer_risk + buyer_risk_inc)
        explanation = f'Custom stress-test scenario evaluated with {days_delay}d delay, {damage_pct}% damage, and +{buyer_risk_inc} buyer risk points.'

    risk_res = calculate_risk_assessment(
        physical_risk=new_phys_risk,
        buyer_risk=new_buyer_risk,
        logistics_risk=new_log_risk,
        market_risk=new_market_risk,
        payment_risk=new_pay_risk,
        verification_confidence=asset.physicalState.verificationConfidence
    )
    
    new_safe = calculate_safe_exposure(new_val, new_stage, risk_res['overallScore'])
    new_cap = max(0.0, round(new_safe - new_existing_fin, 2))
    
    action, rec_amt, rec_inst, conf, reasons = recommend_financing_action(
        stage=new_stage,
        current_val=new_val,
        existing_financing=new_existing_fin,
        available_capacity=new_cap,
        risk_score=risk_res['overallScore'],
        risk_level=risk_res['riskLevel'],
        buyer_score=asset.contractualState.buyerCreditScore - (15 if preset == 'buyer_risk_increase' else 0),
        conflict_count=len(asset.conflicts)
    )
    
    after_state = {
        'stage': new_stage.value,
        'value': new_val,
        'formattedValue': format_inr(new_val),
        'riskScore': risk_res['overallScore'],
        'healthScore': risk_res['healthScore'],
        'riskLevel': risk_res['riskLevel'].value,
        'existingFinancing': new_existing_fin,
        'formattedFinancing': format_inr(new_existing_fin),
        'maxSafeExposure': new_safe,
        'formattedMaxSafe': format_inr(new_safe),
        'availableCapacity': new_cap,
        'formattedCapacity': format_inr(new_cap),
        'expectedDays': new_days,
        'recommendedAction': action,
        'recommendedInstrument': rec_inst.value,
    }
    
    delta_val = round(new_val - before_state['value'], 2)
    delta_risk = risk_res['overallScore'] - before_state['riskScore']
    delta_cap = round(new_cap - before_state['availableCapacity'], 2)
    
    return SimulationResponse(
        assetId=asset.assetId,
        preset=preset,
        before=before_state,
        after=after_state,
        deltaValue=delta_val,
        deltaRisk=delta_risk,
        deltaCapacity=delta_cap,
        recommendedAction=action,
        recommendedInstrument=rec_inst.value,
        explanation=explanation
    )
