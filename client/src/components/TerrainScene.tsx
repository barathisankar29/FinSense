import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export function TerrainScene({ selectedAsset = 'AS-1042' }: { selectedAsset?: string }) {
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(220, 160, 220, 160)
    const positions = geometry.attributes.position as THREE.BufferAttribute
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index)
      const y = positions.getY(index)
      const coast = Math.max(0, 18 - Math.abs(x + 68) / 1.8) * 2.5
      const industrial = Math.exp(-((x - 18) ** 2) / 5000 - ((y + 6) ** 2) / 3500) * 10
      const ridge = Math.sin(x * 0.18) * 9 + Math.cos(y * 0.16) * 8 + Math.sin((x + y) * 0.12) * 7
      positions.setZ(index, ridge + industrial + coast - 6)
    }
    geometry.computeVertexNormals()
    return geometry
  }, [])

  return (
    <>
      <color attach="background" args={['#020b18']} />
      <fog attach="fog" args={['#020b18', 42, 170]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[40, 55, 20]} intensity={2.3} color="#dbeafe" />
      <pointLight position={[-65, 18, 32]} intensity={2.4} color="#22d3ee" />
      <pointLight position={[74, 20, -60]} intensity={1.8} color="#f59e0b" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.5, 0]} geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial color="#15314a" roughness={0.95} metalness={0.12} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-78, -3.7, 52]} receiveShadow>
        <planeGeometry args={[34, 22]} />
        <meshStandardMaterial color="#0d4d72" transparent opacity={0.82} roughness={0.3} metalness={0.2} />
      </mesh>

      {[-66, -16, -58, 32, -24, 18, 20, 42, 40, 10, 72, 18, 85, -22, 48, -48, 14, -42, -18, -50, -48, -32, -76, 26, 2, 32, 28, -30, 52, 32, 92, -44, -12, 58, -52, 58, 78, 42, 24, 54, -88, -14, 60, -68, 10, -66, -30, 40].reduce<Array<[number, number]>>((acc, _, index, arr) => {
        if (index % 2 === 0) {
          acc.push([arr[index] as number, arr[index + 1] as number])
        }
        return acc
      }, []).map(([x, z], index) => (
        <group key={`tree-${index}`} position={[x, 0, z]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[3, 6, 12]} />
            <meshStandardMaterial color="#1d4d34" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.8, 1.1, 2.5, 12]} />
            <meshStandardMaterial color="#5b3b1f" roughness={1} />
          </mesh>
        </group>
      ))}

      <Html position={[0, 18, 0]} center>
        <div className="rounded-full border border-cyan-500/40 bg-slate-950/85 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.4)]">
          {selectedAsset}
        </div>
      </Html>
    </>
  )
}
