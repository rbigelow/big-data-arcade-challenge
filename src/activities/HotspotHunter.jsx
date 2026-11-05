import { useEffect, useMemo, useRef, useState } from 'react'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { Stat } from '../components/ui.jsx'
import { generateGeoEvents, newSeed, ZONE_COLS } from '../generators/syntheticData.js'
import { gridDensity, findHotspots } from '../analytics/spatial.js'
import { fmt } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'
import { useTheme } from '../hooks/useTheme.jsx'

const KINDS = ['SALES', 'TRAFFIC', 'DELIVERIES', 'SERVICE CALLS']
const STEPS = ['LOCATION EVENTS', 'SPATIAL BUCKETS', 'DENSITY', 'CLUSTERS', 'HOTSPOTS']
const N = 5000, SIZE = 480, CELL = SIZE / 8

export default function HotspotHunter({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const [kind, setKind] = useState(null)
  const [shown, setShown] = useState(0)
  const [step, setStep] = useState(-1)
  const canvas = useRef(null)
  const events = useMemo(() => (kind ? generateGeoEvents(kind, N, seed) : []), [kind, seed])
  const grid = useMemo(() => (events.length ? gridDensity(events) : null), [events])
  const hot = useMemo(() => (grid ? findHotspots(grid) : []), [grid])
  const finished = step >= STEPS.length
  const top = hot[0]

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const g = c.getContext('2d')
    g.clearRect(0, 0, SIZE, SIZE)
    g.fillStyle = colors.card; g.fillRect(0, 0, SIZE, SIZE)
    if (finished && grid) {
      grid.cells.forEach((cell) => { g.globalAlpha = Math.min(0.85, (cell.count / grid.max) * 0.85); g.fillStyle = colors.data4; g.fillRect(cell.x * CELL, cell.y * CELL, CELL, CELL) })
      g.globalAlpha = 1
    }
    g.strokeStyle = colors.grid; g.lineWidth = 1
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * CELL, 0); g.lineTo(i * CELL, SIZE); g.moveTo(0, i * CELL); g.lineTo(SIZE, i * CELL); g.stroke() }
    g.fillStyle = colors.text; g.font = '12px Arial'
    for (let i = 0; i < 8; i++) { g.fillText(ZONE_COLS[i], i * CELL + CELL / 2 - 4, 12); g.fillText(String(i + 1), 3, i * CELL + CELL / 2) }
    g.fillStyle = colors.data1
    for (let i = 0; i < Math.min(shown, events.length); i++) g.fillRect(events[i].x * CELL, events[i].y * CELL, 2, 2)
    if (finished) { g.strokeStyle = colors.data3; g.lineWidth = 4; hot.slice(0, 2).forEach((h) => g.strokeRect(h.x * CELL + 2, h.y * CELL + 2, CELL - 4, CELL - 4)) }
  }, [shown, events, finished, grid, hot, colors])

  const pick = async (k) => {
    setKind(k)
    for (let s = 1; s <= 10; s++) { if (!(await wait(180))) return; setShown((s * N) / 10) }
    for (let i = 0; i <= STEPS.length; i++) { setStep(i); if (!(await wait(400))) return }
  }

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC LOCATIONS', 'ABSTRACT CITY GRID']}
      behind={{
        stage: finished ? 7 : step >= 0 ? 4 : kind ? 1 : 0, records: shown || 0, transform: 'Assign each event to an 8×8 grid cell (spatial bucketing)',
        algorithm: 'Density = events per cell; hotspot = cell with ≥ 2× the expected uniform count',
        result: top ? `Zone ${top.zone}: ${fmt(top.count)} events vs ${fmt(grid.expected, 0)} expected` : undefined,
        why: 'Geospatial analytics shows where activity concentrates so resources can go where they matter.',
      }}
      complete={finished && { records: N, score: Math.min(100, Math.round(top ? top.ratio * 10 : 0)), takeaway: 'Spatial bucketing and density turn raw coordinates into clear hotspots.' }}
    >
      <section className="card"><h2 className="mb-3 text-2xl font-black">What kind of activity should we map?</h2>
        <Choices label="Event kind" options={KINDS} value={kind} onPick={pick} disabled={!!kind} /></section>
      <section className="card">
        <div className="grid gap-6 lg:grid-cols-2">
          <canvas ref={canvas} width={SIZE} height={SIZE} className="mx-auto max-w-full rounded-2xl border-2 border-line" role="img"
            aria-label={finished && top ? `Grid map of ${N} synthetic ${kind} events. Hotspot in zone ${top.zone}.` : 'Grid map of synthetic events'} />
          <div aria-live="polite">
            <DataPipeline stages={STEPS} active={step} label="Spatial pipeline" vertical />
            {finished && top && (<div className="mt-4">
              <h3 className="text-3xl font-black text-discover">HOTSPOT DETECTED</h3>
              <p className="text-2xl">Zone {top.zone}</p><div className="mt-2 grid gap-3 sm:grid-cols-2"><Stat label="Events" value={fmt(top.count)} tone="warn" /><Stat label="Expected" value={fmt(grid.expected, 0)} /></div>
              <h4 className="mt-3 font-bold">Top zones</h4><ol className="list-decimal pl-6">{hot.slice(0, 4).map((h) => <li key={h.zone}>{h.zone}: {fmt(h.count)} events ({fmt(h.ratio, 1)}× expected)</li>)}</ol>
            </div>)}
            {kind && !finished && <p className="mt-4 text-lg">Events mapped: <strong>{fmt(shown)}</strong></p>}
          </div>
        </div>
      </section>
    </ActivityShell>
  )
}
