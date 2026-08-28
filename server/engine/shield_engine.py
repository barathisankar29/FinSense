from typing import List, Dict, Any
from ..models import FinancingRecord, FinancingAttemptResponse
from .financial_engine import format_inr

def evaluate_financing_request(
    asset_id: str,
    product_name: str,
    provider: str,
    requested_amount: float,
    instrument: str,
    current_val: float,
    max_safe_exposure: float,
    existing_records: List[FinancingRecord]
) -> FinancingAttemptResponse:
    current_exposure = sum(r.outstanding for r in existing_records)
    remaining_capacity = max(0.0, max_safe_exposure - current_exposure)
    
    # Check for duplicate identical instrument by a competing lender
    competing_claim = next(
        (r for r in existing_records if r.instrument.lower() == instrument.lower() and r.provider.lower() != provider.lower() and r.outstanding > 0),
        None
    )
    if competing_claim:
        return FinancingAttemptResponse(
            allowed=False,
            status='BLOCKED',
            reason=f'DUPLICATE PLEDGE COLLISION: {competing_claim.provider} already holds an active {competing_claim.instrument} lien ({format_inr(competing_claim.outstanding)}) on this asset title.',
            currentExposure=current_exposure,
            requestedAmount=requested_amount,
            maxSafeExposure=max_safe_exposure,
            remainingCapacity=remaining_capacity,
            suggestedAction='Block conflicting claim or initiate multi-lender syndication agreement.'
        )
    
    # Check for over-leverage / capacity breach
    projected_total = current_exposure + requested_amount
    if projected_total > max_safe_exposure:
        excess = projected_total - max_safe_exposure
        return FinancingAttemptResponse(
            allowed=False,
            status='BLOCKED',
            reason=f'OVER-LEVERAGE VIOLATION: Requested {format_inr(requested_amount)} would push total exposure to {format_inr(projected_total)}, exceeding the safe ceiling of {format_inr(max_safe_exposure)} by {format_inr(excess)}.',
            currentExposure=current_exposure,
            requestedAmount=requested_amount,
            maxSafeExposure=max_safe_exposure,
            remainingCapacity=remaining_capacity,
            suggestedAction=f'Cap financing offer at maximum available capacity ({format_inr(remaining_capacity)}) or request buyer collateral enhancement.'
        )
        
    # Approved
    new_remaining = remaining_capacity - requested_amount
    return FinancingAttemptResponse(
        allowed=True,
        status='APPROVED',
        reason=f'ELIGIBLE: Asset health and collateral coverage verified. {format_inr(requested_amount)} underwritten via {instrument}.',
        currentExposure=projected_total,
        requestedAmount=requested_amount,
        maxSafeExposure=max_safe_exposure,
        remainingCapacity=new_remaining,
        suggestedAction='Proceed with smart disbursement to verified supplier escrow.'
    )
