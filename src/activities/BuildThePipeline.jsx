import { useState } from 'react'
import ActivityShell from '../components/ActivityShell.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { Stat } from '../components/ui.jsx'
import { PIPELINE_OPTIONS, validatePipeline } from '../analytics/pipelineValidation.js'
import { generateSales, newSeed } from '../generators/syntheticData.js'
import { fmt } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'

const GROUPS = [
  { key: 'sources', label: 'SOURCES (choose any)', multi: true }, { key: 'ingestion', label: 'INGESTION' },
  { key: 'processing', label: 'PROCESSING (choose any)', multi: true }, { key: 'storage', label: 'STORAGE' }, { key: 'destination', label: 'DESTINATION' },
]

export default function BuildThePipeline({ meta, onBack, onComplete, onRestart }) {
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const [cfg, setCfg] = useState({ sources: [], ingestion: null, processing: [], storage: null, destination: null })
  const [step, setStep] = useState(-1)
  const [result, setResult] = useState(null)
  const [records, setRecords] = useState(0)

  const toggle = (g, v) => {
    setResult(null); setStep(-1)
    setCfg((c) => g.multi ? { ...c, [g.key]: c[g.key].includes(v) ? c[g.key].filter((x) => x !== v) : [...c[g.key], v] } : { ...c, [g.key]: v })
  }
  const run = async () => {
    setResult(null)
    const stages = ['sources', 'ingestion', 'processing', 'storage', 'destination']
    for (let i = 0; i < stages.length; i++) { setStep(i); if (!(await wait(500))) return }
    const v = validatePipeline(cfg)
    const total = cfg.sources.length * 2000
    const rows = Array.from({ length: cfg.sources.length }, (_, i) => generateSales(2000, seed + i)).flat()
    setRecords(total ? rows.length : 0)
    setResult({ ...v, revenue: rows.reduce((s, r) => s + r.amount, 0) })
    setStep(5)
  }
  const nodes = [...cfg.sources, cfg.ingestion, ...cfg.processing, cfg.storage, cfg.destination].filter(Boolean)
  const valid = result?.valid

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC SALES FEED']}
      behind={{
        stage: valid ? 7 : step >= 0 ? 3 : 0, records, transform: 'Source data flows through ingestion, processing and storage to a destination',
        algorithm: 'Rule checks: live → streaming, dashboards → aggregation, multiple sources → join, quality → clean/validate',
        result: result ? (valid ? 'PIPELINE VALID' : 'PIPELINE ISSUE') : undefined,
        why: 'Data engineering makes data reliable and timely before analysis begins.',
      }}
      complete={valid && { records, score: 100, takeaway: 'Data engineering connects sources to insight: the right ingestion, processing and storage choices make analytics trustworthy.' }}
    >
      <section className="card">
        <h2 className="text-3xl font-black">BUILD A LIVE SALES DASHBOARD</h2>
        <div className="mt-4 space-y-5">
          {GROUPS.map((g) => (
            <div key={g.key}><h3 className="mb-2 text-lg font-extrabold tracking-wide">{g.label}</h3>
              <div className="flex flex-wrap gap-3" role="group" aria-label={g.label}>
                {PIPELINE_OPTIONS[g.key].map((o) => {
                  const on = g.multi ? cfg[g.key].includes(o) : cfg[g.key] === o
                  return <button key={o} type="button" className="btn" aria-pressed={on} onClick={() => toggle(g, o)}>{on ? '✓ ' : ''}{o.toUpperCase()}</button>
                })}
              </div></div>
          ))}
        </div>
        <button type="button" className="btn btn-primary mt-6" onClick={run} disabled={step >= 0 && step < 5}>BUILD &amp; RUN PIPELINE</button>
      </section>
      <section className="card"><h2 className="mb-2 text-xl font-black">Your pipeline</h2>
        {nodes.length ? <DataPipeline stages={nodes} active={step >= 0 ? Math.min(nodes.length, Math.ceil(((step + 1) / 5) * nodes.length)) : -1} label="Selected pipeline" /> : <p className="text-muted">Tap options above to build your pipeline.</p>}</section>
      {result && (
        <section className={`card ${valid ? 'border-brand' : 'border-warn'}`} role="status">
          <h2 className={`text-3xl font-black ${valid ? 'text-brand' : 'text-warn'}`}>{valid ? '✅ PIPELINE VALID' : '⚠ PIPELINE ISSUE'}</h2>
          {result.issues.length > 0 && <ul className="mt-2 list-disc pl-6 text-lg">{result.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
          {result.notes.map((n) => <p key={n} className="mt-2 text-muted">{n}</p>)}
          {valid && <div className="mt-4 grid gap-3 sm:grid-cols-2"><Stat label="Records delivered" value={fmt(records)} /><Stat label="Synthetic revenue total" value={`$${fmt(result.revenue)}`} /></div>}
          {!valid && <p className="mt-3 text-muted">Change your choices and run again.</p>}
        </section>
      )}
    </ActivityShell>
  )
}
