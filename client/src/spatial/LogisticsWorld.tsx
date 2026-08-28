import { Html, Line, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import type { RiskLevel } from '../types'
import {
  LOGISTICS_NODES,
  type LogisticsNode,
} from './indiaLogisticsData'

export type LogisticsJourneyState =
  | 'BEFORE_START'
  | 'ONGOING'
  | 'STOPPING'
  | 'ARRIVED'

export function getLogisticsJourneyState(
  progress: number,
): LogisticsJourneyState {
  if (progress <= 0.04) return 'BEFORE_START'
  if (progress < 0.86) return 'ONGOING'
  if (progress < 0.995) return 'STOPPING'
  return 'ARRIVED'
}

export function getLogisticsTruckSpeed(
  state: LogisticsJourneyState,
  multiplier = 1,
  progress = 0,
) {
  if (state === 'BEFORE_START') return 0
  if (state === 'ARRIVED') return 0

  if (state === 'ONGOING') {
    return 26 * multiplier
  }

  return Math.max(
    0,
    10 *
      (1 - (progress - 0.86) / 0.135) *
      multiplier,
  )
}

/*
|--------------------------------------------------------------------------
| 3D LOGISTICS WORLD
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This is NOT the India map.
|
| It is a local 3D logistics environment:
|
| FACTORY → ROAD → WAREHOUSE → TRANSIT → PORT
|
| No external map API.
| No GeoJSON.
| No terrain download.
| No remote model.
|
|--------------------------------------------------------------------------
*/

const FACTORY = new THREE.Vector3(-55, 2, -15)
const WAREHOUSE = new THREE.Vector3(-5, 2, 5)
const TRANSIT = new THREE.Vector3(35, 2, 15)
const PORT = new THREE.Vector3(60, 2, -25)

const ROUTE_POINTS = [
  FACTORY,
  new THREE.Vector3(-42, 2, -8),
  new THREE.Vector3(-28, 2, -1),
  new THREE.Vector3(-14, 2, 5),
  WAREHOUSE,
  new THREE.Vector3(10, 2, 9),
  new THREE.Vector3(24, 2, 14),
  TRANSIT,
  new THREE.Vector3(45, 2, 2),
  PORT,
]

const ROUTE_CURVE = new THREE.CatmullRomCurve3(
  ROUTE_POINTS,
  false,
  'catmullrom',
  0.12,
)

export function getLogisticsTruckPosition(progress: number) {
  return ROUTE_CURVE.getPointAt(
    THREE.MathUtils.clamp(progress, 0, 1),
  )
}

function getTruckHeading(progress: number) {
  const p = THREE.MathUtils.clamp(progress, 0, 1)

  const current = ROUTE_CURVE.getPointAt(p)

  const next = ROUTE_CURVE.getPointAt(
    Math.min(1, p + 0.01),
  )

  return Math.atan2(
    next.x - current.x,
    next.z - current.z,
  )
}

type TruckProps = {
  progress: number
  selected: boolean
  onClick?: () => void
  label: string
}

function Truck({
  progress,
  selected,
  onClick,
  label,
}: TruckProps) {
  const position = useMemo(
    () => getLogisticsTruckPosition(progress),
    [progress],
  )

  const heading = useMemo(
    () => getTruckHeading(progress),
    [progress],
  )

  return (
    <group
      position={[
        position.x,
        position.y + 1,
        position.z,
      ]}
      rotation={[0, heading, 0]}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
    >
      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.9, 0]}
        >
          <ringGeometry args={[4.5, 5.2, 64]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Trailer */}
      <mesh
        castShadow
        position={[-1.3, 1.7, 0]}
      >
        <boxGeometry args={[5.5, 2.4, 2.8]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.35}
          roughness={0.3}
        />
      </mesh>

      {/* Cabin */}
      <mesh
        castShadow
        position={[2.5, 1.5, 0]}
      >
        <boxGeometry args={[2, 2.7, 2.7]} />
        <meshStandardMaterial
          color="#f8fafc"
          metalness={0.2}
          roughness={0.25}
        />
      </mesh>

      {/* Windshield */}
      <mesh
        position={[3.05, 1.8, 0]}
      >
        <boxGeometry args={[0.04, 1, 2]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.15}
        />
      </mesh>

      {/* Wheels */}
      {[
        [-2.5, 0.6, 1.45],
        [1.6, 0.6, 1.45],
        [-2.5, 0.6, -1.45],
        [1.6, 0.6, -1.45],
      ].map(([x, y, z], index) => (
        <mesh
          key={index}
          position={[x, y, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry
            args={[0.65, 0.65, 0.45, 20]}
          />

          <meshStandardMaterial
            color="#020617"
            roughness={0.9}
          />
        </mesh>
      ))}

      {/* Head lights */}
      <mesh
        position={[3.55, 1.65, 1]}
      >
        <sphereGeometry args={[0.15, 16, 16]} />

        <meshBasicMaterial
          color="#ffffff"
        />
      </mesh>

      <mesh
        position={[3.55, 1.65, -1]}
      >
        <sphereGeometry args={[0.15, 16, 16]} />

        <meshBasicMaterial
          color="#ffffff"
        />
      </mesh>

      {/* Asset label */}
      <Html
        position={[0, 4.5, 0]}
        center
        distanceFactor={30}
      >
        <div
          className="
            pointer-events-none
            whitespace-nowrap
            rounded-xl
            border
            border-cyan-400/50
            bg-slate-950/95
            px-3
            py-1.5
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-cyan-200
            shadow-[0_0_20px_rgba(34,211,238,0.25)]
          "
        >
          {label}
        </div>
      </Html>
    </group>
  )
}

/* ---------------------------------------------------------------------- */
/* Road */
/* ---------------------------------------------------------------------- */

function LogisticsRoad() {
  const roadPoints = ROUTE_POINTS.map(
    (point) =>
      new THREE.Vector3(
        point.x,
        0.05,
        point.z,
      ),
  )

  return (
    <group>
      {/* Main road */}
      <Line
        points={roadPoints}
        color="#172033"
        lineWidth={15}
      />

      {/* Road edge */}
      <Line
        points={roadPoints}
        color="#334155"
        lineWidth={8}
      />

      {/* glowing route */}
      <Line
        points={roadPoints}
        color="#22d3ee"
        lineWidth={2.2}
      />

      {/* route center */}
      <Line
        points={roadPoints}
        color="#67e8f9"
        lineWidth={0.6}
        transparent
        opacity={0.8}
      />
    </group>
  )
}

/* ---------------------------------------------------------------------- */
/* Ground */
/* ---------------------------------------------------------------------- */

function Ground() {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[190, 150]} />

        <meshStandardMaterial
          color="#07111f"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* grid */}
      <gridHelper
        args={[180, 36, '#132337', '#0b1625']}
        position={[0, 0.03, 0]}
      />
    </group>
  )
}

/* ---------------------------------------------------------------------- */
/* Factory */
/* ---------------------------------------------------------------------- */

function FactoryModel({
  selected,
  onClick,
}: {
  selected: boolean
  onClick: () => void
}) {
  return (
    <group
      position={[
        FACTORY.x,
        0,
        FACTORY.z,
      ]}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <mesh
        position={[0, 3, 0]}
        castShadow
      >
        <boxGeometry args={[18, 6, 12]} />

        <meshStandardMaterial
          color="#243447"
          metalness={0.35}
          roughness={0.55}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 6.5, 0]}>
        <boxGeometry args={[19, 1, 13]} />

        <meshStandardMaterial
          color="#475569"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Chimneys */}
      {[-6, 0, 6].map((x) => (
        <mesh
          key={x}
          position={[x, 10, 2]}
          castShadow
        >
          <cylinderGeometry
            args={[0.8, 1, 7, 20]}
          />

          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.55}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Tanks */}
      {[-6, 0, 6].map((x) => (
        <mesh
          key={`tank-${x}`}
          position={[x, 2.5, -7]}
        >
          <cylinderGeometry
            args={[1.6, 1.6, 4, 20]}
          />

          <meshStandardMaterial
            color="#64748b"
            metalness={0.5}
            roughness={0.35}
          />
        </mesh>
      ))}

      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.2, 0]}
        >
          <ringGeometry args={[12, 13, 64]} />

          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      <Html
        position={[0, 14, 0]}
        center
        distanceFactor={40}
      >
        <div
          className="
            rounded-xl
            border
            border-emerald-400/50
            bg-slate-950/95
            px-3
            py-1.5
            text-center
            text-[10px]
            uppercase
            tracking-[0.18em]
            text-emerald-300
          "
        >
          FACTORY
          <div className="mt-1 text-[8px] text-slate-400">
            Ahmedabad Plant
          </div>
        </div>
      </Html>
    </group>
  )
}

/* ---------------------------------------------------------------------- */
/* Warehouse */
/* ---------------------------------------------------------------------- */

function WarehouseModel({
  selected,
  onClick,
}: {
  selected: boolean
  onClick: () => void
}) {
  return (
    <group
      position={[
        WAREHOUSE.x,
        0,
        WAREHOUSE.z,
      ]}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <mesh
        position={[0, 3, 0]}
        castShadow
      >
        <boxGeometry args={[20, 6, 13]} />

        <meshStandardMaterial
          color="#26364a"
          metalness={0.3}
          roughness={0.65}
        />
      </mesh>

      <mesh position={[0, 6.4, 0]}>
        <boxGeometry args={[21, 0.8, 14]} />

        <meshStandardMaterial
          color="#64748b"
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>

      {/* loading bays */}
      {[-6, 0, 6].map((x) => (
        <mesh
          key={x}
          position={[x, 2, 6.8]}
        >
          <boxGeometry args={[3.5, 3, 0.7]} />

          <meshStandardMaterial
            color="#0f172a"
            emissive="#22d3ee"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}

      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.2, 0]}
        >
          <ringGeometry args={[13, 14, 64]} />

          <meshBasicMaterial
            color="#a78bfa"
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      <Html
        position={[0, 10, 0]}
        center
        distanceFactor={40}
      >
        <div
          className="
            rounded-xl
            border
            border-violet-400/50
            bg-slate-950/95
            px-3
            py-1.5
            text-center
            text-[10px]
            uppercase
            tracking-[0.18em]
            text-violet-300
          "
        >
          WAREHOUSE
          <div className="mt-1 text-[8px] text-slate-400">
            Nashik Distribution Hub
          </div>
        </div>
      </Html>
    </group>
  )
}

/* ---------------------------------------------------------------------- */
/* Transit */
/* ---------------------------------------------------------------------- */

function TransitModel({
  selected,
  onClick,
}: {
  selected: boolean
  onClick: () => void
}) {
  return (
    <group
      position={[
        TRANSIT.x,
        0,
        TRANSIT.z,
      ]}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <mesh
        position={[0, 2.5, 0]}
        castShadow
      >
        <boxGeometry args={[10, 5, 8]} />

        <meshStandardMaterial
          color="#1e293b"
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[11, 0.8, 9]} />

        <meshStandardMaterial
          color="#475569"
        />
      </mesh>

      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[8, 9, 48]} />

          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      <Html
        position={[0, 8, 0]}
        center
        distanceFactor={40}
      >
        <div
          className="
            rounded-xl
            border
            border-amber-400/50
            bg-slate-950/95
            px-3
            py-1.5
            text-[10px]
            uppercase
            tracking-[0.18em]
            text-amber-300
          "
        >
          TRANSIT HUB
        </div>
      </Html>
    </group>
  )
}

/* ---------------------------------------------------------------------- */
/* Port */
/* ---------------------------------------------------------------------- */

function PortModel({
  selected,
  onClick,
}: {
  selected: boolean
  onClick: () => void
}) {
  return (
    <group
      position={[
        PORT.x,
        0,
        PORT.z,
      ]}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      {/* dock */}
      <mesh
        position={[0, 1, 0]}
        castShadow
      >
        <boxGeometry args={[20, 2, 14]} />

        <meshStandardMaterial
          color="#334155"
          metalness={0.45}
          roughness={0.55}
        />
      </mesh>

      {/* containers */}
      {[-6, 0, 6].map((x) => (
        <mesh
          key={x}
          position={[x, 2.5, 2]}
        >
          <boxGeometry args={[4, 2.5, 3]} />

          <meshStandardMaterial
            color="#f59e0b"
            roughness={0.55}
          />
        </mesh>
      ))}

      {/* cranes */}
      {[-6, 6].map((x) => (
        <group
          key={`crane-${x}`}
          position={[x, 0, -3]}
        >
          <mesh
            position={[0, 6, 0]}
          >
            <boxGeometry args={[0.7, 12, 0.7]} />

            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.6}
            />
          </mesh>

          <mesh
            position={[3, 10, 0]}
          >
            <boxGeometry args={[6, 0.5, 0.5]} />

            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.5}
            />
          </mesh>
        </group>
      ))}

      {selected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.2, 0]}
        >
          <ringGeometry args={[14, 15, 64]} />

          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      <Html
        position={[0, 15, 0]}
        center
        distanceFactor={40}
      >
        <div
          className="
            rounded-xl
            border
            border-sky-400/50
            bg-slate-950/95
            px-3
            py-1.5
            text-center
            text-[10px]
            uppercase
            tracking-[0.18em]
            text-sky-300
          "
        >
          PORT
          <div className="mt-1 text-[8px] text-slate-400">
            Nhava Sheva
          </div>
        </div>
      </Html>
    </group>
  )
}

/* ---------------------------------------------------------------------- */
/* World */
/* ---------------------------------------------------------------------- */

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

export function LogisticsWorld({
  progress,
  highlightTruck = false,
  followCamera = false,
  showTerrain = true,
  showRoad = true,
  showBuildings = true,
  showRoute = true,
  showTruck = true,
  showLabels = true,
  onSelectNode,
  onSelectTruck,
  label = 'AS-1042',
  worldScale = 1,
}: LogisticsWorldProps) {
  const controlsRef = useRef<any>(null)

  const truckPosition = useMemo(
    () => getLogisticsTruckPosition(progress),
    [progress],
  )

  useFrame((state, delta) => {
    if (!controlsRef.current) return

    if (followCamera || highlightTruck) {
      const target = new THREE.Vector3(
        truckPosition.x,
        truckPosition.y,
        truckPosition.z,
      )

      const desiredCamera = new THREE.Vector3(
        truckPosition.x + 25,
        truckPosition.y + 20,
        truckPosition.z + 28,
      )

      state.camera.position.lerp(
        desiredCamera,
        1 - Math.exp(-delta * 1.8),
      )

      controlsRef.current.target.lerp(
        target,
        1 - Math.exp(-delta * 2),
      )

      controlsRef.current.update()
    }
  })

  const factoryNode =
    LOGISTICS_NODES.find(
      (node) => node.type === 'FACTORY',
    )

  const warehouseNode =
    LOGISTICS_NODES.find(
      (node) => node.type === 'WAREHOUSE',
    )

  const transitNode =
    LOGISTICS_NODES.find(
      (node) => node.type === 'TRANSIT',
    )

  const portNode =
    LOGISTICS_NODES.find(
      (node) =>
        node.name === 'Nhava Sheva Port',
    )

  return (
    <>
      <color
        attach="background"
        args={['#020617']}
      />

      <fog
        attach="fog"
        args={[
          '#020617',
          100,
          240,
        ]}
      />

      <ambientLight intensity={1.4} />

      <directionalLight
        castShadow
        position={[30, 80, 30]}
        intensity={2.4}
      />

      <pointLight
        position={[-50, 20, -20]}
        intensity={3}
        color="#22d3ee"
      />

      <pointLight
        position={[55, 20, -20]}
        intensity={2.5}
        color="#f59e0b"
      />

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={30}
        maxDistance={190}
        maxPolarAngle={Math.PI * 0.48}
      />

      <group scale={worldScale}>
        {showTerrain && <Ground />}
        {showRoad && <LogisticsRoad />}

      {/* route waypoint lights */}
      {showRoute &&
        ROUTE_POINTS.map(
          (point, index) => (
            <group
              key={index}
              position={[
                point.x,
                0.5,
                point.z,
              ]}
            >
              <mesh>
                <sphereGeometry
                  args={[0.45, 16, 16]}
                />

                <meshBasicMaterial
                  color="#22d3ee"
                />
              </mesh>

              <mesh
                rotation={[
                  -Math.PI / 2,
                  0,
                  0,
                ]}
              >
                <ringGeometry
                  args={[1.5, 1.7, 32]}
                />

                <meshBasicMaterial
                  color="#22d3ee"
                  transparent
                  opacity={0.3}
                />
              </mesh>
            </group>
          ),
        )}

      {showBuildings && (
        <>
          <FactoryModel
            selected={false}
            onClick={() => {
              if (factoryNode) {
                onSelectNode?.(factoryNode)
              }
            }}
          />

          <WarehouseModel
            selected={false}
            onClick={() => {
              if (warehouseNode) {
                onSelectNode?.(warehouseNode)
              }
            }}
          />

          <TransitModel
            selected={false}
            onClick={() => {
              if (transitNode) {
                onSelectNode?.(transitNode)
              }
            }}
          />

          <PortModel
            selected={false}
            onClick={() => {
              if (portNode) {
                onSelectNode?.(portNode)
              }
            }}
          />
        </>
      )}

      {showTruck && (
        <Truck
          progress={progress}
          selected={highlightTruck}
          onClick={onSelectTruck}
          label={label}
        />
      )}

        {showLabels && (
          <Html
            position={[0, 18, 0]}
            center
            distanceFactor={80}
          >
            <div
              className="
                pointer-events-none
                rounded-full
                border
                border-cyan-400/30
                bg-slate-950/90
                px-4
                py-2
                text-[10px]
                uppercase
                tracking-[0.25em]
                text-cyan-200
              "
            >
              FIN-SENSE LOGISTICS DIGITAL TWIN
            </div>
          </Html>
        )}
      </group>
    </>
  )
}
