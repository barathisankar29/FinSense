import { useEffect, useState } from 'react'
import { acknowledgeAlert, fetchAlerts, resolveAlert } from '../services/api'
import type { AlertItem } from '../types'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await fetchAlerts()
      setAlerts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId)
    await load()
  }

  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId)
    await load()
  }

  if (loading) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading alerts…</div>

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-semibold text-slate-100">{alert.title}</div>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">{alert.status}</span>
          </div>
          <div className="mt-2 text-sm text-slate-300">{alert.message}</div>
          <div className="mt-3 text-xs text-slate-500">{alert.assetId} · {alert.timestamp}</div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => void handleAcknowledge(alert.id)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">Acknowledge</button>
            <button type="button" onClick={() => void handleResolve(alert.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white">Resolve</button>
          </div>
        </div>
      ))}
    </div>
  )
}
