export type SpatialNodeType = 'PORT' | 'FACTORY' | 'WAREHOUSE' | 'TRANSIT' | 'DELIVERY'

export type SpatialStatus = 'OPERATIONAL' | 'WARNING' | 'CRITICAL' | 'ARRIVED'

export type SpatialJourneyState = 'BEFORE_START' | 'ONGOING' | 'STOPPING' | 'FINAL_ARRIVED'

export interface SpatialNode {
  id: string
  name: string
  type: SpatialNodeType
  latitude: number
  longitude: number
  status: SpatialStatus
  assetId?: string
  value?: number
  risk?: string
  financing?: number
  model?: string
}

export interface SpatialRoute {
  id: string
  name: string
  nodes: string[]
  status: 'BEFORE' | 'ONGOING' | 'STOPPING' | 'FINAL'
  vehicle?: {
    id: string
    type: 'TRUCK'
    progress: number
    speed: number
  }
}

export interface SpatialRouteSegment {
  from: string
  to: string
  points: Array<[number, number]>
  status: 'NORMAL' | 'ACTIVE' | 'CRITICAL' | 'COMPLETED'
}
