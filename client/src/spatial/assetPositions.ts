export const ASSET_LOCATION_MAP = {
  port: { label: 'Port Terminal', latitude: 13.0827, longitude: 80.2707 },
  factory: { label: 'Factory Hub', latitude: 13.1002, longitude: 80.2873 },
  warehouse: { label: 'Warehouse Distribution', latitude: 13.1234, longitude: 80.3091 },
} as const

export const ASSET_ROUTE_STATUS = {
  ALL: 'all',
  ACTIVE: 'active',
  'AT RISK': 'risk',
  'IN TRANSIT': 'transit',
  ARRIVED: 'arrived',
} as const
