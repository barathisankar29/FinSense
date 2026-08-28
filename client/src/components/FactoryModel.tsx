import { Html } from '@react-three/drei'

export function FactoryModel({ selected = false }: { selected?: boolean }) {
  return (
    <group position={[-14, 0.8, -12]}>
      <mesh castShadow>
        <boxGeometry args={[26, 2.6, 18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.84} metalness={0.22} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[24, 0.8, 16]} />
        <meshStandardMaterial color={selected ? '#8b5cf6' : '#374151'} roughness={0.5} metalness={0.2} />
      </mesh>
      {[-8, 0, 8].map((offset) => (
        <mesh key={`factory-tank-${offset}`} position={[offset, 1.5, -7.5]} castShadow>
          <cylinderGeometry args={[2.8, 2.8, 3.8, 20]} />
          <meshStandardMaterial color="#475569" metalness={0.38} roughness={0.45} />
        </mesh>
      ))}
      {[-10, -3, 4, 11].map((offset) => (
        <mesh key={`factory-chimney-${offset}`} position={[offset, 5.5, -2]} castShadow>
          <boxGeometry args={[1.6, 6, 1.6]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.3} />
        </mesh>
      ))}
      {selected && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
            <ringGeometry args={[14, 16, 64]} />
            <meshBasicMaterial color="#f5d0fe" transparent opacity={0.8} side={2} />
          </mesh>
          <Html position={[0, 8.5, 0]} center>
            <div className="rounded-full border border-fuchsia-500/50 bg-slate-950/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-300">
              FACTORY
            </div>
          </Html>
        </>
      )}
    </group>
  )
}
