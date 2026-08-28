import { useEffect, useState } from 'react'
import { fetchReconciliation, resolveReconciliation } from '../services/api'
import ARSceneFrame from '../components/ARSceneFrame'

export default function ReconciliationPage() {
  const [rows, setRows] = useState<any[]>([])

  const load = async () => {
    const data = await fetchReconciliation()
    setRows(data)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleResolve = async (assetId: string) => {
    await resolveReconciliation(assetId)
    await load()
  }

  return (
    <ARSceneFrame title="Truth layer" subtitle="Data reconciliation" accent="AS-1042">
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Field</th>
              <th className="px-4 py-3">ERP</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.assetId}-${row.field}-${index}`} className="border-t border-slate-800">
                <td className="px-4 py-3 text-slate-200">{row.assetId}</td>
                <td className="px-4 py-3 text-slate-300">{row.field}</td>
                <td className="px-4 py-3 text-slate-300">{row.valueA}</td>
                <td className="px-4 py-3 text-slate-300">{row.valueB}</td>
                <td className="px-4 py-3"><span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2 py-1 text-[10px] uppercase text-orange-300">{row.status}</span></td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => void handleResolve(row.assetId)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white">Resolve</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ARSceneFrame>
  )
}
