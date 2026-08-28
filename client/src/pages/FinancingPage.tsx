import { useEffect, useState } from 'react'
import { attemptFinancing, fetchAssets } from '../services/api'
import type { Asset } from '../types'
import ARSceneFrame from '../components/ARSceneFrame'

const instruments = ['Purchase Order Financing', 'Inventory Financing', 'In-Transit Financing', 'Invoice Financing', 'Receivables Financing']

export default function FinancingPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [provider, setProvider] = useState('NorthBridge Capital')
  const [instrument, setInstrument] = useState('Purchase Order Financing')
  const [requestedAmount, setRequestedAmount] = useState('2500000')
  const [result, setResult] = useState<{ allowed: boolean; status: string; reason: string; remainingCapacity: number; suggestedAction: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAssets()
        setAssets(data)
        if (data[0]) {
          setSelectedAssetId(data[0].assetId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load financing state.')
      }
    }
    void load()
  }, [])

  const handleSubmit = async () => {
    if (!selectedAssetId) return
    try {
      const outcome = await attemptFinancing(selectedAssetId, provider, Number(requestedAmount), instrument)
      setResult({
        allowed: outcome.allowed,
        status: outcome.status,
        reason: outcome.reason,
        remainingCapacity: outcome.remainingCapacity,
        suggestedAction: outcome.suggestedAction,
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Financing request failed.')
    }
  }

  return (
    <ARSceneFrame title="Financing transitions" subtitle="Money follows asset" accent={selectedAssetId || 'AS-1042'}>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            {assets.map((asset) => <option key={asset.id} value={asset.assetId}>{asset.assetId} · {asset.productName}</option>)}
          </select>
          <input value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" placeholder="Provider name" />
          <select value={instrument} onChange={(e) => setInstrument(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            {instruments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" placeholder="Requested amount" />
        </div>

        <button type="button" onClick={handleSubmit} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Submit financing request</button>

        {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

        {result && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-100">Decision</div>
              <span className={`rounded-full border px-2 py-1 text-[10px] uppercase ${result.allowed ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-rose-500/30 bg-rose-500/15 text-rose-300'}`}>
                {result.status}
              </span>
            </div>
            <div className="text-sm text-slate-300">{result.reason}</div>
            <div className="mt-3 text-xs text-slate-400">Remaining capacity: ₹{result.remainingCapacity.toLocaleString('en-IN')}</div>
            <div className="mt-1 text-xs text-slate-400">Suggested action: {result.suggestedAction}</div>
          </div>
        )}
      </div>
    </ARSceneFrame>
  )
}
