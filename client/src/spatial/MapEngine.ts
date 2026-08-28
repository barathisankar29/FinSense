import type { Asset } from '../types'
import { latLngToLocal, localToThree } from './CoordinateSystem'

export type MapMode = '2D' | '3D' | 'TERRAIN' | 'AR' | 'LIVE' | 'SIMULATION'

export function buildMapAssetMarkers(assets: Asset[]) {
  const origin = { lat: 13.0827, lng: 80.2707, alt: 0 }

  return assets.map((asset) => {
    const local = latLngToLocal(origin, { lat: asset.physicalState.lat, lng: asset.physicalState.lng, alt: asset.physicalState.verificationConfidence })
    return {
      assetId: asset.assetId,
      position: [asset.physicalState.lat, asset.physicalState.lng] as [number, number],
      world: localToThree(local),
      risk: asset.riskAssessment.riskLevel,
      label: asset.productName,
    }
  })
}

export function getMapModeOptions(): Array<{ id: MapMode; label: string }> {
  return [
    { id: '2D', label: '2D' },
    { id: '3D', label: '3D' },
    { id: 'TERRAIN', label: 'Terrain' },
    { id: 'AR', label: 'AR' },
    { id: 'LIVE', label: 'Live' },
    { id: 'SIMULATION', label: 'Simulation' },
  ]
}
