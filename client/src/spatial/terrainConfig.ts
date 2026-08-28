export const terrainConfig = {
  base: {
    center: [13.1017, 80.2925],
    zoom: 11,
    minZoom: 8,
    maxZoom: 15,
  },
  routeColors: {
    base: '#60a5fa',
    glow: '#22d3ee',
    active: '#fbbf24',
    critical: '#ef4444',
    complete: '#34d399',
  },
  markers: {
    port: '#22d3ee',
    factory: '#a78bfa',
    warehouse: '#f59e0b',
    transit: '#f97316',
  },
} as const
