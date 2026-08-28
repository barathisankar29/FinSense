import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { LOGISTICS_ROUTE_POINTS } from '../spatial/spatialUtils'

export function LogisticsRoute({ progress = 0.42, highlighted = false }: { progress?: number; highlighted?: boolean }) {
  const routePoints = LOGISTICS_ROUTE_POINTS.map((point) => [point.x, point.y + 0.8, point.z]) as [number, number, number][]
  const glowPoints = LOGISTICS_ROUTE_POINTS.map((point) => [point.x, point.y + 0.7, point.z]) as [number, number, number][]

  return (
    <group>
      <Line points={routePoints} color={highlighted ? '#f8fafc' : '#38bdf8'} lineWidth={highlighted ? 4.5 : 3} transparent opacity={highlighted ? 0.98 : 0.9} />
      <Line points={glowPoints} color="#7dd3fc" lineWidth={1.5} transparent opacity={0.6} />
      <mesh position={[0, 0, 0]} visible={false}>
        <sphereGeometry args={[1]} />
      </mesh>
      <group position={[0, 0, 0]}>
        {Array.from({ length: 14 }).map((_, index) => {
          const t = (index / 13) * 0.9 + (progress * 0.08)
          const point = new THREE.CatmullRomCurve3(LOGISTICS_ROUTE_POINTS, false, 'catmullrom', 0.2).getPointAt(Math.min(Math.max(t, 0), 1))
          return (
            <mesh key={`pulse-${index}`} position={[point.x, point.y + 2.1, point.z]}>
              <sphereGeometry args={[0.7, 12, 12]} />
              <meshBasicMaterial color="#67e8f9" transparent opacity={0.35 + (index % 3) * 0.12} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
