import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import DataPipeline from './DataPipeline.jsx'
import { fmt } from '../analytics/util.js'

export const STAGES = ['SOURCE', 'INGEST', 'CLEAN', 'TRANSFORM', 'ANALYZE', 'VISUALIZE', 'DECIDE']

/** Reusable BEHIND THE DATA panel. `stage` 0-7 (7 = all done). */
export default function BehindTheData({ stage = -1, records = 0, transform, algorithm, result, why, learnMore, steps }) {
  const [open, setOpen] = useState(false)
  const current = stage >= 0 && stage < STAGES.length ? STAGES[stage] : stage >= STAGES.length ? 'COMPLETE' : 'WAITING'
  return (
    <section aria-labelledby="btd-title" className="card">
      <h2 id="btd-title" className="mb-3 text-2xl font-black tracking-wide">BEHIND THE DATA</h2>
      <DataPipeline stages={STAGES} active={stage} label="Behind the data stages" />
      <dl className="mt-4 grid gap-3 text-base sm:grid-cols-2">
        <div><dt className="tag">Records</dt><dd className="font-bold">{fmt(records)}</dd></div>
        <div><dt className="tag">Current stage</dt><dd className="font-bold">{current}</dd></div>
        <div><dt className="tag">Transformation</dt><dd>{transform || '—'}</dd></div>
        <div><dt className="tag">Calculation</dt><dd>{algorithm || '—'}</dd></div>
        <div><dt className="tag">Result</dt><dd className="font-bold text-discover">{result || 'Pending…'}</dd></div>
        <div><dt className="tag">Why it matters</dt><dd>{why || '—'}</dd></div>
      </dl>
      <button type="button" className="btn mt-4" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        LEARN MORE <ChevronDown aria-hidden="true" size={20} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="mt-3 rounded-2xl bg-card2 p-4 text-base leading-relaxed">
          <p>{learnMore || 'Every result on this screen is calculated from the synthetic records generated in your browser.'}</p>
          {steps && <ul className="mt-2 list-disc pl-6">{steps.map((s) => <li key={s}>{s}</li>)}</ul>}
        </div>
      )}
    </section>
  )
}
