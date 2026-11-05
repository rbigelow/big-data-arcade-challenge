import { useMemo, useState } from 'react'
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis, Line, ComposedChart } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateClusterData, makeRng, newSeed, PATTERN_SCENARIOS } from '../generators/syntheticData.js'
import { detectStructure, kMeans, findOutlierPoints } from '../analytics/clustering.js'
import { fmt } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'
import { useTheme } from '../hooks/useTheme.jsx'

const CHOICES = [
  { id: 'none', label: 'NO PATTERN' }, { id: 'two', label: '2 GROUPS' }, { id: 'three', label: '3 GROUPS' },
  { id: 'outliers', label: 'OUTLIERS' }, { id: 'trend', label: 'TREND' },
]
const STEPS = ['RAW DATA', 'CHOOSE TECHNIQUE', 'K-MEANS / OUTLIERS / TREND', 'STRUCTURE']
const AXES = { 'Customer segments': ['Visits per month', 'Spend per visit'], 'Website behaviour': ['Pages viewed', 'Minutes on site'], 'Product demand': ['Price', 'Units sold'], 'Equipment readings': ['Temperature', 'Vibration'] }
const KIND_FOR = (r) => ['none', 'two', 'three', 'outliers', 'trend'][r.int(0, 4)]

export default function PatternHunter({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const setup = useMemo(() => { const r = makeRng(seed); return { kind: KIND_FOR(r), scenario: r.pick(PATTERN_SCENARIOS) } }, [seed])
  const points = useMemo(() => generateClusterData(setup.kind, 240, seed), [setup, seed])
  const [pick, setPick] = useState(null)
  const [step, setStep] = useState(-1)
  const [found, setFound] = useState(null)
  const [ax, ay] = AXES[setup.scenario]
  const palette = [colors.data1, colors.data2, colors.data3]

  const choose = async (id) => {
    setPick(id)
    for (let i = 0; i < STEPS.length; i++) { setStep(i); if (!(await wait(500))) return }
    const s = detectStructure(points)
    const label = s.type === 'clusters' ? `${s.k} GROUPS` : s.type === 'none' ? 'NO PATTERN' : s.type.toUpperCase()
    const matchId = s.type === 'clusters' ? (s.k === 2 ? 'two' : 'three') : s.type
    setFound({ s, label, matchId, outliers: s.type === 'outliers' ? s.outliers : s.type === 'clusters' ? findOutlierPoints(points, 3.5) : [] })
  }
  const data = points.map((p, i) => {
    const out = found?.outliers.includes(i)
    const g = found?.s.type === 'clusters' ? found.s.result.assignments[i] : -1
    return { x: p.x, y: p.y, g, out }
  })
  const series = found ? [
    ...(found.s.type === 'clusters' ? found.s.result.centroids.map((_, ci) => ({ name: `Group ${ci + 1}`, fill: palette[ci % 3], d: data.filter((d) => d.g === ci && !d.out) })) : [{ name: 'Points', fill: colors.data1, d: data.filter((d) => !d.out) }]),
    { name: 'Outliers', fill: colors.data4, d: data.filter((d) => d.out) },
  ] : [{ name: 'Raw data', fill: colors.data1, d: data }]
  const trendLine = found?.s.type === 'trend' ? [0, 100].map((x) => ({ x, y: found.s.slope * x + found.s.intercept })) : null
  const km = found?.s.type === 'clusters' ? found.s.result : found ? kMeans(points, 1) : null

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={[`SYNTHETIC ${setup.scenario.toUpperCase()}`]}
      behind={{
        stage: found ? 7 : step >= 0 ? 4 : 0, records: points.length, transform: 'Plot each record as a point; test for correlation, outliers and cluster structure',
        algorithm: 'Pearson correlation (trend), distance-from-centre z-score (outliers), k-means with elbow rule for k = 1–4 (groups)',
        result: found ? `Structure found: ${found.label}` : undefined,
        why: 'Analytics reveals structure that becomes hard to see as datasets grow larger and more complex.',
      }}
      complete={found && { records: points.length, score: pick === found.matchId ? 100 : 60, takeaway: 'Analytics helps reveal structures that become difficult to see as datasets grow larger and more complex.' }}
    >
      <section className="card"><h2 className="text-2xl font-black">{setup.scenario}: what pattern do you see?</h2>
        <div className="my-3">
          <ChartBox title={found ? `Analytics view: ${found.label}` : 'Raw data'} description={found ? `Scatter plot of ${points.length} points. Analytics found ${found.label}.` : `Scatter plot of ${points.length} unlabeled synthetic points.`} height={380}>
            <ComposedChart><CartesianGrid stroke={colors.grid} /><XAxis type="number" dataKey="x" name={ax} domain={[0, 100]} stroke={colors.text} label={{ value: ax, position: 'insideBottom', offset: -2, fill: colors.text }} /><YAxis type="number" dataKey="y" name={ay} domain={[0, 100]} stroke={colors.text} width={50} />
              <ZAxis range={[40, 40]} />
              {series.map((s) => <Scatter key={s.name} name={s.name} data={s.d} fill={s.fill} isAnimationActive={false} shape={s.name === 'Outliers' ? 'cross' : 'circle'} />)}
              {trendLine && <Line data={trendLine} dataKey="y" dot={false} stroke={colors.data3} strokeWidth={3} isAnimationActive={false} />}
              {found?.s.type === 'clusters' && <Scatter name="Centroids" data={found.s.result.centroids} fill={colors.text} shape="diamond" isAnimationActive={false} />}
            </ComposedChart>
          </ChartBox>
        </div>
        <Choices label="Your answer" options={CHOICES} value={pick} onPick={choose} disabled={!!pick} />
        {step >= 0 && <div className="mt-4"><DataPipeline stages={STEPS} active={found ? 4 : step} label="Pattern pipeline" /></div>}
      </section>
      {found && (
        <section className="card border-discover" role="status">
          <h2 className="text-3xl font-black text-discover">STRUCTURE REVEALED: {found.label}</h2>
          <p className="mt-1 text-lg">{pick === found.matchId ? '🎉 Your answer matches the analytics.' : `You answered ${CHOICES.find((c) => c.id === pick).label}; analytics found ${found.label}.`}</p>
          <div className="my-3 grid gap-3 sm:grid-cols-3">
            <Stat label="Cluster count" value={found.s.type === 'clusters' ? found.s.k : 1} />
            <Stat label="Outliers" value={found.outliers.length} tone="warn" />
            {found.s.type === 'trend' ? <Stat label="Correlation r" value={fmt(found.s.r, 2)} tone="discover" /> : <Stat label="K-means iterations" value={km.iterations} />}
          </div>
          {found.s.type === 'clusters' && <ul className="list-disc pl-6 text-lg">{km.centroids.map((c, i) => <li key={i}>Group {i + 1}: {km.sizes[i]} points, centroid ({fmt(c.x, 1)}, {fmt(c.y, 1)})</li>)}</ul>}
        </section>
      )}
    </ActivityShell>
  )
}
