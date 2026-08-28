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

/*
 * FinSense API configuration
 *
 * Production backend:
 * https://finsense-api-15lk.onrender.com
 *
 * Local development:
 * http://localhost:8000
 *
 * You can override the production URL using:
 * VITE_API_BASE_URL
 */

const API_BASE =
  (
    import.meta.env.VITE_API_BASE_URL ||
    'https://finsense-api-15lk.onrender.com/api'
  ).replace(/\/+$/, '')

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  if (!res.ok) {
    const payload = await res
      .json()
      .catch(() => ({ detail: res.statusText }))

    throw new Error(
      payload.detail ||
        payload.message ||
        res.statusText ||
        'Request failed',
    )
  }

  const json = await res.json()

  return json.data ?? json
}

/* =========================================================
   DASHBOARD
   ========================================================= */

export function fetchDashboard(): Promise<DashboardMetrics> {
  return request('/dashboard')
}

/* =========================================================
   ASSETS
   ========================================================= */

export function fetchAssets(
  filters?: {
    stage?: string
    risk?: string
    category?: string
    search?: string
  },
): Promise<Asset[]> {
  const params = new URLSearchParams()

  if (filters?.stage) {
    params.set('stage', filters.stage)
  }

  if (filters?.risk) {
    params.set('risk', filters.risk)
  }

  if (filters?.category) {
    params.set('category', filters.category)
  }

  if (filters?.search) {
    params.set('search', filters.search)
  }

  const qs = params.toString()

  return request<Asset[] | { data?: Asset[]; assets?: Asset[]; items?: Asset[] }>(
    `/assets${qs ? `?${qs}` : ''}`,
  ).then((payload) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.assets)) return payload.assets
    if (Array.isArray(payload?.items)) return payload.items
    return []
  })
}

export function fetchAsset(
  id: string,
): Promise<Asset> {
  return request(
    `/assets/${encodeURIComponent(id)}`,
  )
}

/* =========================================================
   SIMULATION
   ========================================================= */

export function simulateScenario(
  assetId: string,
  preset: string,
  customParams?: {
    customDaysDelay?: number
    customDamagePct?: number
    customBuyerRiskIncrease?: number
    customInvoiceLagDays?: number
  },
): Promise<SimulationResponse> {
  return request(
    `/assets/${encodeURIComponent(assetId)}/simulate`,
    {
      method: 'POST',
      body: JSON.stringify({
        preset,
        ...customParams,
      }),
    },
  )
}

export function applySimulation(
  assetId: string,
  preset: string,
): Promise<{
  success: boolean
  assetId: string
  applied: boolean
  result: SimulationResponse
}> {
  return request(
    `/simulation/${encodeURIComponent(assetId)}/apply`,
    {
      method: 'POST',
      body: JSON.stringify({
        preset,
      }),
    },
  )
}

/* =========================================================
   FINANCING
   ========================================================= */

export function attemptFinancing(
  assetId: string,
  provider: string,
  requestedAmount: number,
  instrument: string,
): Promise<FinancingAttemptResponse> {
  return request(
    `/assets/${encodeURIComponent(assetId)}/financing/attempt`,
    {
      method: 'POST',
      body: JSON.stringify({
        assetId,
        provider,
        requestedAmount,
        instrument,
      }),
    },
  )
}

/* =========================================================
   ALERTS
   ========================================================= */

export function fetchAlerts(): Promise<AlertItem[]> {
  return request('/alerts')
}

export function acknowledgeAlert(
  alertId: string,
): Promise<{
  success: boolean
  alertId: string
  status: string
}> {
  return request(
    `/alerts/${encodeURIComponent(alertId)}/acknowledge`,
    {
      method: 'POST',
    },
  )
}

export function resolveAlert(
  alertId: string,
): Promise<{
  success: boolean
  alertId: string
  status: string
}> {
  return request(
    `/alerts/${encodeURIComponent(alertId)}/resolve`,
    {
      method: 'POST',
    },
  )
}

/* =========================================================
   AUDIT
   ========================================================= */

export function fetchAuditTrail(): Promise<AuditEntry[]> {
  return request('/audit')
}

/* =========================================================
   RECONCILIATION
   ========================================================= */

export function fetchReconciliation(): Promise<
  Array<{
    assetId: string
    field: string
    sourceA: string
    sourceB: string
    valueA: string
    valueB: string
    status: string
    resolution: string
  }>
> {
  return request('/reconciliation')
}

export function resolveReconciliation(
  assetId: string,
  status = 'RESOLVED',
): Promise<{
  success: boolean
  assetId: string
  status: string
}> {
  return request(
    `/reconciliation/${encodeURIComponent(assetId)}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify({
        status,
      }),
    },
  )
}

/* =========================================================
   AI COPILOT
   ========================================================= */

export function chatWithCopilot(
  message: string,
  assetId?: string,
  role = 'Executive',
): Promise<CopilotResponse> {
  return request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      assetId,
      role,
    }),
  })
}

/* =========================================================
   AUTHENTICATION
   ========================================================= */

export function fetchCurrentUser(): Promise<User> {
  return request('/auth/me')
}

export function loginUser(
  email: string,
  role = 'Executive',
): Promise<{
  user: User
  token: string
}> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      role,
    }),
  })
}

export function logoutUser(): Promise<{
  success: boolean
  message: string
}> {
  return request('/auth/logout', {
    method: 'POST',
  })
}

/* =========================================================
   ASSET LIFECYCLE
   ========================================================= */

export function advanceStage(
  assetId: string,
  targetStage?: string,
): Promise<{
  status: string
  newStage: string
  recommendedAction: string
}> {
  const params = targetStage
    ? `?target_stage=${encodeURIComponent(targetStage)}`
    : ''

  return request(
    `/assets/${encodeURIComponent(assetId)}/advance${params}`,
    {
      method: 'POST',
    },
  )
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

export function fetchHealth(): Promise<{
  status: string
  service: string
  version: string
  assets_tracked: number
  timestamp?: string
}> {
  return request('/health')
}

/* =========================================================
   EVIDENCE
   ========================================================= */

export function fetchEvidence(
  assetId: string,
): Promise<{
  assetId: string

  dataSources: Array<{
    source: string
    field: string
    value: string
    confidence: number
    timestamp: string
    verified: boolean
  }>

  conflicts: Array<{
    field: string
    sourceA: string
    valueA: string
    sourceB: string
    valueB: string
    discrepancy: string
    resolution: string
    confidence: number
  }>

  decisionTrail: Array<{
    time: string
    event: string
    description: string
    dataSources: string[]
    confidence: number
    impact: string
  }>

  verificationConfidence: number
}> {
  return request(
    `/assets/${encodeURIComponent(assetId)}/evidence`,
  )
}

/* =========================================================
   WEBSOCKET
   ========================================================= */

export function createWebSocketConnection(
  onMessage: (event: WebSocketEvent) => void,
): WebSocket {
  const configuredWsBase =
    import.meta.env.VITE_WS_BASE_URL

  let wsUrl: string

  if (configuredWsBase) {
    wsUrl = `${configuredWsBase.replace(
      /\/+$/,
      '',
    )}/ws/events`
  } else {
    /*
     * Automatically convert the Render HTTPS API
     * into a secure WebSocket URL.
     *
     * https://finsense-api-15lk.onrender.com
     * ->
     * wss://finsense-api-15lk.onrender.com
     */

    const apiUrl = API_BASE.replace(
      /\/api$/,
      '',
    )

    wsUrl = apiUrl
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:')

    wsUrl = `${wsUrl}/ws/events`
  }

  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    try {
      const parsed =
        JSON.parse(event.data) as WebSocketEvent

      onMessage(parsed)
    } catch {
      onMessage({
        type: 'SYSTEM_ERROR',
        timestamp: new Date().toISOString(),
        assetId: '',
        payload: {
          message: event.data,
        },
      })
    }
  }

  ws.onerror = () => {
    onMessage({
      type: 'SYSTEM_ERROR',
      timestamp: new Date().toISOString(),
      assetId: '',
      payload: {
        message: 'WebSocket connection failed.',
      },
    })
  }

  return ws
}

/* =========================================================
   EXPORT API BASE FOR DEBUGGING
   ========================================================= */

export { API_BASE }