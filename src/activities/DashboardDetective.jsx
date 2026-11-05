import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, Tooltip } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import Choices from '../components/Choices.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateBISales, BI_REGIONS, BI_PRODUCTS, BI_CHANNELS, BI_CUSTOMERS, BI_MONTHS, newSeed } from '../generators/syntheticData.js'
import { declineShare, groupSum } from '../analytics/aggregation.js'
import { fmt } from '../analytics/util.js'
import { useTheme } from '../hooks/useTheme.jsx'

const DIMS = [
  { id: 'region', label: 'REGION', values: BI_REGIONS },
  { id: 'product', label: 'PRODUCT', values: BI_PRODUCTS },
  { id: 'channel', label: 'CHANNEL', values: BI_CHANNELS },
  { id: 'customer', label: 'CUSTOMER TYPE', values: BI_CUSTOMERS },
  { id: 'month', label: 'MONTH', values: BI_MONTHS },
]
const STAGES = ['TRANSACTIONS', 'MEASURES', 'FILTER', 'DRILL DOWN', 'ROOT CAUSE']

export default function DashboardDetective({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const [seed] = useState(newSeed)
  const rows = useMemo(() => generateBISales(seed), [seed])
  const [path, setPath] = useState([])
  const [dim, setDim] = useState('region')

  const filters = Object.fromEntries(path.map((p) => [p.dim, p.value]))
  const usable = DIMS.filter((d) => !(d.id in filters) && d.id !== 'month')
  const current = DIMS.find((d) => d.id === dim && !(d.id in filters)) || usable[0]
  const subset = rows.filter((r) => Object.entries(filters).every(([k, v]) => r[k] === v))
  const stat = declineShare(rows, filters)
  const data = current ? current.values.map((v) => {
    const part = declineShare(rows, { ...filters, [current.id]: v })
    return { name: v, change: Math.round(part.part.change), early: part.part.early, late: part.part.late }
  }) : []
  const monthly = groupSum(subset, (r) => r.month, (r) => r.revenue)
  const monthData = BI_MONTHS.map((m) => ({ name: m, revenue: monthly.find((x) => x.key === m)?.sum ?? 0 }))
  const solved = path.length >= 3 && stat.share >= 50
  const worst = data.length ? data.reduce((a, b) => (b.change < a.change ? b : a)) : null
  const pathLabels = ['ALL SALES', ...path.map((p) => p.value.toUpperCase())]
  const pick = (name) => {
    if (!current || current.id === 'month') return
    setPath([...path, { dim: current.id, value: name }])
    setDim(usable.find((d) => d.id !== current.id)?.id ?? 'region')
  }

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart}
      behind={{
        stage: solved ? 7 : path.length ? 3 : 1, records: subset.length, transform: 'Sum revenue measures, compare Jan–Mar with Apr–Jun, filter as you drill down',
        algorithm: 'Share of decline = segment change ÷ total decline across all segments that fell',
        result: solved ? `${pathLabels.slice(1).join(' · ')} accounts for ${fmt(stat.share, 0)}% of the decline` : undefined,
        why: 'Drilling down turns "revenue fell" into "this specific segment is why".',
      }}
      complete={solved && { records: rows.length, score: Math.round(stat.share), takeaway: 'Business intelligence lets you slice measures by dimensions to find the root cause behind a headline number.' }}
    >
      <section className="card">
        <h2 className="text-3xl font-black">WHY DID REVENUE FALL?</h2>
        <p className="mt-1 text-muted">Tap a bar to drill down. The biggest drop is usually the best clue.</p>
        <div className="mt-3"><DataPipeline stages={pathLabels} active={pathLabels.length - 1} label="Your drill-down path" /></div>
        <div className="my-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Jan–Mar revenue" value={`$${fmt(stat.part.early)}`} /><Stat label="Apr–Jun revenue" value={`$${fmt(stat.part.late)}`} />
          <Stat label="Change" value={`${stat.part.change < 0 ? '' : '+'}$${fmt(stat.part.change)}`} tone={stat.part.change < 0 ? 'warn' : 'brand'} />
        </div>
        {current && !solved && (<>
          <h3 className="mb-2 text-xl font-bold">Explore by</h3>
          <Choices label="Dimension" options={usable.map((d) => ({ id: d.id, label: d.label }))} value={current.id} onPick={setDim} />
          <div className="mt-4">
            <ChartBox title={`Revenue change (Apr–Jun vs Jan–Mar) by ${current.label.toLowerCase()}`} description={`Bar chart. Largest decline: ${worst?.name} at ${fmt(worst?.change ?? 0)} dollars.`} height={280}>
              <BarChart data={data}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} /><YAxis stroke={colors.text} width={80} tickFormatter={(v) => fmt(v)} /><Tooltip />
                <Bar dataKey="change" cursor="pointer" onClick={(d) => pick(d.name)}>{data.map((d) => <Cell key={d.name} fill={d.change < 0 ? colors.data4 : colors.data2} />)}</Bar></BarChart>
            </ChartBox>
          </div>
          <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label="Drill into a value">
            {data.map((d) => <button key={d.name} type="button" className="btn" onClick={() => pick(d.name)}>{d.name} ({d.change < 0 ? '' : '+'}{fmt(d.change)})</button>)}
          </div>
        </>)}
        <div className="mt-4"><ChartBox title="Monthly revenue for current selection" description={`Revenue by month for ${pathLabels.join(' then ')}.`} height={220}>
          <BarChart data={monthData}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} /><YAxis stroke={colors.text} width={80} tickFormatter={(v) => fmt(v)} /><Bar dataKey="revenue" fill={colors.data1} /></BarChart></ChartBox></div>
        {path.length > 0 && !solved && <button type="button" className="btn mt-4" onClick={() => setPath(path.slice(0, -1))}>↩ Step back</button>}
      </section>
      {solved && (
        <section className="card border-discover" role="status">
          <h2 className="text-3xl font-black text-discover">INSIGHT FOUND</h2>
          <p className="mt-2 text-2xl">{pathLabels.slice(1).join(' · ')} sales accounted for <strong>{fmt(stat.share, 0)}%</strong> of the decline.</p>
        </section>
      )}
      {!solved && path.length >= 3 && <p role="status" className="card">This path explains only {fmt(stat.share, 0)}% of the decline — try stepping back and following the biggest drop.</p>}
    </ActivityShell>
  )
}
