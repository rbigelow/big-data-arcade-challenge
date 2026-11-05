import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, Tooltip } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateSales, newSeed } from '../generators/syntheticData.js'
import { groupCount, runAggregation, QUESTION_KEYS } from '../analytics/aggregation.js'
import { fmt } from '../analytics/util.js'
import { useTheme } from '../hooks/useTheme.jsx'
import useAlive from '../hooks/useAlive.js'

const QUESTIONS = [
  { id: 'product', label: 'MOST POPULAR PRODUCT' },
  { id: 'location', label: 'BUSIEST LOCATION' },
  { id: 'hour', label: 'HIGHEST SALES HOUR' },
]
const SCALES = [20, 100, 1000, 10000, 100000, 1000000]
const STEPS = ['FILTER', 'GROUP', 'AGGREGATE', 'SORT', 'INSIGHT']
const label = (dim, v) => (dim === 'hour' ? `${v}:00` : String(v))

export default function HumanVsBigData({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const [dim, setDim] = useState(null)
  const [guess, setGuess] = useState(null)
  const [phase, setPhase] = useState('pick')
  const [scale, setScale] = useState(SCALES[0])
  const [step, setStep] = useState(-1)
  const [res, setRes] = useState(null)
  const sample = useMemo(() => generateSales(20, seed), [seed])

  const options = dim ? [...new Set(sample.map(QUESTION_KEYS[dim]))].sort((a, b) => (a > b ? 1 : -1)) : []

  const doGuess = async (g) => {
    setGuess(g)
    setPhase('scaling')
    for (const s of SCALES) { if (!(await wait(600))) return; setScale(s) }
    setPhase('ready')
  }
  const start = async () => {
    setPhase('running')
    for (let i = 0; i < STEPS.length - 1; i++) { setStep(i); if (!(await wait(450))) return }
    const rows = generateSales(1000000, seed)
    const r = runAggregation(rows, dim)
    if (!r.winner) { setPhase('error'); return }
    setRes(r)
    setStep(STEPS.length)
    setPhase('done')
  }

  const manual = dim ? groupCount(sample, QUESTION_KEYS[dim])[0] : null
  const stage = { pick: 0, guess: 0, scaling: 1, ready: 2, running: 4, error: 4, done: 7 }[phase]
  const won = res && guess != null && String(guess) === String(res.winner.key)

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart}
      behind={{
        stage, records: res ? res.records : scale, transform: 'Filter valid rows → group by category → count',
        algorithm: 'Hash-map GROUP BY + COUNT, then sort descending',
        result: res ? `${label(dim, res.winner.key)} wins with ${fmt(res.winner.count)} records (${fmt(res.winner.pct, 1)}%) in ${fmt(res.ms, 1)} ms` : undefined,
        why: 'Analytics turns datasets too large to inspect manually into understandable answers.',
      }}
      complete={res && { records: res.records, score: won ? 100 : 60, takeaway: 'Analytics turns datasets too large to inspect manually into understandable answers.' }}
    >
      {phase === 'pick' && (
        <section className="card"><h2 className="mb-4 text-2xl font-black">What do you want to find out?</h2>
          <Choices label="Question" options={QUESTIONS} value={dim} onPick={(d) => { setDim(d); setPhase('guess') }} /></section>
      )}
      {phase !== 'pick' && (
        <section className="card">
          <h2 className="mb-2 text-2xl font-black">{QUESTIONS.find((q) => q.id === dim).label}</h2>
          <p className="mb-3 text-muted">Here are the first 20 of the transactions. Take a look…</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base"><caption className="sr-only">20 synthetic transactions</caption>
              <thead><tr className="text-muted"><th className="p-1">#</th><th>Product</th><th>Location</th><th>Hour</th></tr></thead>
              <tbody>{sample.map((r) => <tr key={r.id} className="border-t border-line"><td className="p-1">{r.id}</td><td>{r.product}</td><td>{r.location}</td><td>{r.hour}:00</td></tr>)}</tbody></table>
          </div>
          {phase === 'guess' && (<><h3 className="mt-4 mb-2 text-xl font-bold">Your guess?</h3><Choices label="Your guess" options={options.map((o) => ({ id: String(o), label: label(dim, o) }))} value={guess} onPick={doGuess} /></>)}
          {phase !== 'guess' && <p className="mt-3 font-bold">Your guess: {label(dim, guess)} {phase === 'done' || phase === 'ready' ? `· Best in these 20 rows: ${label(dim, manual.key)}` : ''}</p>}
        </section>
      )}
      {['scaling', 'ready', 'running', 'done'].includes(phase) && (
        <section className="card text-center" aria-live="polite">
          <p className="tag">Records in the dataset</p>
          <p className="text-6xl font-black text-discover"><AnimatedCounter value={scale} /></p>
          {phase === 'scaling' && <p className="mt-2 text-lg text-muted">Scaling up… {SCALES.map(fmt).join(' → ')}</p>}
          {phase === 'ready' && (<><p className="mt-3 text-2xl font-black text-warn">TOO MUCH DATA FOR MANUAL ANALYSIS</p>
            <button type="button" className="btn btn-primary mt-4" onClick={start}>START ANALYTICS</button></>)}
          {(phase === 'running' || phase === 'done') && <div className="mt-4 flex justify-center"><DataPipeline stages={STEPS} active={phase === 'done' ? 5 : step} label="Analytics steps" /></div>}
        </section>
      )}
      {phase === 'error' && <div role="alert" className="card border-warn"><strong>WHAT HAPPENED:</strong> No valid records were found. <strong>HOW TO FIX IT:</strong> Retry. <button type="button" className="btn" onClick={onRestart}>RETRY</button></div>}
      {res && (
        <section className="card" aria-live="polite">
          <h2 className="text-3xl font-black text-discover">{label(dim, res.winner.key)} is the answer</h2>
          <p className="mt-1 text-lg">{won ? '🎉 Your guess matched the full analysis!' : 'Your guess differed from the full analysis — that is why analytics matters.'}</p>
          <div className="my-4 grid gap-3 sm:grid-cols-4">
            <Stat label="Records processed" value={fmt(res.records)} />
            <Stat label="Winner count" value={fmt(res.winner.count)} />
            <Stat label="Share" value={`${fmt(res.winner.pct, 1)}%`} />
            <Stat label="Measured time" value={`${fmt(res.ms, 1)} ms`} tone="accent" />
          </div>
          <ChartBox title="Counts by category" description={`Bar chart of record counts. ${label(dim, res.winner.key)} is highest with ${fmt(res.winner.count)}.`}>
            <BarChart data={res.groups.slice(0, 8).map((g) => ({ name: label(dim, g.key), count: g.count }))}>
              <CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} /><YAxis stroke={colors.text} width={80} tickFormatter={(v) => fmt(v)} /><Tooltip />
              <Bar dataKey="count">{res.groups.slice(0, 8).map((g, i) => <Cell key={g.key} fill={i === 0 ? colors.data3 : colors.data1} />)}</Bar>
            </BarChart>
          </ChartBox>
        </section>
      )}
    </ActivityShell>
  )
}
