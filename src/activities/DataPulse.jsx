import { useState } from 'react'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Pause, Play, RotateCcw } from 'lucide-react'
import ActivityShell from '../components/ActivityShell.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { ChartBox } from '../components/ui.jsx'
import { EVENT_TYPES, generateEventBatch, makeRng, newSeed } from '../generators/syntheticData.js'
import { isOutlier } from '../analytics/anomalies.js'
import { fmt } from '../analytics/util.js'
import useSimulation from '../hooks/useSimulation.js'
import useReducedMotion from '../hooks/useReducedMotion.js'
import { useTheme } from '../hooks/useTheme.jsx'

const TICK_MS = 500
const STAGES = ['SOURCES', 'EVENT STREAM', 'INGEST', 'ROLLING AGGREGATES', 'LIVE DASHBOARD']
const fresh = () => ({ total: 0, byType: Object.fromEntries(EVENT_TYPES.map((t) => [t, 0])), anomalies: 0, rate: 0, sources: 0, series: [], errWindow: [], tick: 0 })

export default function DataPulse({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const reduced = useReducedMotion()
  const [rng] = useState(() => makeRng(newSeed()))
  const [view, setView] = useState(fresh)
  const [running, setRunning] = useState(true)
  const [active, setActive] = useState(() => new Set(EVENT_TYPES))
  const [done, setDone] = useState(false)

  useSimulation(() => {
    const r = rng
    const batch = generateEventBatch(Math.round(r.normal(1400, 150)), r)
    if (r() < 0.04) for (let i = 0; i < 30; i++) batch.push({ type: 'Errors', source: r.int(1, 47), value: 0 })
    const srcs = new Set()
    const per = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0]))
    for (const e of batch) { per[e.type]++; srcs.add(e.source) }
    setView((s) => {
      const w = s.errWindow
      let anomalies = s.anomalies
      if (w.length >= 8) {
        const mean = w.reduce((a, b) => a + b, 0) / w.length
        const sd = Math.sqrt(w.reduce((a, b) => a + (b - mean) ** 2, 0) / w.length)
        if (isOutlier(per.Errors, mean, Math.max(sd, 1), 3)) anomalies++
      }
      const tick = s.tick + 1
      return {
        total: s.total + batch.length,
        byType: Object.fromEntries(EVENT_TYPES.map((t) => [t, s.byType[t] + per[t]])),
        anomalies, rate: Math.round(batch.length * (1000 / TICK_MS)), sources: srcs.size, tick,
        errWindow: [...w.slice(-19), per.Errors],
        series: [...s.series.slice(-39), { t: tick, ...per }],
      }
    })
  }, TICK_MS, running && !done)

  const toggle = (t) => setActive((a) => { const n = new Set(a); if (n.has(t)) { if (n.size > 1) n.delete(t) } else n.add(t); return n })
  const reset = () => { setView(fresh()); setRunning(true) }
  const chartData = view.series.map((p) => ({ t: p.t, events: EVENT_TYPES.filter((x) => active.has(x)).reduce((a, x) => a + p[x], 0) * (1000 / TICK_MS) }))
  const filtered = EVENT_TYPES.filter((t) => active.has(t)).reduce((a, t) => a + view.byType[t], 0)

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC LIVE DATA']}
      behind={{
        stage: view.total ? 4 : 0, records: view.total, transform: 'Count each incoming event by type in a rolling window',
        algorithm: 'Rolling aggregates; anomaly = error count more than 3 standard deviations from the rolling mean',
        result: `${fmt(view.total)} events received, ${view.anomalies} anomalies flagged`,
        why: 'Streaming analytics shows what is happening now, not what happened last month.',
      }}
      complete={done && { records: view.total, score: Math.min(100, view.anomalies * 20 + 40), takeaway: 'Streaming analytics ingests events as they arrive and keeps rolling aggregates so dashboards stay live.' }}
    >
      <section className="card" aria-label="Live counters">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-live="off">
          {[['EVENTS RECEIVED', view.total], ['EVENTS / SECOND', view.rate], ['ACTIVE SOURCES', view.sources], ['ANOMALIES', view.anomalies]].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-card2 p-4"><p className="tag">{l}</p><p className={`text-4xl font-black ${l === 'ANOMALIES' ? 'text-warn' : 'text-discover'}`}><AnimatedCounter value={v} duration={400} /></p></div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={() => setRunning(false)} disabled={!running || done}><Pause aria-hidden="true" size={20} /> PAUSE</button>
          <button type="button" className="btn" onClick={() => setRunning(true)} disabled={running || done}><Play aria-hidden="true" size={20} /> RESUME</button>
          <button type="button" className="btn" onClick={reset}><RotateCcw aria-hidden="true" size={20} /> RESET</button>
          <button type="button" className="btn btn-primary" onClick={() => { setRunning(false); setDone(true) }} disabled={done || view.total === 0}>FINISH CHALLENGE</button>
        </div>
      </section>
      <section className="card">
        <h2 className="mb-3 text-2xl font-black">Event types <span className="text-base font-normal text-muted">(tap to filter)</span></h2>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Event type filters">
          {EVENT_TYPES.map((t) => <button key={t} type="button" className="btn" aria-pressed={active.has(t)} onClick={() => toggle(t)}>{active.has(t) ? '✓ ' : ''}{t} · {fmt(view.byType[t])}</button>)}
        </div>
        <p className="mt-3 text-muted">Showing {fmt(filtered)} events from selected types.</p>
        <div className="my-4 h-6 overflow-hidden rounded-full bg-card2" aria-hidden="true">
          {!reduced && running && <div className="relative h-full">{[0, 0.4, 0.8, 1.2].map((d) => <span key={d} className="stream-dot absolute top-1 h-4 w-4 rounded-full" style={{ background: colors.data1, animationDelay: `${d}s` }} />)}</div>}
        </div>
        <DataPipeline stages={STAGES} active={running ? 3 : 5} label="Streaming pipeline" />
        <div className="mt-4">
          <ChartBox title="Events per second (rolling)" description={`Line chart of events per second over the last ${chartData.length} intervals. Latest value ${chartData.at(-1)?.events ?? 0}.`}>
            <LineChart data={chartData}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="t" stroke={colors.text} /><YAxis stroke={colors.text} width={70} domain={['auto', 'auto']} />
              <Line type="monotone" dataKey="events" stroke={colors.data1} strokeWidth={3} dot={false} isAnimationActive={false} /></LineChart>
          </ChartBox>
        </div>
      </section>
    </ActivityShell>
  )
}
