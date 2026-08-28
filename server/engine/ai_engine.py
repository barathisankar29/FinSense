from typing import List, Dict, Any, Optional
from ..models import Asset, CopilotChatResponse
from .financial_engine import format_inr

def generate_ai_explanation(asset: Asset) -> Dict[str, Any]:
    fs = asset.financialState
    ps = asset.physicalState
    cs = asset.contractualState
    ra = asset.riskAssessment
    fd = asset.financingDecision

    stage_name = ps.stage.value.replace('_', ' ').title()
    summary = (
        'The engine recommends ' + str(fd.recommendedAction) + ' (' + str(fd.recommendedInstrument.value) + ') '
        'with ' + str(fd.confidence) + '% algorithmic confidence. '
        'Asset ' + str(asset.assetId) + ' (' + str(asset.productName) + ') is presently in ' + stage_name + ' '
        'with a verified market valuation of ' + str(fs.formattedValue) + '. '
        'Current outstanding exposure is ' + str(fs.formattedFinancing) + ' against a maximum calculated safe exposure of ' + format_inr(fs.maxSafeExposure) + '.'
    )
    
    breakdown_points = [
        {
            'factor': 'Physical Verification & Stage Integrity',
            'detail': 'Consensus confidence at ' + str(ps.verificationConfidence) + '% with verified location at ' + str(ps.location) + '. Condition rated ' + str(ps.conditionStatus) + '.',
            'status': 'POSITIVE' if ps.verificationConfidence >= 85 else 'WARNING'
        },
        {
            'factor': 'Buyer Creditworthiness',
            'detail': 'Counterparty ' + str(cs.buyer) + ' maintains a credit score of ' + str(cs.buyerCreditScore) + '/100 with terms ' + str(cs.paymentTerms) + '.',
            'status': 'POSITIVE' if cs.buyerCreditScore >= 75 else 'WARNING'
        },
        {
            'factor': 'Financing Headroom & Safe Exposure',
            'detail': 'Remaining safe capacity of ' + str(fs.formattedCapacity) + ' protects against over-leverage.',
            'status': 'POSITIVE' if fs.availableCapacity > 0 else 'NEUTRAL'
        },
        {
            'factor': 'Multi-Factor Risk Assessment',
            'detail': 'Composite risk score ' + str(ra.overallScore) + '/100 (' + str(ra.riskLevel.value) + ') across physical, logistics, buyer, and market dimensions.',
            'status': 'POSITIVE' if ra.overallScore < 40 else ('WARNING' if ra.overallScore < 65 else 'DANGER')
        }
    ]

    return {
        'summary': summary,
        'breakdown': breakdown_points,
        'reasons': fd.reasons,
        'dataSources': fd.dataSourcesUsed,
        'confidence': fd.confidence,
        'riskLevel': ra.riskLevel.value
    }

def handle_copilot_chat(message: str, asset: Optional[Asset] = None, role: str = 'Executive') -> CopilotChatResponse:
    lower_msg = message.lower()
    
    if not asset:
        return CopilotChatResponse(
            reply='FlowCapital AI is monitoring all supply chain working capital assets across your portfolio. Please select an asset (such as AS-1042 Laptops) to analyze specific digital twin telemetry, risk vectors, or simulation triggers.',
            suggestedFollowups=['Analyze AS-1042 Laptops', 'Show portfolio trapped capital', 'What are our highest risk assets?']
        )

    fs = asset.financialState
    ra = asset.riskAssessment
    ps = asset.physicalState
    fd = asset.financingDecision
    cs = asset.contractualState
    stage_label = ps.stage.value.replace('_', ' ').title()

    if 'why' in lower_msg and any(k in lower_msg for k in ['recommend', 'amount', 'lakh', 'action', 'reason']):
        reply = (
            str(fd.formattedRecommendedAmount) + ' is recommended under ' + str(fd.recommendedInstrument.value) + ' because: '
            '(1) The asset is verified in ' + stage_label + ' at ' + str(ps.location) + '; '
            '(2) Buyer ' + str(cs.buyer) + ' has a healthy payment score of ' + str(cs.buyerCreditScore) + '/100; '
            '(3) Current valuation of ' + str(fs.formattedValue) + ' easily supports total exposure without breaching the safe exposure limit of ' + format_inr(fs.maxSafeExposure) + '; '
            'and (4) Multi-source reconciliation confidence is high (' + str(ps.verificationConfidence) + '%).'
        )
        followups = [
            'Simulate 7-day shipment delay',
            'Attempt over-leverage financing',
            'Show multi-lender exposure breakdown'
        ]

    elif 'risk' in lower_msg or 'warning' in lower_msg:
        reply = (
            'Asset ' + str(asset.assetId) + ' has an overall risk score of ' + str(ra.overallScore) + '/100 (Health Score: ' + str(ra.healthScore) + '/100, ' + str(ra.riskLevel.value) + ' Risk). '
            'Physical Risk: ' + str(ra.physicalRisk) + '/100, Buyer Risk: ' + str(ra.buyerRisk) + '/100, Logistics Risk: ' + str(ra.logisticsRisk) + '/100, Market Risk: ' + str(ra.marketRisk) + '/100, Payment Risk: ' + str(ra.paymentRisk) + '/100. '
            'Telemetry note: ' + (str(ra.earlyWarning) if ra.earlyWarning else 'All parameters nominal.')
        )
        followups = [
            'What happens if goods are damaged 10%?',
            'What happens if buyer risk increases?',
            'View supply chain route map'
        ]

    elif 'money follows' in lower_msg or 'concept' in lower_msg or 'lifecycle' in lower_msg:
        reply = (
            'In FlowCapital AI, money follows the asset rather than being locked to static paper invoices. '
            'For ' + str(asset.assetId) + ', financing transitioned dynamically from Purchase Order Financing (PO Stage) -> '
            'Procurement Financing (Production) -> In-Transit Financing (' + stage_label + ') -> '
            'automatically unlocking Invoice Financing upon delivery receipt, culminating in full settlement upon cash realization.'
        )
        followups = [
            'Advance to next lifecycle stage',
            'Check Financing Shield status',
            'Open Data Truth Center'
        ]

    elif 'shield' in lower_msg or 'duplicate' in lower_msg or 'over-leverage' in lower_msg:
        reply = (
            'The Financing Shield actively protects ' + str(asset.assetId) + '. Current registered liens total ' + str(fs.formattedFinancing) + ' across lenders, '
            'against a maximum safe exposure ceiling of ' + format_inr(fs.maxSafeExposure) + '. Available headroom is ' + str(fs.formattedCapacity) + '. '
            'Any uncoordinated duplicate claim or excess draw is automatically blocked in real time.'
        )
        followups = [
            'Attempt ₹30L duplicate claim',
            'View active lender claims',
            'Explain safe exposure formula'
        ]

    else:
        reply = (
            'Asset ' + str(asset.assetId) + ' (' + str(asset.productName) + ') is currently ' + stage_label + ' '
            'en route to ' + str(ps.destination) + '. Valuation is ' + str(fs.formattedValue) + ', active financing is ' + str(fs.formattedFinancing) + ', '
            'and available financing headroom is ' + str(fs.formattedCapacity) + '. Recommended action: ' + str(fd.recommendedAction) + '.'
        )
        followups = [
            'Why are you recommending this amount?',
            'Simulate supply chain delay',
            'Scan pallet in AR'
        ]

    metrics = {
        'assetId': asset.assetId,
        'currentValue': fs.currentValue,
        'existingFinancing': fs.existingFinancing,
        'safeLimit': fs.maxSafeExposure,
        'availableCapacity': fs.availableCapacity,
        'healthScore': ra.healthScore
    }

    return CopilotChatResponse(
        reply=reply,
        suggestedFollowups=followups,
        contextMetrics=metrics
    )
