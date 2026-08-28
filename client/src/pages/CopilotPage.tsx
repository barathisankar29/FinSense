import { useEffect, useState } from 'react'
import { chatWithCopilot, fetchAssets } from '../services/api'
import type { Asset } from '../types'

export default function CopilotPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [message, setMessage] = useState('Which assets are high risk?')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data = await fetchAssets()
      setAssets(data)
      if (data[0]) setSelectedAssetId(data[0].assetId)
    }
    void load()
  }, [])

  const handleAsk = async () => {
    setLoading(true)
    try {
      const data = await chatWithCopilot(message, selectedAssetId || undefined)
      setReply(data.reply)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 text-lg font-semibold text-slate-100">AI Copilot</div>
        <select value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)} className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
          {assets.map((asset) => <option key={asset.id} value={asset.assetId}>{asset.assetId}</option>)}
        </select>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="h-28 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200" />
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={handleAsk} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={loading}>{loading ? 'Thinking…' : 'Ask FinSense'}</button>
        </div>
      </div>

      {reply && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-slate-200">
          <div className="mb-2 text-sm uppercase tracking-[0.2em] text-cyan-300">Response</div>
          <div className="whitespace-pre-line">{reply}</div>
        </div>
      )}
    </div>
  )
}
