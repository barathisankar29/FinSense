import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applySimulation, fetchAssets, simulateScenario } from '../services/api'
import type { Asset } from '../types'

export default function SimulationPage() {
  const [searchParams] = useSearchParams()
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [preset, setPreset] = useState('goods_damaged_10p')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const data = await fetchAssets()
      setAssets(data)
      const initialAssetId = searchParams.get('asset') ?? data[0]?.assetId ?? ''
      setSelectedAssetId(initialAssetId)
    }
    void load()
  }, [searchParams])

  const run = async () => {
    try {
      const sim = await simulateScenario(selectedAssetId, preset)
      setResult(sim)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed.')
    }
  }

  const apply = async () => {
    try {
      const sim = await applySimulation(selectedAssetId, preset)
      setResult(sim.result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apply simulation failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 text-lg font-semibold text-slate-100">Simulation</div>
        <div className="grid gap-4 md:grid-cols-3">
          <select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            {assets.map((asset) => <option key={asset.id} value={asset.assetId}>{asset.assetId}</option>)}
          </select>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            <option value="shipment_delay_7d">Shipment delay 7d</option>
            <option value="goods_damaged_10p">Goods damaged 10%</option>
            <option value="buyer_risk_increase">Buyer risk increase</option>
            <option value="invoice_delayed_15d">Invoice delayed 15d</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={() => void run()} className="flex-1 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Run</button>
            <button type="button" onClick={() => void apply()} className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-100">Apply</button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">{error}</div>}
      {result && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 text-lg font-semibold text-slate-100">Projected state</div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="text-xs uppercase text-slate-500">Projected value</div><div className="mt-2 text-xl text-white">{result.after.formattedValue}</div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="text-xs uppercase text-slate-500">Projected risk</div><div className="mt-2 text-xl text-white">{result.after.riskScore}</div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="text-xs uppercase text-slate-500">Projected capacity</div><div className="mt-2 text-xl text-white">{result.after.formattedCapacity}</div></div>
          </div>
          <div className="mt-4 text-sm text-slate-300">{result.explanation}</div>
        </div>
      )}
    </div>
  )
}
