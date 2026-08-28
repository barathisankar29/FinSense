export type GeoPoint = {
  lat: number
  lng: number
  alt?: number
}

export type LocalPoint = {
  x: number
  y: number
  z: number
}

export const DEFAULT_SITE_ORIGIN: GeoPoint = {
  lat: 13.0827,
  lng: 80.2707,
  alt: 0,
}

const EARTH_RADIUS_METERS = 6371000

export function latLngToLocal(origin: GeoPoint, point: GeoPoint): LocalPoint {
  const latDelta = ((point.lat - origin.lat) * Math.PI) / 180
  const lngDelta = ((point.lng - origin.lng) * Math.PI) / 180

  const x = lngDelta * EARTH_RADIUS_METERS * Math.cos((origin.lat * Math.PI) / 180)
  const z = latDelta * EARTH_RADIUS_METERS
  const y = (point.alt ?? origin.alt ?? 0) - (origin.alt ?? 0)

  return { x, y, z }
}

export function localToThree(point: LocalPoint): { x: number; y: number; z: number } {
  return { x: point.x / 12, y: point.y / 6, z: point.z / 12 }
}

export function formatCoordinate(value: number, suffix = ''): string {
  return `${Number(value).toFixed(4)}${suffix}`
}
