import { Vector3 } from 'three'

export const LOGISTICS_ROUTE_POINTS = [
  new Vector3(-72, 0.6, 46),
  new Vector3(-54, 1, 36),
  new Vector3(-30, 1.2, 22),
  new Vector3(-8, 1.4, 8),
  new Vector3(12, 1.3, 0),
  new Vector3(16, 0.6, 8),
  new Vector3(32, 1.1, -10),
  new Vector3(52, 1.2, -28),
  new Vector3(64, 1.1, -40),
  new Vector3(76, 0.8, -54),
]

export const LOGISTICS_ROUTE_2D = [
  [13.0827, 80.2707],
  [13.0889, 80.2764],
  [13.0912, 80.2822],
  [13.0978, 80.2849],
  [13.1015, 80.2871],
  [13.1062, 80.2913],
  [13.1107, 80.2965],
  [13.1161, 80.3012],
  [13.1204, 80.3058],
  [13.1234, 80.3091],
] as const

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getRouteProgressPosition(progress: number) {
  const t = clamp(progress, 0, 1)
  const points = LOGISTICS_ROUTE_POINTS
  const scaled = t * (points.length - 1)
  const index = Math.min(Math.floor(scaled), points.length - 2)
  const localT = scaled - index
  return new Vector3().lerpVectors(points[index], points[index + 1], localT)
}

export function getRouteStatusLabel(progress: number) {
  if (progress < 0.06) return 'READY TO DEPART'
  if (progress < 0.85) return 'IN TRANSIT'
  if (progress < 0.995) return 'STOPPING'
  return 'ARRIVED'
}
