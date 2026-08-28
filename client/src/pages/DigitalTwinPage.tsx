import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { fetchAssets } from '../services/api'
import type { Asset } from '../types'
import {
  LogisticsWorld,
  getLogisticsJourneyState,
  getLogisticsTruckPosition,
  getLogisticsTruckSpeed,
} from '../spatial/LogisticsWorld'

function createFallbackAsset(): Asset {
  const now = new Date().toISOString()

  return {
    id: 'as-1042',
    assetId: 'AS-1042',
    productName: '1,000 High-End Enterprise Laptops',
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
      existingFinancing: 78000000,
      maxSafeExposure: 142000000,
      availableCapacity: 268000000,
      trappedCapital: 42000000,
      expectedRealisationDays: 14,
      ltvPercent: 56,
      currency: 'INR',
      formattedValue: '₹2.84 Cr',
      formattedFinancing: '₹0.78 Cr',
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
        timestamp: now,
        stage: 'IN_TRANSIT',
        eventType: 'LOCATION_UPDATE',
        description: 'Truck moving north-west to Nhava Sheva port',
        severity: 'INFO',
        source: 'GPS',
        impact: 'On schedule',
      },
    ],
    routeWaypoints: [
      {
        name: 'Ahmedabad Plant',
        lat: 23.0225,
        lng: 72.5714,
        status: 'COMPLETED',
        timestamp: now,
      },
      {
        name: 'Nashik Hub',
        lat: 20.0059,
        lng: 73.791,
        status: 'CURRENT',
        timestamp: now,
      },
      {
        name: 'Nhava Sheva Port',
        lat: 18.9496,
        lng: 72.952,
        status: 'PENDING',
        timestamp: now,
      },
    ],
  }
}

export default function DigitalTwinPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('AS-1042')
  const [journeyProgress, setJourneyProgress] = useState(0.12)
  const [journeyState, setJourneyState] = useState<'BEFORE_START' | 'ONGOING' | 'STOPPING' | 'ARRIVED'>('BEFORE_START')
  const [simulationSpeed, setSimulationSpeed] = useState<1 | 2 | 5 | 10>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [followTruck, setFollowTruck] = useState(false)
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'top' | 'follow'>('isometric')
  const [layers, setLayers] = useState({ terrain: true, road: true, buildings: true, truck: true, route: true, risk: true, telemetry: true })

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await fetchAssets()
        const data = Array.isArray(raw) ? raw : []
        const resolved = data.length ? data : [createFallbackAsset()]
        setAssets(resolved)
        const selected = resolved.find((asset) => asset.assetId === 'AS-1042') ?? resolved[0]
        setSelectedId(selected.assetId)
        setSearchInput(selected.assetId)
      } catch (err) {
        const fallback = [createFallbackAsset()]
        setAssets(fallback)
        setSelectedId('AS-1042')
        setSearchInput('AS-1042')
        setError(err instanceof Error ? err.message : 'Unable to load digital twin data.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.assetId === selectedId) ?? assets.find((asset) => asset.assetId === 'AS-1042') ?? assets[0] ?? null,
    [assets, selectedId]
  )

  const truckPosition = useMemo(() => getLogisticsTruckPosition(journeyProgress), [journeyProgress])

  useEffect(() => {
    if (!selectedAsset) return

    const nextState = getLogisticsJourneyState(journeyProgress)
    setJourneyState(nextState)
    if (nextState === 'ARRIVED') {
      setIsPlaying(false)
    }
  }, [journeyProgress, selectedAsset])

  useEffect(() => {
    if (!isPlaying || !selectedAsset || journeyState === 'ARRIVED') return

    const interval = window.setInterval(() => {
      setJourneyProgress((previous) => {
        const currentState = getLogisticsJourneyState(previous)
        const speed = getLogisticsTruckSpeed(currentState, simulationSpeed, previous)
        const delta = speed / 1500
        const next = Math.min(1, previous + delta * 0.032)

        if (next >= 1) {
          setIsPlaying(false)
          return 1
        }

        return next
      })
    }, 80)

    return () => window.clearInterval(interval)
  }, [isPlaying, journeyState, selectedAsset, simulationSpeed])

  const handleStart = () => {
    if (!selectedAsset) return
    if (journeyState === 'ARRIVED') {
      setJourneyProgress(0.12)
    }
    setIsPlaying(true)
    setJourneyState('ONGOING')
  }

  const handlePause = () => {
    setIsPlaying(false)
    setJourneyState((previous) => (previous === 'ARRIVED' ? 'ARRIVED' : 'STOPPING'))
  }

  const handleResume = () => {
    if (journeyState === 'ARRIVED') return
    setIsPlaying(true)
    setJourneyState('ONGOING')
  }

  const handleReset = () => {
    setJourneyProgress(0.12)
    setJourneyState('BEFORE_START')
    setIsPlaying(false)
  }

  const liveStatus = selectedAsset
    ? Date.now() - Date.parse(selectedAsset.events[0]?.timestamp ?? new Date().toISOString()) < 60000
      ? 'LIVE'
      : 'OFFLINE'
    : 'OFFLINE'

  const truckSpeed = getLogisticsTruckSpeed(journeyState, simulationSpeed, journeyProgress)
  const etaDays = Math.max(0, Math.round((1 - journeyProgress) * (selectedAsset ? selectedAsset.financialState.expectedRealisationDays : 18)))
  const riskZone = selectedAsset ? selectedAsset.riskAssessment.riskLevel : 'LOW'

  const handleSearch = () => {
    const found = assets.find((asset) => asset.assetId.toLowerCase() === searchInput.toLowerCase())
    if (found) {
      setSelectedId(found.assetId)
      setFollowTruck(true)
      setCameraPreset('follow')
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading digital twin…</div>
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">{error}</div>
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[30px] border border-slate-800 bg-slate-950/95 p-4 shadow-[0_0_50px_rgba(34,211,238,0.12)]">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-cyan-300">LIVE 3D DIGITAL TWIN</div>
            <div className="mt-1 text-2xl font-semibold text-white">Port → Factory → Warehouse</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setFollowTruck((value) => !value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">{followTruck ? 'STOP FOLLOWING' : 'FOLLOW TRUCK'}</button>
            <button type="button" onClick={() => setFollowTruck(false)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">RESET</button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-300">
          <span className={`rounded-full border px-2 py-1 ${liveStatus === 'LIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{liveStatus}</span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">ASSETS: {assets.length}</span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">ROUTES: {assets.filter((asset) => (asset.routeWaypoints?.length ?? 0) > 1).length}</span>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-300">3D MODEL</span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.7fr_0.8fr]">
          <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950">
            <div className="flex flex-wrap gap-2 border-b border-slate-800 bg-slate-900/70 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              <button type="button" className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1">Layers</button>
              <div className="flex flex-wrap gap-1">
                {Object.entries(layers).map(([key, enabled]) => (
                  <button key={key} type="button" onClick={() => setLayers((current) => ({ ...current, [key]: !enabled }))} className={`rounded-md border px-2 py-1 ${enabled ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-950 text-slate-300'}`}>
                    {key}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-200" placeholder="AS-1042" />
                <button type="button" onClick={handleSearch} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">SEARCH</button>
              </div>
            </div>

            <div className="h-[560px] w-full touch-none overflow-hidden" style={{ touchAction: 'none' }}>
              <Canvas camera={{ position: [18, 15, 22], fov: 42 }} shadows dpr={[1, 2]}>
                <LogisticsWorld
                  progress={journeyProgress}
                  highlightTruck={
                    followTruck ||
                    cameraPreset === 'follow'
                  }
                  label={
                    selectedAsset?.assetId ??
                    'AS-1042'
                  }
                  riskLevel={
                    selectedAsset?.riskAssessment
                      .riskLevel ?? 'LOW'
                  }
                  showTerrain={layers.terrain}
                  showRoad={layers.road}
                  showBuildings={layers.buildings}
                  showRoute={layers.route}
                  showTruck={layers.truck}
                  showLabels={layers.telemetry}
                  followCamera={
                    cameraPreset === 'follow' ||
                    followTruck
                  }
                  onSelectNode={(node) => {
                    console.log(
                      'Selected logistics location:',
                      node,
                    )
                  }}
                  onSelectTruck={() => {
                    setFollowTruck(true)
                    setCameraPreset('follow')
                  }}
                />
              </Canvas>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Asset focus</div>
                <div className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${riskZone === 'CRITICAL' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : riskZone === 'HIGH' ? 'border-orange-500/40 bg-orange-500/10 text-orange-300' : riskZone === 'MEDIUM' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}>
                  {riskZone}
                </div>
              </div>

              {selectedAsset ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-semibold text-white">{selectedAsset.assetId}</div>
                    <div className="text-sm text-slate-300">{selectedAsset.productName}</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Value</div>
                      <div className="mt-1 text-lg font-semibold text-white">{selectedAsset.financialState.formattedValue}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Financing</div>
                      <div className="mt-1 text-lg font-semibold text-white">{selectedAsset.financialState.formattedFinancing}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Route ETA</div>
                      <div className="mt-1 text-lg font-semibold text-white">{etaDays}d</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Speed</div>
                      <div className="mt-1 text-lg font-semibold text-white">{Math.round(truckSpeed)} km/h</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">Telemetry</div>
                    <div className="space-y-2 text-sm text-slate-200">
                      <div className="flex items-center justify-between"><span>Latitude</span><span>{selectedAsset.physicalState.lat.toFixed(4)}</span></div>
                      <div className="flex items-center justify-between"><span>Longitude</span><span>{selectedAsset.physicalState.lng.toFixed(4)}</span></div>
                      <div className="flex items-center justify-between"><span>Altitude</span><span>{selectedAsset.physicalState.verificationConfidence}</span></div>
                      <div className="flex items-center justify-between"><span>Risk</span><span>{selectedAsset.riskAssessment.overallScore}</span></div>
                      <div className="flex items-center justify-between"><span>Truck</span><span>{truckPosition.x.toFixed(1)}, {truckPosition.z.toFixed(1)}</span></div>
                      <div className="flex items-center justify-between"><span>State</span><span className={liveStatus === 'LIVE' ? 'text-emerald-300' : 'text-amber-300'}>{journeyState}</span></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[26px] border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">Journey controls</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleStart} className="rounded-xl bg-cyan-600 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white">START</button>
                <button type="button" onClick={handlePause} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">PAUSE</button>
                <button type="button" onClick={handleResume} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">RESUME</button>
                <button type="button" onClick={handleReset} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">RESET</button>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">Simulation speed</div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 5, 10].map((speed) => (
                    <button key={speed} type="button" onClick={() => setSimulationSpeed(speed as 1 | 2 | 5 | 10)} className={`rounded-lg border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${simulationSpeed === speed ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-950 text-slate-200'}`}>
                      {speed}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-slate-400">Journey states</div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {['BEFORE START', 'ONGOING', 'STOPPING', 'FINAL ARRIVED'].map((state, idx) => {
              const active = state === {
                BEFORE_START: 'BEFORE START',
                ONGOING: 'ONGOING',
                STOPPING: 'STOPPING',
                ARRIVED: 'FINAL ARRIVED',
              }[journeyState] || false

              return (
                <div key={state} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${active ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                    <span className={`h-2 w-2 rounded-full ${active ? 'bg-cyan-300' : 'bg-slate-600'}`} />
                    {state}
                  </div>
                  {idx < 3 && <span className="h-px w-8 bg-slate-700" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">TOTAL DISTANCE</div>
            <div className="mt-1 text-lg font-semibold text-white">1,248 km</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">TIME ELAPSED</div>
            <div className="mt-1 text-lg font-semibold text-white">2d 4h</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">TIME REMAINING</div>
            <div className="mt-1 text-lg font-semibold text-white">15d 20h</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">EST. ARRIVAL</div>
            <div className="mt-1 text-lg font-semibold text-white">18d</div>
          </div>
        </div>
      </div>
    </div>
  )
}
