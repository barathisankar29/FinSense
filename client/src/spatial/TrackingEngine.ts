import type { Asset } from '../types'

export type TrackingSnapshot = {
  assetId: string
  latitude: number
  longitude: number
  altitude: number
  heading: number
  speed: number
  timestamp: string
  status: string
  live: boolean
}

export function createTrackingSnapshot(asset: Asset): TrackingSnapshot {
  return {
    assetId: asset.assetId,
    latitude: asset.physicalState.lat,
    longitude: asset.physicalState.lng,
    altitude: asset.physicalState.verificationConfidence,
    heading: Math.max(0, Math.min(360, (asset.financialState.currentValue % 360) || 90)),
    speed: Math.max(8, Math.min(60, asset.riskAssessment.delayProbabilityPct * 0.8 + 12)),
    timestamp: new Date().toISOString(),
    status: asset.physicalState.stage,
    live: true,
  }
}

export function getTelemetryStatus(asset: Asset): { label: string; deltaSeconds: number; online: boolean } {
  const recent = Date.parse(asset.events[0]?.timestamp ?? new Date().toISOString())
  const delta = Math.max(0, Math.abs(Date.now() - recent) / 1000)

  return {
    label: delta < 60 ? 'LIVE' : 'OFFLINE',
    deltaSeconds: delta,
    online: delta < 60,
  }
}
