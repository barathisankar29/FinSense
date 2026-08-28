export type LogisticsLocationType = 'FACTORY' | 'WAREHOUSE' | 'PORT' | 'TRANSIT_HUB'

export type LogisticsLocationStatus = 'OPERATIONAL' | 'WARNING' | 'CRITICAL'

export interface LogisticsLocation {
  id: string
  name: string
  type: LogisticsLocationType
  latitude: number
  longitude: number
  status: LogisticsLocationStatus
  capacity?: number
  exposure?: string
  risk?: string
  assetIds: string[]
}

export const LOGISTICS_LOCATIONS: LogisticsLocation[] = [
  {
    id: 'factory-ahmedabad',
    name: 'Ahmedabad Plant',
    type: 'FACTORY',
    latitude: 23.0225,
    longitude: 72.5714,
    status: 'OPERATIONAL',
    capacity: 5000,
    exposure: '₹1.42 Cr',
    risk: 'LOW',
    assetIds: ['AS-1042'],
  },
  {
    id: 'warehouse-nashik',
    name: 'Nashik Hub',
    type: 'WAREHOUSE',
    latitude: 20.0059,
    longitude: 73.791,
    status: 'OPERATIONAL',
    capacity: 12500,
    exposure: '₹2.15 Cr',
    risk: 'MEDIUM',
    assetIds: ['AS-1042'],
  },
  {
    id: 'port-nhava-sheva',
    name: 'Nhava Sheva Port',
    type: 'PORT',
    latitude: 18.9496,
    longitude: 72.952,
    status: 'OPERATIONAL',
    capacity: 2840,
    exposure: '₹3.40 Cr',
    risk: 'LOW',
    assetIds: [],
  },
  {
    id: 'hub-mumbai',
    name: 'Mumbai Transit Hub',
    type: 'TRANSIT_HUB',
    latitude: 19.076,
    longitude: 72.8777,
    status: 'WARNING',
    capacity: 6800,
    exposure: '₹1.80 Cr',
    risk: 'MEDIUM',
    assetIds: ['AS-1042'],
  },
]

export const LOGISTICS_ROUTE = [
  {
    locationId: 'factory-ahmedabad',
    latitude: 23.0225,
    longitude: 72.5714,
  },
  {
    latitude: 22.3,
    longitude: 72.8,
  },
  {
    latitude: 21.7,
    longitude: 73.0,
  },
  {
    latitude: 20.95,
    longitude: 73.3,
  },
  {
    locationId: 'warehouse-nashik',
    latitude: 20.0059,
    longitude: 73.791,
  },
  {
    locationId: 'port-nhava-sheva',
    latitude: 18.9496,
    longitude: 72.952,
  },
] as const

export function getLogisticsLocationById(id: string) {
  return LOGISTICS_LOCATIONS.find((location) => location.id === id)
}
