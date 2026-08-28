import { Vector3 } from 'three'
import type { SpatialNode, SpatialRoute, SpatialRouteSegment } from './spatialTypes'

export const PORT_NODE: SpatialNode = {
  id: 'port',
  name: 'Port Terminal',
  type: 'PORT',
  latitude: 13.0827,
  longitude: 80.2707,
  status: 'OPERATIONAL',
  assetId: 'AS-1042',
  value: 14200000,
  risk: 'LOW',
  financing: 4200000,
  model: 'port',
}

export const FACTORY_NODE: SpatialNode = {
  id: 'factory',
  name: 'Factory Hub',
  type: 'FACTORY',
  latitude: 13.1002,
  longitude: 80.2873,
  status: 'OPERATIONAL',
  assetId: 'AS-1042',
  value: 18000000,
  risk: 'LOW',
  financing: 5200000,
  model: 'factory',
}

export const WAREHOUSE_NODE: SpatialNode = {
  id: 'warehouse',
  name: 'Warehouse Distribution',
  type: 'WAREHOUSE',
  latitude: 13.1234,
  longitude: 80.3091,
  status: 'OPERATIONAL',
  assetId: 'AS-1042',
  value: 22000000,
  risk: 'MEDIUM',
  financing: 7600000,
  model: 'warehouse',
}

export const SPATIAL_NODES: SpatialNode[] = [PORT_NODE, FACTORY_NODE, WAREHOUSE_NODE]

export const LOGISTICS_ROUTE_COORDINATES: Array<[number, number]> = [
  [13.0827, 80.2707],
  [13.0889, 80.2764],
  [13.0912, 80.2822],
  [13.0978, 80.2849],
  [13.1015, 80.2871],
  [13.1062, 80.2913],
  [13.1107, 80.2965],
  [13.1161, 80.3012],
  [13.1204, 80.3058],
  [13.1234, 80.3091],
]

export const LOGISTICS_ROUTE_SEGMENTS: SpatialRouteSegment[] = [
  {
    from: 'port',
    to: 'factory',
    points: LOGISTICS_ROUTE_COORDINATES.slice(0, 5),
    status: 'ACTIVE',
  },
  {
    from: 'factory',
    to: 'warehouse',
    points: LOGISTICS_ROUTE_COORDINATES.slice(4),
    status: 'NORMAL',
  },
]

export const SPATIAL_ROUTE: SpatialRoute = {
  id: 'chennai-corridor',
  name: 'Chennai Logistics Corridor',
  nodes: ['port', 'factory', 'warehouse'],
  status: 'ONGOING',
  vehicle: {
    id: 'AS-1042',
    type: 'TRUCK',
    progress: 0.42,
    speed: 26,
  },
}

export const LOGISTICS_ROUTE_POINTS_3D = [
  new Vector3(-72, 0.6, 46),
  new Vector3(-54, 1, 36),
  new Vector3(-30, 1.2, 22),
  new Vector3(-8, 1.4, 8),
  new Vector3(12, 1.3, 0),
  new Vector3(16, 0.6, 8),
  new Vector3(32, 1.1, -10),
  new Vector3(52, 1.2, -28),
  new Vector3(64, 1.1, -40),
  new Vector3(76, 0.8, -54),
]
