import { Line, Text } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { INDIA_MAP_CENTER } from '../../spatial/indiaLogisticsData'

type GeoJson = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Polygon' | 'MultiPolygon'
      coordinates: number[][][] | number[][][][]
    }
  }>
}

type LatLng = [number, number]

const INDIA_GEOJSON_URL = 'https://raw.githubusercontent.com/datameet/maps/refs/heads/master/Country/india-land-simplified.geojson'
const WIDTH = 132
const DEPTH = 150
const BASE_Y = -1.5
export const INDIA_BOUNDS = { minLat: 8, maxLat: 37, minLng: 68, maxLng: 98 }

function collectRings(geo: GeoJson): LatLng[][] {
  const rings: LatLng[][] = []
  for (const feature of geo.features) {
    if (feature.geometry.type === 'Polygon') {
      for (const ring of feature.geometry.coordinates as number[][][]) {
        rings.push(ring.map(([lng, lat]) => [lat, lng]))
      }
    } else {
      for (const polygon of feature.geometry.coordinates as number[][][][]) {
        for (const ring of polygon) {
          rings.push(ring.map(([lng, lat]) => [lat, lng]))
        }
      }
    }
  }
  return rings
}

function bounds(rings: LatLng[][]) {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  for (const ring of rings) {
    for (const [lat, lng] of ring) {
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
    }
  }
  return { minLat, maxLat, minLng, maxLng }
}

function pointInRing(lat: number, lng: number, ring: LatLng[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i += 1) {
    const [yi, xi] = ring[i]
    const [yj, xj] = ring[j]
    const intersect = ((xi > lng) !== (xj > lng)) && lat < ((yj - yi) * (lng - xi)) / (xj - xi + Number.EPSILON) + yi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInIndia(lat: number, lng: number, rings: LatLng[][]) {
  return rings.some((ring) => pointInRing(lat, lng, ring))
}

function project(lat: number, lng: number, b: ReturnType<typeof bounds>) {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng) - 0.5) * WIDTH
  const z = -((lat - b.minLat) / (b.maxLat - b.minLat) - 0.5) * DEPTH
  return { x, z }
}

function elevation(lat: number, lng: number) {
  const himalayas = Math.exp(-(((lat - 30.0) ** 2) / 8 + ((lng - 80.0) ** 2) / 55)) * 7
  const westernGhats = Math.exp(-(((lat - 15.5) ** 2) / 55 + ((lng - 75.0) ** 2) / 4)) * 3.2
  const central = Math.exp(-(((lat - 21.0) ** 2) / 45 + ((lng - 78.0) ** 2) / 45)) * 2.2
  const coast = Math.sin(lng * 0.55) * 0.22 + Math.cos(lat * 0.42) * 0.18
  return himalayas + westernGhats + central + coast
}

function createTerrainGeometry(rings: LatLng[][], b: ReturnType<typeof bounds>) {
  const cols = 70
  const rows = 78
  const positions: number[] = []
  const indices: number[] = []
  const vertexMap = new Map<string, number>()

  const addVertex = (lat: number, lng: number) => {
    const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`
    const existing = vertexMap.get(key)
    if (existing !== undefined) return existing
    const { x, z } = project(lat, lng, b)
    const index = positions.length / 3
    positions.push(x, BASE_Y + elevation(lat, lng), z)
    vertexMap.set(key, index)
    return index
  }

  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < cols - 1; col += 1) {
      const t0 = row / (rows - 1)
      const t1 = (row + 1) / (rows - 1)
      const s0 = col / (cols - 1)
      const s1 = (col + 1) / (cols - 1)
      const lat0 = b.minLat + (b.maxLat - b.minLat) * t0
      const lat1 = b.minLat + (b.maxLat - b.minLat) * t1
      const lng0 = b.minLng + (b.maxLng - b.minLng) * s0
      const lng1 = b.minLng + (b.maxLng - b.minLng) * s1
      const centerLat = (lat0 + lat1) / 2
      const centerLng = (lng0 + lng1) / 2
      if (!pointInIndia(centerLat, centerLng, rings)) continue
      const a = addVertex(lat0, lng0)
      const b0 = addVertex(lat0, lng1)
      const c = addVertex(lat1, lng1)
      const d = addVertex(lat1, lng0)
      indices.push(a, b0, d, b0, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function IndiaOutline({ rings, mapBounds }: { rings: LatLng[][]; mapBounds: ReturnType<typeof bounds> }) {
  const lines = useMemo(() => rings.slice(0, 10).map((ring) => ring.map(([lat, lng]) => {
    const p = project(lat, lng, mapBounds)
    return [p.x, BASE_Y + 0.18, p.z] as [number, number, number]
  })), [mapBounds, rings])

  return (
    <group>
      {lines.map((points, index) => (
        <Line key={`india-outline-${index}`} points={points} color="#67e8f9" lineWidth={1.6} transparent opacity={0.78} />
      ))}
      <Text position={[0, BASE_Y + 0.5, 52]} rotation={[-Math.PI / 2, 0, 0]} fontSize={3.8} color="#94a3b8" anchorX="center" anchorY="middle">
        INDIA • LOGISTICS TERRAIN
      </Text>
      <Text position={[0, BASE_Y + 0.5, -58]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.9} color="#475569" anchorX="center" anchorY="middle">
        {INDIA_MAP_CENTER.lat.toFixed(1)}°N / {INDIA_MAP_CENTER.lng.toFixed(1)}°E NETWORK VIEW
      </Text>
    </group>
  )
}

export function geoToIndiaWorld(lat: number, lng: number, mapBounds: ReturnType<typeof bounds>) {
  const p = project(lat, lng, mapBounds)
  return new THREE.Vector3(p.x, BASE_Y + elevation(lat, lng) + 0.7, p.z)
}

export default function IndiaTerrain() {
  const [geo, setGeo] = useState<GeoJson | null>(null)

  useEffect(() => {
    let alive = true
    fetch(INDIA_GEOJSON_URL)
      .then((response) => {
        if (!response.ok) throw new Error('India boundary could not be loaded')
        return response.json() as Promise<GeoJson>
      })
      .then((data) => {
        if (alive) setGeo(data)
      })
      .catch(() => {
        if (alive) setGeo(null)
      })
    return () => {
      alive = false
    }
  }, [])

  const rings = useMemo(() => (geo ? collectRings(geo) : []), [geo])
  const mapBounds = INDIA_BOUNDS
  const terrainGeometry = useMemo(() => (rings.length ? createTerrainGeometry(rings, mapBounds) : null), [mapBounds, rings])

  if (!terrainGeometry || !rings.length) {
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_Y, 0]} receiveShadow>
          <planeGeometry args={[WIDTH, DEPTH, 1, 1]} />
          <meshStandardMaterial color="#102a3f" roughness={1} />
        </mesh>
        <Text position={[0, BASE_Y + 1, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={3} color="#67e8f9" anchorX="center" anchorY="middle">
          LOADING INDIA TERRAIN…
        </Text>
      </group>
    )
  }

  return (
    <group>
      <mesh geometry={terrainGeometry} receiveShadow castShadow>
        <meshStandardMaterial color="#173c3b" roughness={0.94} metalness={0.08} />
      </mesh>
      <mesh geometry={terrainGeometry} scale={[1, 0.18, 1]} position={[0, -1.2, 0]}>
        <meshStandardMaterial color="#081a29" roughness={1} metalness={0.02} />
      </mesh>
      <IndiaOutline rings={rings} mapBounds={mapBounds} />
    </group>
  )
}
