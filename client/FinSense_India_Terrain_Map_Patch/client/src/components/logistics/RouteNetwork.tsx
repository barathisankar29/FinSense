import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { LogisticsRoute } from '../../spatial/indiaLogisticsData'
import { geoToIndiaWorld } from './IndiaTerrain'

type Props = {
  routes: LogisticsRoute[]
  mapBounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  progress: number
  activeRouteId: string
  visible: boolean
}

export function RouteNetwork({ routes, mapBounds, progress, activeRouteId, visible }: Props) {
  if (!visible) return null

  return (
    <group>
      {routes.map((route) => {
        const points = route.points.map(([lat, lng]) => {
          const p = geoToIndiaWorld(lat, lng, mapBounds)
          return [p.x, p.y + 0.4, p.z] as [number, number, number]
        })
        return <RouteSegment key={route.id} route={route} points={points} active={route.id === activeRouteId} progress={progress} />
      })}
    </group>
  )
}

function RouteSegment({ route, points, active, progress }: { route: LogisticsRoute; points: Array<[number, number, number]>; active: boolean; progress: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'catmullrom', 0.12), [points])
  const particleRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!particleRef.current || !active) return
    const t = (progress + clock.getElapsedTime() * 0.012) % 1
    const p = curve.getPointAt(t)
    particleRef.current.position.copy(p)
    particleRef.current.position.y += 1.1
  })

  return (
    <group>
      <Line points={points} color={active ? '#f8fafc' : '#334155'} lineWidth={active ? 6 : 2.4} transparent opacity={active ? 0.95 : 0.65} />
      <Line points={points} color={active ? '#22d3ee' : '#0e7490'} lineWidth={active ? 2.1 : 0.8} transparent opacity={active ? 0.95 : 0.48} />
      {active && <mesh ref={particleRef}>
        <sphereGeometry args={[0.7, 14, 14]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>}
      {active && Array.from({ length: 8 }).map((_, index) => {
        const t = (progress + index * 0.11) % 1
        const p = curve.getPointAt(t)
        return (
          <mesh key={`${route.id}-pulse-${index}`} position={[p.x, p.y + 0.75, p.z]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0.65 - index * 0.05} />
          </mesh>
        )
      })}
    </group>
  )
}
