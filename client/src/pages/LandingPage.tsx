import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const metrics = [
  { value: '₹2.84Cr', label: 'Portfolio value' },
  { value: '₹86L', label: 'Available financing' },
  { value: '82%', label: 'Operating efficiency' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FinSense logo" className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-700" />
            <div>
              <div className="text-lg font-semibold">FinSense</div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Working capital intelligence</div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/architecture" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">View architecture</Link>
            <Link to="/dashboard" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900">Open portfolio</Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-slate-300">Supply chain finance</div>
            <h1 className="max-w-xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">
              Money follows the asset.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-300">
              FinSense connects physical asset movement, risk, and financing decisions in one operating view for lenders, traders, and treasury teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-slate-900">Open portfolio <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/architecture" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-medium text-slate-200">View architecture</Link>
            </div>
            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
              {metrics.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 border-b border-slate-800 pb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Lifecycle financing</div>
            <div className="space-y-4">
              {['Purchase order', 'Production', 'Transit', 'Invoice', 'Cash realisation'].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${index === 0 || index === 4 ? 'border-slate-500 bg-slate-800 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">{step}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Portfolio transition</div>
              <div>PO financing → inventory → receivables → settlement</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
