import { useEffect, useMemo, useState } from 'react'
import { Search, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchAssets } from '../services/api'
import type { Asset } from '../types'
import ARSceneFrame from '../components/ARSceneFrame'
import { detectARSupport, requestARSession } from '../spatial/ARManager'
import { AssetARModel } from './AssetDetailPage'

const lifecycleOptions = ['PO_CREATED', 'RAW_MATERIAL', 'PRODUCTION', 'FINISHED_GOODS', 'SHIPPED', 'DELIVERED', 'CASH_REALISED']

export default function AssetListPage() {
  const navigate = useNavigate()
  const [assets, setAssets] = useState<Asset[]>([])
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [stageFilter, setStageFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [portfolioArOpen, setPortfolioArOpen] = useState(true)
  const [portfolioSceneMode, setPortfolioSceneMode] = useState<'ar' | '3d'>('3d')
  const [arUnavailableMessage, setArUnavailableMessage] = useState<string | null>(null)

  const safeAssets = Array.isArray(assets) ? assets : []

  useEffect(() => {
    if (!safeAssets.length) {
      setSelectedAssetId(null)
      return
    }

    if (!selectedAssetId || !safeAssets.some((asset) => asset.assetId === selectedAssetId)) {
      setSelectedAssetId(safeAssets[0].assetId)
    }
  }, [safeAssets, selectedAssetId])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAssets({ search: query || undefined, risk: riskFilter === 'ALL' ? undefined : riskFilter, stage: stageFilter === 'ALL' ? undefined : stageFilter })
        setAssets(Array.isArray(data) ? data : [])
      } catch (err) {
        setAssets([])
        setError(err instanceof Error ? err.message : 'Unable to load assets.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [query, riskFilter, stageFilter])

  const rows = useMemo(() => {
    const list = [...safeAssets]
    return list.sort((a, b) => a.assetId.localeCompare(b.assetId))
  }, [safeAssets])

  const selectedAsset = rows.find((asset) => asset.assetId === selectedAssetId) ?? rows[0] ?? null

  const handleViewInAR = async () => {
    if (!selectedAsset) return

    setPortfolioSceneMode('ar')
    setPortfolioArOpen(true)
    setArUnavailableMessage(null)

    const state = await detectARSupport()
    if (!state.supported) {
      setArUnavailableMessage(null)
      return
    }

    const ok = await requestARSession()
    if (!ok) {
      setArUnavailableMessage(null)
      return
    }
  }

  const handleOpenAssetInPortfolio = (assetId: string) => {
    setSelectedAssetId(assetId)
    setPortfolioSceneMode('3d')
    setPortfolioArOpen(true)
    setArUnavailableMessage(null)
  }

  if (loading) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading assets…</div>
  if (error) return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">{error}</div>
  if (!rows.length) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">No assets found for the current filters.</div>

  return (
    <div className="space-y-5">
      <ARSceneFrame title="Asset command layer" subtitle="AR inventory map" accent="AS-1042">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-200" placeholder="Search assets" />
          </div>
          <div className="flex gap-2">
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              <option value="ALL">All risk</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              <option value="ALL">All stages</option>
              {lifecycleOptions.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"><Download className="h-4 w-4" /> Export</button>
          </div>
        </div>
      </ARSceneFrame>

      {selectedAsset && (
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-4 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300">AR asset intelligence</div>
              <div className="mt-1 text-2xl font-semibold text-white">{selectedAsset.assetId} · {selectedAsset.productName}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleViewInAR} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">VIEW IN AR</button>
              <button type="button" onClick={() => navigate('/map')} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200">LIVE TRACK</button>
              <button type="button" onClick={() => navigate(`/simulation?asset=${selectedAsset.assetId}`)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200">SIMULATE</button>
            </div>
          </div>

          {arUnavailableMessage ? (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              {arUnavailableMessage}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setPortfolioArOpen(true)} className="rounded-xl border border-amber-300/50 bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-200">OPEN 3D VIEW</button>
              </div>
            </div>
          ) : null}

          {portfolioArOpen && (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <AssetARModel asset={selectedAsset} mode={portfolioSceneMode} />

              <div className="rounded-[24px] border border-slate-800 bg-slate-950/90 p-4">
                <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-cyan-300">ASSET OVERLAY</div>
                <div className="mb-4 text-xl font-semibold text-white">{selectedAsset.assetId}</div>
                <div className="mb-4 text-sm text-slate-300">{selectedAsset.productName}</div>

                <div className="space-y-2">
                  {[
                    { label: 'ASSET VALUE', value: selectedAsset.financialState.formattedValue },
                    { label: 'FINANCED', value: selectedAsset.financialState.formattedFinancing },
                    { label: 'OUTSTANDING', value: selectedAsset.financialState.formattedFinancing },
                    { label: 'RISK', value: selectedAsset.riskAssessment.riskLevel },
                    { label: 'STATUS', value: selectedAsset.physicalState.stage },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs uppercase tracking-[0.14em] text-slate-300">
                      <span>{row.label}</span>
                      <span className="text-right text-[11px] font-medium normal-case tracking-normal text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((asset) => {
              const isSelected = asset.assetId === selectedAssetId

              return (
                <tr
                  key={asset.id}
                  onClick={() => handleOpenAssetInPortfolio(asset.assetId)}
                  className={`cursor-pointer border-t border-slate-800 transition-colors hover:bg-slate-800/60 ${isSelected ? 'bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]' : ''}`}
                >
                  <td className={`px-4 py-3 font-medium ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>{asset.assetId}</td>
                  <td className="px-4 py-3 text-slate-200">{asset.productName}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.contractualState.buyer}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.physicalState.location}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.physicalState.stage}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] ${asset.riskAssessment.riskLevel === 'CRITICAL' ? 'border-rose-500/30 bg-rose-500/15 text-rose-300' : asset.riskAssessment.riskLevel === 'HIGH' ? 'border-orange-500/30 bg-orange-500/15 text-orange-300' : asset.riskAssessment.riskLevel === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/15 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'}`}>{asset.riskAssessment.riskLevel}</span></td>
                  <td className="px-4 py-3 text-slate-300">{asset.financingDecision.status}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.financialState.formattedFinancing}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
