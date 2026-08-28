import { Html, Line, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { RiskLevel } from '../types'
import { ACTIVE_ROUTE, LOGISTICS_NODES, NETWORK_ROUTES, type LogisticsNode } from './indiaLogisticsData'
import IndiaTerrain, { INDIA_BOUNDS, geoToIndiaWorld } from '../components/logistics/IndiaTerrain'
import { FacilityModel } from '../components/logistics/FacilityModel'
import { RouteNetwork } from '../components/logistics/RouteNetwork'

export type LogisticsJourneyState = 'BEFORE_START' | 'ONGOING' | 'STOPPING' | 'ARRIVED'

export function getLogisticsJourneyState(progress: number): LogisticsJourneyState {
  if (progress <= 0.04) return 'BEFORE_START'
  if (progress < 0.86) return 'ONGOING'
  if (progress < 0.995) return 'STOPPING'
  return 'ARRIVED'
}

export function getLogisticsTruckSpeed(state: LogisticsJourneyState, multiplier = 1, progress = 0) {
  if (state === 'BEFORE_START' || state === 'ARRIVED') return 0
  if (state === 'ONGOING') return 26 * multiplier
  return Math.max(0, 10 * (1 - (progress - 0.86) / 0.135) * multiplier)
}

export type LogisticsWorldProps = {
  progress: number
  selectedNodeId?: string | null
  highlightTruck?: boolean
  followCamera?: boolean
  riskLevel?: RiskLevel
  showTerrain?: boolean
  showRoad?: boolean
  showBuildings?: boolean
  showRoute?: boolean
  showTruck?: boolean
  showRisk?: boolean
  showLabels?: boolean
  onSelectNode?: (node: LogisticsNode) => void
  onSelectTruck?: () => void
  label?: string
  worldScale?: number
}

export function getLogisticsTruckPosition(progress: number) {
  return getTruckPosition(progress)
}

export function getTruckPosition(progress: number) {
  const points = ACTIVE_ROUTE.points.map(([lat, lng]) => geoToIndiaWorld(lat, lng, INDIA_BOUNDS))
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.08)
  return curve.getPointAt(THREE.MathUtils.clamp(progress, 0, 1))
}

function getTruckHeading(progress: number) {
  const points = ACTIVE_ROUTE.points.map(([lat, lng]) => geoToIndiaWorld(lat, lng, INDIA_BOUNDS))
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.08)
  const current = curve.getPointAt(THREE.MathUtils.clamp(progress, 0, 1))
  const next = curve.getPointAt(Math.min(1, progress + 0.008))
  return Math.atan2(next.x - current.x, next.z - current.z)
}

function TrackedTruck({ progress, selected, onClick, showLabel = true, label = 'AS-1042' }: { progress: number; selected: boolean; onClick?: () => void; showLabel?: boolean; label?: string }) {
  const position = useMemo(() => getTruckPosition(progress), [progress])
  const heading = useMemo(() => getTruckHeading(progress), [progress])

  return (
    <group position={[position.x, position.y + 0.65, position.z]} rotation={[0, heading, 0]} onClick={(event) => { event.stopPropagation(); onClick?.() }}>
      {selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <ringGeometry args={[4.5, 5.1, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.65} side={2} />
      </mesh>}
      <mesh castShadow position={[0, 2, 0]}>
        <boxGeometry args={[5.8, 1.8, 2.7]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[1.7, 3.4, 0]}>
        <boxGeometry args={[1.9, 1.7, 2.4]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.28} />
      </mesh>
      <mesh position={[1.72, 3.42, 1.23]}>
        <boxGeometry args={[1.15, 0.72, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[1.72, 3.42, -1.23]}>
        <boxGeometry args={[1.15, 0.72, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.1} />
      </mesh>
      {[[-2.0, 1.0, 1.42], [2.0, 1.0, 1.42], [-2.0, 1.0, -1.42], [2.0, 1.0, -1.42]].map(([x, y, z], index) => (
        <mesh key={`wheel-${index}`} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.42, 18]} />
          <meshStandardMaterial color="#020617" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[2.7, 2.5, 1.15]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[2.7, 2.5, -1.15]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      {showLabel && <Html position={[0, 5.2, 0]} center distanceFactor={28}>
        <div className="pointer-events-none whitespace-nowrap rounded-lg border border-cyan-400/50 bg-slate-950/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
          {label} • 26 KM/H
        </div>
      </Html>}
    </group>
  )
}

function RiskZone({ node }: { node: LogisticsNode }) {
  const color = node.risk === 'CRITICAL' ? '#ef4444' : node.risk === 'HIGH' ? '#f97316' : node.risk === 'MEDIUM' ? '#fbbf24' : '#34d399'
  const position = geoToIndiaWorld(node.lat, node.lng, INDIA_BOUNDS)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position.x, position.y + 0.18, position.z]}>
      <ringGeometry args={[4, 5.5, 48]} />
      <meshBasicMaterial color={color} transparent opacity={node.risk === 'LOW' ? 0.12 : 0.28} side={2} />
    </mesh>
  )
}

function RoadGrid() {
  const lines = [
    [[-58, -30, 62], [-30, -30, 54], [2, -30, 38], [36, -30, 20], [64, -30, 4]],
    [[-42, -30, 20], [-15, -30, 8], [16, -30, -8], [45, -30, -26]],
    [[-5, -30, 55], [10, -30, 28], [28, -30, 2], [44, -30, -22]],
  ] as Array<Array<[number, number, number]>>

  return (
    <group>
      {lines.map((line, index) => (
        <Line key={`road-grid-${index}`} points={line} color="#26394b" lineWidth={5} transparent opacity={0.5} />
      ))}
    </group>
  )
}

export function LogisticsWorld({
  progress,
  selectedNodeId = null,
  highlightTruck = false,
  followCamera = false,
  riskLevel = 'LOW',
  showTerrain = true,
  showRoad = true,
  showBuildings = true,
  showRoute = true,
  showTruck = true,
  showRisk = true,
  showLabels = true,
  onSelectNode,
  onSelectTruck,
  label = 'AS-1042',
  worldScale = 1,
}: LogisticsWorldProps) {
  const controlsRef = useRef<any>(null)
  const truckPosition = useMemo(() => getTruckPosition(progress), [progress])
  const activeNode = LOGISTICS_NODES.find((node) => node.id === selectedNodeId)
  const cameraTarget = activeNode
    ? geoToIndiaWorld(activeNode.lat, activeNode.lng, INDIA_BOUNDS)
    : truckPosition

  useFrame((state, delta) => {
    if (!controlsRef.current) return
    const shouldFollow = followCamera || highlightTruck
    const desiredPosition = shouldFollow
      ? new THREE.Vector3(cameraTarget.x + 22, cameraTarget.y + 18, cameraTarget.z + 25)
      : new THREE.Vector3(0, 86, 122)
    const desiredTarget = shouldFollow
      ? new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z)
      : new THREE.Vector3(0, 0, 0)
    state.camera.position.lerp(desiredPosition, 1 - Math.exp(-delta * 1.8))
    controlsRef.current.target.lerp(desiredTarget, 1 - Math.exp(-delta * 2.2))
    controlsRef.current.update()
  })

  return (
    <>
      <color attach="background" args={['#020817']} />
      <fog attach="fog" args={['#020817', 100, 260]} />
      <ambientLight intensity={1.55} />
      <directionalLight castShadow position={[30, 90, 20]} intensity={2.7} color="#dbeafe" />
      <pointLight position={[-55, 30, 45]} intensity={3.5} color="#22d3ee" />
      <pointLight position={[55, 20, -45]} intensity={2.4} color="#f59e0b" />
      <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate minDistance={35} maxDistance={210} maxPolarAngle={Math.PI * 0.47} />

      <group scale={worldScale}>
        {showTerrain && <IndiaTerrain />}
        {showRoad && <RoadGrid />}
        {showRoute && <RouteNetwork routes={NETWORK_ROUTES} mapBounds={INDIA_BOUNDS} progress={progress} activeRouteId={ACTIVE_ROUTE.id} visible />}

        {showBuildings && LOGISTICS_NODES.filter((node) => node.type !== 'CITY').map((node) => {
          const p = geoToIndiaWorld(node.lat, node.lng, INDIA_BOUNDS)
          return (
            <FacilityModel key={node.id} node={node} position={[p.x, p.y, p.z]} selected={selectedNodeId === node.id} onSelect={() => onSelectNode?.(node)} />
          )
        })}

        {showBuildings && LOGISTICS_NODES.filter((node) => node.type === 'CITY').map((node) => {
          const p = geoToIndiaWorld(node.lat, node.lng, INDIA_BOUNDS)
          return (
            <FacilityModel key={node.id} node={node} position={[p.x, p.y, p.z]} selected={selectedNodeId === node.id} onSelect={() => onSelectNode?.(node)} />
          )
        })}

        {showRisk && LOGISTICS_NODES.map((node) => <RiskZone key={`risk-${node.id}`} node={node} />)}
        {showTruck && <TrackedTruck progress={progress} selected={highlightTruck} onClick={onSelectTruck} showLabel={showLabels} label={label} />}

        <Html position={[0, 10, 0]} center distanceFactor={70}>
          <div className="pointer-events-none rounded-full border border-slate-700 bg-slate-950/85 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-slate-300">
            INDIA NATIONAL LOGISTICS NETWORK • RISK {riskLevel}
          </div>
        </Html>
      </group>
    </>
  )
}
