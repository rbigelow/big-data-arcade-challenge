import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip } from 'recharts'
import ActivityShell from '../components/ActivityShell.jsx'
import Choices from '../components/Choices.jsx'
import DataPipeline from '../components/DataPipeline.jsx'
import { ChartBox, Stat } from '../components/ui.jsx'
import { generateHospital, newSeed } from '../generators/syntheticData.js'
import { hospitalProjection } from '../analytics/scenarios.js'
import { useTheme } from '../hooks/useTheme.jsx'

const ACTIONS = [
  { id: 'treatment', label: 'OPEN TREATMENT AREA', sub: '+6 rooms' }, { id: 'staff', label: 'MOVE STAFF', sub: '+3 staff' },
  { id: 'discharge', label: 'PRIORITIZE DISCHARGES', sub: '−6 waiting' }, { id: 'support', label: 'REQUEST SUPPORT', sub: '+4 temporary staff' },
]
const STAGES = ['SENSE', 'PREDICT', 'SCENARIO', 'DECIDE']

export default function HospitalCommandCentre({ meta, onBack, onComplete, onRestart }) {
  const { colors } = useTheme()
  const [seed] = useState(newSeed)
  const [h] = useState(() => generateHospital(seed))
  const [action, setAction] = useState(null)
  const before = hospitalProjection(h, 'none')
  const after = action ? hospitalProjection(h, action) : null
  const all = ACTIONS.map((a) => ({ name: a.label.split(' ').slice(0, 2).join(' '), ...hospitalProjection(h, a.id) }))

  return (
    <ActivityShell
      meta={meta} onBack={onBack} onComplete={onComplete} onRestart={onRestart} labels={['SYNTHETIC OPERATIONAL SIMULATION', 'NOT A CLINICAL DECISION TOOL']}
      behind={{
        stage: after ? 7 : 1, records: 24 * 4, transform: 'Combine current load, capacity and predicted arrivals',
        algorithm: 'Capacity = √(room throughput × staff throughput); wait = projected queue ÷ capacity',
        result: after ? `Predicted wait ${before.wait} → ${after.wait} min` : undefined,
        why: 'Operational analytics compares options before committing scarce resources.',
      }}
      complete={after && { records: 24 * 4, score: Math.max(0, Math.round(100 - after.wait / 2)), takeaway: 'Operational analytics projects the effect of each decision and shows the resource trade-offs. This is a synthetic simulation, not a clinical tool.' }}
    >
      <section className="card">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Patients waiting" value={h.waiting} /><Stat label="Rooms" value={`${h.roomsOpen}`} /><Stat label="Available staff" value={h.staff} />
          <Stat label="Wait time (now)" value={`${before.wait} min`} tone="warn" /><Stat label="Incoming ambulances" value={h.ambulances} /><Stat label="Predicted arrivals/hr" value={h.predictedArrivalsPerHour} sub={`normally ${h.baseArrivalsPerHour}`} />
        </div>
        <div className="mt-4"><DataPipeline stages={STAGES} active={after ? 4 : 2} label="Operational analytics pipeline" /></div>
      </section>
      <section className="card border-warn" role="alert">
        <h2 className="text-3xl font-black text-warn">⚠ EXPECTED PATIENT SURGE</h2>
        <p className="mb-4 text-lg">Predicted arrivals rise from {h.baseArrivalsPerHour} to {h.predictedArrivalsPerHour} per hour. Predicted wait without action: <strong>{before.wait} min</strong>. What do you do?</p>
        <Choices label="Response" options={ACTIONS} value={action} onPick={setAction} />
      </section>
      {after && (
        <section className="card" role="status">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-card2 p-4"><p className="tag">Before</p><p className="text-2xl font-black">Predicted wait: {before.wait} min</p></div>
            <div className="rounded-2xl bg-card2 p-4"><p className="tag">After</p><p className="text-2xl font-black text-discover">Predicted wait: {after.wait} min</p></div>
          </div>
          <p className="mt-3 text-lg">Room utilization {before.roomUtil}% → {after.roomUtil}% · Staff utilization {before.staffUtil}% → {after.staffUtil}%</p>
          <ChartBox title="Trade-offs across all options" description={`Bar chart comparing predicted wait, room utilization and staff utilization for each option. Baseline wait ${before.wait} minutes.`} height={280}>
            <BarChart data={[{ name: 'No action', ...before }, ...all]}><CartesianGrid stroke={colors.grid} /><XAxis dataKey="name" stroke={colors.text} /><YAxis stroke={colors.text} width={50} /><Tooltip /><Legend />
              <Bar dataKey="wait" name="Wait (min)" fill={colors.data4} /><Bar dataKey="roomUtil" name="Room use %" fill={colors.data1} /><Bar dataKey="staffUtil" name="Staff use %" fill={colors.data2} /></BarChart>
          </ChartBox>
        </section>
      )}
    </ActivityShell>
  )
}
