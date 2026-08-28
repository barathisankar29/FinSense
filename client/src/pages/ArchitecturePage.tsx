import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const stages = [
  'Data sources',
  'Reconciliation',
  'Asset state',
  'Risk and valuation',
  'Credit decision',
  'Portfolio monitoring',
  'Settlement',
]

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Platform architecture</div>
            <h1 className="mt-2 text-3xl font-bold text-white">How capital follows the asset</h1>
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100">Open portfolio <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage, index) => (
            <div key={stage} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-200">{index + 1}</div>
                {index < stages.length - 1 && <ArrowRight className="h-4 w-4 text-slate-500" />}
              </div>
              <div className="text-lg font-semibold text-white">{stage}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 text-lg font-semibold text-slate-100">Core operating model</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              'Asset lifecycle visibility from PO to cash settlement',
              'Event-driven financing reassessment based on real movement',
              'Exposure guardrails and concentration limits built in',
              'Operational data reconciliation across internal and external sources',
              'Transparent risk and financing rationale for decision-makers',
              'Portfolio controls designed for working capital teams',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
