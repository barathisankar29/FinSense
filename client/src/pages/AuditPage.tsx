import { useEffect, useState } from 'react'
import { fetchAuditTrail } from '../services/api'
import type { AuditEntry } from '../types'

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    const load = async () => {
      const data = await fetchAuditTrail()
      setEntries(data)
    }
    void load()
  }, [])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="mb-4 text-lg font-semibold text-slate-100">Audit trail</div>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={`${entry.assetId}-${entry.time}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-100">{entry.event}</div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">{entry.confidence}% confidence</span>
            </div>
            <div className="mt-2 text-sm text-slate-300">{entry.description}</div>
            <div className="mt-3 text-xs text-slate-500">{entry.assetId} · {entry.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
