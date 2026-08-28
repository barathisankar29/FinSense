interface AROverlayProps {
  assetId: string
  title: string
  value: string
  risk: string
  financed: string
  available: string
  stage: string
  compact?: boolean
}

export default function AROverlay({ assetId, title, value, risk, financed, available, stage, compact = false }: AROverlayProps) {
  return (
    <div className={`pointer-events-none absolute inset-x-4 bottom-4 ${compact ? 'max-w-sm' : 'max-w-md'} rounded-2xl border border-cyan-400/30 bg-slate-950/80 p-4 shadow-[0_20px_50px_rgba(14,165,233,0.2)] backdrop-blur-md`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.26em] text-cyan-300">AR DIGITAL TWIN</div>
          <div className="mt-1 text-xl font-semibold text-white">{assetId}</div>
        </div>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">{stage}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Value</div>
          <div className="mt-1 font-medium text-white">{value}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Risk</div>
          <div className="mt-1 font-medium text-white">{risk}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Financed</div>
          <div className="mt-1 font-medium text-white">{financed}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Available</div>
          <div className="mt-1 font-medium text-white">{available}</div>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-800 pt-3 text-sm text-slate-200">{title}</div>
    </div>
  )
}
