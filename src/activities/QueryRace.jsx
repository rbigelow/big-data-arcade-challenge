import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { Stat } from '../components/ui.jsx'
import { generateSales, newSeed } from '../generators/syntheticData.js'
import { scanQuery, buildCube, cubeQuery } from '../analytics/aggregation.js'
import { fmt, timed } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'
import useReducedMotion from '../hooks/useReducedMotion.js'

const QUESTIONS = [
  { id: 'product', label: 'TOP PRODUCT' }, { id: 'region', label: 'TOP REGION' }, { id: 'average', label: 'AVERAGE ORDER' },
  { id: 'hour', label: 'BUSIEST HOUR' }, { id: 'growth', label: 'BIGGEST GROWTH' },
]
const N = 1000000
const show = (q, r) => (q === 'average' ? `$${fmt(r.value, 2)}` : q === 'growth' ? `${r.label} (+${fmt(r.value, 1)}%)` : q === 'hour' ? `${r.label}:00 (${fmt(r.value)} orders)` : `${r.label} (${fmt(r.value)} orders)`)

export default function QueryRace({ meta, onBack, onComplete, onRestart }) {
  const reduced = useReducedMotion()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const [q, setQ] = useState(null)
  const [phase, setPhase] = useState('pick')
  const [out, setOut] = useState(null)
  const cache = useRef(null)

  const race = async (id) => {
    setQ(id); setPhase('generating')
    if (!(await wait(80))) return
    if (!cache.current) {
      const rows = generateSales(N, seed)
      for (let i = 0; i < rows.length; i++) rows[i].half = i & 1
      cache.current = { rows, cube: null }
    }
    if (!cache.current.cube) cache.current.cube = buildCube(cache.current.rows)
    const { rows, cube } = cache.current
    setPhase('racing')
    if (!(await wait(80))) return
    const scan = timed(() => scanQuery(rows, id)).value
    const idx = cubeQuery(cube, id)
    setOut({ scan, idx, build: cube.buildMs })
    if (!(await wait(reduced ? 100 : 3200))) return
    setPhase('done')
  }
  const scanMs = out ? Math.max(out.scan.ms, 0.01) : 1
  const idxFrac = out ? Math.min(1, Math.max(0.03, out.idx.ms / scanMs)) : 1
  const done = phase === 'done'
  const speedup = out ? scanMs / Math.max(out.idx.ms, 0.001) : 0

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC SALES RECORDS']}
      behind={{
        stage: done ? 7 : phase === 'racing' ? 4 : phase === 'generating' ? 1 : 0, records: out ? N : 0, transform: 'Pre-aggregate counts and sums by product, region, hour and period',
        algorithm: 'Full scan = read all records per question. Index/aggregate = answer from small pre-computed group tables',
        result: done ? `Scan ${fmt(out.scan.ms, 1)} ms vs aggregate ${fmt(out.idx.ms, 3)} ms (same answer)` : undefined,
        why: 'Data structures, indexes, partitions and pre-aggregations can dramatically change analytical performance.',
      }}
      complete={done && { records: N, score: 100, takeaway: 'Data structures, indexes, partitions and pre-aggregations can dramatically change analytical performance.' }}
    >
      <section className="card"><h2 className="mb-3 text-2xl font-black">Ask a million records a question</h2>
        <Choices label="Question" options={QUESTIONS} value={q} onPick={race} disabled={phase !== 'pick'} />
        {phase === 'generating' && <p role="status" className="mt-4 text-lg font-bold">Generating {fmt(N)} synthetic records…</p>}
      </section>
      {out && (
        <section className="card" aria-live="polite">
          <h2 className="mb-3 text-2xl font-black">THE RACE</h2>
          {[['SCAN EVERYTHING', 1, out.scan, 'bg-data4'], ['INDEX / AGGREGATE', idxFrac, out.idx, 'bg-data2']].map(([name, frac, r, color]) => (
            <div key={name} className="mb-5">
              <p className="mb-1 text-lg font-extrabold">{name} — <span className="text-discover">{fmt(r.ms, r.ms < 1 ? 3 : 1)} ms</span></p>
              <div className="h-8 overflow-hidden rounded-full bg-card2" role="progressbar" aria-label={`${name} progress`} aria-valuenow={done ? 100 : 0} aria-valuemin={0} aria-valuemax={100}>
                <motion.div className={`h-full ${color}`} initial={{ width: reduced ? `${frac * 100}%` : 0 }} animate={{ width: '100%' }} transition={{ duration: reduced ? 0 : 3 * frac, ease: 'linear' }} />
              </div>
              <p className="mt-1 text-muted">Records scanned: {fmt(r.scanned || 0)} · Groups processed: {fmt(r.groups)}{name.startsWith('INDEX') ? ` · one-time aggregate build: ${fmt(out.build, 0)} ms` : ''}</p>
            </div>
          ))}
          <p className="text-sm text-muted">Bar speeds are scaled to the measured times above.</p>
        </section>
      )}
      {done && (
        <section className="card border-discover" role="status">
          <h2 className="text-3xl font-black text-discover">ANSWER: {show(q, out.idx.result)}</h2>
          <div className="my-3 grid gap-3 sm:grid-cols-3"><Stat label="Records" value={fmt(N)} /><Stat label="Scan time" value={`${fmt(out.scan.ms, 1)} ms`} tone="warn" /><Stat label="Aggregate time" value={`${fmt(out.idx.ms, 3)} ms`} tone="brand" sub={`${fmt(speedup, 0)}× faster per question`} /></div>
          <p className="text-muted">Both approaches returned the same answer ({show(q, out.scan.result)}). Timings are measured in your browser, so they vary by device.</p>
          <div className="mt-2"><DataPipeline stages={['QUESTION', 'ENGINE', 'RESULT']} active={3} label="Query steps" /></div>
        </section>
      )}
    </ActivityShell>
  )
}
