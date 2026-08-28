from typing import Dict, Any
from ..models import RiskLevel

def calculate_risk_assessment(
    physical_risk: int,
    buyer_risk: int,
    logistics_risk: int,
    market_risk: int,
    payment_risk: int,
    verification_confidence: int = 90
) -> Dict[str, Any]:
    overall_score = int(round(
        0.25 * physical_risk +
        0.25 * buyer_risk +
        0.25 * logistics_risk +
        0.15 * payment_risk +
        0.10 * market_risk
    ))
    
    overall_score = max(5, min(95, overall_score))
    
    confidence_bonus = 4 if verification_confidence >= 90 else (0 if verification_confidence >= 75 else -6)
    health_score = max(5, min(98, 100 - overall_score + confidence_bonus))
    
    if overall_score >= 70:
        level = RiskLevel.CRITICAL
    elif overall_score >= 50:
        level = RiskLevel.HIGH
    elif overall_score >= 28:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW

    # Early Warning logic
    early_warning = None
    delay_prob = 12
    
    if logistics_risk >= 60:
        delay_prob = min(92, logistics_risk + 15)
        early_warning = f'{delay_prob}% probability of route disruption / customs hold within next 72h. Potential impact: 5-day delay in cash realization.'
    elif physical_risk >= 55:
        delay_prob = 40
        early_warning = 'Telemetry flags temperature / vibration threshold deviation. Recommended immediate physical inspection before transit continuation.'
    elif buyer_risk >= 60:
        delay_prob = 55
        early_warning = 'Buyer credit rating under watch. High probability of payment term renegotiation or 15+ day invoice lag.'
    elif payment_risk >= 60:
        delay_prob = 45
        early_warning = 'Invoice reconciliation dispute probability elevated. Recommend securing escrow lock.'
    else:
        early_warning = 'All telemetry signals within nominal operating parameters. 88% on-time settlement probability.'

    return {
        'overallScore': overall_score,
        'healthScore': health_score,
        'riskLevel': level,
        'physicalRisk': physical_risk,
        'buyerRisk': buyer_risk,
        'logisticsRisk': logistics_risk,
        'marketRisk': market_risk,
        'paymentRisk': payment_risk,
        'earlyWarning': early_warning,
        'delayProbabilityPct': delay_prob
    }
