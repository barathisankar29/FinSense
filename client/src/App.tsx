import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Settings as SettingsIcon, ShieldCheck, UserCircle2 } from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import AssetListPage from './pages/AssetListPage'
import AssetDetailPage from './pages/AssetDetailPage'
import SimulationPage from './pages/SimulationPage'
import AlertsPage from './pages/AlertsPage'
import CopilotPage from './pages/CopilotPage'
import MapPage from './pages/MapPage'
import ReconciliationPage from './pages/ReconciliationPage'
import FinancingPage from './pages/FinancingPage'
import AuditPage from './pages/AuditPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import LandingPage from './pages/LandingPage'
import ArchitecturePage from './pages/ArchitecturePage'
import ARViewPage from './pages/ARViewPage'
import DigitalTwinPage from './pages/DigitalTwinPage'

const navItems = [
  { path: '/dashboard', label: 'Overview' },
  { path: '/assets', label: 'Portfolio' },
  { path: '/digital-twin', label: 'Digital Twin' },
  { path: '/map', label: 'Map' },
  { path: '/simulation', label: 'Simulation' },
  { path: '/financing', label: 'Financing' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/reconciliation', label: 'Reconciliation' },
  { path: '/copilot', label: 'Advisor' },
  { path: '/audit', label: 'Audit' },
  { path: '/settings', label: 'Settings' },
]

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = () => {
    const trimmed = searchValue.trim()
    if (!trimmed) {
      navigate('/assets')
      return
    }
    navigate(`/assets?search=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} border-r border-slate-800 bg-slate-950 transition-all duration-200 px-3 py-4`}>
        <div className="mb-6 flex items-center gap-3 px-2">
          <img src="/logo.png" alt="FinSense logo" className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-700" />
          {sidebarOpen && <div className="text-lg font-semibold tracking-tight">FinSense</div>}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path === '/assets' && location.pathname.startsWith('/assets'))
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'bg-cyan-600/15 text-cyan-300 ring-1 ring-cyan-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
              >
                <ShieldCheck className="h-4 w-4" />
                {sidebarOpen && item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen((v) => !v)} className="rounded-lg border border-slate-700 p-2 text-slate-300 lg:hidden">
                ☰
              </button>
              <div className="text-lg font-semibold text-slate-100">
                {navItems.find((item) => location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/'))?.label || 'FinSense'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400">
                <Search className="h-4 w-4" />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSearch()
                  }}
                  placeholder="Search assets"
                  className="w-28 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <button type="button" onClick={handleSearch} className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                  Go
                </button>
              </div>
              <button type="button" onClick={() => navigate('/alerts')} className="relative rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400" />
              </button>
              <button type="button" onClick={() => navigate('/settings')} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white">
                <UserCircle2 className="h-4 w-4" />
                Executive
              </button>
              <button type="button" onClick={() => navigate('/settings')} className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
                <SettingsIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assets" element={<AssetListPage />} />
            <Route path="/assets/:assetId" element={<AssetDetailPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/3d-site" element={<DigitalTwinPage />} />
            <Route path="/financing" element={<FinancingPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/ar" element={<ARViewPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isStandalonePage = ['/landing', '/architecture'].includes(location.pathname)

  if (isStandalonePage) {
    return (
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/dashboard" element={<AppShell />} />
        <Route path="/assets" element={<AppShell />} />
        <Route path="/assets/:assetId" element={<AppShell />} />
        <Route path="/digital-twin" element={<AppShell />} />
        <Route path="/3d-site" element={<AppShell />} />
        <Route path="/financing" element={<AppShell />} />
        <Route path="/simulation" element={<AppShell />} />
        <Route path="/ar" element={<ARViewPage />} />
        <Route path="/alerts" element={<AppShell />} />
        <Route path="/copilot" element={<AppShell />} />
        <Route path="/map" element={<AppShell />} />
        <Route path="/reconciliation" element={<AppShell />} />
        <Route path="/audit" element={<AppShell />} />
        <Route path="/settings" element={<AppShell />} />
      </Routes>
    )
  }

  return <AppShell />
}
