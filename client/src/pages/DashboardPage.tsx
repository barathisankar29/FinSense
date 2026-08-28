import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, AlertTriangle, ArrowUpRight, Coins, ShieldAlert, Truck, Warehouse, Route, GaugeCircle } from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { fetchDashboard, fetchAssets, fetchAlerts } from '../services/api'
import type { AlertItem, Asset, DashboardMetrics } from '../types'
import ARSceneFrame from '../components/ARSceneFrame'

const riskColors: Record<string, string> = {
  LOW: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  CRITICAL: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [dashboard, assetList, alertList] = await Promise.all([
          fetchDashboard(),
          fetchAssets(),
          fetchAlerts(),
        ])
        setMetrics(dashboard)
        setAssets(assetList)
        setAlerts(alertList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading dashboard…</div>
  if (error) return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">{error}</div>
  if (!metrics) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">No dashboard data available.</div>

  const kpis = [
    { label: 'Live Assets', value: metrics.totalAssets, trend: '+6.1%', icon: Warehouse },
    { label: 'Asset Exposure', value: metrics.formattedTotalValue, trend: '+5.4%', icon: Coins },
    { label: 'Financing Active', value: metrics.formattedActiveFinancing, trend: '+2.8%', icon: ShieldAlert },
    { label: 'Cash Realised', value: metrics.formattedAvailableCapacity, trend: '+9.3%', icon: Activity },
    { label: 'At-Risk Assets', value: metrics.atRiskAssetsCount, trend: '-2.1%', icon: AlertTriangle },
  ]

  const stageCounts = Object.entries(metrics.stageCounts)
  const recent = assets.slice(0, 4)
  const topAsset = recent[0]

  function DashboardTerrainPreview() {
    const previewAssets = useMemo(() => assets.slice(0, 4), [assets])
    const routePoints = useMemo(
      () => [
        new THREE.Vector3(-6.5, 0.35, -4.5),
        new THREE.Vector3(-4.4, 0.55, -3.2),
        new THREE.Vector3(-1.4, 0.72, -1.2),
        new THREE.Vector3(1.3, 0.82, 0.6),
        new THREE.Vector3(4.7, 0.88, 2.5),
        new THREE.Vector3(7.4, 0.74, 4.6),
      ],
      []
    )

    function RouteCargo({ route, color, offset = 0 }: { route: THREE.Vector3[]; color: string; offset?: number }) {
      const groupRef = useRef<THREE.Group | null>(null)
      const curve = useMemo(() => new THREE.CatmullRomCurve3(route, false, 'catmullrom', 0.2), [route])

      useFrame((state) => {
        if (!groupRef.current) return
        const progress = (state.clock.getElapsedTime() * 0.08 + offset) % 1
        const point = curve.getPointAt(progress)
        const tangent = curve.getTangentAt(progress).normalize()

        groupRef.current.position.set(point.x, point.y + 0.28, point.z)
        groupRef.current.rotation.y = Math.atan2(tangent.x, tangent.z)
      })

      return (
        <group ref={groupRef}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.46, 1.8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
          </mesh>
        </group>
      )
    }

    function CommandCenterScene() {
      const routeColor = '#67e8f9'
      const riskZones = [
        { position: new THREE.Vector3(-1.6, 0.3, -0.9), radius: 1.5, color: '#f59e0b', label: 'WATCH' },
        { position: new THREE.Vector3(3.4, 0.3, 2.2), radius: 1.8, color: '#f87171', label: 'CRITICAL' },
      ]

      return (
        <>
          <color attach="background" args={['#020817']} />
          <fog attach="fog" args={['#020817', 12, 26]} />
          <ambientLight intensity={1.15} />
          <directionalLight position={[10, 12, 9]} intensity={2.1} color="#dbeafe" />
          <pointLight position={[-5, 5, 0]} intensity={1.5} color="#67e8f9" />

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.75}
            autoRotate={false}
            minDistance={8}
            maxDistance={18}
            target={[0, 0.9, 0]}
          />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]} receiveShadow>
            <circleGeometry args={[9.5, 96]} />
            <meshStandardMaterial color="#0b1220" roughness={0.96} metalness={0.08} />
          </mesh>

          <group position={[-6.2, 1.2, -4.4]}>
            <mesh castShadow>
              <boxGeometry args={[3.2, 2.2, 3.2]} />
              <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.7} />
            </mesh>
            <Html position={[0, 2.6, 0]} center>
              <div className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-slate-200">PORT</div>
            </Html>
          </group>

          <group position={[6.8, 1.2, 4.4]}>
            <mesh castShadow>
              <boxGeometry args={[3.8, 2.4, 3.5]} />
              <meshStandardMaterial color="#111827" metalness={0.15} roughness={0.8} />
            </mesh>
            <Html position={[0, 2.7, 0]} center>
              <div className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-slate-200">WAREHOUSE</div>
            </Html>
          </group>

          <group position={[0.8, 0.8, 0.2]}>
            <mesh castShadow>
              <boxGeometry args={[3.6, 1.6, 2.8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.18} roughness={0.72} />
            </mesh>
            <Html position={[0, 2.1, 0]} center>
              <div className="rounded-full border border-slate-600 bg-slate-950/80 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-slate-200">FACTORY</div>
            </Html>
          </group>

          {riskZones.map((zone) => (
            <group key={zone.label} position={zone.position}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[zone.radius * 0.6, zone.radius, 40]} />
                <meshBasicMaterial color={zone.color} transparent opacity={0.3} side={THREE.DoubleSide} />
              </mesh>
              <Html position={[0, 1.5, 0]} center>
                <div className="rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-slate-100">{zone.label}</div>
              </Html>
            </group>
          ))}

          <Line points={routePoints} color={routeColor} lineWidth={2.5} dashed dashSize={0.3} gapSize={0.2} />

          {routePoints.map((point, index) => (
            <group key={`${point.x}-${point.z}-${index}`} position={point}>
              <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial color={index === 0 ? '#34d399' : index === routePoints.length - 1 ? '#fbbf24' : '#67e8f9'} emissive={index === 0 ? '#34d399' : '#67e8f9'} emissiveIntensity={0.8} />
              </mesh>
            </group>
          ))}

          <RouteCargo route={routePoints} color="#34d399" offset={0} />
          <RouteCargo route={routePoints} color="#fbbf24" offset={0.28} />
          <RouteCargo route={routePoints} color="#f97316" offset={0.58} />

          <Html position={[0, 4.1, 0]} center>
            <div className="rounded-full border border-cyan-500/50 bg-slate-950/85 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.25)]">
              {previewAssets[0]?.assetId ?? 'AS-1042'}
            </div>
          </Html>
        </>
      )
    }

    return (
      <div className="command-center-panel rounded-[30px] border border-slate-800 bg-slate-950/90 p-4 shadow-[0_25px_70px_rgba(2,6,23,0.42)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300">LIVE 3D DIGITAL TWIN</div>
            <div className="mt-1 text-xl font-semibold text-white">Chennai logistics corridor</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            LIVE
          </div>
        </div>

        <div className="relative h-[320px] overflow-hidden rounded-[24px] border border-slate-800 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,#020817,#0f172a)]">
          <Canvas camera={{ position: [9, 7, 11], fov: 40 }}>
            <CommandCenterScene />
          </Canvas>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Route</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-100"><Route className="h-4 w-4 text-cyan-300" /> {topAsset ? `${topAsset.assetId} → ${topAsset.physicalState.destination}` : 'Port → Warehouse'}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Mode</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-100"><Truck className="h-4 w-4 text-cyan-300" /> In transit</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Speed</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-100"><GaugeCircle className="h-4 w-4 text-cyan-300" /> {topAsset ? `${Math.round(topAsset.riskAssessment.delayProbabilityPct * 0.7 + 18)} km/h` : '32 km/h'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <DashboardTerrainPreview />

        <div className="space-y-4">
          <ARSceneFrame title="Operational overview" subtitle="Portfolio status" accent="SITE-01">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Site exposure</div>
                <div className="mt-1 text-xl font-semibold text-white">{metrics.formattedTotalValue}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Financing shield</div>
                <div className="mt-1 text-xl font-semibold text-white">{metrics.formattedAvailableCapacity}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Asset health</div>
                <div className="mt-1 text-xl font-semibold text-emerald-300">93.4%</div>
              </div>
            </div>
          </ARSceneFrame>

          <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">Key signal</div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
              <div>
                <div className="text-sm font-medium text-cyan-100">{topAsset?.assetId ?? 'AS-1042'}</div>
                <div className="text-xs text-cyan-200/80">{topAsset?.productName ?? 'Auto component shipment'}</div>
              </div>
              <div className="rounded-full border border-cyan-400/40 bg-slate-950 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                {topAsset?.riskAssessment.riskLevel ?? 'HIGH'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map(({ label, value, trend, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-[0_20px_40px_rgba(2,6,23,0.35)]">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm text-slate-400">{label}</span>
              <div className="rounded-lg bg-slate-800 p-2 text-cyan-300"><Icon className="h-4 w-4" /></div>
            </div>
            <div className="text-2xl font-semibold text-white">{value}</div>
            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="h-3.5 w-3.5" /> {trend}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 text-lg font-semibold text-slate-100">Lifecycle pipeline</div>
          <div className="grid gap-3">
            {stageCounts.map(([stage, count]) => (
              <div key={stage}>
                <div className="mb-1 flex justify-between text-sm text-slate-300"><span>{stage.replace('_', ' ')}</span><span>{count}</span></div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.min((count / Math.max(1, assets.length)) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <ARSceneFrame title="Risk distribution" subtitle="Exposure watch" accent="RISK-01">
          <div className="space-y-3">
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => {
              const count = assets.filter((asset) => asset.riskAssessment.riskLevel === level).length
              return (
                <div key={level} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                  <span className={`rounded-full border px-2 py-1 text-xs ${riskColors[level]}`}>{level}</span>
                  <span className="text-sm text-slate-300">{count}</span>
                </div>
              )
            })}
          </div>
        </ARSceneFrame>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 text-lg font-semibold text-slate-100">Recent activity</div>
          <div className="space-y-3">
            {recent.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-none last:pb-0">
                <div>
                  <div className="text-sm font-medium text-slate-100">{asset.assetId}</div>
                  <div className="text-xs text-slate-400">{asset.productName}</div>
                </div>
                <div className={`rounded-full border px-2 py-1 text-[10px] ${riskColors[asset.riskAssessment.riskLevel]}`}>{asset.riskAssessment.riskLevel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 text-lg font-semibold text-slate-100">Critical alerts</div>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">{alert.title}</span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${riskColors[alert.severity === 'CRITICAL' ? 'CRITICAL' : alert.severity === 'HIGH' ? 'HIGH' : 'MEDIUM']}`}>{alert.severity}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
