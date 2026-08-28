import { CatmullRomCurve3, Vector3 } from 'three'
import { LOGISTICS_ROUTE_POINTS } from './spatialUtils'

export type VehicleStatus = 'READY' | 'IN TRANSIT' | 'STOPPING' | 'ARRIVED'

export interface TruckMetrics {
  progress: number
  position: Vector3
  heading: number
  speed: number
  eta: string
  status: VehicleStatus
  route: string
}

const routeCurve = new CatmullRomCurve3(LOGISTICS_ROUTE_POINTS, false, 'catmullrom', 0.2)

export function getTruckMetrics(progress: number, multiplier = 1): TruckMetrics {
  const clamped = Math.min(Math.max(progress, 0), 1)
  const current = routeCurve.getPointAt(clamped)
  const next = routeCurve.getPointAt(Math.min(clamped + 0.01, 1))
  const direction = new Vector3().subVectors(next, current)
  const heading = direction.lengthSq() > 0 ? Math.atan2(direction.x, direction.z) : 0

  let speed = 0
  let status: VehicleStatus = 'READY'
  if (clamped <= 0.04) {
    speed = 0
    status = 'READY'
  } else if (clamped < 0.85) {
    speed = 26 * multiplier
    status = 'IN TRANSIT'
  } else if (clamped < 0.995) {
    speed = 10 * (1 - (clamped - 0.85) / 0.145) * multiplier
    status = 'STOPPING'
  } else {
    speed = 0
    status = 'ARRIVED'
  }

  const remainingMinutes = Math.max(0, (1 - clamped) * 270)
  const hours = Math.floor(remainingMinutes / 60)
  const minutes = Math.round(remainingMinutes % 60)
  const eta = `${hours}h ${minutes}m`

  return {
    progress: clamped,
    position: current,
    heading,
    speed,
    eta,
    status,
    route: 'Ahmedabad → Mumbai',
  }
}
