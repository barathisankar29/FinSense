import type { Asset } from '../types'
import { latLngToLocal, localToThree } from './CoordinateSystem'

export type SpatialAsset = {
  asset: Asset
  world: { x: number; y: number; z: number }
  riskColor: string
  isSelected: boolean
}

export function resolveAssetSpatialState(assets: Asset[], selectedId?: string | null) {
  const origin = { lat: 13.0827, lng: 80.2707, alt: 0 }

  return assets.map((asset) => {
    const point = { lat: asset.physicalState.lat, lng: asset.physicalState.lng, alt: asset.physicalState.verificationConfidence }
    const local = latLngToLocal(origin, point)
    const world = localToThree(local)

    const riskColor = {
      LOW: '#34d399',
      MEDIUM: '#fbbf24',
      HIGH: '#f97316',
      CRITICAL: '#f87171',
    }[asset.riskAssessment.riskLevel] ?? '#94a3b8'

    return {
      asset,
      world,
      riskColor,
      isSelected: selectedId ? asset.assetId === selectedId : false,
    } satisfies SpatialAsset
  })
}
