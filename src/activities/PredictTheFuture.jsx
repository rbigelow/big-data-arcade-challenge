import { useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, XAxis, YAxis, Legend, Scatter } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import Choices from '../components/Choices.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateTimeSeries, newSeed } from '../generators/syntheticData.js'
import { forecastNext, findOutliers, movingAverage, naiveLast } from '../analytics/forecasting.js'
import { fmt } from '../analytics/util.js'
import useAlive from '../hooks/useAlive.js'
import { useTheme } from '../hooks/useTheme.jsx'

const STEPS = ['HISTORY', 'TREND', 'SEASONALITY', 'FORECAST', 'COMPARE WITH ACTUAL']

export default function PredictTheFuture({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const { wait } = useAlive()
  const [seed] = useState(newSeed)
  const ts = useMemo(() => generateTimeSeries(24, seed), [seed])
  const ys = ts.points.map((p) => p.value)
  const model = useMemo(() => forecastNext(ys, ts.period), [ys, ts.period])
  const last = naiveLast(ys)
  const options = [
    { id: 'lower', label: `LOWER: ${fmt(last * 0.9)}`, v: Math.round(last * 0.9) },
    { id: 'same', label: `ABOUT THE SAME: ${fmt(last)}`, v: Math.round(last) },
    { id: 'higher', label: `HIGHER: ${fmt(last * 1.1)}`, v: Math.round(last * 1.1) },
  ]
  const [pick, setPick] = useState(null)
  const [step, setStep] = useState(-1)
  const [done, setDone] = useState(false)

  const choose = async (id) => {
    setPick(id)
    for (let i = 0; i < STEPS.length; i++) { setStep(i); if (!(await wait(450))) return }
    setDone(true)
  }
  const mine = options.find((o) => o.id === pick)?.v
  const outl = findOutliers(ys, 2.5)
  const ma = movingAverage(ys, 3)
  const t = ys.length
  const data = ts.points.map((p, i) => ({ name: `M${i + 1}`, value: p.value, trend: Math.round(model.fit.intercept + model.fit.slope * i), ma: Math.round(ma[i]), outlier: outl.includes(i) ? p.value : null }))
  data.push({ name: `M${t + 1}`, forecast: Math.round(model.forecast), band: [Math.round(model.lower), Math.round(model.upper)], actual: done ? ts.simulatedActual : null })
  const errMine = mine != null ? Math.abs(mine - ts.simulatedActual) : 0, errModel = Math.abs(model.forecast - ts.simulatedActual)

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC TIME SERIES']}
      behind={{
        stage: done ? 7 : step >= 0 ? 4 : 0, records: ys.length, transform: 'Fit a linear trend, estimate monthly seasonality from the residuals, extrapolate one step',
        algorithm: 'Least-squares trend + additive seasonal index; interval = ±1.28 × residual SD (≈80%)',
        result: done ? `Model ${fmt(model.forecast)} (range ${fmt(model.lower)}–${fmt(model.upper)}) vs simulated actual ${fmt(ts.simulatedActual)}` : undefined,
        why: 'Forecasts are estimates with uncertainty — they inform planning, they do not predict with certainty.',
      }}
      complete={done && { records: ys.length, score: Math.round(Math.max(0, 100 - errMine / 5)), takeaway: 'Forecasting combines trend and seasonality, and always comes with a range — the future is never certain.' }}
    >
      <section className="card">
        <h2 className="text-2xl font-black">What will next month be?</h2>
        <p className="mb-3 text-muted">The last 24 months of synthetic sales are charted below. Pick a forecast for the next month.</p>
        <Choices label="Your forecast" options={options} value={pick} onPick={choose} disabled={pick != null} />
        {step >= 0 && <div className="mt-4"><DataPipeline stages={STEPS} active={done ? 5 : step} label="Forecast pipeline" /></div>}
      </section>
      <section className="card">
        <ChartBox title="History, trend, forecast and interval" description={`Monthly values for 24 months with trend line, outliers marked, and a one-step forecast of ${fmt(model.forecast)} with range ${fmt(model.lower)} to ${fmt(model.upper)}.`} height={340}>
          <ComposedChart data={data}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} interval={2} /><YAxis stroke={colors.text} width={60} domain={['auto', 'auto']} /><Legend />
            {step >= 1 && <Line dataKey="trend" name="Trend" stroke={colors.data2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />}
            {step >= 2 && <Line dataKey="ma" name="3-mo average" stroke={colors.data3} dot={false} isAnimationActive={false} />}
            <Line dataKey="value" name="Sales" stroke={colors.data1} strokeWidth={3} dot={false} isAnimationActive={false} />
            <Scatter dataKey="outlier" name="Outlier" fill={colors.data4} />
            {step >= 3 && <Area dataKey="band" name="Forecast interval" stroke="none" fill={colors.data3} fillOpacity={0.35} isAnimationActive={false} />}
            {step >= 3 && <ReferenceDot x={`M${t + 1}`} y={Math.round(model.forecast)} r={7} fill={colors.data3} stroke={colors.text} />}
            {done && <ReferenceDot x={`M${t + 1}`} y={ts.simulatedActual} r={7} fill={colors.data4} stroke={colors.text} />}
          </ComposedChart>
        </ChartBox>
      </section>
      {done && (
        <section className="card" role="status">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Your forecast" value={fmt(mine)} /><Stat label="Model forecast" value={fmt(model.forecast)} tone="accent" sub={`80% range ${fmt(model.lower)}–${fmt(model.upper)}`} /><Stat label="Simulated actual" value={fmt(ts.simulatedActual)} tone="discover" />
          </div>
          <p className="mt-3 text-lg">{errMine < errModel ? 'Your estimate landed closer than the model this time.' : 'The model landed closer.'} Error: you {fmt(errMine)}, model {fmt(errModel)}. A forecast is an estimate, not a guarantee.</p>
        </section>
      )}
    </ActivityShell>
  )
}
