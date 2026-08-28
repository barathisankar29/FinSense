import { useEffect, useState } from 'react'
import { fetchCurrentUser, fetchHealth, loginUser } from '../services/api'
import type { User } from '../types'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [health, setHealth] = useState<{ status: string; service: string; version: string; assets_tracked: number } | null>(null)
  const [email, setEmail] = useState('executive@finsense.ai')
  const [role, setRole] = useState('Executive')

  useEffect(() => {
    const load = async () => {
      const [current, service] = await Promise.all([fetchCurrentUser(), fetchHealth()])
      setUser(current)
      setHealth(service)
    }
    void load()
  }, [])

  const handleLogin = async () => {
    const result = await loginUser(email, role)
    setUser(result.user)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 text-lg font-semibold text-slate-100">Settings</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="font-medium text-slate-100">Current user</div>
            <div className="mt-2 text-sm text-slate-300">{user ? `${user.name} · ${user.role}` : 'Loading…'}</div>
            <div className="mt-1 text-xs text-slate-500">{user?.email}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="font-medium text-slate-100">API health</div>
            <div className="mt-2 text-sm text-emerald-300">{health?.status ?? 'Checking…'}</div>
            <div className="mt-1 text-xs text-slate-500">{health ? `${health.service} · ${health.version}` : '…'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 text-lg font-semibold text-slate-100">Operator login</div>
        <div className="grid gap-3 md:grid-cols-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" placeholder="Email" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            <option>Executive</option>
            <option>Financier</option>
            <option>Supply Chain Manager</option>
            <option>Business</option>
            <option>Admin</option>
          </select>
          <button type="button" onClick={() => void handleLogin()} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Switch profile</button>
        </div>
      </div>
    </div>
  )
}
