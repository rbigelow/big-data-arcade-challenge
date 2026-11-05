import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Line, LineChart, Legend } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateTrendStreams, TREND_ITEMS, newSeed } from '../generators/syntheticData.js'
import { trendMetrics } from '../analytics/trends.js'
import { fmt } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'
import { useTheme } from '../hooks/useTheme.jsx'

const STEPS = ['EVENTS', 'TIME WINDOWS', 'COUNTS', 'GROWTH RATE', 'TREND']
const FIRST = 6, TOTAL = 12

export default function WhatsTrending({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const streams = useMemo(() => generateTrendStreams(TOTAL, seed), [seed])
  const [windows, setWindows] = useState(FIRST)
  const [pick, setPick] = useState(null)
  const [done, setDone] = useState(false)
  const m = trendMetrics(streams.map((s) => ({ ...s, counts: s.counts.slice(0, windows) })))
  const palette = [colors.data1, colors.data2, colors.data3, colors.data4, colors.text, colors.grid]

  const choose = async (p) => {
    setPick(p)
    for (let w = FIRST + 1; w <= TOTAL; w++) { if (!(await wait(500))) return; setWindows(w) }
    await wait(300)
    setDone(true)
  }
  const bars = m.rows.map((r) => ({ name: r.name.split(': ')[1] ?? r.name, full: r.name, now: r.last }))
  const lines = Array.from({ length: windows }, (_, w) => ({ w: w + 1, ...Object.fromEntries(streams.map((s) => [s.name, s.counts[w]])) }))
  const won = pick === m.fastest.name

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC ACTIVITY STREAMS']}
      behind={{
        stage: done ? 7 : pick ? 4 : 1, records: streams.reduce((s, r) => s + r.counts.slice(0, windows).reduce((a, b) => a + b, 0), 0), transform: 'Group events into time windows and count per item',
        algorithm: 'Growth rate = (count − previous) ÷ previous; velocity = count change; 3-window moving average; share = item ÷ total',
        result: done ? `Growing fastest: ${m.fastest.name} (+${fmt(m.fastest.cumulative, 0)}%). Popular now: ${m.popular.name}` : undefined,
        why: 'Popular now and growing fastest are different questions — trend analysis finds the second one.',
      }}
      complete={done && { records: streams.reduce((s, r) => s + r.counts.reduce((a, b) => a + b, 0), 0), score: won ? 100 : 60, takeaway: 'Popular now is not the same as growing fastest. Growth rate and velocity reveal what is rising.' }}
    >
      <section className="card">
        <h2 className="text-2xl font-black">Which item will trend?</h2>
        <p className="mb-3 text-muted">Window {windows} of {TOTAL}. Counts so far are shown below.</p>
        <ChartBox title="Activity in the latest window" description={`Bar chart of events per item in window ${windows}. Highest now: ${m.popular.name}.`} height={260}>
          <BarChart data={bars} layout="vertical"><CartesianGrid stroke={colors.grid} /><XAxis type="number" stroke={colors.text} /><YAxis type="category" dataKey="name" stroke={colors.text} width={100} />
            <Bar dataKey="now" isAnimationActive={false}>{bars.map((b, i) => <Cell key={b.full} fill={palette[i % palette.length]} />)}</Bar></BarChart>
        </ChartBox>
        <h3 className="my-3 text-xl font-bold">Click the item you think will trend</h3>
        <Choices label="Item" options={TREND_ITEMS} value={pick} onPick={choose} disabled={!!pick} />
        {pick && <div className="mt-4"><DataPipeline stages={STEPS} active={done ? 5 : Math.min(4, windows - FIRST)} label="Trend pipeline" /></div>}
      </section>
      {pick && (
        <section className="card">
          <ChartBox title="Counts per window" description="Line chart of event counts per window for each item." height={300}>
            <LineChart data={lines}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="w" stroke={colors.text} /><YAxis stroke={colors.text} width={50} /><Legend />
              {streams.map((s, i) => <Line key={s.name} dataKey={s.name} stroke={palette[i % palette.length]} dot={false} strokeWidth={s.name === m.fastest.name ? 4 : 2} isAnimationActive={false} />)}</LineChart>
          </ChartBox>
        </section>
      )}
      {done && (
        <section className="card border-discover" role="status">
          <h2 className="text-3xl font-black text-discover">TREND DETECTED</h2>
          <p className="mt-1 text-lg">{won ? '🎉 You picked the fastest-growing item!' : `You picked ${pick}; the fastest-growing item was different.`}</p>
          <div className="my-4 grid gap-3 sm:grid-cols-2"><Stat label="Popular now" value={m.popular.name} sub={`${fmt(m.popular.share, 1)}% of activity`} /><Stat label="Growing fastest" value={m.fastest.name} tone="discover" sub={`+${fmt(m.fastest.cumulative, 0)}% since window 1`} /></div>
          <div className="overflow-x-auto"><table className="w-full text-left"><caption className="sr-only">Trend metrics per item</caption>
            <thead><tr className="text-muted"><th>Item</th><th>Growth</th><th>Velocity</th><th>3-win avg</th><th>Share</th><th>Rank Δ</th></tr></thead>
            <tbody>{[...m.rows].sort((a, b) => b.cumulative - a.cumulative).map((r) => <tr key={r.name} className="border-t border-line"><td className="py-1">{r.name}</td><td>{fmt(r.growth, 1)}%/win</td><td>{r.velocity >= 0 ? '+' : ''}{fmt(r.velocity)}</td><td>{fmt(r.movingAvg)}</td><td>{fmt(r.share, 1)}%</td><td>{r.rankChange > 0 ? `▲${r.rankChange}` : r.rankChange < 0 ? `▼${-r.rankChange}` : '—'}</td></tr>)}</tbody></table></div>
        </section>
      )}
    </ActivityShell>
  )
}
