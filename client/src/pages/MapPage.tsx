import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { fetchAssets } from '../services/api'
import type { Asset } from '../types'

const riskColorMap: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
}

function createMarkerIcon(color: string) {
  return L.divIcon({
    className: 'marker-pin',
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #f8fafc;box-shadow:0 0 0 4px rgba(15,23,42,0.8);"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export default function MapPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAssets()
        setAssets(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load asset map.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const center = useMemo(() => {
    const base = assets[0]
    if (!base) return [19.076, 72.8777] as [number, number]
    return [base.physicalState.lat, base.physicalState.lng] as [number, number]
  }, [assets])

  if (loading) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Loading map…</div>
  if (error) return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">{error}</div>

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 text-lg font-semibold text-slate-100">Portfolio map</div>
        <div className="h-[560px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <MapContainer center={center} zoom={5} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {assets.map((asset) => (
              <Marker
                key={asset.id}
                position={[asset.physicalState.lat, asset.physicalState.lng]}
                icon={createMarkerIcon(riskColorMap[asset.riskAssessment.riskLevel] ?? '#94a3b8')}
              >
                <Popup>
                  <div className="space-y-1 text-sm text-slate-700">
                    <div className="font-semibold">{asset.assetId}</div>
                    <div>{asset.productName}</div>
                    <div>{asset.physicalState.location}</div>
                    <div>{asset.riskAssessment.riskLevel} risk</div>
                    <div>{asset.financialState.formattedValue}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
