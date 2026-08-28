import type { ReactNode } from 'react'

interface ARSceneFrameProps {
  title: string
  subtitle?: string
  accent?: string
  children: ReactNode
  className?: string
  arSupported?: boolean
  arActive?: boolean
  trackingConnected?: boolean
  simulationActive?: boolean
}

export default function ARSceneFrame({
  title,
  subtitle,
  accent = 'AS-1042',
  children,
  className = '',
  arSupported = false,
  arActive = false,
  trackingConnected = true,
  simulationActive = false,
}: ARSceneFrameProps) {
  const stateLabel = arActive ? 'AR ACTIVE' : arSupported ? 'AR SUPPORTED' : 'AR UNAVAILABLE'
  const trackLabel = trackingConnected ? 'LIVE TRACKING' : 'OFFLINE'
  const simLabel = simulationActive ? 'SIMULATION' : 'STANDBY'

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-cyan-500/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_30%),linear-gradient(180deg,#020817,#0f172a)] p-4 shadow-[0_25px_60px_rgba(14,165,233,0.12)] ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:22px_22px] opacity-30" />

      <div className="relative rounded-[24px] border border-slate-800 bg-slate-950/65 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-cyan-300">
              {stateLabel}
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-200">
              {accent}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${trackingConnected ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.8)]'}`} />
            <span className={`text-xs uppercase tracking-[0.2em] ${trackingConnected ? 'text-emerald-300' : 'text-amber-300'}`}>{trackLabel}</span>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{subtitle || 'Digital twin overlay'}</div>
            <div className="mt-1 text-xl font-semibold text-white">{title}</div>
          </div>
          <div className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">{simLabel}</div>
        </div>

        {children}
      </div>
    </div>
  )
}
