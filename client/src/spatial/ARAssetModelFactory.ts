import type { Asset } from '../types'

export type ARModelType =
  | 'laptop-pallet'
  | 'smartphone-carton'
  | 'container'
  | 'vehicle'
  | 'machinery'
  | 'generic'

export interface ARAssetModelSpec {
  type: ARModelType
  label: string
  color: string
  accent: string
  scale: number
  dimensions: {
    x: number
    y: number
    z: number
  }
}

export function getARModel(asset: Asset): ARAssetModelSpec {
  const text = `${asset.productName} ${asset.category}`.toLowerCase()

  if (text.includes('laptop') || text.includes('notebook') || text.includes('device')) {
    return {
      type: 'laptop-pallet',
      label: 'Enterprise laptop pallet',
      color: '#7dd3fc',
      accent: '#22d3ee',
      scale: 1,
      dimensions: { x: 1.5, y: 0.9, z: 1.5 },
    }
  }

  if (text.includes('smartphone') || text.includes('phone') || text.includes('mobile')) {
    return {
      type: 'smartphone-carton',
      label: 'Smartphone carton stack',
      color: '#a78bfa',
      accent: '#8b5cf6',
      scale: 1,
      dimensions: { x: 1.2, y: 1, z: 1.2 },
    }
  }

  if (text.includes('container') || text.includes('shipping') || text.includes('inventory')) {
    return {
      type: 'container',
      label: 'Shipping container',
      color: '#fbbf24',
      accent: '#f59e0b',
      scale: 1,
      dimensions: { x: 2.1, y: 1.2, z: 1.2 },
    }
  }

  if (text.includes('vehicle') || text.includes('truck') || text.includes('trailer')) {
    return {
      type: 'vehicle',
      label: 'Vehicle unit',
      color: '#34d399',
      accent: '#10b981',
      scale: 1,
      dimensions: { x: 2.2, y: 1.1, z: 1.4 },
    }
  }

  if (text.includes('machinery') || text.includes('equipment') || text.includes('industrial') || text.includes('cnc')) {
    return {
      type: 'machinery',
      label: 'Industrial machinery',
      color: '#fca5a5',
      accent: '#ef4444',
      scale: 1,
      dimensions: { x: 1.8, y: 1.2, z: 1.4 },
    }
  }

  return {
    type: 'generic',
    label: 'Portfolio asset',
    color: '#67e8f9',
    accent: '#22d3ee',
    scale: 1,
    dimensions: { x: 1.4, y: 1.1, z: 1.4 },
  }
}
