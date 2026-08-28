export type TerrainProviderName = 'mapbox' | 'maptiler' | 'cesium' | 'local'

export interface TerrainProviderConfig {
  name: TerrainProviderName
  apiKey?: string
  styleUrl?: string
  label: string
  active: boolean
}

export class TerrainProvider {
  static fromEnv(env: Record<string, string | undefined>): TerrainProviderConfig {
    const provider = (env.VITE_TERRAIN_PROVIDER ?? 'local').toLowerCase() as TerrainProviderName
    const apiKey = env.VITE_TERRAIN_API_KEY ?? ''
    const styleUrl = env.VITE_MAP_STYLE_URL ?? 'https://demotiles.maplibre.org/style.json'

    if (provider === 'mapbox' && apiKey) {
      return { name: 'mapbox', apiKey, styleUrl, label: 'REAL TERRAIN', active: true }
    }
    if (provider === 'maptiler' && apiKey) {
      return { name: 'maptiler', apiKey, styleUrl, label: 'REAL TERRAIN', active: true }
    }
    if (provider === 'cesium' && apiKey) {
      return { name: 'cesium', apiKey, styleUrl, label: 'REAL TERRAIN', active: true }
    }

    return { name: 'local', apiKey: '', styleUrl, label: 'DEMO TERRAIN', active: false }
  }
}

export const terrainProviderConfig = TerrainProvider.fromEnv(import.meta.env)
