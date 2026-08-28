export type LifecycleStage =
  | 'PO_CREATED'
  | 'RAW_MATERIAL'
  | 'PRODUCTION'
  | 'FINISHED_GOODS'
  | 'IN_TRANSIT'
  | 'WAREHOUSE'
  | 'DELIVERED'
  | 'INVOICE_GENERATED'
  | 'RECEIVABLE'
  | 'CASH_REALISED';

export type FinancingInstrument =
  | 'Purchase Order Financing'
  | 'Procurement Financing'
  | 'Inventory Financing'
  | 'In-Transit Financing'
  | 'Warehouse Financing'
  | 'Trade Financing'
  | 'Invoice Financing'
  | 'Receivables Financing'
  | 'Settled / Closed';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole = 'Executive' | 'Financier' | 'Supply Chain Manager' | 'Business' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface FinancingRecord {
  id: string;
  provider: string;
  instrument: string;
  amount: number;
  outstanding: number;
  status: string;
  startDate: string;
  interestRate: number;
}

export interface DataSourceEntry {
  source: string;
  field: string;
  value: string;
  confidence: number;
  timestamp: string;
  verified: boolean;
}

export interface DataConflict {
  field: string;
  sourceA: string;
  valueA: string;
  sourceB: string;
  valueB: string;
  discrepancy: string;
  resolution: string;
  confidence: number;
}

export interface ValuationPoint {
  date: string;
  value: number;
  event?: string;
}

export interface RiskTrendPoint {
  date: string;
  riskScore: number;
  event?: string;
}

export interface DecisionTrailStep {
  time: string;
  event: string;
  description: string;
  dataSources: string[];
  confidence: number;
  impact: string;
}

export interface PhysicalState {
  stage: LifecycleStage;
  quantity: number;
  unit: string;
  location: string;
  destination: string;
  carrier: string;
  lat: number;
  lng: number;
  verificationConfidence: number;
  conditionStatus: string;
  lastInspectionDate: string;
  temperatureC?: number;
  humidityPct?: number;
}

export interface FinancialState {
  currentValue: number;
  originalValue: number;
  existingFinancing: number;
  maxSafeExposure: number;
  availableCapacity: number;
  trappedCapital: number;
  expectedRealisationDays: number;
  ltvPercent: number;
  currency: string;
  formattedValue: string;
  formattedFinancing: string;
  formattedTrapped: string;
  formattedCapacity: string;
}

export interface ContractualState {
  buyer: string;
  buyerCreditScore: number;
  poNumber: string;
  invoiceNumber?: string;
  paymentTerms: string;
  deliveryDeadline: string;
  ownershipStatus: string;
  contractStatus: string;
  incoterms: string;
}

export interface RiskAssessment {
  overallScore: number;
  healthScore: number;
  riskLevel: RiskLevel;
  physicalRisk: number;
  buyerRisk: number;
  logisticsRisk: number;
  marketRisk: number;
  paymentRisk: number;
  earlyWarning?: string;
  delayProbabilityPct: number;
}

export interface FinancingDecision {
  recommendedAction: string;
  recommendedAmount: number;
  formattedRecommendedAmount: string;
  recommendedInstrument: FinancingInstrument;
  confidence: number;
  riskRating: RiskLevel;
  expectedRealisationDays: number;
  reasons: string[];
  dataSourcesUsed: string[];
  status: string;
}

export interface LifecycleEvent {
  id: string;
  timestamp: string;
  stage: LifecycleStage;
  eventType: string;
  description: string;
  severity: string;
  source: string;
  impact?: string;
}

export interface RouteWaypoint {
  name: string;
  lat: number;
  lng: number;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  timestamp: string;
}

export interface Asset {
  id: string;
  assetId: string;
  productName: string;
  category: string;
  batchNumber: string;
  palletCode?: string;
  physicalState: PhysicalState;
  financialState: FinancialState;
  contractualState: ContractualState;
  riskAssessment: RiskAssessment;
  financingDecision: FinancingDecision;
  financingRecords: FinancingRecord[];
  dataSources: DataSourceEntry[];
  conflicts: DataConflict[];
  valuationHistory: ValuationPoint[];
  riskTrend: RiskTrendPoint[];
  decisionTrail: DecisionTrailStep[];
  events: LifecycleEvent[];
  routeWaypoints: RouteWaypoint[];
}

export interface DashboardMetrics {
  totalAssetValue: number;
  formattedTotalValue: string;
  activeFinancing: number;
  formattedActiveFinancing: string;
  trappedCapital: number;
  formattedTrappedCapital: string;
  availableCapacity: number;
  formattedAvailableCapacity: string;
  atRiskAssetsCount: number;
  financingEfficiencyPct: number;
  monthlyGrowthRate: string;
  trappedByStage: Array<{
    stage: string;
    amount: number;
    formatted: string;
  }>;
  stageCounts: Record<string, number>;
  totalAssets: number;
}

export interface SimulationResponse {
  assetId: string;
  preset: string;
  before: {
    stage: string;
    value: number;
    formattedValue: string;
    riskScore: number;
    healthScore: number;
    riskLevel: string;
    existingFinancing: number;
    formattedFinancing: string;
    maxSafeExposure: number;
    formattedMaxSafe: string;
    availableCapacity: number;
    formattedCapacity: string;
    expectedDays: number;
    recommendedAction: string;
    recommendedInstrument: string;
  };
  after: {
    stage: string;
    value: number;
    formattedValue: string;
    riskScore: number;
    healthScore: number;
    riskLevel: string;
    existingFinancing: number;
    formattedFinancing: string;
    maxSafeExposure: number;
    formattedMaxSafe: string;
    availableCapacity: number;
    formattedCapacity: string;
    expectedDays: number;
    recommendedAction: string;
    recommendedInstrument: string;
  };
  deltaValue: number;
  deltaRisk: number;
  deltaCapacity: number;
  recommendedAction: string;
  recommendedInstrument: string;
  explanation: string;
}

export interface FinancingAttemptResponse {
  allowed: boolean;
  status: 'APPROVED' | 'BLOCKED';
  reason: string;
  currentExposure: number;
  requestedAmount: number;
  maxSafeExposure: number;
  remainingCapacity: number;
  suggestedAction: string;
}

export interface AlertItem {
  id: string;
  type: string;
  severity: 'INFO' | 'MEDIUM' | 'WARNING' | 'HIGH' | 'CRITICAL';
  assetId: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface AuditEntry {
  assetId: string;
  productName: string;
  time: string;
  event: string;
  description: string;
  confidence: number;
  impact?: string;
  dataSources: string[];
}

export interface WebSocketEvent {
  type: string;
  timestamp: string;
  assetId: string;
  payload: Record<string, string | number | boolean | object | null>;
}

export interface CopilotResponse {
  reply: string;
  suggestedFollowups: string[];
  contextMetrics?: Record<string, unknown>;
}

export interface DashboardMetrics {
  totalAssetValue: number;
  formattedTotalValue: string;
  activeFinancing: number;
  formattedActiveFinancing: string;
  trappedCapital: number;
  formattedTrappedCapital: string;
  availableCapacity: number;
  formattedAvailableCapacity: string;
  atRiskAssetsCount: number;
  financingEfficiencyPct: number;
  monthlyGrowthRate: string;
  trappedByStage: Array<{ stage: string; amount: number; formatted: string }>
  stageCounts: Record<string, number>
  totalAssets: number
}
