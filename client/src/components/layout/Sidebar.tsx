import {
  LayoutDashboard,
  Boxes,
  FlaskConical,
  AlertTriangle,
  Bot,
  Map,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hash: 'dashboard' },
  { id: 'assets', label: 'Assets', icon: Boxes, hash: 'assets' },
  { id: 'simulation', label: 'Simulation', icon: FlaskConical, hash: 'simulation' },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, hash: 'alerts' },
  { id: 'copilot', label: 'AI Copilot', icon: Bot, hash: 'copilot' },
  { id: 'map', label: 'Asset Map', icon: Map, hash: 'map' },
  { id: 'audit', label: 'Audit Trail', icon: ClipboardList, hash: 'audit' },
]

interface SidebarProps {
  activePage: string
  open: boolean
  onToggle: () => void
}

export default function Sidebar({ activePage, open, onToggle }: SidebarProps) {
  const navigate = useNavigate()

  return (
    <aside
      className={`${
        open ? 'w-56' : 'w-16'
      } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 shrink-0`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-800">
        <img src="/logo.png" alt="FinSense logo" className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-slate-700" />
        {open && (
          <span className="text-sm font-bold text-white tracking-wide">
            FinSense
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            activePage === item.id ||
            (item.id === 'assets' && activePage === 'asset')
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.hash)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'bg-cyan-600/15 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={!open ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {open && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="h-10 flex items-center justify-center border-t border-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  )
}
