import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { LogisticsNode } from '../../spatial/indiaLogisticsData'

function ModelLabel({ node }: { node: LogisticsNode }) {
  return (
    <Html position={[0, node.type === 'FACTORY' ? 8 : 6, 0]} center distanceFactor={34}>
      <div className="pointer-events-none whitespace-nowrap rounded-full border border-cyan-400/40 bg-slate-950/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-200 shadow-lg">
        {node.shortName}
      </div>
    </Html>
  )
}

export function FacilityModel({ node, position, selected, onSelect }: { node: LogisticsNode; position: [number, number, number]; selected: boolean; onSelect: () => void }) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect()
  }

  const ringColor = node.risk === 'CRITICAL' ? '#ef4444' : node.risk === 'HIGH' ? '#f97316' : node.risk === 'MEDIUM' ? '#fbbf24' : '#34d399'

  if (node.type === 'FACTORY') {
    return (
      <group position={position} onClick={handleClick}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[12, 4, 8]} />
          <meshStandardMaterial color={selected ? '#334155' : '#1e293b'} roughness={0.72} metalness={0.25} />
        </mesh>
        <mesh position={[0, 4.6, 0]} castShadow>
          <boxGeometry args={[13, 0.9, 8.6]} />
          <meshStandardMaterial color="#475569" roughness={0.42} metalness={0.32} />
        </mesh>
        {[-4, 0, 4].map((x) => (
          <mesh key={`tank-${x}`} position={[x, 2.6, -5]} castShadow>
            <cylinderGeometry args={[1.2, 1.2, 3.5, 18]} />
            <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {[-4, 0, 4].map((x) => (
          <mesh key={`chimney-${x}`} position={[x, 7, 1.5]} castShadow>
            <cylinderGeometry args={[0.5, 0.65, 5, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.4} />
          </mesh>
        ))}
        {[[-5, 0.7, 4.7], [0, 0.7, 4.7], [5, 0.7, 4.7]].map(([x, y, z], i) => (
          <mesh key={`dock-${i}`} position={[x, y, z]} castShadow>
            <boxGeometry args={[3.2, 1.2, 1]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#22d3ee" emissiveIntensity={0.12} />
          </mesh>
        ))}
        {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[10, 11, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.85} side={2} />
        </mesh>}
        <ModelLabel node={node} />
      </group>
    )
  }

  if (node.type === 'WAREHOUSE') {
    return (
      <group position={position} onClick={handleClick}>
        <mesh position={[0, 2.3, 0]} castShadow>
          <boxGeometry args={[15, 4.6, 10]} />
          <meshStandardMaterial color={selected ? '#334155' : '#1f2937'} roughness={0.78} metalness={0.2} />
        </mesh>
        <mesh position={[0, 4.9, 0]} castShadow>
          <boxGeometry args={[15.6, 0.8, 10.6]} />
          <meshStandardMaterial color="#64748b" roughness={0.38} metalness={0.28} />
        </mesh>
        {[-5, 0, 5].map((x) => (
          <mesh key={`bay-${x}`} position={[x, 1.2, 5.5]} castShadow>
            <boxGeometry args={[3.2, 2.2, 1]} />
            <meshStandardMaterial color="#e2e8f0" emissive="#fbbf24" emissiveIntensity={0.08} />
          </mesh>
        ))}
        {[-5, 0, 5].map((x) => (
          <mesh key={`container-${x}`} position={[x, 1, -6]} castShadow>
            <boxGeometry args={[3.8, 2, 2.4]} />
            <meshStandardMaterial color="#475569" roughness={0.55} metalness={0.35} />
          </mesh>
        ))}
        {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[12, 13, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.85} side={2} />
        </mesh>}
        <ModelLabel node={node} />
      </group>
    )
  }

  if (node.type === 'PORT') {
    return (
      <group position={position} onClick={handleClick}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[12, 2.4, 7]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.35} />
        </mesh>
        {[-4, 0, 4].map((x) => (
          <group key={`crane-${x}`} position={[x, 5, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.6, 8, 0.6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[1.8, 3.5, 0]}>
              <boxGeometry args={[3.5, 0.45, 0.45]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.32} />
            </mesh>
          </group>
        ))}
        {[-4, 0, 4].map((x) => (
          <mesh key={`port-container-${x}`} position={[x, 1.8, 3.8]} castShadow>
            <boxGeometry args={[3, 1.5, 1.8]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.28} roughness={0.5} />
          </mesh>
        ))}
        {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[10, 11, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.85} side={2} />
        </mesh>}
        <ModelLabel node={node} />
      </group>
    )
  }

  if (node.type === 'TRANSIT') {
    return (
      <group position={position} onClick={handleClick}>
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[8, 3.4, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.28} />
        </mesh>
        <mesh position={[0, 3.7, 0]}>
          <boxGeometry args={[8.5, 0.5, 6.5]} />
          <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.35} />
        </mesh>
        {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[7, 8, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.8} side={2} />
        </mesh>}
        <ModelLabel node={node} />
      </group>
    )
  }

  return (
    <group position={position} onClick={handleClick}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[1.8, 2.2, 2.2, 24]} />
        <meshStandardMaterial color={selected ? '#22d3ee' : '#475569'} emissive="#0e7490" emissiveIntensity={selected ? 0.5 : 0.1} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#67e8f9" />
      </mesh>
      <ModelLabel node={node} />
    </group>
  )
}
