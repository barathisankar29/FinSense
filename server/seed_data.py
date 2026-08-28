import json
import os
from typing import List
from .models import (
    Asset, PhysicalState, FinancialState, ContractualState,
    RiskAssessment, FinancingDecision, FinancingRecord,
    DataSourceEntry, DataConflict, ValuationPoint, RiskTrendPoint,
    DecisionTrailStep, LifecycleEvent, LifecycleStage,
    FinancingInstrument, RiskLevel
)
from .engine.financial_engine import (
    calculate_financing_metrics, recommend_financing_action, format_inr
)
from .engine.risk_engine import calculate_risk_assessment

def load_seed_assets() -> List[Asset]:
    json_path = os.path.join(os.path.dirname(__file__), 'seed_raw.json')
    if not os.path.exists(json_path):
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'server', 'seed_raw.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        raw_items = json.load(f)
        
    assets: List[Asset] = []
    for item in raw_items:
        stage_enum = LifecycleStage(item['stage'])
        risk_res = calculate_risk_assessment(
            physical_risk=item['physRisk'],
            buyer_risk=item['buyerRisk'],
            logistics_risk=item['logRisk'],
            market_risk=item['marketRisk'],
            payment_risk=item['payRisk'],
            verification_confidence=item['verificationConfidence']
        )
        
        fin_metrics = calculate_financing_metrics(
            current_val=item['currentVal'],
            stage=stage_enum,
            risk_score=risk_res['overallScore'],
            existing_financing=item['existingFin']
        )
        
        action, rec_amt, rec_inst, conf, reasons = recommend_financing_action(
            stage=stage_enum,
            current_val=item['currentVal'],
            existing_financing=item['existingFin'],
            available_capacity=fin_metrics['availableCapacity'],
            risk_score=risk_res['overallScore'],
            risk_level=risk_res['riskLevel'],
            buyer_score=item['buyerScore'],
            conflict_count=len(item.get('conflicts', []))
        )
        
        phys_state = PhysicalState(
            stage=stage_enum,
            quantity=item['quantity'],
            unit=item['unit'],
            location=item['location'],
            destination=item['destination'],
            carrier=item['carrier'],
            lat=item['lat'],
            lng=item['lng'],
            verificationConfidence=item['verificationConfidence'],
            conditionStatus=item['conditionStatus'],
            lastInspectionDate=item['lastInspectionDate'],
            temperatureC=item.get('temperatureC'),
            humidityPct=item.get('humidityPct')
        )
        
        fin_state = FinancialState(
            currentValue=item['currentVal'],
            originalValue=item['originalVal'],
            existingFinancing=item['existingFin'],
            maxSafeExposure=fin_metrics['maxSafeExposure'],
            availableCapacity=fin_metrics['availableCapacity'],
            trappedCapital=fin_metrics['trappedCapital'],
            expectedRealisationDays=item['expectedDays'],
            ltvPercent=fin_metrics['ltvPercent'],
            currency='INR',
            formattedValue=fin_metrics['formattedValue'],
            formattedFinancing=fin_metrics['formattedFinancing'],
            formattedTrapped=fin_metrics['formattedTrapped'],
            formattedCapacity=fin_metrics['formattedCapacity']
        )
        
        contract_state = ContractualState(
            buyer=item['buyer'],
            buyerCreditScore=item['buyerScore'],
            poNumber=item['poNumber'],
            invoiceNumber=item.get('invoiceNumber'),
            paymentTerms=item['paymentTerms'],
            deliveryDeadline=item['deliveryDeadline'],
            ownershipStatus=item['ownershipStatus'],
            contractStatus=item['contractStatus'],
            incoterms=item['incoterms']
        )
        
        risk_assess = RiskAssessment(
            overallScore=risk_res['overallScore'],
            healthScore=risk_res['healthScore'],
            riskLevel=risk_res['riskLevel'],
            physicalRisk=risk_res['physicalRisk'],
            buyerRisk=risk_res['buyerRisk'],
            logisticsRisk=risk_res['logisticsRisk'],
            marketRisk=risk_res['marketRisk'],
            paymentRisk=risk_res['paymentRisk'],
            earlyWarning=risk_res['earlyWarning'],
            delayProbabilityPct=risk_res['delayProbabilityPct']
        )
        
        fin_decision = FinancingDecision(
            recommendedAction=action,
            recommendedAmount=rec_amt,
            formattedRecommendedAmount=format_inr(rec_amt),
            recommendedInstrument=rec_inst,
            confidence=conf,
            riskRating=risk_res['riskLevel'],
            expectedRealisationDays=item['expectedDays'],
            reasons=reasons,
            dataSourcesUsed=[s['source'] for s in item['sources']],
            status='ACTIVE'
        )
        
        records = [FinancingRecord(**r) for r in item['records']]
        sources = [DataSourceEntry(**s) for s in item['sources']]
        conflicts = [DataConflict(**c) for c in item.get('conflicts', [])]
        valuations = [ValuationPoint(**v) for v in item['valuations']]
        risks = [RiskTrendPoint(**r) for r in item['riskHistory']]
        trails = [DecisionTrailStep(**t) for t in item['decisionTrail']]
        events = [LifecycleEvent(
            id=e['id'],
            timestamp=e['timestamp'],
            stage=LifecycleStage(e['stage']),
            eventType=e['eventType'],
            description=e['description'],
            severity=e['severity'],
            source=e['source'],
            impact=e.get('impact')
        ) for e in item['events']]
        
        asset = Asset(
            id=item['id'],
            assetId=item['assetId'],
            productName=item['productName'],
            category=item['category'],
            batchNumber=item['batchNumber'],
            palletCode=item.get('palletCode'),
            physicalState=phys_state,
            financialState=fin_state,
            contractualState=contract_state,
            riskAssessment=risk_assess,
            financingDecision=fin_decision,
            financingRecords=records,
            dataSources=sources,
            conflicts=conflicts,
            valuationHistory=valuations,
            riskTrend=risks,
            decisionTrail=trails,
            events=events,
            routeWaypoints=item.get('waypoints', [])
        )
        assets.append(asset)
        
    return assets
