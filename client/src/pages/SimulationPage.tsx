import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchAssets, simulateScenario } from '../services/api'
import type { Asset, SimulationResponse } from '../types'

type ScenarioKey = 'delay_7d' | 'damage_15p' | 'buyer_risk' | 'invoice_30d' | 'custom'

type ScenarioDefinition = {
  id: ScenarioKey
  title: string
  label: string
  tag: string
  description: string
  impact: string
  expectedLoss: string
  riskShift: string
}

const scenarioDefinitions: ScenarioDefinition[] = [
  {
    id: 'delay_7d',
    title: 'Transit delay',
    label: '+7 day delay',
    tag: 'ETA +7D',
    description: 'Shipment misses the warehouse handoff window.',
    impact: 'Risk shifts from LOW to MEDIUM with a short-term liquidity hit.',
    expectedLoss: '₹18.4L expected loss',
    riskShift: 'LOW → MEDIUM',
  },
  {
    id: 'damage_15p',
    title: 'Damage event',
    label: '15% goods damage',
    tag: 'Value -15%',
    description: 'Physical damage reduces the saleable asset value.',
    impact: 'Asset value falls and collateral coverage tightens.',
    expectedLoss: '₹43L loss exposure',
    riskShift: 'LOW → MEDIUM',
  },
  {
    id: 'buyer_risk',
    title: 'Buyer risk increase',
    label: 'Buyer risk HIGH',
    tag: 'Buyer risk',
    description: 'Counterparty quality weakens and collection timing becomes uncertain.',
    impact: 'Recommended action: reduce financing exposure and tighten monitoring.',
    expectedLoss: 'Exposure pressure HIGH',
    riskShift: 'LOW → HIGH',
  },
  {
    id: 'invoice_30d',
    title: 'Invoice delay',
    label: '+30 day lag',
    tag: 'Cash delay',
    description: 'Cash realization moves from 30 to 60 days.',
    impact: 'Liquidity pressure rises sharply across the working capital cycle.',
    expectedLoss: 'Liquidity pressure HIGH',
    riskShift: 'LOW → MEDIUM',
  },
  {
    id: 'custom',
    title: 'Custom scenario',
    label: 'Custom stress case',
    tag: 'Flexible',
    description: 'Model a user-defined delay, loss, or buyer stress event.',
    impact: 'Fine-tune the scenario before running the recommendation.',
    expectedLoss: 'Configurable',
    riskShift: 'Adaptive',
  },
]

function createDemoAsset(): Asset {
  return {
    id: 'as-1042',
    assetId: 'AS-1042',
    productName: 'High-end enterprise laptops',
    category: 'Consumer Electronics',
    batchNumber: 'BATCH-2026-LPX-1042',
    physicalState: {
      stage: 'IN_TRANSIT',
      quantity: 1000,
      unit: 'Units',
      location: 'Pune Expressway (KM 42), Maharashtra',
      destination: 'Nhava Sheva Port, Mumbai',
      carrier: 'BlueDart Freight Logistics',
      lat: 18.7522,
      lng: 73.4055,
      verificationConfidence: 94,
      conditionStatus: 'Nominal / Sealed Container',
      lastInspectionDate: '2026-08-28 09:30 IS',
      temperatureC: 18,
      humidityPct: 42,
    },
    financialState: {
      currentValue: 284000000,
      originalValue: 240000000,
      existingFinancing: 9223000,
      maxSafeExposure: 142000000,
      availableCapacity: 268000000,
      trappedCapital: 42000000,
      expectedRealisationDays: 30,
      ltvPercent: 56,
      currency: 'INR',
      formattedValue: '₹2.84 Cr',
      formattedFinancing: '₹92.23 L',
      formattedTrapped: '₹0.42 Cr',
      formattedCapacity: '₹2.68 Cr',
    },
    contractualState: {
      buyer: 'Apex Mobility Pvt. Ltd.',
      buyerCreditScore: 771,
      poNumber: 'PO-1042-2026',
      invoiceNumber: 'INV-1042-2026',
      paymentTerms: 'Net 30',
      deliveryDeadline: '2026-08-30',
      ownershipStatus: 'Title transfer pending',
      contractStatus: 'ACTIVE',
      incoterms: 'FOB',
    },
    riskAssessment: {
      overallScore: 32,
      healthScore: 74,
      riskLevel: 'LOW',
      physicalRisk: 24,
      buyerRisk: 30,
      logisticsRisk: 28,
      marketRisk: 21,
      paymentRisk: 26,
      delayProbabilityPct: 14,
    },
    financingDecision: {
      recommendedAction: 'Maintain current facility',
      recommendedAmount: 64000000,
      formattedRecommendedAmount: '₹0.64 Cr',
      recommendedInstrument: 'In-Transit Financing',
      confidence: 84,
      riskRating: 'LOW',
      expectedRealisationDays: 14,
      reasons: ['Route remains on schedule', 'Cushion on working capital remains healthy'],
      dataSourcesUsed: ['ERP', 'GPS', 'Port status'],
      status: 'APPROVED',
    },
    financingRecords: [],
    dataSources: [],
    conflicts: [],
    valuationHistory: [],
    riskTrend: [],
    decisionTrail: [],
    events: [
      {
        id: 'evt-1',
        timestamp: new Date().toISOString(),
        stage: 'IN_TRANSIT',
        eventType: 'LOCATION_UPDATE',
        description: 'Truck moving north-west to Nhava Sheva port',
        severity: 'INFO',
        source: 'GPS',
        impact: 'On schedule',
      },
    ],
    routeWaypoints: [
      { name: 'Ahmedabad Plant', lat: 23.0225, lng: 72.5714, status: 'COMPLETED', timestamp: new Date().toISOString() },
      { name: 'Nashik Hub', lat: 20.0059, lng: 73.791, status: 'CURRENT', timestamp: new Date().toISOString() },
      { name: 'Nhava Sheva Port', lat: 18.9496, lng: 72.952, status: 'PENDING', timestamp: new Date().toISOString() },
    ],
  }
}

function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`
  return `₹${value.toLocaleString('en-IN')}`
}

function buildFallbackSimulation(asset: Asset, preset: ScenarioKey): SimulationResponse {
  const baseValue = asset.financialState.currentValue
  const baseRisk = asset.riskAssessment.overallScore
  const baseCapacity = asset.financialState.availableCapacity
  const baseFinancing = asset.financialState.existingFinancing

  const map: Record<ScenarioKey, { value: number; riskScore: number; riskLevel: string; financing: number; capacity: number; expectedDays: number; recommendedAction: string; recommendedInstrument: string; explanation: string }> = {
    delay_7d: {
      value: baseValue * 0.93,
      riskScore: Math.min(95, baseRisk + 23),
      riskLevel: 'MEDIUM',
      financing: baseFinancing + 1840000,
      capacity: Math.max(0, baseCapacity - 1840000),
      expectedDays: asset.financialState.expectedRealisationDays + 7,
      recommendedAction: 'Tighten working capital buffer and protect the shipment window.',
      recommendedInstrument: 'In-Transit Financing',
      explanation: 'A 7-day transit delay raises risk and creates additional financing drag, but the asset remains financeable with a tighter buffer.',
    },
    damage_15p: {
      value: baseValue * 0.85,
      riskScore: Math.min(95, baseRisk + 18),
      riskLevel: 'MEDIUM',
      financing: baseFinancing + 4300000,
      capacity: Math.max(0, baseCapacity - 4300000),
      expectedDays: asset.financialState.expectedRealisationDays + 10,
      recommendedAction: 'Reduce exposure and add physical risk mitigation before approving more debt.',
      recommendedInstrument: 'Inventory Financing',
      explanation: 'A 15% damage event reduces collateral value by approximately ₹43L and increases risk, requiring a lower financing draw.',
    },
    buyer_risk: {
      value: baseValue * 0.9,
      riskScore: Math.min(98, baseRisk + 32),
      riskLevel: 'HIGH',
      financing: baseFinancing + 6200000,
      capacity: Math.max(0, baseCapacity - 6200000),
      expectedDays: asset.financialState.expectedRealisationDays + 25,
      recommendedAction: 'Reduce financing exposure and require stronger buyer protections.',
      recommendedInstrument: 'Receivables Financing',
      explanation: 'Buyer risk escalation materially increases collection uncertainty and supports a lower recommended financing amount.',
    },
    invoice_30d: {
      value: baseValue * 0.94,
      riskScore: Math.min(96, baseRisk + 14),
      riskLevel: 'MEDIUM',
      financing: baseFinancing + 5200000,
      capacity: Math.max(0, baseCapacity - 5200000),
      expectedDays: asset.financialState.expectedRealisationDays + 30,
      recommendedAction: 'Limit draw and extend collection controls until cash realizes.',
      recommendedInstrument: 'Invoice Financing',
      explanation: 'An invoice lag from 30 to 60 days increases liquidity pressure, pushing the asset into a more conservative financing stance.',
    },
    custom: {
      value: baseValue * 0.96,
      riskScore: Math.min(97, baseRisk + 12),
      riskLevel: 'MEDIUM',
      financing: baseFinancing + 2600000,
      capacity: Math.max(0, baseCapacity - 2600000),
      expectedDays: asset.financialState.expectedRealisationDays + 12,
      recommendedAction: 'Use the custom scenario to stress-test a tighter exposure and short-term monitoring plan.',
      recommendedInstrument: 'Trade Financing',
      explanation: 'The custom case highlights how a moderate disruption can affect market value, timing, and financing capacity before it becomes visible in the live asset state.',
    },
  }

  const scenario = map[preset]

  return {
    assetId: asset.assetId,
    preset,
    before: {
      stage: asset.physicalState.stage,
      value: baseValue,
      formattedValue: asset.financialState.formattedValue,
      riskScore: asset.riskAssessment.overallScore,
      healthScore: asset.riskAssessment.healthScore,
      riskLevel: asset.riskAssessment.riskLevel,
      existingFinancing: asset.financialState.existingFinancing,
      formattedFinancing: asset.financialState.formattedFinancing,
      maxSafeExposure: asset.financialState.maxSafeExposure,
      formattedMaxSafe: formatCurrency(asset.financialState.maxSafeExposure),
      availableCapacity: asset.financialState.availableCapacity,
      formattedCapacity: asset.financialState.formattedCapacity,
      expectedDays: asset.financialState.expectedRealisationDays,
      recommendedAction: asset.financingDecision.recommendedAction,
      recommendedInstrument: asset.financingDecision.recommendedInstrument,
    },
    after: {
      stage: asset.physicalState.stage,
      value: scenario.value,
      formattedValue: formatCurrency(scenario.value),
      riskScore: scenario.riskScore,
      healthScore: Math.max(20, asset.riskAssessment.healthScore - 8),
      riskLevel: scenario.riskLevel,
      existingFinancing: scenario.financing,
      formattedFinancing: formatCurrency(scenario.financing),
      maxSafeExposure: Math.min(asset.financialState.maxSafeExposure, scenario.financing),
      formattedMaxSafe: formatCurrency(Math.min(asset.financialState.maxSafeExposure, scenario.financing)),
      availableCapacity: scenario.capacity,
      formattedCapacity: formatCurrency(scenario.capacity),
      expectedDays: scenario.expectedDays,
      recommendedAction: scenario.recommendedAction,
      recommendedInstrument: scenario.recommendedInstrument,
    },
    deltaValue: baseValue - scenario.value,
    deltaRisk: scenario.riskScore - asset.riskAssessment.overallScore,
    deltaCapacity: baseCapacity - scenario.capacity,
    recommendedAction: scenario.recommendedAction,
    recommendedInstrument: scenario.recommendedInstrument,
    explanation: scenario.explanation,
  }
}

export default function SimulationPage() {
  const [searchParams] = useSearchParams()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [preset, setPreset] = useState<ScenarioKey>('delay_7d')
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isArOpen, setIsArOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAssets()
        const resolved = data.length ? data : [createDemoAsset()]
        setAssets(resolved)
        const initialAssetId = searchParams.get('asset') ?? resolved.find((asset) => asset.assetId === 'AS-1042')?.assetId ?? resolved[0]?.assetId ?? 'AS-1042'
        setSelectedAssetId(initialAssetId)
        const active = resolved.find((asset) => asset.assetId === initialAssetId) ?? resolved[0] ?? createDemoAsset()
        setResult(buildFallbackSimulation(active, 'delay_7d'))
        setError(null)
      } catch {
        const fallback = [createDemoAsset()]
        setAssets(fallback)
        setSelectedAssetId('AS-1042')
        setResult(buildFallbackSimulation(fallback[0], 'delay_7d'))
        setError(null)
      }
    }
    void load()
  }, [searchParams])

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.assetId === selectedAssetId) ?? assets[0] ?? null,
    [assets, selectedAssetId],
  )

  const activeScenario = useMemo(
    () => scenarioDefinitions.find((scenario) => scenario.id === preset) ?? scenarioDefinitions[0],
    [preset],
  )

  const run = async () => {
    const targetAsset = selectedAsset ?? assets[0] ?? createDemoAsset()
    setSelectedAssetId(targetAsset.assetId)

    try {
      const sim = await simulateScenario(targetAsset.assetId, preset).catch(() => buildFallbackSimulation(targetAsset, preset))
      setResult(sim)
      setError(null)
      setIsArOpen(false)
    } catch (err) {
      const fallback = buildFallbackSimulation(targetAsset, preset)
      setResult(fallback)
      setError(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-800 bg-slate-950/95 p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-cyan-300">WHAT-IF ENGINE</div>
            <h1 className="mt-2 text-3xl font-semibold text-white">Simulation • financing stress test</h1>
          </div>
          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
            Connected to Digital Twin
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="rounded-[26px] border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Asset</div>
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                  LIVE
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Selected Asset</div>
                  <select
                    value={selectedAssetId}
                    onChange={(event) => setSelectedAssetId(event.target.value)}
                    className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.assetId}>{asset.assetId}</option>
                    ))}
                  </select>
                </div>

                {selectedAsset && (
                  <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">{selectedAsset.productName}</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{selectedAsset.assetId}</div>
                      </div>
                      <div className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${selectedAsset.riskAssessment.riskLevel === 'LOW' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : selectedAsset.riskAssessment.riskLevel === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : selectedAsset.riskAssessment.riskLevel === 'HIGH' ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
                        {selectedAsset.riskAssessment.riskLevel}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Value</div>
                        <div className="mt-2 text-lg font-semibold text-white">{selectedAsset.financialState.formattedValue}</div>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Speed</div>
                        <div className="mt-2 text-lg font-semibold text-white">26 km/h</div>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Financing</div>
                        <div className="mt-2 text-lg font-semibold text-white">{selectedAsset.financialState.formattedFinancing}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-4 text-[10px] uppercase tracking-[0.24em] text-slate-400">Scenario library</div>
              <div className="grid gap-3 md:grid-cols-2">
                {scenarioDefinitions.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setPreset(scenario.id)}
                    className={`rounded-2xl border p-4 text-left transition ${preset === scenario.id ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-600'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{scenario.title}</div>
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-slate-300">{scenario.tag}</span>
                    </div>
                    <div className="mt-3 text-xl font-semibold text-cyan-200">{scenario.label}</div>
                    <div className="mt-2 text-sm text-slate-300">{scenario.description}</div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">{scenario.expectedLoss}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[26px] border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">Active scenario</div>
              <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{activeScenario.title}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{activeScenario.label}</div>
                <div className="mt-3 text-sm text-slate-300">{activeScenario.impact}</div>
              </div>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => void run()} className="flex-1 rounded-xl bg-cyan-600 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">Run scenario</button>
                <button type="button" onClick={() => setIsArOpen((value) => !value)} className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100" disabled={!result}>View in AR</button>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-slate-400">Digital Twin connection</div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Current status</span>
                  <span className="text-emerald-300">In transit</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Route</span>
                  <span>Factory → Warehouse → Port</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Asset</span>
                  <span className="text-cyan-200">AS-1042</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">{error}</div>}

      {result && (
        <div className="rounded-[30px] border border-slate-800 bg-slate-950/95 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Simulated result</div>
              <div className="mt-2 text-2xl font-semibold text-white">{activeScenario.label}</div>
            </div>
            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-cyan-200">{result.preset}</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Asset value</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-cyan-300">Δ {formatCurrency(result.deltaValue)}</span>
              </div>
              <div className="text-3xl font-semibold text-white">{result.after.formattedValue}</div>
              <div className="mt-2 text-sm text-slate-400">From {result.before.formattedValue}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Risk profile</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-amber-300">Score {result.after.riskScore}</span>
              </div>
              <div className="text-3xl font-semibold text-white">{result.after.riskLevel}</div>
              <div className="mt-2 text-sm text-slate-400">Was {result.before.riskLevel}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Financing</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-300">Exposure</span>
              </div>
              <div className="text-3xl font-semibold text-white">{result.after.formattedFinancing}</div>
              <div className="mt-2 text-sm text-slate-400">Available: {result.after.formattedCapacity}</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">ETA</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-cyan-300">Delay</span>
              </div>
              <div className="text-3xl font-semibold text-white">+{result.after.expectedDays - result.before.expectedDays}d</div>
              <div className="mt-2 text-sm text-slate-400">{result.after.expectedDays} days total</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Recommended action</div>
            <div className="mt-2 text-lg font-semibold text-white">{result.recommendedAction}</div>
            <div className="mt-3 text-sm leading-6 text-slate-300">{result.explanation}</div>
          </div>
        </div>
      )}

      {isArOpen && result && (
        <div className="relative overflow-hidden rounded-[30px] border border-cyan-500/30 bg-slate-950/95 p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.12),transparent_32%)]" />
          <div className="relative flex min-h-[220px] items-center justify-center">
            <div className="w-full max-w-md rounded-[28px] border border-cyan-400/30 bg-slate-900/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">AR future overlay</div>
                <button type="button" onClick={() => setIsArOpen(false)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-slate-300">Close</button>
              </div>

              <div className="rounded-[24px] border border-slate-700 bg-slate-950/80 p-4 text-center">
                <div className="text-3xl">🚚</div>
                <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-cyan-300">AS-1042</div>
                <div className="mt-2 text-xl font-semibold text-white">SIMULATION</div>
                <div className="mt-2 text-lg font-medium text-cyan-200">{activeScenario.label}</div>
                <div className="mt-4 grid gap-2 text-left text-sm text-slate-300">
                  <div className="flex items-center justify-between"><span>Risk</span><span className="text-amber-300">{result.after.riskLevel}</span></div>
                  <div className="flex items-center justify-between"><span>Loss</span><span>{formatCurrency(result.deltaValue)}</span></div>
                  <div className="flex items-center justify-between"><span>ETA</span><span>+{result.after.expectedDays - result.before.expectedDays}d</span></div>
                </div>
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-amber-200">Delay zone</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
