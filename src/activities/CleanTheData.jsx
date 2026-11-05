import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateDirtyRecords, newSeed } from '../generators/syntheticData.js'
import { measureQuality, cleanRecords } from '../analytics/dataCleaning.js'
import { fmt } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'
import { useTheme } from '../hooks/useTheme.jsx'

const CATS = [
  { id: 'duplicates', label: 'DUPLICATES' }, { id: 'missing', label: 'MISSING DATA' },
  { id: 'format', label: 'FORMAT ERRORS' }, { id: 'invalid', label: 'INVALID VALUES' },
]
const STEPS = ['STANDARDIZE', 'VALIDATE', 'DEDUPLICATE', 'HANDLE MISSING', 'QUALITY CHECK']

export default function CleanTheData({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const rows = useMemo(() => generateDirtyRecords(80, seed), [seed])
  const before = useMemo(() => measureQuality(rows), [rows])
  const [sel, setSel] = useState({})
  const [step, setStep] = useState(-1)
  const [out, setOut] = useState(null)

  const run = async () => {
    for (let i = 0; i < STEPS.length; i++) { setStep(i); if (!(await wait(450))) return }
    const cleaned = cleanRecords(rows, sel)
    setOut({ rows: cleaned, q: measureQuality(cleaned) })
  }
  const chosen = CATS.filter((c) => sel[c.id])
  const sample = rows.slice(0, 6)
  const data = [['Duplicates', 'duplicates'], ['Missing', 'missing'], ['Format errors', 'format'], ['Invalid', 'invalid']].map(([name, k]) => ({ name, Before: before[k], After: out ? out.q[k] : before[k] }))

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC MESSY RECORDS']}
      behind={{
        stage: out ? 7 : step >= 0 ? 2 : 0, records: rows.length, transform: 'Standardize case/dates/numbers, validate ranges, remove duplicates, handle missing values',
        algorithm: 'Rule-based cleaning; quality score = 100 − (issues ÷ records × 50)',
        result: out ? `Quality score ${fmt(before.score)} → ${fmt(out.q.score)}; issues ${before.issues} → ${out.q.issues}` : undefined,
        why: 'Analytics is only as trustworthy as the data underneath it.',
      }}
      complete={out && { records: rows.length, score: Math.round(out.q.score), takeaway: 'Cleaning is a big share of real analytics work — fixing duplicates, formats and gaps before analysis prevents wrong answers.' }}
    >
      <section className="card">
        <h2 className="text-2xl font-black">Messy records (first 6 of {rows.length})</h2>
        <div className="overflow-x-auto"><table className="mt-2 w-full text-left"><caption className="sr-only">Sample of synthetic dirty records</caption>
          <thead><tr className="text-muted"><th>Name</th><th>City</th><th>Age</th><th>Date</th><th>Email</th></tr></thead>
          <tbody>{sample.map((r) => <tr key={r.id} className="border-t border-line"><td>{r.name}</td><td>{r.city || <em className="text-warn">(missing)</em>}</td><td>{r.age || <em className="text-warn">(missing)</em>}</td><td>{r.date}</td><td>{r.email || <em className="text-warn">(missing)</em>}</td></tr>)}</tbody></table></div>
        <div className="my-4 grid gap-3 sm:grid-cols-4"><Stat label="Records" value={rows.length} /><Stat label="Issues found" value={before.issues} tone="warn" /><Stat label="Duplicates" value={before.duplicates} /><Stat label="Quality score" value={fmt(before.score)} /></div>
        <h3 className="mb-2 text-xl font-bold">Which problems will you fix?</h3>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Issue categories">
          {CATS.map((c) => <button key={c.id} type="button" className="btn" aria-pressed={!!sel[c.id]} disabled={step >= 0} onClick={() => setSel((s) => ({ ...s, [c.id]: !s[c.id] }))}>{sel[c.id] ? '✓ ' : ''}{c.label} · {before[c.id]}</button>)}
        </div>
        <button type="button" className="btn btn-primary mt-4" disabled={!chosen.length || step >= 0} onClick={run}>RUN DATA CLEANING</button>
        {step >= 0 && <div className="mt-4"><DataPipeline stages={STEPS} active={out ? 5 : step} label="Cleaning steps" /></div>}
      </section>
      {out && (
        <section className="card" role="status">
          <h2 className="text-2xl font-black text-discover">Quality: {fmt(before.score)} → {fmt(out.q.score)}</h2>
          <p className="mb-2 text-lg">{rows.length} records → {out.rows.length} records. Issues {before.issues} → {out.q.issues}.</p>
          <ChartBox title="Issues before and after" description={`Bar chart of issues by category before and after cleaning. Total ${before.issues} before, ${out.q.issues} after.`} height={260}>
            <BarChart data={data}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} /><YAxis stroke={colors.text} width={40} allowDecimals={false} /><Legend />
              <Bar dataKey="Before" fill={colors.data4} /><Bar dataKey="After" fill={colors.data2} /></BarChart>
          </ChartBox>
        </section>
      )}
    </ActivityShell>
  )
}
