import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { SENSOR_TYPES, generateSensorReading, makeRng, newSeed } from '../generators/syntheticData.js'
import { trafficProjection } from '../analytics/scenarios.js'
import { linearFit } from '../analytics/forecasting.js'
import { isOutlier } from '../analytics/anomalies.js'
import { fmt } from '../analytics/util.js'
import useSimulation from '../hooks/useSimulation.js'
import { useTheme } from '../hooks/useTheme.jsx'

const SURGE_AT = 10
const UNITS = { Traffic: 'veh/min', Transit: '% on time', Water: 'psi', Electricity: 'MW', Weather: '°C', 'Air quality': 'AQI' }
const ACTIONS = [
  { id: 'lights', label: 'ADJUST LIGHTS' }, { id: 'transit', label: 'ALERT TRANSIT' },
  { id: 'investigate', label: 'INVESTIGATE' }, { id: 'ignore', label: 'IGNORE' },
]
const STAGES = ['SENSORS', 'STREAM', 'ANOMALY', 'FORECAST', 'ACTION', 'PROJECTED IMPACT']

export default function SmartCity({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const [rng] = useState(() => makeRng(newSeed()))
  const [hist, setHist] = useState([])
  const [action, setAction] = useState(null)

  useSimulation((n) => {
    const row = { tick: n }
    SENSOR_TYPES.forEach((t) => { row[t] = Math.round(generateSensorReading(t, n, rng, t === 'Traffic' && n >= SURGE_AT) * 10) / 10 })
    setHist((h) => [...h.slice(-39), row])
  }, 800, !action && hist.length < 60)

  const last = hist.at(-1)
  const base = hist.filter((h) => h.tick < SURGE_AT).map((h) => h.Traffic)
  const normal = base.length ? base.reduce((a, b) => a + b, 0) / base.length : 0
  const sd = base.length > 1 ? Math.sqrt(base.reduce((a, b) => a + (b - normal) ** 2, 0) / base.length) : 0
  const surge = !!last && base.length >= 8 && isOutlier(last.Traffic, normal, Math.max(sd, 1), 3)
  const recent = hist.slice(-5).map((h) => h.Traffic)
  const fit = linearFit(recent.length > 1 ? recent : [0, 0])
  const proj = surge && action ? trafficProjection(Math.round(normal), Math.round(last.Traffic), action) : null
  const stage = proj ? 7 : surge ? 4 : hist.length ? 1 : 0

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC SENSORS']}
      behind={{
        stage, records: hist.length * SENSOR_TYPES.length, transform: 'Stream readings from 6 sensor types and compare traffic with its normal baseline',
        algorithm: 'Anomaly = reading more than 3 SD from the baseline mean; short-term forecast = linear fit over the last 5 readings',
        result: proj ? `Traffic ${proj.before} → ${proj.after} veh/min; delay ${proj.delayBefore} → ${proj.delayAfter} min` : surge ? 'Traffic surge detected' : undefined,
        why: 'IoT analytics turns constant sensor streams into alerts and decisions.',
      }}
      complete={proj && { records: hist.length * SENSOR_TYPES.length, score: Math.round(Math.max(0, 100 - proj.delayAfter * 4)), takeaway: 'IoT analytics detects when a sensor departs from normal and projects the impact of each possible response.' }}
    >
      <section className="card" aria-label="Sensors">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {SENSOR_TYPES.map((t) => <Stat key={t} label={t} value={last ? fmt(last[t], 1) : '…'} sub={UNITS[t]} tone={t === 'Traffic' && surge ? 'warn' : 'discover'} />)}
        </div>
        <div className="mt-4"><DataPipeline stages={STAGES} active={proj ? 6 : surge ? 4 : hist.length ? 2 : 0} label="IoT pipeline" /></div>
        <div className="mt-4"><ChartBox title="Traffic sensor (vehicles/min)" description={`Line chart of traffic. Normal about ${fmt(normal)}; latest ${fmt(last?.Traffic ?? 0)}.`} height={240}>
          <LineChart data={hist}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="tick" stroke={colors.text} /><YAxis stroke={colors.text} domain={[0, 130]} width={50} />
            {normal > 0 && <ReferenceLine y={normal} stroke={colors.data2} strokeDasharray="6 4" label={{ value: 'normal', fill: colors.text }} />}
            <Line dataKey="Traffic" stroke={surge ? colors.data4 : colors.data1} strokeWidth={3} dot={false} isAnimationActive={false} /></LineChart></ChartBox></div>
      </section>
      {surge && (
        <section className="card border-warn" role="alert">
          <h2 className="text-3xl font-black text-warn">⚠ TRAFFIC SURGE DETECTED</h2>
          <p className="mt-1 text-xl">Normal: <strong>{fmt(normal)}</strong> vehicles/min · Current: <strong><AnimatedCounter value={Math.round(last.Traffic)} /></strong> vehicles/min</p>
          <p className="text-muted">Forecast if nothing changes: about {fmt(Math.max(0, fit.intercept + fit.slope * recent.length))} veh/min next reading.</p>
          {!action && (<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Choose a response">
            {ACTIONS.map((a) => <button key={a.id} type="button" className="btn" onClick={() => setAction(a.id)}>{a.label}</button>)}</div>)}
        </section>
      )}
      {proj && (
        <section className="card" role="status">
          <h2 className="text-2xl font-black text-discover">BEFORE / AFTER — {ACTIONS.find((a) => a.id === action).label}</h2>
          <ChartBox title="Projected vehicles/min" description={`Before ${proj.before}, after ${proj.after} vehicles per minute. Normal ${Math.round(normal)}.`} height={220}>
            <BarChart data={[{ name: 'Before', veh: proj.before, delay: proj.delayBefore }, { name: 'After', veh: proj.after, delay: proj.delayAfter }]}>
              <CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} /><YAxis stroke={colors.text} width={50} /><Tooltip /><Legend />
              <Bar dataKey="veh" name="Vehicles/min" fill={colors.data1} /><Bar dataKey="delay" name="Avg delay (min)" fill={colors.data4} /></BarChart>
          </ChartBox>
          <p className="mt-2 text-lg">Projected average delay changes from <strong>{proj.delayBefore} min</strong> to <strong>{proj.delayAfter} min</strong>. Projection uses fixed scenario assumptions on synthetic data.</p>
        </section>
      )}
    </ActivityShell>
  )
}
