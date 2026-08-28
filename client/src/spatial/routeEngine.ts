import type { SpatialJourneyState } from './spatialTypes'
import { LOGISTICS_ROUTE_COORDINATES } from './spatialData'

export function interpolateRouteCoordinates(
  points: Array<[number, number]>,
  progress: number,
): [number, number] {
  const clamped = Math.min(Math.max(progress, 0), 1)

  if (points.length < 2) {
    return points[0] ?? [0, 0]
  }

  const scaled = clamped * (points.length - 1)
  const index = Math.min(Math.floor(scaled), points.length - 2)
  const localT = scaled - index
  const start = points[index]
  const end = points[index + 1]

  const lat = start[0] + (end[0] - start[0]) * localT
  const lng = start[1] + (end[1] - start[1]) * localT

  return [lat, lng]
}

export function getRouteProgressPosition(progress: number): [number, number] {
  return interpolateRouteCoordinates(LOGISTICS_ROUTE_COORDINATES, progress)
}

export function getJourneyState(progress: number): SpatialJourneyState {
  if (progress <= 0.04) return 'BEFORE_START'
  if (progress < 0.85) return 'ONGOING'
  if (progress < 0.995) return 'STOPPING'
  return 'FINAL_ARRIVED'
}

export function getVehicleSpeed(
  state: string,
  multiplier = 1,
  progress = 0,
): number {
  if (state === 'BEFORE_START' || state === 'FINAL_ARRIVED') return 0
  if (state === 'ONGOING') return 26 * multiplier

  const stoppingFactor = 1 - (progress - 0.85) / 0.145
  return Math.max(0, 10 * stoppingFactor * multiplier)
}

export function getRouteStatusColor(status: 'NORMAL' | 'ACTIVE' | 'CRITICAL' | 'COMPLETED') {
  if (status === 'CRITICAL') return '#ef4444'
  if (status === 'ACTIVE') return '#22d3ee'
  if (status === 'COMPLETED') return '#34d399'
  return '#94a3b8'
}

export function getSpatialRoutePolylineProgress(progress: number) {
  const segmentLength = LOGISTICS_ROUTE_COORDINATES.length - 1
  const scaled = Math.min(Math.max(progress, 0), 1) * segmentLength
  const index = Math.floor(scaled)
  const localT = scaled - index
  const start = LOGISTICS_ROUTE_COORDINATES[index]
  const end = LOGISTICS_ROUTE_COORDINATES[Math.min(index + 1, LOGISTICS_ROUTE_COORDINATES.length - 1)]

  return {
    start,
    end,
    localT,
  }
}
