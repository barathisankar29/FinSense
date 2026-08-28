import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { advanceStage, fetchAsset } from '../services/api'
import type { Asset } from '../types'
import { detectARSupport, requestARSession } from '../spatial/ARManager'
import { getARModel } from '../spatial/ARAssetModelFactory'

export function AssetARModel({ asset, mode = 'ar' }: { asset: Asset; mode?: 'ar' | '3d' }) {
  const model = useMemo(() => getARModel(asset), [asset])
  const [scale, setScale] = useState(1)
  const [rotationY, setRotationY] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
  const dragState = useRef({ active: false, startX: 0, startZ: 0, originX: 0, originZ: 0 })

  function AssetARSceneContent() {
    const groupRef = useRef<THREE.Group | null>(null)

    const handlePointerDown = (event: any) => {
      event.stopPropagation()
      dragState.current = {
        active: true,
        startX: event.point.x,
        startZ: event.point.z,
        originX: position.x,
        originZ: position.z,
      }
    }

    const handlePointerMove = (event: any) => {
      if (!dragState.current.active) return
      event.stopPropagation()
      const dx = event.point.x - dragState.current.startX
      const dz = event.point.z - dragState.current.startZ
      setPosition({
        x: Math.max(-1.3, Math.min(1.3, dragState.current.originX + dx)),
        y: 0,
        z: Math.max(-1.3, Math.min(1.3, dragState.current.originZ + dz)),
      })
    }

    const handlePointerUp = () => {
      dragState.current.active = false
    }

    useFrame((state) => {
      if (!groupRef.current) return
      groupRef.current.rotation.y = rotationY + state.clock.elapsedTime * 0.18
      groupRef.current.position.set(position.x, position.y, position.z)
      groupRef.current.scale.setScalar(scale)
    })

    const renderProceduralModel = () => {
      const { dimensions, color, accent } = model

      switch (model.type) {
        case 'laptop-pallet':
          return (
            <group>
              <mesh castShadow position={[0, 0.4, 0]}>
                <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
                <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
              </mesh>
              {[-0.4, 0, 0.4].map((x) => (
                <mesh key={x} castShadow position={[x, 0.9, 0]}>
                  <boxGeometry args={[0.35, 0.18, 0.6]} />
                  <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
                </mesh>
              ))}
            </group>
          )
        case 'smartphone-carton':
          return (
            <group>
              <mesh castShadow position={[0, 0.45, 0]}>
                <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
                <meshStandardMaterial color={color} metalness={0.15} roughness={0.7} />
              </mesh>
              {[-0.45, 0.45].map((x) => (
                <mesh key={x} castShadow position={[x, 0.9, 0]}>
                  <boxGeometry args={[0.25, 0.12, 0.5]} />
                  <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
                </mesh>
              ))}
            </group>
          )
        case 'container':
          return (
            <group>
              <mesh castShadow position={[0, 0.6, 0]}>
                <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
                <meshStandardMaterial color={color} metalness={0.22} roughness={0.65} />
              </mesh>
              <mesh castShadow position={[0, 1.05, 0]}>
                <boxGeometry args={[dimensions.x * 0.86, 0.16, dimensions.z * 0.8]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} />
              </mesh>
            </group>
          )
        case 'vehicle':
          return (
            <group>
              <mesh castShadow position={[0, 0.45, 0]}>
                <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
              </mesh>
              <mesh castShadow position={[0, 0.1, 0.75]}>
                <boxGeometry args={[1.2, 0.3, 0.75]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} />
              </mesh>
            </group>
          )
        case 'machinery':
          return (
            <group>
              <mesh castShadow position={[0, 0.55, 0]}>
                <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
                <meshStandardMaterial color={color} metalness={0.28} roughness={0.6} />
              </mesh>
              <mesh castShadow position={[0, 1.1, 0]}>
                <boxGeometry args={[0.8, 0.42, 0.8]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} />
              </mesh>
            </group>
          )
        default:
          return (
            <group>
              <mesh castShadow position={[0, 0.5, 0]}>
                <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
                <meshStandardMaterial color={color} metalness={0.25} roughness={0.55} />
              </mesh>
            </group>
          )
      }
    }

    return (
      <group ref={groupRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        {renderProceduralModel()}
      </group>
    )
  }

  return (
    <div className="relative h-[320px] overflow-hidden rounded-[22px] border border-slate-800 bg-slate-950">
      <Canvas camera={{ position: [2.8, 2.1, 4.5], fov: 34 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 5, 2]} intensity={2.1} color="#e0f2fe" />
        <pointLight position={[-2, 2, 2]} intensity={1.6} color={model.accent} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
          <circleGeometry args={[4.2, 60]} />
          <meshStandardMaterial color="#081420" roughness={1} metalness={0.1} />
        </mesh>
        <AssetARSceneContent />
        <OrbitControls enablePan enableZoom enableRotate makeDefault />
      </Canvas>

      {mode === 'ar' ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-slate-700 bg-slate-950/80 p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <span>AR asset intelligence</span>
            <span className="text-emerald-300">LIVE</span>
          </div>
          <div className="text-sm font-medium text-white">{asset.assetId}</div>
          <div className="text-xs text-slate-300">{asset.productName}</div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-slate-700 bg-slate-950/80 p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <span>3D asset inspection</span>
            <span className="text-cyan-300">DRAG</span>
          </div>
          <div className="text-sm font-medium text-white">{asset.assetId}</div>
          <div className="text-xs text-slate-300">{asset.productName}</div>
        </div>
      )}

      <div className="absolute right-3 top-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setPosition({ x: 0, y: 0, z: 0 })} className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">PLACE</button>
        <button type="button" onClick={() => setPosition((prev) => ({ ...prev, x: prev.x + 0.2 }))} className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">MOVE</button>
        <button type="button" onClick={() => setRotationY((prev) => prev + Math.PI / 6)} className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">ROTATE</button>
        <button type="button" onClick={() => setScale((prev) => Number((prev + 0.1).toFixed(2)))} className="rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">SCALE</button>
        <button type="button" onClick={() => { setScale(1); setRotationY(0); setPosition({ x: 0, y: 0, z: 0 }) }} className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">RESET</button>
      </div>
    </div>
  )
}

export default function AssetDetailPage() {
  const { assetId } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [arUnavailableMessage, setArUnavailableMessage] = useState<string | null>(null)
  const [showArView, setShowArView] = useState(false)
  const [sceneMode, setSceneMode] = useState<'ar' | '3d'>('ar')

  useEffect(() => {
    const load = async () => {
      if (!assetId) return
      try {
        const data = await fetchAsset(assetId)
        setAsset(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load asset.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [assetId])

  useEffect(() => {
    const checkAR = async () => {
      await detectARSupport()
    }
    void checkAR()
  }, [])

  const handleAdvance = async () => {
    if (!asset) return
    try {
      const result = await advanceStage(asset.assetId)
      const refreshed = await fetchAsset(asset.assetId)
      setAsset(refreshed)
      alert(`${result.newStage} reached. ${result.recommendedAction}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lifecycle update failed.')
    }
  }

  const handleViewInAR = async () => {
    if (!asset) return

    setSceneMode('ar')
    setShowArView(true)
    setArUnavailableMessage(null)

    const state = await detectARSupport()
    if (!state.supported) {
      setArUnavailableMessage(null)
      return
    }

    const ok = await requestARSession()
    if (!ok) {
      setArUnavailableMessage(null)
      return
    }
  }

  const handleViewIn3D = () => {
    setSceneMode('3d')
    setShowArView(true)
    setArUnavailableMessage(null)
  }

  if (loading) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading asset…</div>
  if (error) return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">{error}</div>
  if (!asset) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Asset not found.</div>

  const infoRows = [
    { label: 'ASSET VALUE', value: asset.financialState.formattedValue },
    { label: 'FINANCED', value: asset.financialState.formattedFinancing },
    { label: 'OUTSTANDING', value: asset.financialState.formattedFinancing },
    { label: 'RISK', value: asset.riskAssessment.riskLevel },
    { label: 'STATUS', value: asset.physicalState.stage },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Asset intelligence</div>
            <div className="mt-1 text-2xl font-semibold text-white">{asset.assetId} · {asset.productName}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleViewInAR} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">VIEW IN AR</button>
            <button type="button" onClick={handleViewIn3D} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200">VIEW 3D</button>
            <button type="button" onClick={() => navigate('/map')} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200">LIVE TRACK</button>
            <button type="button" onClick={() => navigate(`/simulation?asset=${asset.assetId}`)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200">SIMULATE</button>
            <button onClick={handleAdvance} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100">Advance Lifecycle</button>
          </div>
        </div>
      </div>

      {showArView && (
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-4 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
          {arUnavailableMessage ? (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              {arUnavailableMessage}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={handleViewIn3D} className="rounded-xl border border-amber-300/50 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-200">OPEN 3D VIEW</button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.7fr]">
            <AssetARModel asset={asset} mode={sceneMode} />

            <div className="rounded-[24px] border border-slate-800 bg-slate-950/90 p-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-cyan-300">ASSET OVERLAY</div>
              <div className="mb-3 text-xl font-semibold text-white">{asset.assetId}</div>
              <div className="mb-4 text-sm text-slate-300">{asset.productName}</div>

              <div className="space-y-2">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs uppercase tracking-[0.14em] text-slate-300">
                    <span>{row.label}</span>
                    <span className="text-right text-[11px] font-medium normal-case tracking-normal text-white">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-300">
                LIVE ●
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 text-lg font-semibold text-slate-100">Asset identity</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><div className="text-xs uppercase text-slate-500">Asset ID</div><div className="text-slate-200">{asset.assetId}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Product</div><div className="text-slate-200">{asset.productName}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Supplier</div><div className="text-slate-200">{asset.contractualState.buyer}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Location</div><div className="text-slate-200">{asset.physicalState.location}</div></div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 text-lg font-semibold text-slate-100">Financial state</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><div className="text-xs uppercase text-slate-500">Asset value</div><div className="text-slate-200">{asset.financialState.formattedValue}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Available capacity</div><div className="text-slate-200">{asset.financialState.formattedCapacity}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Outstanding financing</div><div className="text-slate-200">{asset.financialState.formattedFinancing}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Exposure</div><div className="text-slate-200">{asset.financialState.maxSafeExposure}</div></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 xl:col-span-2">
          <div className="mb-4 text-lg font-semibold text-slate-100">Lifecycle timeline</div>
          <div className="space-y-3">
            {['PO_CREATED','RAW_MATERIAL','PRODUCTION','FINISHED_GOODS','SHIPPED','DELIVERED','CASH_REALISED'].map((stage) => {
              const active = asset.physicalState.stage === stage
              return (
                <div key={stage} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${active ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-slate-800 bg-slate-950/60'}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  <span className="text-sm text-slate-200">{stage}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 text-lg font-semibold text-slate-100">Risk</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Overall</span><span className="text-white">{asset.riskAssessment.overallScore}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Physical</span><span className="text-white">{asset.riskAssessment.physicalRisk}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Buyer</span><span className="text-white">{asset.riskAssessment.buyerRisk}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Logistics</span><span className="text-white">{asset.riskAssessment.logisticsRisk}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 text-lg font-semibold text-slate-100">Actions</div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => window.location.assign('/financing')} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"><ShieldCheck className="h-4 w-4" /> Request Financing</button>
          <button type="button" onClick={() => window.location.assign(`/simulation?asset=${asset.assetId}`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"><TrendingUp className="h-4 w-4" /> Run Simulation</button>
          <button type="button" onClick={() => window.location.assign('/reconciliation')} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"><AlertCircle className="h-4 w-4" /> Reconcile Data</button>
          <button type="button" onClick={() => window.location.assign('/audit')} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"><ArrowRight className="h-4 w-4" /> View Audit</button>
        </div>
      </div>
    </div>
  )
}
