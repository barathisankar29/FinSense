import { Html } from '@react-three/drei'

export function PortModel({ selected = false }: { selected?: boolean }) {
  return (
    <group position={[-48, 2.2, 32]}>
      <mesh castShadow>
        <boxGeometry args={[22, 4.2, 18]} />
        <meshStandardMaterial color="#1f2937" roughness={0.78} metalness={0.25} />
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <boxGeometry args={[24, 1.1, 20]} />
        <meshStandardMaterial color={selected ? '#22d3ee' : '#334155'} roughness={0.5} metalness={0.2} />
      </mesh>
      {[-8, 0, 8].map((offset) => (
        <mesh key={offset} position={[offset, 2.5, 9.5]} castShadow>
          <boxGeometry args={[3.2, 5, 1.8]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#67e8f9" emissiveIntensity={0.12} />
        </mesh>
      ))}
      {selected && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
            <ringGeometry args={[12, 14, 64]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0.8} side={2} />
          </mesh>
          <Html position={[0, 8, 0]} center>
            <div className="rounded-full border border-cyan-500/50 bg-slate-950/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
              PORT
            </div>
          </Html>
        </>
      )}
    </group>
  )
}
