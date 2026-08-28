import { Html } from '@react-three/drei'
import type { GroupProps } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

interface MovingTruckProps extends GroupProps {
  progress: number
  selected?: boolean
  label?: string
  speed?: number
  eta?: string
}

export function MovingTruck({ progress, selected = false, label = 'AS-1042', speed = 26, eta = '4h 32m', ...props }: MovingTruckProps) {
  const truckPosition = useMemo(() => {
    const points = [
      new THREE.Vector3(-72, 0.6, 46),
      new THREE.Vector3(-54, 1, 36),
      new THREE.Vector3(-30, 1.2, 22),
      new THREE.Vector3(-8, 1.4, 8),
      new THREE.Vector3(12, 1.3, 0),
      new THREE.Vector3(16, 0.6, 8),
      new THREE.Vector3(32, 1.1, -10),
      new THREE.Vector3(52, 1.2, -28),
      new THREE.Vector3(64, 1.1, -40),
      new THREE.Vector3(76, 0.8, -54),
    ]
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2)
    return curve.getPointAt(Math.min(Math.max(progress, 0), 1))
  }, [progress])

  const next = useMemo(() => {
    const points = [
      new THREE.Vector3(-72, 0.6, 46),
      new THREE.Vector3(-54, 1, 36),
      new THREE.Vector3(-30, 1.2, 22),
      new THREE.Vector3(-8, 1.4, 8),
      new THREE.Vector3(12, 1.3, 0),
      new THREE.Vector3(16, 0.6, 8),
      new THREE.Vector3(32, 1.1, -10),
      new THREE.Vector3(52, 1.2, -28),
      new THREE.Vector3(64, 1.1, -40),
      new THREE.Vector3(76, 0.8, -54),
    ]
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2)
    const nextProgress = Math.min(progress + 0.01, 1)
    return curve.getPointAt(nextProgress)
  }, [progress])

  const direction = new THREE.Vector3().subVectors(next, truckPosition)
  const heading = direction.lengthSq() > 0 ? Math.atan2(direction.x, direction.z) : 0

  return (
    <group {...props} position={[truckPosition.x, truckPosition.y + 0.5, truckPosition.z]} rotation={[0, heading, 0]}>
      <mesh castShadow position={[0, 2.6, 0]}>
        <boxGeometry args={[10, 3, 5.2]} />
        <meshStandardMaterial color={selected ? '#f1f5f9' : '#dbeafe'} metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh castShadow position={[0.5, 4.8, 0]}>
        <boxGeometry args={[5.7, 2.6, 3.6]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.25} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[10.8, 1.2, 5.7]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.7} />
      </mesh>
      {[[-3.8, 1.3, 2.5], [3.8, 1.3, 2.5], [-3.8, 1.3, -2.5], [3.8, 1.3, -2.5]].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.8, 20]} />
          <meshStandardMaterial color="#111827" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[5.2, 5.2, 1.5]}>
        <boxGeometry args={[0.5, 0.7, 0.8]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[5.2, 5.2, -1.5]}>
        <boxGeometry args={[0.5, 0.7, 0.8]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.7} />
      </mesh>
      {selected && (
        <Html position={[0, 9, 0]} center>
          <div className="rounded-full border border-cyan-500/50 bg-slate-950/85 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
            {label}
          </div>
        </Html>
      )}
      {selected && (
        <Html position={[0, -6, 0]} center>
          <div className="rounded-xl border border-slate-700 bg-slate-950/85 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200">
            {speed} km/h · {eta}
          </div>
        </Html>
      )}
    </group>
  )
}
