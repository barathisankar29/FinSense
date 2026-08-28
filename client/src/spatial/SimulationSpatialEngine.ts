export type SimulationEventType =
  | 'DELAY'
  | 'ACCIDENT'
  | 'WEATHER'
  | 'ROUTE_BLOCK'
  | 'PRICE_DROP'
  | 'BUYER_DEFAULT'
  | 'FINANCING_CHANGE'
  | 'RISK_SPIKE'

export type SimulationEvent = {
  time: number
  assetId: string
  type: SimulationEventType
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  parameters: Record<string, number | string>
}

export function generateSimulationEvents(assetId: string): SimulationEvent[] {
  return [
    { time: 3, assetId, type: 'DELAY', severity: 'MEDIUM', parameters: { minutes: 18 } },
    { time: 9, assetId, type: 'RISK_SPIKE', severity: 'HIGH', parameters: { scoreDelta: 12 } },
    { time: 14, assetId, type: 'FINANCING_CHANGE', severity: 'MEDIUM', parameters: { exposure: 0.04 } },
  ]
}

export function getSimulationTimeline(totalMinutes = 30) {
  return Array.from({ length: totalMinutes + 1 }, (_, index) => ({
    time: index,
    label: `${String(Math.floor(index / 60)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
  }))
}
