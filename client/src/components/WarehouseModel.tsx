import { Html } from '@react-three/drei'

export function WarehouseModel({ selected = false }: { selected?: boolean }) {
  return (
    <group position={[72, 2.8, -52]}>
      <mesh castShadow>
        <boxGeometry args={[32, 5.2, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.2} />
      </mesh>
      <mesh position={[0, 5.9, 0]} castShadow>
        <boxGeometry args={[34, 1.1, 22]} />
        <meshStandardMaterial color={selected ? '#a855f7' : '#475569'} roughness={0.42} metalness={0.3} />
      </mesh>
      {[[-12, 0, 9], [0, 0, 9], [12, 0, 9], [-12, 0, -9], [0, 0, -9], [12, 0, -9]].map(([x, y, z], index) => (
        <mesh key={`warehouse-dock-${index}`} position={[x, y + 0.5, z]} castShadow>
          <boxGeometry args={[5.5, 1, 2.5]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.45} metalness={0.3} />
        </mesh>
      ))}
      {[-10, -4, 2, 8].map((offset) => (
        <mesh key={`warehouse-container-${offset}`} position={[offset, 1.6, -10.5]} castShadow>
          <boxGeometry args={[4.8, 2.8, 2.8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      {selected && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
            <ringGeometry args={[18, 20, 64]} />
            <meshBasicMaterial color="#d8b4fe" transparent opacity={0.8} side={2} />
          </mesh>
          <Html position={[0, 9, 0]} center>
            <div className="rounded-full border border-violet-500/50 bg-slate-950/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-300">
              WAREHOUSE
            </div>
          </Html>
        </>
      )}
    </group>
  )
}
