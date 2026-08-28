type SpatialControlsProps = {
  viewMode: '2D' | '3D' | 'AR'
  playing: boolean
  followTruck: boolean
  onViewModeChange: (mode: '2D' | '3D' | 'AR') => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onFollow: () => void
}

export function SpatialControls({
  viewMode,
  playing,
  followTruck,
  onViewModeChange,
  onPlay,
  onPause,
  onReset,
  onFollow,
}: SpatialControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-950/85 p-1 shadow-[0_0_30px_rgba(14,116,144,0.18)] backdrop-blur-sm">
        {(['2D', '3D', 'AR'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`rounded-xl px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] transition ${
              viewMode === mode
                ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/85 p-2 shadow-[0_0_30px_rgba(15,23,42,0.38)] backdrop-blur-sm">
        <button
          type="button"
          onClick={onPlay}
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-emerald-200"
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={onPause}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-200"
        >
          ⏸ Pause
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-200"
        >
          ↻ Reset
        </button>
        <button
          type="button"
          onClick={onFollow}
          className={`rounded-xl border px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${
            followTruck ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-200'
          }`}
        >
          {playing ? '🚚 Follow' : '🚚 Follow'}
        </button>
      </div>
    </div>
  )
}
