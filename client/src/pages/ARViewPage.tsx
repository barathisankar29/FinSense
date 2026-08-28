import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { fetchAssets } from '../services/api'
import type { Asset } from '../types'
import { detectARSupport, requestARSession } from '../spatial/ARManager'
import { LogisticsWorld } from '../spatial/LogisticsWorld'

export default function ARViewPage() {
  const [asset, setAsset] = useState<Asset | null>(null)
  const [launching, setLaunching] = useState(false)
  const [arSupported, setArSupported] = useState<boolean>(false)
  const [routeProgress, setRouteProgress] = useState(0.42)

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
      setRouteProgress((previous) => (previous >= 1 ? 0 : previous + 0.01))
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
            {launching ? 'Launching…' : arSupported ? 'Launch AR' : 'AR available'}
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
        <Canvas camera={{ position: [34, 26, 34], fov: 42 }} shadows dpr={[1, 2]}>
          <LogisticsWorld
            progress={routeProgress}
            highlightTruck
            label={asset.assetId}
            riskLevel={asset.riskAssessment.riskLevel}
            followCamera
          />
        </Canvas>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.12)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />

        <div className="absolute left-6 top-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-300">
          {arSupported ? 'AR ready' : 'Interactive 3D fallback'}
        </div>

        <div className="absolute left-6 top-20 w-64 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <span>Route progress</span>
            <span>{Math.round(routeProgress * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
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
