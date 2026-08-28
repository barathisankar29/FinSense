import type {
  AlertItem,
  Asset,
  AuditEntry,
  CopilotResponse,
  DashboardMetrics,
  FinancingAttemptResponse,
  SimulationResponse,
  User,
  WebSocketEvent,
} from '../types'

const BASE = '/api'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(payload.detail || payload.message || res.statusText || 'Request failed')
  }

  const json = await res.json()
  return json.data ?? json
}

export function fetchDashboard(): Promise<DashboardMetrics> {
  return request('/dashboard')
}

export function fetchAssets(filters?: {
  stage?: string
  risk?: string
  category?: string
  search?: string
}): Promise<Asset[]> {
  const params = new URLSearchParams()
  if (filters?.stage) params.set('stage', filters.stage)
  if (filters?.risk) params.set('risk', filters.risk)
  if (filters?.category) params.set('category', filters.category)
  if (filters?.search) params.set('search', filters.search)
  const qs = params.toString()
  return request(`/assets${qs ? `?${qs}` : ''}`)
}

export function fetchAsset(id: string): Promise<Asset> {
  return request(`/assets/${encodeURIComponent(id)}`)
}

export function simulateScenario(
  assetId: string,
  preset: string,
  customParams?: {
    customDaysDelay?: number
    customDamagePct?: number
    customBuyerRiskIncrease?: number
    customInvoiceLagDays?: number
  }
): Promise<SimulationResponse> {
  return request(`/assets/${encodeURIComponent(assetId)}/simulate`, {
    method: 'POST',
    body: JSON.stringify({ preset, ...customParams }),
  })
}

export function attemptFinancing(
  assetId: string,
  provider: string,
  requestedAmount: number,
  instrument: string
): Promise<FinancingAttemptResponse> {
  return request(`/assets/${encodeURIComponent(assetId)}/financing/attempt`, {
    method: 'POST',
    body: JSON.stringify({ provider, requestedAmount, instrument }),
  })
}

export function fetchAlerts(): Promise<AlertItem[]> {
  return request('/alerts')
}

export function acknowledgeAlert(alertId: string): Promise<{ success: boolean; alertId: string; status: string }> {
  return request(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
    method: 'POST',
  })
}

export function resolveAlert(alertId: string): Promise<{ success: boolean; alertId: string; status: string }> {
  return request(`/alerts/${encodeURIComponent(alertId)}/resolve`, {
    method: 'POST',
  })
}

export function fetchAuditTrail(): Promise<AuditEntry[]> {
  return request('/audit')
}

export function fetchReconciliation(): Promise<Array<{
  assetId: string
  field: string
  sourceA: string
  sourceB: string
  valueA: string
  valueB: string
  status: string
  resolution: string
}>> {
  return request('/reconciliation')
}

export function resolveReconciliation(assetId: string, status = 'RESOLVED'): Promise<{ success: boolean; assetId: string; status: string }> {
  return request(`/reconciliation/${encodeURIComponent(assetId)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export function chatWithCopilot(
  message: string,
  assetId?: string,
  role = 'Executive'
): Promise<CopilotResponse> {
  return request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, assetId, role }),
  })
}

export function fetchCurrentUser(): Promise<User> {
  return request('/auth/me')
}

export function loginUser(email: string, role = 'Executive'): Promise<{ user: User; token: string }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  })
}

export function advanceStage(assetId: string, targetStage?: string): Promise<{ status: string; newStage: string; recommendedAction: string }> {
  const params = targetStage ? `?target_stage=${targetStage}` : ''
  return request(`/assets/${encodeURIComponent(assetId)}/advance${params}`, {
    method: 'POST',
  })
}

export function fetchHealth(): Promise<{ status: string; service: string; version: string; assets_tracked: number }> {
  return request('/health')
}

export function applySimulation(assetId: string, preset: string): Promise<{ success: boolean; assetId: string; applied: boolean; result: SimulationResponse }> {
  return request(`/simulation/${encodeURIComponent(assetId)}/apply`, {
    method: 'POST',
    body: JSON.stringify({ preset }),
  })
}

export function fetchEvidence(assetId: string): Promise<{
  assetId: string
  dataSources: Array<{ source: string; field: string; value: string; confidence: number; timestamp: string; verified: boolean }>
  conflicts: Array<{ field: string; sourceA: string; valueA: string; sourceB: string; valueB: string; discrepancy: string; resolution: string; confidence: number }>
  decisionTrail: Array<{ time: string; event: string; description: string; dataSources: string[]; confidence: number; impact: string }>
  verificationConfidence: number
}> {
  return request(`/assets/${encodeURIComponent(assetId)}/evidence`)
}

export function createWebSocketConnection(onMessage: (event: WebSocketEvent) => void): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws/events`)
  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data) as WebSocketEvent
      onMessage(parsed)
    } catch {
      onMessage({ type: 'SYSTEM_ERROR', timestamp: new Date().toISOString(), assetId: '', payload: { message: event.data } })
    }
  }
  return ws
}
