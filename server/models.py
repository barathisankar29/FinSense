from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class LifecycleStage(str, Enum):
    PO_CREATED = 'PO_CREATED'
    RAW_MATERIAL = 'RAW_MATERIAL'
    PRODUCTION = 'PRODUCTION'
    FINISHED_GOODS = 'FINISHED_GOODS'
    IN_TRANSIT = 'IN_TRANSIT'
    WAREHOUSE = 'WAREHOUSE'
    DELIVERED = 'DELIVERED'
    INVOICE_GENERATED = 'INVOICE_GENERATED'
    RECEIVABLE = 'RECEIVABLE'
    CASH_REALISED = 'CASH_REALISED'

class FinancingInstrument(str, Enum):
    PURCHASE_ORDER_FINANCING = 'Purchase Order Financing'
    PROCUREMENT_FINANCING = 'Procurement Financing'
    INVENTORY_FINANCING = 'Inventory Financing'
    IN_TRANSIT_FINANCING = 'In-Transit Financing'
    WAREHOUSE_FINANCING = 'Warehouse Financing'
    TRADE_FINANCING = 'Trade Financing'
    INVOICE_FINANCING = 'Invoice Financing'
    RECEIVABLES_FINANCING = 'Receivables Financing'
    SETTLED = 'Settled / Closed'

class RiskLevel(str, Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    CRITICAL = 'CRITICAL'

class FinancingRecord(BaseModel):
    id: str
    provider: str
    instrument: str
    amount: float
    outstanding: float
    status: str
    startDate: str
    interestRate: float

class DataSourceEntry(BaseModel):
    source: str
    field: str
    value: str
    confidence: int
    timestamp: str
    verified: bool

class DataConflict(BaseModel):
    field: str
    sourceA: str
    valueA: str
    sourceB: str
    valueB: str
    discrepancy: str
    resolution: str
    confidence: int

class ValuationPoint(BaseModel):
    date: str
    value: float
    event: Optional[str] = None

class RiskTrendPoint(BaseModel):
    date: str
    riskScore: int
    event: Optional[str] = None

class DecisionTrailStep(BaseModel):
    time: str
    event: str
    description: str
    dataSources: List[str]
    confidence: int
    impact: str

class PhysicalState(BaseModel):
    stage: LifecycleStage
    quantity: int
    unit: str
    location: str
    destination: str
    carrier: str
    lat: float
    lng: float
    verificationConfidence: int
    conditionStatus: str
    lastInspectionDate: str
    temperatureC: Optional[float] = None
    humidityPct: Optional[float] = None

class FinancialState(BaseModel):
    currentValue: float
    originalValue: float
    existingFinancing: float
    maxSafeExposure: float
    availableCapacity: float
    trappedCapital: float
    expectedRealisationDays: int
    ltvPercent: int
    currency: str = 'INR'
    formattedValue: str
    formattedFinancing: str
    formattedTrapped: str
    formattedCapacity: str

class ContractualState(BaseModel):
    buyer: str
    buyerCreditScore: int
    poNumber: str
    invoiceNumber: Optional[str] = None
    paymentTerms: str
    deliveryDeadline: str
    ownershipStatus: str
    contractStatus: str
    incoterms: str

class RiskAssessment(BaseModel):
    overallScore: int
    healthScore: int
    riskLevel: RiskLevel
    physicalRisk: int
    buyerRisk: int
    logisticsRisk: int
    marketRisk: int
    paymentRisk: int
    earlyWarning: Optional[str] = None
    delayProbabilityPct: int = 15

class FinancingDecision(BaseModel):
    recommendedAction: str
    recommendedAmount: float
    formattedRecommendedAmount: str
    recommendedInstrument: FinancingInstrument
    confidence: int
    riskRating: RiskLevel
    expectedRealisationDays: int
    reasons: List[str]
    dataSourcesUsed: List[str]
    status: str = 'ACTIVE'

class LifecycleEvent(BaseModel):
    id: str
    timestamp: str
    stage: LifecycleStage
    eventType: str
    description: str
    severity: str
    source: str
    impact: Optional[str] = None

class Asset(BaseModel):
    id: str
    assetId: str
    productName: str
    category: str
    batchNumber: str
    physicalState: PhysicalState
    financialState: FinancialState
    contractualState: ContractualState
    riskAssessment: RiskAssessment
    financingDecision: FinancingDecision
    financingRecords: List[FinancingRecord]
    dataSources: List[DataSourceEntry]
    conflicts: List[DataConflict]
    valuationHistory: List[ValuationPoint]
    riskTrend: List[RiskTrendPoint]
    decisionTrail: List[DecisionTrailStep]
    events: List[LifecycleEvent]
    routeWaypoints: List[Dict[str, Any]]
    palletCode: Optional[str] = None

class SimulationRequest(BaseModel):
    preset: str
    customDaysDelay: Optional[int] = 0
    customDamagePct: Optional[float] = 0.0
    customBuyerRiskIncrease: Optional[int] = 0
    customInvoiceLagDays: Optional[int] = 0

class SimulationResponse(BaseModel):
    assetId: str
    preset: str
    before: Dict[str, Any]
    after: Dict[str, Any]
    deltaValue: float
    deltaRisk: int
    deltaCapacity: float
    recommendedAction: str
    recommendedInstrument: str
    explanation: str

class FinancingAttemptRequest(BaseModel):
    assetId: str
    provider: str
    requestedAmount: float
    instrument: str

class FinancingAttemptResponse(BaseModel):
    allowed: bool
    status: str
    reason: str
    currentExposure: float
    requestedAmount: float
    maxSafeExposure: float
    remainingCapacity: float
    suggestedAction: str

class CopilotChatRequest(BaseModel):
    assetId: Optional[str] = None
    message: str
    role: Optional[str] = 'Executive'

class CopilotChatResponse(BaseModel):
    reply: str
    suggestedFollowups: List[str]
    contextMetrics: Optional[Dict[str, Any]] = None
