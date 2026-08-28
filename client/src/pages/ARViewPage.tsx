import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { fetchAssets } from '../services/api'
import type { Asset } from '../types'
import { detectARSupport, requestARSession } from '../spatial/ARManager'

const routePoints = [
  new THREE.Vector3(-4.8, 0.3, -3.4),
  new THREE.Vector3(-2.9, 0.55, -2.7),
  new THREE.Vector3(-1.5, 0.72, -1.3),
  new THREE.Vector3(0.5, 0.84, 0.1),
  new THREE.Vector3(2.5, 0.92, 1.5),
  new THREE.Vector3(4.8, 0.7, 2.8),
]

const riskZones = [
  { position: new THREE.Vector3(-1.2, 0.4, -1.0), radius: 1.6, color: '#f97316', label: 'Risk watch', value: 38 },
  { position: new THREE.Vector3(2.2, 0.4, 1.2), radius: 1.8, color: '#f87171', label: 'Critical zone', value: 62 },
]

function AnimatedCargo({ asset, progress }: { asset: Asset; progress: number }) {
  const curve = useRef(new THREE.CatmullRomCurve3(routePoints, false, 'catmullrom', 0.2))
  const t = Math.min(Math.max(progress, 0), 100) / 100
  const point = curve.current.getPointAt(t)
  const tangent = curve.current.getTangentAt(t).normalize()

  return (
    <group position={[point.x, point.y + 1.2, point.z]} rotation={[0.12, Math.atan2(tangent.x, tangent.z), 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.7, 1.2, 2.8]} />
        <meshStandardMaterial color={asset.riskAssessment.riskLevel === 'CRITICAL' ? '#f87171' : asset.riskAssessment.riskLevel === 'HIGH' ? '#fb923c' : '#34d399'} emissive="#38bdf8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0.1, 0.9, 0]}>
        <boxGeometry args={[0.7, 0.5, 0.8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  )
}

function IndustrialNode({ position, label, color }: { position: THREE.Vector3; label: string; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[2.4, 2.2, 2.6]} />
        <meshStandardMaterial color={color} metalness={0.18} roughness={0.7} />
      </mesh>
      <Html position={[0, 2.4, 0]} center>
        <div className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-slate-200">{label}</div>
      </Html>
    </group>
  )
}

function RiskOverlay() {
  return (
    <>
      {riskZones.map((zone) => (
        <group key={zone.label} position={zone.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[zone.radius * 0.6, zone.radius, 32]} />
            <meshBasicMaterial color={zone.color} transparent opacity={0.28} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 1.5, 0]} center>
            <div className="rounded-full border border-white/10 bg-slate-950/80 px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-slate-100">
              {zone.label}
            </div>
          </Html>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function ARScene({ asset, progress }: { asset: Asset; progress: number }) {
  return (
    <>
      <color attach="background" args={['#020817']} />
      <fog attach="fog" args={['#020817', 12, 32]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[6, 8, 6]} intensity={2.3} color="#dbeafe" />
      <pointLight position={[-4, 4, 4]} intensity={1.7} color="#67e8f9" />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        autoRotate={false}
        minDistance={5}
        maxDistance={18}
        target={[0, 1, 0]}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]} receiveShadow>
        <circleGeometry args={[8.5, 120]} />
        <meshStandardMaterial color="#0f172a" roughness={1} metalness={0.1} />
      </mesh>

      <IndustrialNode position={new THREE.Vector3(-3.9, 1.3, -3.1)} label="PORT" color="#1f2937" />
      <IndustrialNode position={new THREE.Vector3(3.8, 1.2, 2.7)} label="WAREHOUSE" color="#0f172a" />
      <IndustrialNode position={new THREE.Vector3(0.4, 0.6, 0.4)} label="FACTORY" color="#1e293b" />

      <RiskOverlay />

      <Line points={routePoints} color="#67e8f9" lineWidth={2.5} dashed dashSize={0.35} gapSize={0.2} />

      {routePoints.map((point, index) => (
        <group key={`${point.x}-${point.z}-${index}`} position={point}>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color={index === 0 ? '#34d399' : index === routePoints.length - 1 ? '#fbbf24' : '#67e8f9'} emissive={index === 0 ? '#34d399' : '#67e8f9'} emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}

      <AnimatedCargo asset={asset} progress={progress} />

      <Html position={[0, 4.4, 0]} center>
        <div className="rounded-full border border-cyan-400/60 bg-slate-950/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.4)]">
          {asset.assetId}
        </div>
      </Html>
    </>
  )
}

export default function ARViewPage() {
  const [asset, setAsset] = useState<Asset | null>(null)
  const [launching, setLaunching] = useState(false)
  const [arSupported, setArSupported] = useState<boolean>(false)
  const [routeProgress, setRouteProgress] = useState(42)

  useEffect(() => {
    const load = async () => {
      const assets = await fetchAssets()
      setAsset(assets[0] ?? null)
      const arState = await detectARSupport()
      setArSupported(arState.supported)
    }
    void load()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRouteProgress((previous) => (previous >= 100 ? 0 : previous + 1))
    }, 40)

    return () => window.clearInterval(intervalId)
  }, [])

  const handleLaunchAR = async () => {
    setLaunching(true)
    const ok = await requestARSession()
    const arState = await detectARSupport()
    setArSupported(ok || arState.supported)
    setLaunching(false)
  }

  if (!asset) {
    return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading AR view…</div>
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_transparent_32%),linear-gradient(135deg,#020817,#0f172a)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.26em] text-cyan-300">AR / live spatial viewer</div>
          <div className="mt-1 text-lg font-semibold text-white">{asset.assetId} · {asset.productName}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLaunchAR}
            disabled={launching || !arSupported}
            className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {launching ? 'Launching…' : arSupported ? 'Launch AR' : 'AR unavailable'}
          </button>
          <button
            type="button"
            onClick={() => setArSupported(false)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200"
          >
            3D fallback
          </button>
        </div>
      </div>

      <div className="relative min-h-[680px] overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950/70">
        <Canvas camera={{ position: [8, 6, 10], fov: 42 }} shadows dpr={[1, 2]}>
          <ARScene asset={asset} progress={routeProgress} />
        </Canvas>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.12)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />

        <div className="absolute left-6 top-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-300">
          {arSupported ? 'AR ready' : 'Interactive 3D fallback'}
        </div>

        <div className="absolute left-6 top-20 w-64 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <span>Route progress</span>
            <span>{Math.round(routeProgress)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={routeProgress}
            onChange={(event) => setRouteProgress(Number(event.target.value))}
            className="mt-3 h-2 w-full cursor-pointer accent-cyan-400"
            aria-label="Route progress"
          />
          <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-300">
            <span>Speed</span>
            <span>29 km/h</span>
          </div>
        </div>

        <div className="absolute left-6 top-1/2 flex -translate-y-1/2 flex-col gap-3 text-sm text-slate-200">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">{asset.physicalState.quantity} units</div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">{asset.financialState.formattedValue}</div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">Risk: {asset.riskAssessment.riskLevel}</div>
        </div>

        <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col gap-3 text-sm text-slate-200">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">Financed: {asset.financialState.formattedFinancing}</div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">Available: {asset.financialState.formattedCapacity}</div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">Verified: ✓</div>
        </div>
      </div>
    </div>
  )
}
