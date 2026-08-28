import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { fetchAssets } from '../services/api'
import type { Asset } from '../types'
import { detectARSupport } from '../spatial/ARManager'

const PORT = new THREE.Vector3(-18, 0.6, 12)
const FACTORY = new THREE.Vector3(0, 0.8, 0)
const WAREHOUSE = new THREE.Vector3(18, 0.7, -12)

const ROUTE_POINTS = [PORT.clone(), new THREE.Vector3(-10, 0.7, 8), FACTORY.clone(), new THREE.Vector3(9, 0.8, -2), WAREHOUSE.clone()]
const ROUTE_CURVE = new THREE.CatmullRomCurve3(ROUTE_POINTS, false, 'catmullrom', 0.2)

function getAssetPosition(asset: Asset | null, progress: number) {
  if (!asset) return PORT.clone()
  const t = Math.max(0, Math.min(1, progress))
  const p = ROUTE_CURVE.getPointAt(t)
  return p.clone()
}

function getJourneyState(progress: number): 'BEFORE_START' | 'ONGOING' | 'STOPPING' | 'ARRIVED' {
  if (progress <= 0.05) return 'BEFORE_START'
  if (progress < 0.85) return 'ONGOING'
  if (progress < 0.995) return 'STOPPING'
  return 'ARRIVED'
}

function getTruckSpeed(state: string, multiplier: number, progress: number): number {
  if (state === 'BEFORE_START') return 0
  if (state === 'ARRIVED') return 0
  if (state === 'ONGOING') return 26 * multiplier
  const stoppingFactor = 1 - (progress - 0.85) / 0.145
  return Math.max(0, 25 * stoppingFactor * multiplier)
}

function TerrainScene({
  selectedAsset,
  progress,
  journeyState,
  layers,
  followTruck,
  cameraPreset,
  onTruckPosition,
}: {
  selectedAsset: Asset | null
  progress: number
  journeyState: 'BEFORE_START' | 'ONGOING' | 'STOPPING' | 'ARRIVED'
  layers: Record<string, boolean>
  followTruck: boolean
  cameraPreset: 'isometric' | 'top' | 'follow'
  onTruckPosition: (v: THREE.Vector3) => void
}) {
  const controlsRef = useRef<any>(null)
  const truckPosition = useMemo(() => getAssetPosition(selectedAsset, progress), [selectedAsset, progress])
  const truckTangent = useMemo(() => {
    const target = ROUTE_CURVE.getPointAt(Math.min(1, progress + 0.01))
    const current = ROUTE_CURVE.getPointAt(Math.min(1, progress))
    const direction = new THREE.Vector3().subVectors(target, current)
    return direction.lengthSq() > 0 ? Math.atan2(direction.x, direction.z) : 0
  }, [progress])

  useEffect(() => {
    onTruckPosition(truckPosition)
  }, [onTruckPosition, truckPosition])

  useFrame((state, delta) => {
    if (controlsRef.current) {
      const desiredCameraPosition =
        cameraPreset === 'top'
          ? new THREE.Vector3(0, 26, 0.1)
          : cameraPreset === 'follow' || followTruck
            ? new THREE.Vector3(truckPosition.x + 8, 5.4, truckPosition.z + 8)
            : new THREE.Vector3(16, 9, 22)

      const desiredTarget =
        cameraPreset === 'top'
          ? new THREE.Vector3(0, 0, 0)
          : cameraPreset === 'follow' || followTruck
            ? new THREE.Vector3(truckPosition.x, 1.2, truckPosition.z)
            : new THREE.Vector3(0, 1.2, 0)

      state.camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-delta * (cameraPreset === 'top' ? 1.4 : 2.4)))
      controlsRef.current.target.lerp(desiredTarget, 1 - Math.exp(-delta * (cameraPreset === 'top' ? 1.2 : 2.4)))
      controlsRef.current.update()
    }
  })

  const journeyAccent =
    journeyState === 'ARRIVED'
      ? '#34d399'
      : journeyState === 'STOPPING'
        ? '#fbbf24'
        : journeyState === 'BEFORE_START'
          ? '#a78bfa'
          : '#67e8f9'

  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(60, 60, 90, 90)
    const position = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i)
      const y = position.getY(i)
      const height = Math.sin(x * 0.9) * 2.5 + Math.cos(y * 0.8) * 2.1 + Math.sin((x + y) * 1.15) * 1.3
      position.setZ(i, height)
    }
    geometry.computeVertexNormals()
    return geometry
  }, [])

  const riskColor = selectedAsset ? {
    LOW: '#34d399',
    MEDIUM: '#fbbf24',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  }[selectedAsset.riskAssessment.riskLevel] ?? '#60a5fa' : '#60a5fa'

  return (
    <>
      <color attach="background" args={['#020b18']} />
      <fog attach="fog" args={['#020b18', 24, 70]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[18, 20, 12]} intensity={2.2} color="#dbeafe" />
      <pointLight position={[-20, 8, 10]} intensity={1.8} color="#22d3ee" />

      {layers.terrain && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} geometry={terrainGeometry} receiveShadow>
          <meshStandardMaterial color="#12263b" roughness={0.96} metalness={0.1} />
        </mesh>
      )}

      {layers.terrain && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-18, -1.15, 12]} receiveShadow>
          <planeGeometry args={[15, 10]} />
          <meshStandardMaterial color="#0b4d75" transparent opacity={0.8} roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {layers.buildings && (
        <group>
          <mesh position={[-18, 2.2, 12]} castShadow>
            <boxGeometry args={[7, 4.2, 9]} />
            <meshStandardMaterial color="#1e293b" metalness={0.35} roughness={0.7} />
          </mesh>
          <mesh position={[-18, 5.1, 12]} castShadow>
            <boxGeometry args={[7.5, 0.7, 9.6]} />
            <meshStandardMaterial color="#334155" roughness={0.55} metalness={0.2} />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <boxGeometry args={[10, 4.2, 7]} />
            <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.22} />
          </mesh>
          <mesh position={[18, 2.3, -12]} castShadow>
            <boxGeometry args={[9, 4.4, 10]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} metalness={0.2} />
          </mesh>

          {[[-18, 1.1, 16], [-15, 1.1, 16], [-12, 1.1, 16], [-9, 1.1, 16], [21, 1.2, -16], [18, 1.2, -16], [15, 1.2, -16]].map(([x, y, z], index) => (
            <mesh key={`${x}-${z}-${index}`} position={[x, y, z]} castShadow>
              <boxGeometry args={[1.4, 1.4, 1.8]} />
              <meshStandardMaterial color="#dbeafe" emissive="#67e8f9" emissiveIntensity={0.25} />
            </mesh>
          ))}
        </group>
      )}

      {layers.road && (
        <group>
          <mesh position={[0, 0.18, 0]} receiveShadow>
            <tubeGeometry args={[ROUTE_CURVE, 240, 2.1, 18, false]} />
            <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.18} />
          </mesh>
          <mesh position={[0, 0.22, 0]} receiveShadow>
            <tubeGeometry args={[ROUTE_CURVE, 240, 0.18, 18, false]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#67e8f9" emissiveIntensity={0.25} />
          </mesh>
        </group>
      )}

      {layers.route && (
        <Line
          points={ROUTE_POINTS.map((p) => [p.x, p.y + 0.8, p.z])}
          color="#38bdf8"
          lineWidth={2.2}
          transparent
          opacity={0.9}
        />
      )}

      {layers.risk && (
        <mesh position={[0, 0.6, 0]}>
          <torusGeometry args={[10.5, 0.8, 12, 100, Math.PI * 0.8]} />
          <meshStandardMaterial color={riskColor} transparent opacity={0.22} emissive={riskColor} emissiveIntensity={0.28} />
        </mesh>
      )}

      <mesh position={[0, 0.45, 0]}>
        <ringGeometry args={[0.4, 0.8, 32]} />
        <meshStandardMaterial color={journeyAccent} emissive={journeyAccent} emissiveIntensity={0.8} />
      </mesh>

      {layers.telemetry && (
        <>
          <Html position={PORT.clone().add(new THREE.Vector3(0, 2.8, 0))} center>
            <div className="rounded-full border border-cyan-500/40 bg-slate-950/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">PORT</div>
          </Html>
          <Html position={FACTORY.clone().add(new THREE.Vector3(0, 4.2, 0))} center>
            <div className="rounded-full border border-violet-500/40 bg-slate-950/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-300">FACTORY</div>
          </Html>
          <Html position={WAREHOUSE.clone().add(new THREE.Vector3(0, 4.8, 0))} center>
            <div className="rounded-full border border-fuchsia-500/40 bg-slate-950/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-300">WAREHOUSE</div>
          </Html>
        </>
      )}

      {selectedAsset && layers.truck && (
        <group position={truckPosition.clone()} rotation={[0, truckTangent, 0]}>
          <mesh castShadow position={[0, 1.1, 0]}>
            <boxGeometry args={[2.5, 1, 4.6]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.45} roughness={0.38} />
          </mesh>
          <mesh castShadow position={[0.35, 1.9, 0]}>
            <boxGeometry args={[1.5, 0.9, 2.7]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0, 0.55, 0]}>
            <boxGeometry args={[2.9, 0.6, 4.9]} />
            <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.7} />
          </mesh>
          {[[-1.1, 0.55, 1.4], [1.1, 0.55, 1.4], [-1.1, 0.55, -1.4], [1.1, 0.55, -1.4]].map(([x, y, z], index) => (
            <mesh key={index} position={[x, y, z]} castShadow>
              <cylinderGeometry args={[0.48, 0.48, 0.5, 18]} />
              <meshStandardMaterial color="#111827" roughness={0.9} metalness={0.2} />
            </mesh>
          ))}
          <mesh position={[1.4, 1.7, 0.9]}>
            <boxGeometry args={[0.18, 0.22, 0.4]} />
            <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[1.4, 1.7, -0.9]}>
            <boxGeometry args={[0.18, 0.22, 0.4]} />
            <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.5} />
          </mesh>
          <Html position={[0, 3.2, 0]} center>
            <div className="rounded-full border border-cyan-500/40 bg-slate-950/85 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">{selectedAsset.assetId}</div>
          </Html>
        </group>
      )}

      <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate makeDefault minDistance={8} maxDistance={40} />
    </>
  )
}

export default function DigitalTwinPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('AS-1042')
  const [journeyProgress, setJourneyProgress] = useState(0)
  const [journeyState, setJourneyState] = useState<'BEFORE_START' | 'ONGOING' | 'STOPPING' | 'ARRIVED'>('BEFORE_START')
  const [simulationSpeed, setSimulationSpeed] = useState<1 | 2 | 5 | 10>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [followTruck, setFollowTruck] = useState(false)
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'top' | 'follow'>('isometric')
  const [arSupport, setArSupport] = useState<{ supported: boolean; label: string }>({ supported: false, label: 'AR unavailable' })
  const [layers, setLayers] = useState({ terrain: true, road: true, buildings: true, truck: true, route: true, risk: true, telemetry: true })
  const [truckPosition, setTruckPosition] = useState(PORT.clone())

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAssets()
        setAssets(data)
        if (data.length) {
          const selected = data.find((asset) => asset.assetId === 'AS-1042') ?? data[0]
          setSelectedId(selected.assetId)
          setSearchInput(selected.assetId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load digital twin data.')
      } finally {
        setLoading(false)
      }
    }

    const checkAR = async () => {
      const state = await detectARSupport()
      setArSupport(state)
    }

    void load()
    void checkAR()
  }, [])

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.assetId === selectedId) ?? assets.find((asset) => asset.assetId === 'AS-1042') ?? assets[0] ?? null,
    [assets, selectedId]
  )

  useEffect(() => {
    if (!selectedAsset) return
    const nextState = getJourneyState(journeyProgress)
    setJourneyState(nextState)
    if (nextState === 'ARRIVED') setIsPlaying(false)
  }, [journeyProgress, selectedAsset])

  useEffect(() => {
    if (!isPlaying || !selectedAsset || journeyState === 'ARRIVED') return

    const interval = window.setInterval(() => {
      setJourneyProgress((previous) => {
        const currentState = getJourneyState(previous)
        const speed = getTruckSpeed(currentState, simulationSpeed, previous)
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
      setJourneyProgress(0)
      setJourneyState('BEFORE_START')
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
    setJourneyProgress(0)
    setJourneyState('BEFORE_START')
    setIsPlaying(false)
  }

  const liveStatus = selectedAsset ? (Date.now() - Date.parse(selectedAsset.events[0]?.timestamp ?? new Date().toISOString()) < 60000 ? 'LIVE' : 'OFFLINE') : 'OFFLINE'
  const truckSpeed = getTruckSpeed(journeyState, simulationSpeed, journeyProgress)
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

  useEffect(() => {
    if (cameraPreset === 'follow') {
      setFollowTruck(true)
    }
  }, [cameraPreset])

  if (loading) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading digital twin…</div>
  if (error) return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">{error}</div>

  return (
    <div className="space-y-5">
      <div className="rounded-[30px] border border-slate-800 bg-slate-950/95 p-4 shadow-[0_0_50px_rgba(34,211,238,0.12)]">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-cyan-300">LIVE 3D DIGITAL TWIN</div>
            <div className="mt-1 text-2xl font-semibold text-white">Port → Factory → Warehouse</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={async () => { const state = await detectARSupport(); setArSupport(state); }} className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200">AR</button>
            <button type="button" onClick={() => setFollowTruck((value) => !value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">{followTruck ? 'STOP FOLLOWING' : 'FOLLOW TRUCK'}</button>
            <button type="button" onClick={() => setCameraPreset('top')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">TOP VIEW</button>
            <button type="button" onClick={() => setCameraPreset('isometric')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">ISOMETRIC</button>
            <button type="button" onClick={() => { setFollowTruck(false); setCameraPreset('isometric'); }} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">RESET</button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-300">
          <span className={`rounded-full border px-2 py-1 ${liveStatus === 'LIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{liveStatus}</span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">ASSETS: {assets.length}</span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">ROUTES: {assets.filter((asset) => (asset.routeWaypoints?.length ?? 0) > 1).length}</span>
          {arSupport.supported ? <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-300">AR READY</span> : <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">AR UNAVAILABLE</span>}
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

            <div className="h-[560px] w-full touch-none" style={{ touchAction: 'none' }}>
              <Canvas camera={{ position: [18, 15, 22], fov: 42 }}>
                <TerrainScene
                  selectedAsset={selectedAsset}
                  progress={journeyProgress}
                  journeyState={journeyState}
                  layers={layers}
                  followTruck={followTruck}
                  cameraPreset={cameraPreset}
                  onTruckPosition={setTruckPosition}
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
