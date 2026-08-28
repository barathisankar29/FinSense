import { Canvas, useThree } from '@react-three/fiber'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { Activity, Building2, Car, Factory, Pause, Play, RotateCcw, Ship, Warehouse, X } from 'lucide-react'
import { fetchAssets } from '../services/api'
import type { Asset } from '../types'
import { LOGISTICS_NODES, NETWORK_ROUTES, ACTIVE_ROUTE, type LogisticsNode } from '../spatial/indiaLogisticsData'

import { LogisticsWorld, getLogisticsJourneyState, getLogisticsTruckSpeed } from '../spatial/LogisticsWorld'
import { detectARSupport } from '../spatial/ARManager'
import { interpolateRouteCoordinates } from '../spatial/routeEngine'

const nodeIcon = (node: LogisticsNode, selected: boolean) => L.divIcon({
  className: 'finsense-map-marker',
  html: `<div style="width:${selected ? 22 : 16}px;height:${selected ? 22 : 16}px;border-radius:999px;background:${node.type === 'FACTORY' ? '#a78bfa' : node.type === 'WAREHOUSE' ? '#f59e0b' : node.type === 'PORT' ? '#22d3ee' : node.type === 'TRANSIT' ? '#f97316' : '#94a3b8'};border:3px solid #020617;box-shadow:0 0 0 2px rgba(103,232,249,.5),0 0 22px rgba(34,211,238,.35)"></div>`,
})

function MapViewport({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) map.fitBounds(points as L.LatLngBoundsExpression, { padding: [35, 35] })
  }, [map, points])
  return null
}

function XRBridge({ active }: { active: boolean }) {
  const { gl } = useThree()
  useEffect(() => {
    if (!active) return
    gl.xr.enabled = true
    let disposed = false
    void (async () => {
      const xr = (navigator as Navigator & { xr?: { requestSession?: (mode: string, options?: Record<string, unknown>) => Promise<any> } }).xr
      if (!xr?.requestSession || disposed) return
      try {
        const session = await xr.requestSession('immersive-ar', {
          requiredFeatures: ['local', 'hit-test'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: document.body },
        })
        if (!disposed) await gl.xr.setSession(session)
      } catch {
        // The page keeps the interactive 3D fallback when WebXR cannot start.
      }
    })()
    return () => {
      disposed = true
      if (gl.xr.isPresenting) void gl.xr.getSession()?.end()
    }
  }, [active, gl])
  return null
}

function formatEta(progress: number) {
  const remainingMinutes = Math.max(0, Math.round((1 - progress) * 275))
  return `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`
}

export default function MapPage() {
  const [selectedView, setSelectedView] = useState<'2D MAP' | '3D TWIN' | 'AR VIEW'>('AR VIEW')
  const [selectedNode, setSelectedNode] = useState<LogisticsNode | null>(null)
  const [selectedTruck, setSelectedTruck] = useState(true)
  const [progress, setProgress] = useState(0.42)
  const [playing, setPlaying] = useState(true)
  const [followTruck, setFollowTruck] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [arSupported, setArSupported] = useState(false)
  const [arActive, setArActive] = useState(false)
  const [layers, setLayers] = useState({ routes: true, vehicles: true, buildings: true, risk: true, traffic: true })

  useEffect(() => {
    void fetchAssets().then(setAssets).catch(() => setAssets([]))
    void detectARSupport().then((state) => setArSupported(state.supported))
  }, [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(0.08, (now - previous) / 1000)
      previous = now
      setProgress((value) => (value >= 1 ? 0 : value + delta * 0.0075))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const asset = assets.find((item) => item.assetId === 'AS-1042') ?? assets[0] ?? null
  const journeyState = getLogisticsJourneyState(progress)
  const speed = getLogisticsTruckSpeed(journeyState)
  const eta = formatEta(progress)
  const activeRoutePoints = ACTIVE_ROUTE.points
  const currentLatLng = interpolateRouteCoordinates(activeRoutePoints, progress)

  const mapPoints = useMemo(() => LOGISTICS_NODES.map((node) => [node.lat, node.lng] as [number, number]), [])

  const selectNode = (node: LogisticsNode) => {
    setSelectedNode(node)
    setSelectedTruck(false)
    setFollowTruck(false)
  }

  const selectTruck = () => {
    setSelectedTruck(true)
    setSelectedNode(null)
  }

  const launchAR = async () => {
    if (!arSupported) return
    setArActive(true)
  }

  const iconForNode = (type: LogisticsNode['type']) => {
    if (type === 'FACTORY') return Factory
    if (type === 'WAREHOUSE') return Warehouse
    if (type === 'PORT') return Ship
    if (type === 'TRANSIT') return Activity
    return Building2
  }

  const selectedDetails = selectedNode
    ? {
        title: selectedNode.name,
        type: selectedNode.type,
        status: selectedNode.status,
        risk: selectedNode.risk,
        capacity: selectedNode.capacity,
        exposure: selectedNode.exposure,
      }
    : null

  return (
    <div className="relative -m-4 min-h-[calc(100vh-5rem)] overflow-hidden bg-[#020817] text-slate-100 md:-m-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,.08),transparent_34%),linear-gradient(180deg,#020817,#020b14)]" />

      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-5 py-4 backdrop-blur-xl">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">FinSense • India logistics command map</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">National 3D terrain • live route • AR digital twin</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['2D MAP', '3D TWIN', 'AR VIEW'] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => setSelectedView(mode)} className={`rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${selectedView === mode ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
              {mode}
            </button>
          ))}
          <button type="button" onClick={() => setPlaying((value) => !value)} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-200" title={playing ? 'Pause route' : 'Play route'}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => setProgress(0.02)} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-200" title="Reset journey"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="relative z-10 grid min-h-[calc(100vh-9rem)] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="border-r border-slate-800 bg-slate-950/80 p-3 backdrop-blur-xl">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Layers</div>
          {Object.entries(layers).map(([key, value]) => (
            <label key={key} className="mb-2 flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-xs text-slate-200">
              <span className="capitalize">{key}</span>
              <input type="checkbox" checked={value} onChange={(event) => setLayers((current) => ({ ...current, [key]: event.target.checked }))} className="accent-cyan-400" />
            </label>
          ))}

          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Active corridor</div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200"><Car className="h-4 w-4" /> AS-1042</div>
              <div className="mt-2 text-[11px] leading-5 text-slate-300">Ahmedabad Plant → Nashik Hub → Mumbai → Nhava Sheva</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progress * 100}%` }} /></div>
              <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.15em] text-slate-500"><span>{Math.round(progress * 100)}%</span><span>{eta}</span></div>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Network nodes</div>
            <div className="space-y-1.5">
              {LOGISTICS_NODES.map((node) => {
                const Icon = iconForNode(node.type)
                return <button key={node.id} type="button" onClick={() => selectNode(node)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] ${selectedNode?.id === node.id ? 'bg-cyan-500/10 text-cyan-200' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}><Icon className="h-3.5 w-3.5" />{node.shortName}</button>
              })}
            </div>
          </div>
        </aside>

        <main className="relative min-h-[680px] overflow-hidden">
          {selectedView === '2D MAP' ? (
            <div className="absolute inset-0 p-3 md:p-5">
              <div className="relative h-full overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
                <MapContainer center={[22.5, 78.9]} zoom={5} minZoom={4} maxZoom={11} scrollWheelZoom className="h-full w-full">
                  <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapViewport points={mapPoints} />
                  {NETWORK_ROUTES.map((route) => <Polyline key={route.id} positions={route.points} pathOptions={{ color: route.id === ACTIVE_ROUTE.id ? '#22d3ee' : '#64748b', weight: route.id === ACTIVE_ROUTE.id ? 5 : 2, opacity: route.id === ACTIVE_ROUTE.id ? 0.9 : 0.6 }} />)}
                  {LOGISTICS_NODES.map((node) => <Marker key={node.id} position={[node.lat, node.lng]} icon={nodeIcon(node, selectedNode?.id === node.id)} eventHandlers={{ click: () => selectNode(node) }}><Popup><strong>{node.name}</strong><br />{node.type}<br />Risk: {node.risk}</Popup></Marker>)}
                  {layers.vehicles && <Marker position={currentLatLng} icon={L.divIcon({ className: 'finsense-truck-marker', html: '<div style="font-size:24px;filter:drop-shadow(0 0 7px #22d3ee)">🚚</div>' })} eventHandlers={{ click: selectTruck }} />}
                </MapContainer>
                <div className="pointer-events-none absolute left-5 top-5 rounded-xl border border-cyan-400/30 bg-slate-950/85 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200">Real geographic network view</div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0">
              <Canvas camera={{ position: [0, 86, 122], fov: 44 }} shadows dpr={[1, 2]} gl={{ antialias: true, alpha: selectedView === 'AR VIEW' }}>
                {selectedView === 'AR VIEW' && <XRBridge active={arActive} />}
                <LogisticsWorld
                  progress={progress}
                  selectedNodeId={selectedNode?.id}
                  highlightTruck={selectedTruck}
                  followCamera={followTruck}
                  showTerrain
                  showRoad={layers.traffic}
                  showBuildings={layers.buildings}
                  showRoute={layers.routes}
                  showTruck={layers.vehicles}
                  showRisk={layers.risk}
                  showLabels
                  worldScale={selectedView === 'AR VIEW' && arActive ? 0.18 : 1}
                  onSelectNode={selectNode}
                  onSelectTruck={selectTruck}
                />
              </Canvas>
              <div className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between gap-3">
                <div className="rounded-xl border border-cyan-400/30 bg-slate-950/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200 backdrop-blur">{selectedView === 'AR VIEW' ? 'AR TERRAIN DIGITAL TWIN' : '3D INDIA TERRAIN'}</div>
                <div className="flex gap-2">
                  <span className="rounded-xl border border-emerald-400/30 bg-slate-950/80 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-emerald-300">LIVE TRACKING</span>
                  {selectedView === 'AR VIEW' && <button type="button" onClick={launchAR} disabled={!arSupported} className="pointer-events-auto rounded-xl border border-cyan-400/40 bg-slate-950/90 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-cyan-200 disabled:opacity-40">{arActive ? 'AR ACTIVE' : arSupported ? 'PLACE IN AR' : 'AR FALLBACK'}</button>}
                </div>
              </div>
              <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/90 p-2 backdrop-blur-xl">
                <button type="button" onClick={() => setPlaying(true)} className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-cyan-200">Play journey</button>
                <button type="button" onClick={() => setPlaying(false)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-slate-200">Pause</button>
                <button type="button" onClick={() => setProgress(0.02)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-slate-200">Reset</button>
                <button type="button" onClick={() => { setFollowTruck((value) => !value); setSelectedTruck(true); setSelectedNode(null) }} className={`rounded-xl border px-3 py-2 text-[10px] uppercase tracking-[0.15em] ${followTruck ? 'border-amber-400/50 bg-amber-400/10 text-amber-200' : 'border-slate-700 bg-slate-900 text-slate-200'}`}>Follow truck</button>
              </div>
            </div>
          )}
        </main>

        <aside className="border-l border-slate-800 bg-slate-950/85 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Selected object</div>
            {(selectedNode || selectedTruck) && <button type="button" onClick={() => { setSelectedNode(null); setSelectedTruck(false) }} className="rounded-lg p-1 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}
          </div>

          {selectedDetails && (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">{selectedDetails.type}</div>
              <div className="mt-2 text-xl font-semibold text-white">{selectedDetails.title}</div>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between"><span>Status</span><span className="text-emerald-300">{selectedDetails.status}</span></div>
                <div className="flex justify-between"><span>Risk</span><span className={selectedDetails.risk === 'LOW' ? 'text-emerald-300' : 'text-amber-300'}>{selectedDetails.risk}</span></div>
                <div className="flex justify-between"><span>Capacity</span><span>{selectedDetails.capacity}</span></div>
                <div className="flex justify-between"><span>Exposure</span><span>{selectedDetails.exposure}</span></div>
                <div className="flex justify-between"><span>Assets</span><span>{selectedNode?.assetIds.length ?? 0}</span></div>
              </div>
              <button type="button" className="mt-4 w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Open full details</button>
            </div>
          )}

          {selectedTruck && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200"><Car className="h-4 w-4" /> Live vehicle</div>
              <div className="mt-2 text-2xl font-semibold text-white">AS-1042</div>
              <div className="text-xs text-slate-400">Container Truck • Ahmedabad → Nhava Sheva</div>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between"><span>Status</span><span className="text-emerald-300">{journeyState === 'ARRIVED' ? 'ARRIVED' : 'ON TRANSIT'}</span></div>
                <div className="flex justify-between"><span>Speed</span><span>{speed.toFixed(0)} km/h</span></div>
                <div className="flex justify-between"><span>ETA</span><span>{eta}</span></div>
                <div className="flex justify-between"><span>Progress</span><span>{Math.round(progress * 100)}%</span></div>
                <div className="flex justify-between"><span>Value</span><span>{asset?.financialState.formattedValue ?? '₹2.84 Cr'}</span></div>
                <div className="flex justify-between"><span>Risk</span><span className="text-emerald-300">{asset?.riskAssessment.riskLevel ?? 'LOW'}</span></div>
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-slate-800"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress * 100}%` }} /></div>
            </div>
          )}

          {!selectedDetails && !selectedTruck && <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs leading-5 text-slate-400">Click a factory, warehouse, port, transit hub, city node, route vehicle, or map marker to inspect it.</div>}

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Map controls</div>
            <div className="mt-2 text-[11px] leading-5 text-slate-300">Drag to rotate • wheel to zoom • click a facility • follow the truck • switch to AR on a WebXR-capable device.</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
