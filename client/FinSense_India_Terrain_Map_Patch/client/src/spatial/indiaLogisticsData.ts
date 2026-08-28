export type LogisticsNodeType = 'FACTORY' | 'WAREHOUSE' | 'TRANSIT' | 'PORT' | 'CITY'

export type LogisticsNode = {
  id: string
  name: string
  shortName: string
  type: LogisticsNodeType
  lat: number
  lng: number
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL'
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  capacity: string
  exposure: string
  assetIds: string[]
}

export type LogisticsRoute = {
  id: string
  name: string
  points: Array<[number, number]>
  active?: boolean
  assetId?: string
}

export const INDIA_MAP_CENTER = { lat: 22.8, lng: 78.8 }

export const LOGISTICS_NODES: LogisticsNode[] = [
  {
    id: 'ahmedabad-factory',
    name: 'Ahmedabad Plant',
    shortName: 'AHMEDABAD',
    type: 'FACTORY',
    lat: 23.0225,
    lng: 72.5714,
    status: 'OPERATIONAL',
    risk: 'LOW',
    capacity: '5,000 units/mo',
    exposure: '₹1.42 Cr',
    assetIds: ['AS-1042'],
  },
  {
    id: 'nashik-warehouse',
    name: 'Nashik Distribution Hub',
    shortName: 'NASHIK',
    type: 'WAREHOUSE',
    lat: 20.0059,
    lng: 73.791,
    status: 'OPERATIONAL',
    risk: 'MEDIUM',
    capacity: '12,500 units',
    exposure: '₹2.15 Cr',
    assetIds: ['AS-1042'],
  },
  {
    id: 'mumbai-transit',
    name: 'Mumbai Transit Hub',
    shortName: 'MUMBAI',
    type: 'TRANSIT',
    lat: 19.076,
    lng: 72.8777,
    status: 'OPERATIONAL',
    risk: 'LOW',
    capacity: '2,000 movements/day',
    exposure: '₹3.10 Cr',
    assetIds: [],
  },
  {
    id: 'nhava-sheva-port',
    name: 'Nhava Sheva Port',
    shortName: 'NHAVA SHEVA',
    type: 'PORT',
    lat: 18.9496,
    lng: 72.952,
    status: 'OPERATIONAL',
    risk: 'LOW',
    capacity: '2.8M TEU',
    exposure: '₹3.40 Cr',
    assetIds: [],
  },
  {
    id: 'delhi-hub',
    name: 'Delhi NCR Hub',
    shortName: 'DELHI NCR',
    type: 'CITY',
    lat: 28.6139,
    lng: 77.209,
    status: 'OPERATIONAL',
    risk: 'LOW',
    capacity: '18,000 units',
    exposure: '₹1.80 Cr',
    assetIds: [],
  },
  {
    id: 'hyderabad-hub',
    name: 'Hyderabad Transit',
    shortName: 'HYDERABAD',
    type: 'CITY',
    lat: 17.385,
    lng: 78.4867,
    status: 'OPERATIONAL',
    risk: 'LOW',
    capacity: '9,000 units',
    exposure: '₹1.25 Cr',
    assetIds: [],
  },
  {
    id: 'bengaluru-hub',
    name: 'Bengaluru Distribution',
    shortName: 'BENGALURU',
    type: 'CITY',
    lat: 12.9716,
    lng: 77.5946,
    status: 'OPERATIONAL',
    risk: 'LOW',
    capacity: '14,000 units',
    exposure: '₹2.06 Cr',
    assetIds: [],
  },
  {
    id: 'chennai-port',
    name: 'Chennai Port',
    shortName: 'CHENNAI',
    type: 'PORT',
    lat: 13.0827,
    lng: 80.2707,
    status: 'OPERATIONAL',
    risk: 'MEDIUM',
    capacity: '1.8M TEU',
    exposure: '₹2.84 Cr',
    assetIds: [],
  },
]

export const ACTIVE_ROUTE: LogisticsRoute = {
  id: 'as-1042-corridor',
  name: 'AS-1042 Ahmedabad → Nashik → Nhava Sheva',
  active: true,
  assetId: 'AS-1042',
  points: [
    [23.0225, 72.5714],
    [22.73, 72.65],
    [22.35, 72.9],
    [21.9, 73.25],
    [21.45, 73.55],
    [20.95, 73.72],
    [20.0059, 73.791],
    [19.55, 73.25],
    [19.076, 72.8777],
    [18.9496, 72.952],
  ],
}

export const NETWORK_ROUTES: LogisticsRoute[] = [
  ACTIVE_ROUTE,
  { id: 'north-west', name: 'Delhi → Ahmedabad', points: [[28.6139, 77.209], [27.2, 76.9], [25.9, 75.8], [24.5, 74.3], [23.0225, 72.5714]] },
  { id: 'south-corridor', name: 'Nhava Sheva → Bengaluru', points: [[18.9496, 72.952], [17.6, 73.4], [16.2, 74.0], [14.8, 75.2], [12.9716, 77.5946]] },
  { id: 'east-corridor', name: 'Hyderabad → Chennai', points: [[17.385, 78.4867], [16.8, 79.2], [15.8, 79.6], [14.7, 80.0], [13.0827, 80.2707]] },
  { id: 'central-branch', name: 'Nashik → Hyderabad', points: [[20.0059, 73.791], [19.0, 75.0], [18.2, 76.5], [17.385, 78.4867]] },
]
