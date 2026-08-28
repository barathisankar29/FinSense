import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-center">
      <div className="text-4xl font-bold text-white">404</div>
      <div className="mt-3 text-lg text-slate-200">This FinSense route was not found.</div>
      <Link to="/dashboard" className="mt-5 inline-block rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Return to dashboard</Link>
    </div>
  )
}
