import { useState, useEffect } from 'react'
import { Menu, Wifi, WifiOff } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuToggle: () => void
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const [connected, setConnected] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    // WebSocket connection status
    let ws: WebSocket | null = null
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      ws = new WebSocket(`${protocol}://${window.location.hostname}:8000/ws/events`)
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)
    } catch {
      setConnected(false)
    }

    // Clock
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      )
    }
    tick()
    const timer = setInterval(tick, 1000)

    return () => {
      ws?.close()
      clearInterval(timer)
    }
  }, [])

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-100">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-slate-500">{time}</span>
        <div
          className={`flex items-center gap-1.5 text-xs ${
            connected ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          {connected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span>{connected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>
    </header>
  )
}
