export function AssetPopup({
  title,
  subtitle,
  rows,
}: {
  title: string
  subtitle?: string
  rows: Array<[string, string]>
}) {
  return (
    <div className="min-w-[240px] space-y-2 rounded-2xl border border-slate-700 bg-slate-950/95 p-3 text-slate-100 shadow-[0_0_30px_rgba(15,23,42,0.5)]">
      <div className="border-b border-slate-800 pb-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{title}</div>
        {subtitle && <div className="mt-1 text-xs text-slate-300">{subtitle}</div>}
      </div>
      <div className="space-y-2 text-xs text-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-slate-400">{label}</span>
            <span className="font-medium text-slate-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
